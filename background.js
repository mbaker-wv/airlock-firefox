// Hatrack: every new tab gets its own private container (a "hat").
// A hat's cookies, logins and site data are erased shortly after its last tab closes,
// unless you mark it "Keep". This add-on collects no data and makes no network requests.

const COLORS = ["blue", "green", "orange", "purple", "red", "yellow", "turquoise", "pink"];
const DEFAULT_STORE = "firefox-default";
const NEW_TAB_URLS = new Set(["about:newtab", "about:home"]);
const ALL_SITES = { origins: ["<all_urls>"] };

// sessions[cookieStoreId] = { number, kept, emptySince? }. Only containers listed here are ours.
// auto: every new tab gets its own hat (otherwise only on request).
// catchLinks: pages opening in Firefox's shared session (links from other apps, bookmarks)
//   move into a new hat. Needs the optional "all websites" permission.
// graceMinutes: how long a hat waits after its last tab closes before it's erased, so an
//   accidentally closed tab can be reopened (⇧⌘T) still signed in.
let state = { sessions: {}, auto: true, catchLinks: true, graceMinutes: 2 };
let canCatchLinks = false;
const ready = start();

async function start() {
  const saved = await browser.storage.local.get("state");
  if (saved.state) state = { ...state, ...saved.state };
  const existing = new Set((await browser.contextualIdentities.query({})).map(c => c.cookieStoreId));
  for (const id of Object.keys(state.sessions)) {
    if (!existing.has(id)) delete state.sessions[id];
  }
  // None of these may stop Hatrack from starting: every tab handler waits on `ready`.
  await refreshLinkPermission().catch(() => {});
  await cleanup({ now: true }).catch(() => {});   // hats left behind when Firefox last closed
  // Firefox's password saving stays off, so it can't autofill another account's password.
  await browser.privacy.services.passwordSavingEnabled.set({ value: false }).catch(() => {});
  await updateAllBadges().catch(() => {});
}

function save() {
  return browser.storage.local.set({ state });
}

async function refreshLinkPermission() {
  canCatchLinks = await browser.permissions.contains(ALL_SITES);
}
browser.permissions.onAdded.addListener(refreshLinkPermission);
browser.permissions.onRemoved.addListener(refreshLinkPermission);

// The lowest number no current hat is using, so numbers (and colors) stay small and reused.
function nextNumber() {
  const used = new Set(Object.values(state.sessions).map(s => s.number));
  let n = 1;
  while (used.has(n)) n++;
  return n;
}

async function createSession() {
  const number = nextNumber();
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
    url: url && /^(https?|ftp|file):/.test(url) ? url : undefined,
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

// Erases a hat's cookies and site data, then deletes the container.
async function removeSession(id) {
  delete state.sessions[id];
  await save();
  await browser.browsingData.remove({ cookieStoreId: id },
    { cookies: true, localStorage: true, indexedDB: true, serviceWorkers: true }).catch(() => {});
  await browser.contextualIdentities.remove(id).catch(() => {});
}

// Erases hats whose tabs are all closed, once their grace period is over (or right away
// with `now`, e.g. after Firefox restarts). Schedules itself for the next one due.
let eraseTimer;
async function cleanup({ now = false } = {}) {
  const time = Date.now();
  let nextDue = Infinity;
  for (const [id, session] of Object.entries(state.sessions)) {
    if (session.kept) continue;
    const tabs = await browser.tabs.query({ cookieStoreId: id });
    if (tabs.length > 0) {
      delete session.emptySince;
      continue;
    }
    session.emptySince ??= time;
    const eraseAt = session.emptySince + state.graceMinutes * 60_000;
    if (now || eraseAt <= time) await removeSession(id);
    else nextDue = Math.min(nextDue, eraseAt);
  }
  await save();
  clearTimeout(eraseTimer);
  if (nextDue !== Infinity) eraseTimer = setTimeout(cleanup, nextDue - time + 500);
}

let cleanupTimer;
function scheduleCleanup() {
  clearTimeout(cleanupTimer);
  cleanupTimer = setTimeout(cleanup, 1000);
}

// Toolbar badge: the current tab's hat, as its number or initials, in its color.
function badgeText(name, number) {
  if (name === `Hat ${number}`) return String(number);
  const words = name.trim().split(/\s+/).filter(Boolean);
  const text = words.length > 1 ? words.slice(0, 2).map(w => w[0]).join("") : name.trim().slice(0, 2);
  return text.toUpperCase();
}

function readableOn(hex) {
  const [r, g, b] = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16));
  return 0.299 * r + 0.587 * g + 0.114 * b > 160 ? "#000000" : "#ffffff";
}

