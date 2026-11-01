// Welcome / options page: shows whether password saving is off and the automatic-mode switch.

async function showPasswordStatus() {
  const status = document.getElementById("pwStatus");
  const { value } = await browser.privacy.services.passwordSavingEnabled.get({});
  status.textContent = value ? "Still on: restart Firefox or check Settings → Passwords" : "✓ Off";
  status.className = "status " + (value ? "warn" : "good");
}

async function setUpToggle() {
  const toggle = document.getElementById("auto");
  toggle.checked = await browser.runtime.sendMessage({ type: "getAuto" });
  toggle.addEventListener("change", () => browser.runtime.sendMessage({ type: "setAuto", auto: toggle.checked }));
}

showPasswordStatus();
setUpToggle();
