// Manage hats page: every hat, with rename, color, keep, go to, new tab, close tabs, forget.

const $ = (id) => document.getElementById(id);
// Firefox's container colors, in the order Hatrack hands them out.
const COLORS = {
  blue: "#37adff", green: "#51cd00", orange: "#ff9f00", purple: "#af51f5",
  red: "#ff613d", yellow: "#ffcb00", turquoise: "#00c79a", pink: "#ff4bda",
};

function send(type, extra = {}) {
  return browser.runtime.sendMessage({ type, ...extra });
}

async function windowId() {
  return (await browser.windows.getCurrent()).id;
}

function statusText(hat) {
  if (hat.tabCount > 0) return hat.tabCount === 1 ? "1 open tab" : `${hat.tabCount} open tabs`;
  if (hat.kept) return "Kept · no open tabs";
  if (hat.eraseAt) {
    const minutes = Math.max(1, Math.ceil((hat.eraseAt - Date.now()) / 60_000));
    return `No open tabs · erasing in about ${minutes} min`;
  }
  return "No open tabs · erasing soon";
}

function button(label, onClick, title) {
  const b = document.createElement("button");
  b.textContent = label;
  if (title) b.title = title;
  b.onclick = onClick;
  return b;
}

function hatRow(hat) {
  const li = document.createElement("li");
  li.className = "hat";
  li.style.setProperty("--hat-color", hat.colorCode);

  const swatch = document.createElement("span");
  swatch.className = "swatch";

  const name = document.createElement("input");
  name.className = "name";
  name.value = hat.name;
  name.maxLength = 40;
  name.title = "Rename this hat";
  name.onchange = () => send("hatRename", { id: hat.id, name: name.value }).then(render);
  name.onkeydown = (e) => { if (e.key === "Enter") name.blur(); };

  const status = document.createElement("span");
  status.className = "status";
  status.textContent = statusText(hat);

  const colors = document.createElement("span");
  colors.className = "colors";
  colors.title = "Color";
  for (const [color, code] of Object.entries(COLORS)) {
    const b = button("", () => send("hatColor", { id: hat.id, color }).then(render), color);
    b.style.setProperty("--c", code);
    b.setAttribute("aria-label", color);
    b.setAttribute("aria-pressed", String(hat.color === color));
    colors.append(b);
  }

  const keep = document.createElement("label");
  const box = document.createElement("input");
  box.type = "checkbox";
  box.checked = hat.kept;
  box.onchange = () => send("hatKeep", { id: hat.id, kept: box.checked }).then(render);
  keep.append(box, "Keep");
  keep.title = "Stay signed in after closing this hat's tabs";

  const spacer = document.createElement("span");
  spacer.className = "spacer";

  const controls = document.createElement("div");
  controls.className = "controls";
  controls.append(
    colors, keep, spacer,
    button(hat.tabCount ? "Go to" : "Open", async () => send("hatFocus", { id: hat.id, windowId: await windowId() }),
      hat.tabCount ? "Switch to this hat's tab" : "Open a tab in this hat"),
    button("New tab", async () => send("hatOpen", { id: hat.id, windowId: await windowId() }), "Open another tab in this hat"),
  );
  if (hat.tabCount) {
    controls.append(button("Close tabs", () => send("hatClose", { id: hat.id }).then(render),
      hat.kept ? "Close its tabs; it stays signed in" : "Close its tabs; it's erased after the usual wait"));
  }
  controls.append(button("Forget", async () => {
    if (confirm(`Forget "${hat.name}"? Its tabs close and you're signed out right away.`)) {
      await send("hatForget", { id: hat.id });
      render();
    }
  }, "Close its tabs and erase its logins now"));

  li.append(swatch, name, status, controls);
  return li;
}

async function render() {
  // Don't redraw under someone who is typing a new name.
  if (document.activeElement?.classList.contains("name")) return;
  const hats = await send("hats");
  $("empty").hidden = hats.length > 0;
  $("danger").hidden = !hats.some(h => !h.kept);
  $("hats").replaceChildren(...hats.map(hatRow));
}

$("newHat").onclick = async () => {
  const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
  await send("newIsolated", { tab });
};
$("forgetUnkept").onclick = async () => {
  if (confirm("Erase every hat you haven't kept? Their tabs close and you're signed out of them right away.")) {
    await send("forgetUnkept");
    render();
  }
};

// Keep the list current as tabs open and close, and as erase times count down.
for (const event of [browser.tabs.onCreated, browser.tabs.onRemoved, browser.contextualIdentities.onUpdated,
                     browser.contextualIdentities.onRemoved]) {
  event.addListener(() => setTimeout(render, 300));
}
setInterval(render, 30_000);
render();