async function updateBadge(windowId) {
  const [tab] = await browser.tabs.query({ active: true, windowId });
  const own = tab && state.sessions[tab.cookieStoreId];
  const container = own && await browser.contextualIdentities.get(tab.cookieStoreId).catch(() => null);
  const text = container ? badgeText(container.name, own.number) : "";
  const color = container ? container.colorCode : "#666666";
  await browser.browserAction.setBadgeText({ text, windowId });
  await browser.browserAction.setBadgeBackgroundColor({ color, windowId });
  await browser.browserAction.setBadgeTextColor({ color: readableOn(color), windowId });
}

async function updateAllBadges() {
  for (const w of await browser.windows.getAll()) await updateBadge(w.id).catch(() => {});
}

browser.tabs.onActivated.addListener(({ windowId }) => updateBadge(windowId).catch(() => {}));
browser.contextualIdentities.onUpdated.addListener(() => updateAllBadges());

// First install: show the welcome and setup page. After an update that left "links from
// other apps" switched on but without its (now optional) permission, show where to allow it.
browser.runtime.onInstalled.addListener(async ({ reason }) => {
  await ready;
  if (reason === "install") {
    browser.tabs.create({ url: browser.runtime.getURL("welcome.html") });
  } else if (reason === "update" && state.auto && state.catchLinks && !canCatchLinks) {
    browser.tabs.create({ url: browser.runtime.getURL("welcome.html#links") });
  }
});

// Tabs whose page load was already moved into a new hat.
const movedTabs = new Set();

// ⌘T / new window: swap Firefox's blank tab for one in a brand-new hat.
browser.tabs.onCreated.addListener(async (tab) => {
  await ready;
  if (!state.auto || tab.incognito || tab.cookieStoreId !== DEFAULT_STORE) return;
  if (tab.url === "about:blank") {
    // Firefox reports a new tab as about:blank before it shows the New Tab page, and a
    // link from another app also starts as about:blank. Give it a moment: a New Tab page
    // or a still-empty tab gets a hat; a tab that started loading a web page is left alone.
    await new Promise(resolve => setTimeout(resolve, 500));
    if (movedTabs.has(tab.id)) return;
    const current = await browser.tabs.get(tab.id).catch(() => null);
    const isNewTab = current && current.cookieStoreId === DEFAULT_STORE
      && (NEW_TAB_URLS.has(current.url) || (current.url === "about:blank" && current.status === "complete"));
    if (!isNewTab) return;
  } else if (!NEW_TAB_URLS.has(tab.url)) {
    return;
  }
  await openInNewSession(tab);
  await browser.tabs.remove(tab.id);
});

// Any page about to load in Firefox's shared default container (a link from another app,
// a bookmark, a restored tab) is moved into a new hat instead. Only runs when the
// optional "all websites" permission is granted.
browser.webRequest.onBeforeRequest.addListener(async (details) => {
  await ready;
  if (!state.auto || !state.catchLinks || !canCatchLinks || details.tabId < 0 || details.incognito
      || details.cookieStoreId !== DEFAULT_STORE || movedTabs.has(details.tabId)) return {};
  movedTabs.add(details.tabId);
  const tab = await browser.tabs.get(details.tabId);
  await openInNewSession(tab, details.url);
  await browser.tabs.remove(details.tabId);
  return { cancel: true };
}, { urls: ["<all_urls>"], types: ["main_frame"] }, ["blocking"]);

browser.tabs.onRemoved.addListener((tabId) => {
  movedTabs.delete(tabId);
  scheduleCleanup();
});

// Shortcut and right-click menus.
browser.commands.onCommand.addListener(async (command) => {
  if (command !== "new-tab-same-session") return;
  const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
  if (tab) newTabInSameSession(tab);
});

