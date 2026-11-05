// Welcome / options page: password-saving status and Hatrack's settings.

const $ = (id) => document.getElementById(id);
const ALL_SITES = { origins: ["<all_urls>"] };

function send(type, extra = {}) {
  return browser.runtime.sendMessage({ type, ...extra });
}

async function showPasswordStatus() {
  const status = $("pwStatus");
  const { value } = await browser.privacy.services.passwordSavingEnabled.get({});
  status.textContent = value ? "Still on: restart Firefox or check Settings → Passwords" : "✓ Off";
  status.className = "status " + (value ? "warn" : "good");
}

function showSettings(s) {
  $("auto").checked = s.auto;
  $("catchLinks").checked = s.catchLinks && s.canCatchLinks;
  $("linksStatus").textContent = s.catchLinks && s.canCatchLinks ? "✓ On" : "Off";
  $("linksStatus").className = "status " + (s.catchLinks && s.canCatchLinks ? "good" : "");
  $("grace").value = String(s.graceMinutes);
}

$("auto").addEventListener("change", async () => {
  showSettings(await send("setSetting", { key: "auto", value: $("auto").checked }));
});

// Turning this on asks Firefox for the "all websites" permission; turning it off gives it back.
$("catchLinks").addEventListener("change", async () => {
  let on = $("catchLinks").checked;
  if (on) {
    on = await browser.permissions.request(ALL_SITES);
  } else {
    await browser.permissions.remove(ALL_SITES);
  }
  showSettings(await send("setSetting", { key: "catchLinks", value: on }));
});

$("grace").addEventListener("change", async () => {
  showSettings(await send("setSetting", { key: "graceMinutes", value: Number($("grace").value) }));
});

showPasswordStatus();
send("settings").then(showSettings);
