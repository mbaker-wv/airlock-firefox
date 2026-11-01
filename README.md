# Airlock for Firefox

Every tab is its own sealed session, so several accounts on the same site
(for example multiple Microsoft 365 tenants) never mix. When an airlock's last
tab closes, its cookies, logins and site data are erased, unless you keep it.

## Features

- **⌘T / Ctrl+T** opens a tab in a brand-new airlock (a fresh, signed-out session).
- **⌥⌘T / Ctrl+Alt+T** opens a tab in the *same* airlock, already signed in.
- Links from other apps, bookmarks and restored tabs are moved out of Firefox's
  shared default session into a new airlock before they load.
- Each airlock is color-coded; rename it from the toolbar button.
- **Keep** an airlock to stay signed in after closing its tabs; **Forget** erases it.
- Firefox's password saving is kept off so it can't autofill the wrong account.
- Automatic mode can be turned off; then airlocks open only when you ask.

## Privacy

Airlock collects no data, has no analytics and makes no network requests.
All state stays in your Firefox profile (`storage.local`).

Why each permission is needed:

| Permission | Used for |
|---|---|
| `<all_urls>`, `webRequest`, `webRequestBlocking` | Stop a page from loading in Firefox's shared default session and reopen it in an airlock |
| `contextualIdentities`, `cookies` | Create and delete the containers that make up airlocks |
| `browsingData` | Erase an airlock's cookies and site data when it closes |
| `tabs`, `menus` | Open tabs in an airlock; tab right-click menu |
| `privacy` | Keep Firefox's password saving turned off |
| `storage` | Remember which airlocks are yours, kept, and their numbers |

Airlock cannot change Firefox's Microsoft single sign-on setting. Users should turn off
*Settings → Privacy & Security → "Allow Windows single sign-on for Microsoft, work, and school accounts"*.

## Develop

Load it for testing: open `about:debugging#/runtime/this-firefox` → **Load Temporary Add-on…** →
pick `manifest.json`. It stays loaded until Firefox quits.

Package for submission (from this folder):

```bash
zip -r ../Airlock-1.0.0.zip manifest.json background.js popup.html popup.css popup.js welcome.html welcome.css welcome.js icons LICENSE
```

The main icon is drawn by `tools/make-icon.swift`. The toolbar button uses simpler,
bolder icons drawn at exact pixel sizes by `tools/make-toolbar-icons.swift`, with a
light and a dark version so it stays clear on any Firefox theme.

## Publish on addons.mozilla.org

The store listing text is in `LISTING.md`. The source is plain, unminified
JavaScript, so no separate source upload is needed.

**First version (once, by hand):** upload the zip at
addons.mozilla.org → *Submit a New Add-on* → *On this site*, and paste the listing text.

**Every later version (automatic):**

1. Raise `"version"` in `manifest.json` (for example `1.0.1`) and commit.
2. Tag and push:

   ```bash
   git tag v1.0.1 && git push origin main v1.0.1
   ```

3. The *Release* workflow lints, submits the version to Mozilla for signing and review,
   and creates a GitHub release. Firefox updates everyone's copy once Mozilla approves it.

The workflow needs the repository secrets `AMO_JWT_ISSUER` and `AMO_JWT_SECRET`
(from addons.mozilla.org → *Tools → Manage API Keys*).

See `SECURITY.md` for how updates and vulnerability reports are handled.
