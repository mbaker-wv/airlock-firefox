# Store listing

The text used on the add-on's page at
[addons.mozilla.org/firefox/addon/hatrack](https://addons.mozilla.org/firefox/addon/hatrack/).
Kept here so it's easy to update and reuse.

**Name:** Hatrack
**Web address:** `hatrack`
**Categories:** Privacy & Security, Tabs
**Support website:** https://github.com/mbaker-wv/hatrack
**License:** MIT License
**Privacy policy:** none needed (no data collected)

## Summary

> 250 characters max

A different hat for every account. Use several accounts on the same site side by side without them getting mixed up. Each tab gets its own private session, and its login disappears when you close it, unless you keep it.

## Description

```
I built Hatrack because I juggle several accounts on the same sites (work, personal, and a few for clients), and every browser kept "helping" by signing me into the wrong one. Private windows didn't fix it either, since all private tabs share the same session.

With Hatrack, every new tab wears its own hat: a sealed-off session with its own logins. Sign into one account in this tab, a different one in the next, and they'll never know about each other. Close the tab and that login is gone.

A few things that make it nice to use day to day:

- Press ⌘T (Ctrl+T on Windows) for a new tab in a fresh, signed-out hat.
- Press ⌥⌘T (Ctrl+Alt+T) for another tab in the same hat, already signed in.
- Each hat gets its own color, and you can name it "Work" or "Client A" so you always know which one you're wearing.
- Tick "Keep" on the hats you wear every day and they'll stay signed in, even after you close their tabs.
- Right-click any link and choose "Open Link in New Hat" for a signed-out copy or a different account.
- The Hatrack button shows which hat you're in, in its color, and lists all your hats so you can jump between them.
- A Manage hats page lets you rename, recolor, keep or forget any hat, all in one place.
- Closed a tab by accident? Hats wait a couple of minutes before they're erased, so ⇧⌘T brings it back still signed in.
- Optional: links you click in other apps can open in a new hat too.
- Firefox's password saving stays off, so it can't fill in the wrong password.
- Don't want every tab sealed off? Turn automatic mode off and only open Hatrack tabs when you ask for them.

Managing a few admin dashboards for different organizations? Sign in once, then press ⌥⌘T to open the other tools for that same organization in the same hat, with no extra sign-in prompts.

Hatrack doesn't collect anything, doesn't track you, and never connects to the internet on its own. The code is open on GitHub if you'd like to look under the hood.
```

## Notes to reviewer

Only Mozilla's reviewers see these, so they're precise rather than friendly.

```
Hatrack uses contextualIdentities to give each tab its own container. When a blank new tab opens in the default container (firefox-default), Hatrack opens a replacement tab in a fresh container and closes the blank one. The <all_urls> host permission is optional (requested only when the user enables "links from other apps" on the options page, and removed when they disable it). With it, webRequest blocking on main_frame requests is used only to detect pages about to load in the default container and reopen them in a new container; requests in other containers are passed through untouched. browsingData.remove is called only with the cookieStoreId of containers Hatrack created, after their last tab closes (following a user-configurable wait, 2 minutes by default), on browser startup, or when the user clicks "Forget" on a kept session. privacy.services.passwordSavingEnabled is set to false so the password manager can't autofill credentials across sessions. No remote code, no network requests, no minified code, no build step. Source: https://github.com/mbaker-wv/hatrack
```

## Screenshots

All 1280×800, in `store/`. Upload them in this order, with these captions:

1. `hatrack-1280x800.png`: A different hat for every account: the same site, side by side, each signed into its own account.
2. `hatrack-menu-1280x800.png`: Name your hats, keep the ones you wear every day, and jump between them from the toolbar.
3. `hatrack-manage-1280x800.png`: Manage all your hats on one page: rename, recolor, keep, or forget.
4. `hatrack-setup-1280x800.png`: A short setup page walks you through the few settings worth changing.

To redraw them: `tools/make-store-image.swift` (1), `tools/render-page.swift` + `tools/make-popup-shot.swift` (2, 3, 4).
