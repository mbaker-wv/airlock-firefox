// Toolbar popup: rename/keep the current session, open tabs, manage kept sessions.

const $ = (id) => document.getElementById(id);
let tab;

function send(type, extra = {}) {
  return browser.runtime.sendMessage({ type, tab, ...extra });
}

async function render() {
  [tab] = await browser.tabs.query({ active: true, currentWindow: true });
  const { session, kept, auto } = await send("describe");
  $("auto").checked = auto;

  $("current").hidden = !session;
  $("none").hidden = !!session;
  $("newSame").hidden = !session;
  if (session) {
    $("dot").style.background = session.colorCode;
    $("name").value = session.name;
    $("keep").checked = session.kept;
  }

  $("keptSection").hidden = kept.length === 0;
  $("keptList").replaceChildren(...kept.map((k) => {
    const li = document.createElement("li");
    const dot = document.createElement("span");
    dot.className = "dot";
    dot.style.background = k.colorCode;
    const open = document.createElement("button");
    open.className = "open";
    open.textContent = k.name;
    open.title = "Open a tab in this hat";
    open.onclick = async () => { await send("openKept", { id: k.id }); window.close(); };
    const forget = document.createElement("button");
    forget.className = "forget";
    forget.textContent = "Forget";
    forget.title = "Close its tabs and erase its logins";
    forget.onclick = async () => { await send("forget", { id: k.id }); render(); };
    li.append(dot, open, forget);
    return li;
  }));
}

$("name").addEventListener("change", () => send("rename", { name: $("name").value }));
$("name").addEventListener("keydown", (e) => { if (e.key === "Enter") $("name").blur(); });
$("keep").addEventListener("change", () => send("keep", { kept: $("keep").checked }));
$("newSame").addEventListener("click", async () => { await send("newSame"); window.close(); });
$("newIsolated").addEventListener("click", async () => { await send("newIsolated"); window.close(); });
$("auto").addEventListener("change", () => send("setSetting", { key: "auto", value: $("auto").checked }));
$("help").addEventListener("click", (e) => {
  e.preventDefault();
  browser.runtime.openOptionsPage();
  window.close();
});

render();
