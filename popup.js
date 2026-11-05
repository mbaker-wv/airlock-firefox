// Toolbar popup: rename/keep the current hat, open tabs, and switch between your hats.

const $ = (id) => document.getElementById(id);
let tab;
let current;

function send(type, extra = {}) {
  return browser.runtime.sendMessage({ type, tab, ...extra });
}

function tabsLabel(hat) {
  if (hat.tabCount > 0) return hat.tabCount === 1 ? "1 tab" : `${hat.tabCount} tabs`;
  return hat.kept ? "kept" : "closing";
}

async function render() {
  [tab] = await browser.tabs.query({ active: true, currentWindow: true });
  const { current: currentId, hats, auto } = await send("describe");
  current = hats.find(h => h.id === currentId);
  $("auto").checked = auto;

  $("current").hidden = !current;
  $("none").hidden = !!current;
  $("newSame").hidden = !current;
  if (current) {
    $("dot").style.background = current.colorCode;
    if (document.activeElement !== $("name")) $("name").value = current.name;
    $("keep").checked = current.kept;
  }

  const others = hats.filter(h => h.id !== currentId);
  $("hatsSection").hidden = others.length === 0;
  $("hatList").replaceChildren(...others.map((hat) => {
    const li = document.createElement("li");
    const go = document.createElement("button");
    go.className = "go";
    go.title = hat.tabCount ? "Switch to this hat" : "Open a tab in this hat";
    const dot = document.createElement("span");
    dot.className = "dot";
    dot.style.background = hat.colorCode;
    const name = document.createElement("span");
    name.className = "hat-name";
    name.textContent = hat.name;
    const count = document.createElement("span");
    count.className = "count";
    count.textContent = tabsLabel(hat);
    go.append(dot, name, count);
    go.onclick = async () => { await send("hatFocus", { id: hat.id, windowId: tab.windowId }); window.close(); };
    const add = document.createElement("button");
    add.className = "add";
    add.textContent = "+";
    add.title = "New tab in this hat";
    add.onclick = async () => { await send("hatOpen", { id: hat.id, windowId: tab.windowId }); window.close(); };
    li.append(go, add);
    return li;
  }));
}

$("name").addEventListener("change", () => current && send("hatRename", { id: current.id, name: $("name").value }));
$("name").addEventListener("keydown", (e) => { if (e.key === "Enter") $("name").blur(); });
$("keep").addEventListener("change", () => current && send("hatKeep", { id: current.id, kept: $("keep").checked }));
$("newSame").addEventListener("click", async () => { await send("newSame"); window.close(); });
$("newIsolated").addEventListener("click", async () => { await send("newIsolated"); window.close(); });
$("auto").addEventListener("change", () => send("setSetting", { key: "auto", value: $("auto").checked }));
$("manage").addEventListener("click", async (e) => {
  e.preventDefault();
  await browser.tabs.create({ url: browser.runtime.getURL("hats.html") });
  window.close();
});
$("help").addEventListener("click", (e) => {
  e.preventDefault();
  browser.runtime.openOptionsPage();
  window.close();
});

render();
