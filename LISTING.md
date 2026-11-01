# addons.mozilla.org listing for Airlock

Copy these into the submission form.

**Name:** Airlock

**Summary** (max 250 characters):
Every tab is its own sealed session. Use several accounts on the same site side by side (Microsoft 365, Google, admin portals) without them mixing. Logins are erased when you close the tab, unless you keep them.

**Categories:** Privacy & Security; Tabs

**Description:**

Working with several accounts on the same site is painful: the browser remembers one account and signs you into it everywhere. Private windows don't help, because all private tabs share one session.

Airlock fixes that. Every new tab opens in its own sealed session, an airlock, with separate cookies and logins. Sign into account A in one tab and account B in the next. They never see each other.

• ⌘T / Ctrl+T: new tab in a fresh, signed-out airlock
• ⌥⌘T / Ctrl+Alt+T: new tab in the same airlock, already signed in
• Color-coded airlocks, which you can rename (for example "Contoso Admin")
• Close an airlock's last tab and its logins and site data are erased
• Tick "Keep" to stay signed into accounts you use every day
• Links from other apps and bookmarks open in a new airlock, never in a shared session
• Keeps Firefox's password saving off, so the wrong password is never autofilled
• Automatic mode can be turned off if you only want airlocks on request

Great for IT admins managing multiple Microsoft 365 / Azure tenants: sign into one portal, then open Azure, Defender, Entra and Intune in the same airlock with ⌥⌘T, without extra MFA.

Privacy: Airlock collects no data, has no analytics and makes no network requests.

**Support email / site:** (your choice: use an address you're happy to make public)

**License:** MIT License

**Privacy policy:** Not required (no data collected). Optionally: "Airlock collects no data and makes no network requests."

**Notes to reviewer:**
Airlock uses contextualIdentities to give each tab its own container. webRequest blocking on main_frame requests is used only to detect pages about to load in the default container (firefox-default) and reopen them in a new container; requests in other containers are never touched. browsingData.remove is called only with the cookieStoreId of containers Airlock created, when their last tab closes. privacy.services.passwordSavingEnabled is set to false so the password manager can't autofill credentials across sessions. No remote code, no network requests, no minified code.

**Screenshots to take** (1280×800 is ideal):
1. Three tabs with different airlock colors, each signed into a different account
2. The Airlock toolbar popup, showing a renamed airlock and the Keep option
3. The welcome / setup page