browser.menus.create({ id: "same-session", title: "New Tab in This Hat", contexts: ["tab"] });
browser.menus.create({ id: "new-session", title: "New Tab in a New Hat", contexts: ["tab"] });
browser.menus.create({ id: "link-new-session", title: "Open Link in New Hat", contexts: ["link"] });
browser.menus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "same-session") newTabInSameSession(tab);
  if (info.menuItemId === "new-session") openInNewSession(tab);
  if (info.menuItemId === "link-new-session") openInNewSession(tab, info.linkUrl);
});

// Requests from the toolbar popup, the Manage hats page and the setup page.

// Every hat Hatrack manages, with its tab count, sorted by number.
async function listHats() {
  const hats = [];
  for (const [id, s] of Object.entries(state.sessions)) {
    const c = await browser.contextualIdentities.get(id).catch(() => null);
    if (!c) continue;
    const tabCount = (await browser.tabs.query({ cookieStoreId: id })).length;
    const eraseAt = !s.kept && tabCount === 0 && s.emptySince ? s.emptySince + state.graceMinutes * 60_000 : null;
    hats.push({ id, name: c.name, color: c.color, colorCode: c.colorCode, number: s.number, kept: s.kept, tabCount, eraseAt });
  }
  return hats.sort((a, b) => a.number - b.number);
}

// Switches to one of a hat's tabs (preferring the given window), or opens one.
async function focusHat(id, windowId) {
  const hatTabs = await browser.tabs.query({ cookieStoreId: id });
  const tab = hatTabs.find(t => t.windowId === windowId) || hatTabs[0];
  if (!tab) return browser.tabs.create({ cookieStoreId: id, windowId });
  await browser.tabs.update(tab.id, { active: true });
  await browser.windows.update(tab.windowId, { focused: true });
}

async function forgetHat(id) {
  if (!state.sessions[id]) return;
  for (const t of await browser.tabs.query({ cookieStoreId: id })) await browser.tabs.remove(t.id);
  await removeSession(id);
}

function settings() {
  return { auto: state.auto, catchLinks: state.catchLinks, canCatchLinks, graceMinutes: state.graceMinutes };
}

browser.runtime.onMessage.addListener(async (msg) => {
  await ready;
  const hat = msg.id && state.sessions[msg.id];
  switch (msg.type) {
    case "settings":
      await refreshLinkPermission();
      return settings();
    case "setSetting":
      if (["auto", "catchLinks"].includes(msg.key)) state[msg.key] = !!msg.value;
      if (msg.key === "graceMinutes") state.graceMinutes = Math.max(0, Number(msg.value) || 0);
      await save();
      if (msg.key === "graceMinutes") await cleanup();
      return settings();

    // The popup: the current tab's hat (if any) and every hat.
    case "describe":
      return { current: state.sessions[msg.tab.cookieStoreId] ? msg.tab.cookieStoreId : null, hats: await listHats(), auto: state.auto };
    case "newSame":
      return newTabInSameSession(msg.tab);
    case "newIsolated":
      return openInNewSession(msg.tab);

    // Acting on one hat, by id.
    case "hats":
      return listHats();
    case "hatRename":
      if (hat) {
        await browser.contextualIdentities.update(msg.id, { name: msg.name.trim() || `Hat ${hat.number}` });
        await updateAllBadges();
      }
      return;
    case "hatColor":
      if (hat && COLORS.includes(msg.color)) {
        await browser.contextualIdentities.update(msg.id, { color: msg.color });
        await updateAllBadges();
      }
      return;
    case "hatKeep":
      if (hat) {
        hat.kept = !!msg.kept;
        await save();
        if (!hat.kept) await cleanup();   // an un-kept hat with no tabs starts its wait now
      }
      return;
    case "hatFocus":
      if (hat) return focusHat(msg.id, msg.windowId);
      return;
    case "hatOpen":
      if (hat) return browser.tabs.create({ cookieStoreId: msg.id, windowId: msg.windowId });
      return;
    case "hatClose":
      if (hat) {
        for (const t of await browser.tabs.query({ cookieStoreId: msg.id })) await browser.tabs.remove(t.id);
      }
      return;
    case "hatForget":
      return forgetHat(msg.id);
    case "forgetUnkept":
      for (const [id, s] of Object.entries(state.sessions)) {
        if (!s.kept) await forgetHat(id);
      }
      return;
  }
});
