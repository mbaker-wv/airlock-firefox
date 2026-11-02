// Hatrack: every new tab gets its own private container (a "hat").
// A hat's cookies, logins and site data are erased when its last tab closes,
// unless you mark it "Keep". This add-on collects no data and makes no network requests.

const COLORS = ["blue", "green", "orange", "purple", "red", "yellow", "turquoise", "pink"];
const DEFAULT_STORE = "firefox-default";
const BLANK_URLS = new Set(["about:newtab", "about:home", "about:blank"]);

// sessions[cookieStoreId] = { number, kept }. Only containers listed here are ours to manage.
// auto: whether every new tab gets its own hat (otherwise only on request).
let state = { sessions: {}, counter: 0, auto: true };
const ready = start();

async function start() {
  const saved = await browser.storage.local.get("state");
  if (saved.state) state = { ...state, ...saved.state };
  const existing = new Set((await browser.contextualIdentities.query({})).map(c => c.cookieStoreId));
  for (const id of Object.keys(state.sessions)) {
    if (!existing.has(id)) delete state.sessions[id];
  }
  await save();
  await cleanup();   // sessions left behind by a crash or restart
  // Firefox's password saving stays off, so it can't autofill another account's password.
  await browser.privacy.services.passwordSavingEnabled.set({ value: false });
}

function save() {
  return browser.storage.local.set({ state });
}

async function createSession() {
  state.counter += 1;
  const number = state.counter;
  const container = await browser.contextualIdentities.create({
    name: `Hat ${number}`,
    color: COLORS[(number - 1) % COLORS.length],
    icon: "fingerprint",
  });
  state.sessions[container.cookieStoreId] = { number, kept: false };
  await save();
  return container.cookieStoreId;
}

async function openInNewSession(nextTo, url) {
  const cookieStoreId = await createSession();
  return browser.tabs.create({
    cookieStoreId,
    url: url && !BLANK_URLS.has(url) ? url : undefined,
    windowId: nextTo?.windowId,
    index: nextTo ? nextTo.index + 1 : undefined,
  });
}

async function newTabInSameSession(tab) {
  if (!state.sessions[tab.cookieStoreId]) return openInNewSession(tab);
  return browser.tabs.create({
    cookieStoreId: tab.cookieStoreId,
    url: /^https?:/.test(tab.url) ? tab.url : undefined,
    windowId: tab.windowId,
    index: tab.index + 1,
  });
}

// Erases a session's cookies and site data, then deletes the container.
async function removeSession(id) {
  delete state.sessions[id];
  await save();
  await browser.browsingData.remove({ cookieStoreId: id },
    { cookies: true, localStorage: true, indexedDB: true, serviceWorkers: true }).catch(() => {});
  await browser.contextualIdentities.remove(id).catch(() => {});
}

async function cleanup() {
  for (const [id, session] of Object.entries(state.sessions)) {
    if (session.kept) continue;
    const tabs = await browser.tabs.query({ cookieStoreId: id });
    if (tabs.length === 0) await removeSession(id);
  }
}

let cleanupTimer;
function scheduleCleanup() {
  clearTimeout(cleanupTimer);
  cleanupTimer = setTimeout(cleanup, 1000);
}

// First install: show the welcome and setup page.
browser.runtime.onInstalled.addListener(({ reason }) => {
  if (reason === "install") browser.tabs.create({ url: browser.runtime.getURL("welcome.html") });
});

// ⌘T / new window: swap Firefox's blank tab for one in a brand-new session.
browser.tabs.onCreated.addListener(async (tab) => {
  await ready;
  if (!state.auto || tab.incognito || tab.cookieStoreId !== DEFAULT_STORE || !BLANK_URLS.has(tab.url)) return;
  await openInNewSession(tab);
  await browser.tabs.remove(tab.id);
});

// Any page about to load in Firefox's shared default container (a link from another app,
// a bookmark, a restored tab) is moved into a new session instead.
browser.webRequest.onBeforeRequest.addListener(async (details) => {
  await ready;
  if (!state.auto || details.tabId < 0 || details.incognito || details.cookieStoreId !== DEFAULT_STORE) return {};
  const tab = await browser.tabs.get(details.tabId);
  await openInNewSession(tab, details.url);
  await browser.tabs.remove(details.tabId);
  return { cancel: true };
}, { urls: ["<all_urls>"], types: ["main_frame"] }, ["blocking"]);

browser.tabs.onRemoved.addListener(scheduleCleanup);

// Shortcut and tab right-click menu.
browser.commands.onCommand.addListener(async (command) => {
  if (command !== "new-tab-same-session") return;
  const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
  if (tab) newTabInSameSession(tab);
});

browser.menus.create({ id: "same-session", title: "New Tab in This Hat", contexts: ["tab"] });
browser.menus.create({ id: "new-session", title: "New Tab in a New Hat", contexts: ["tab"] });
browser.menus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "same-session") newTabInSameSession(tab);
  if (info.menuItemId === "new-session") openInNewSession(tab);
});

// Requests from the toolbar popup.
async function describe(tab) {
  const own = state.sessions[tab.cookieStoreId];
  let session = null;
  if (own) {
    const c = await browser.contextualIdentities.get(tab.cookieStoreId);
    session = { name: c.name, colorCode: c.colorCode, kept: own.kept };
  }
  const kept = [];
  for (const [id, s] of Object.entries(state.sessions)) {
    if (!s.kept || id === tab.cookieStoreId) continue;
    const c = await browser.contextualIdentities.get(id).catch(() => null);
    if (c) kept.push({ id, name: c.name, colorCode: c.colorCode });
  }
  return { session, kept, auto: state.auto };
}

browser.runtime.onMessage.addListener(async (msg) => {
  await ready;
  if (msg.type === "setAuto") {
    state.auto = msg.auto;
    return save();
  }
  if (msg.type === "getAuto") return state.auto;
  const tab = msg.tab;
  const own = state.sessions[tab.cookieStoreId];
  switch (msg.type) {
    case "describe":
      return describe(tab);
    case "rename":
      if (own) {
        const name = msg.name.trim() || `Hat ${own.number}`;
        await browser.contextualIdentities.update(tab.cookieStoreId, { name });
      }
      return;
    case "keep":
      if (own) {
        own.kept = msg.kept;
        await save();
      }
      return;
    case "newSame":
      return newTabInSameSession(tab);
    case "newIsolated":
      return openInNewSession(tab);
    case "openKept":
      return browser.tabs.create({ cookieStoreId: msg.id, windowId: tab.windowId, index: tab.index + 1 });
    case "forget":
      for (const t of await browser.tabs.query({ cookieStoreId: msg.id })) await browser.tabs.remove(t.id);
      return removeSession(msg.id);
  }
});
