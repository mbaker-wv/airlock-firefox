// Behavior tests for background.js, run against the fake browser in harness.js.
(async () => { try {
  await ready;
  const hats = () => Object.entries(state.sessions);
  const userTabs = () => [...tabs.values()];

  // ⌘T: a blank new tab becomes a tab in Hat 1.
  let t = await browser.tabs.create({ url: "about:newtab" });
  await fire("tabs.onCreated", { ...t });
  check("⌘T opens a new tab in a new hat", hats().length === 1 && !tabs.has(t.id) && userTabs().every(x => x.cookieStoreId !== "firefox-default"));
  check("first hat is Hat 1", containers.get(hats()[0][0]).name === "Hat 1");

  // Two more hats, then close Hat 2's tab: grace period keeps it, then erases it.
  for (const _ of [1, 2]) { const n = await browser.tabs.create({ url: "about:newtab" }); await fire("tabs.onCreated", { ...n }); }
  check("three hats numbered 1-3", hats().map(([, s]) => s.number).sort().join() === "1,2,3");
  const hat2 = hats().find(([, s]) => s.number === 2)[0];
  const hat2Tab = userTabs().find(x => x.cookieStoreId === hat2);
  await browser.tabs.remove(hat2Tab.id);
  await tick(1500);
  check("closed hat waits (grace period)", !!state.sessions[hat2] && !removedData.includes(hat2));
  await tick(2 * 60_000);
  check("closed hat erased after 2 minutes", !state.sessions[hat2] && removedData.includes(hat2) && !containers.has(hat2));

  // Number reuse: the next hat takes the free number 2.
  const n4 = await browser.tabs.create({ url: "about:newtab" });
  await fire("tabs.onCreated", { ...n4 });
  check("freed number 2 is reused", hats().some(([id, s]) => s.number === 2 && id !== hat2 && containers.get(id).name === "Hat 2"));

  // Reopening within the grace period keeps the hat.
  const hat1 = hats().find(([, s]) => s.number === 1)[0];
  const hat1Tab = userTabs().find(x => x.cookieStoreId === hat1);
  await browser.tabs.remove(hat1Tab.id);
  await tick(30_000);
  await browser.tabs.create({ cookieStoreId: hat1, url: "https://example.com" });   // ⇧⌘T restores into the same container
  await tick(5 * 60_000);
  check("tab reopened within the wait keeps its hat", !!state.sessions[hat1] && !removedData.includes(hat1));

  // Grace 0: immediate.
  await fire("runtime.onMessage", { type: "setSetting", key: "graceMinutes", value: 0 });
  const hat3 = hats().find(([, s]) => s.number === 3)[0];
  await browser.tabs.remove(userTabs().find(x => x.cookieStoreId === hat3).id);
  await tick(1500);
  check("'right away' erases on close", !state.sessions[hat3] && removedData.includes(hat3));

  // Badge text.
  check("badge: Hat 7 → 7", badgeText("Hat 7", 7) === "7");
  check("badge: Work → WO", badgeText("Work", 1) === "WO");
  check("badge: Client A → CA", badgeText("Client A", 4) === "CA");

  // Links from other apps: off without the permission, on with it, no stray tab.
  const before = hats().length;
  let r = await listeners["webRequest"][0]({ tabId: 999, cookieStoreId: "firefox-default", url: "https://mail.example/" });
  check("without permission, links aren't moved", hats().length === before && !(r && r.cancel));
  granted = true; await fire("perm.add");
  const ext = await browser.tabs.create({ url: "about:blank" });
  tabs.get(ext.id).status = "loading";
  const created = fire("tabs.onCreated", { ...ext });                               // starts its 500ms wait
  r = await listeners["webRequest"][0]({ tabId: ext.id, cookieStoreId: "firefox-default", url: "https://mail.example/" });
  await settle(); await tick(600); await created;
  const moved = userTabs().filter(x => x.url === "https://mail.example/");
  check("with permission, a link moves into a new hat", r && r.cancel && moved.length === 1 && moved[0].cookieStoreId !== "firefox-default");
  check("no extra empty hat left behind", hats().length === before + 1);

  // Real ⌘T: Firefox reports the tab as about:blank first, then switches it to about:newtab.
  let count = hats().length;
  const real = await browser.tabs.create({ url: "about:blank" });
  tabs.get(real.id).status = "loading";
  const realCreated = fire("tabs.onCreated", { ...real });
  await tick(100);
  Object.assign(tabs.get(real.id), { url: "about:newtab", status: "complete" });
  await tick(600); await realCreated;
  check("real ⌘T (blank, then New Tab page) gets a hat", hats().length === count + 1 && !tabs.has(real.id));

  // A link from another app while "links from other apps" is off stays a normal tab.
  granted = false; await fire("perm.remove");
  count = hats().length;
  const link = await browser.tabs.create({ url: "about:blank" });
  tabs.get(link.id).status = "loading";
  const linkCreated = fire("tabs.onCreated", { ...link });
  await tick(100);
  Object.assign(tabs.get(link.id), { url: "https://chat.example/x", status: "loading" });
  await tick(600); await linkCreated;
  check("a loading web page is left alone", hats().length === count && tabs.has(link.id));

  // Open Link in New Hat.
  const n = hats().length;
  await fire("menus.onClicked", { menuItemId: "link-new-session", linkUrl: "https://example.com/a" }, userTabs()[0]);
  check("Open Link in New Hat", hats().length === n + 1 && userTabs().some(x => x.url === "https://example.com/a"));

  // Kept hats survive with no tabs.
  const kept = hats()[0][0];
  state.sessions[kept].kept = true;
  for (const x of userTabs().filter(x => x.cookieStoreId === kept)) await browser.tabs.remove(x.id);
  await tick(60 * 60_000);
  check("kept hat survives", !!state.sessions[kept]);

  // Managing hats from the menu and the Manage hats page (by id, with no tab attached).
  const send = (msg) => fire("runtime.onMessage", msg);
  await send({ type: "setSetting", key: "graceMinutes", value: 2 });
  const someTab = userTabs().find(x => state.sessions[x.cookieStoreId]);
  const d = await listeners["runtime.onMessage"][0]({ type: "describe", tab: someTab });
  check("menu lists every hat and marks the current one", d.current === someTab.cookieStoreId && d.hats.length === hats().length);
  const list = await listeners["runtime.onMessage"][0]({ type: "hats" });
  const target = list.find(h => h.tabCount > 0 && !h.kept);
  await send({ type: "hatRename", id: target.id, name: "Client A" });
  check("rename a hat by id", containers.get(target.id).name === "Client A");
  await send({ type: "hatColor", id: target.id, color: "pink" });
  check("change a hat's color", containers.get(target.id).color === "pink");
  await send({ type: "hatColor", id: target.id, color: "not-a-color" });
  check("unknown colors are ignored", containers.get(target.id).color === "pink");
  await send({ type: "hatKeep", id: target.id, kept: true });
  await send({ type: "hatClose", id: target.id });
  await tick(10 * 60_000);
  check("close a kept hat's tabs: it stays", !!state.sessions[target.id] && userTabs().every(x => x.cookieStoreId !== target.id));
  await send({ type: "hatKeep", id: target.id, kept: false });
  await tick(1000);
  check("un-keep a hat with no tabs: it waits first", !!state.sessions[target.id]);
  await tick(3 * 60_000);
  check("...then it's erased", !state.sessions[target.id]);
  const focusTarget = hats().find(([id]) => userTabs().some(x => x.cookieStoreId === id))[0];
  await send({ type: "hatFocus", id: focusTarget, windowId: 1 });
  check("go to a hat activates its tab", userTabs().find(x => x.active).cookieStoreId === focusTarget);
  const before2 = userTabs().length;
  await send({ type: "hatOpen", id: focusTarget, windowId: 1 });
  check("new tab in a chosen hat", userTabs().length === before2 + 1 && userTabs().filter(x => x.cookieStoreId === focusTarget).length >= 2);
  await send({ type: "hatForget", id: focusTarget });
  check("forget a hat by id (no tab needed)", !state.sessions[focusTarget] && userTabs().every(x => x.cookieStoreId !== focusTarget));
  const keepOne = hats()[0][0];
  state.sessions[keepOne].kept = true;
  const n1 = await browser.tabs.create({ url: "about:newtab" }); await fire("tabs.onCreated", { ...n1 });
  await send({ type: "forgetUnkept" });
  check("erase every hat you haven't kept", hats().length === 1 && hats()[0][0] === keepOne);

  print(failures ? `\n${failures} FAILED` : "\nALL PASSED");
  if (failures && globalThis.process) process.exit(1);
} catch (e) { print("ERROR: " + e + "\n" + e.stack); if (globalThis.process) process.exit(1); } })();
