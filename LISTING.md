# Store listing

The text used on the add-on's page at
[addons.mozilla.org/firefox/addon/airlock-sessions](https://addons.mozilla.org/firefox/addon/airlock-sessions/).
Kept here so it's easy to update and reuse.

**Name:** Airlock
**Web address:** `airlock-sessions`
**Categories:** Privacy & Security, Tabs
**Support website:** https://github.com/mbaker-wv/airlock-firefox
**License:** MIT License
**Privacy policy:** none needed (no data collected)

## Summary

> 250 characters max

Use several accounts on the same site side by side without them getting mixed up. Every tab gets its own private session, and its login disappears when you close it, unless you choose to keep it.

## Description

```
I built Airlock because I juggle several accounts on the same sites (work, personal, and a few for clients), and every browser kept "helping" by signing me into the wrong one. Private windows didn't fix it either, since all private tabs share the same session.

With Airlock, every new tab gets its own sealed-off session. Sign into one account in this tab, a different one in the next, and they'll never know about each other. Close the tab and that login is gone.

A few things that make it nice to use day to day:

- Press ⌘T (Ctrl+T on Windows) for a fresh, signed-out tab.
- Press ⌥⌘T (Ctrl+Alt+T) when you want another tab that's already signed in to the same account.
- Each session gets its own color, and you can give it a name like "Work" or "Client A" so you always know where you are.
- Tick "Keep" on accounts you use every day and they'll stay signed in, even after you close their tabs.
- Links you click in other apps open in a new session instead of whatever you were last signed into.
- Firefox's password saving stays off, so it can't fill in the wrong password.
- Don't want every tab sealed off? Turn automatic mode off and only open Airlock tabs when you ask for them.

Managing a few admin dashboards for different organizations? Sign in once, then press ⌥⌘T to open the other tools for that same organization in the same session, with no extra sign-in prompts.

Airlock doesn't collect anything, doesn't track you, and never connects to the internet on its own. The code is open on GitHub if you'd like to look under the hood.
```

## Notes to reviewer

Only Mozilla's reviewers see these, so they're precise rather than friendly.

```
Airlock uses contextualIdentities to give each tab its own container. When a blank new tab opens in the default container (firefox-default), Airlock opens a replacement tab in a fresh container and closes the blank one. webRequest blocking on main_frame requests is used only to detect pages about to load in the default container and reopen them in a new container; requests in other containers are passed through untouched. browsingData.remove is called only with the cookieStoreId of containers Airlock created, when their last tab closes or when the user clicks "Forget" on a kept session. privacy.services.passwordSavingEnabled is set to false so the password manager can't autofill credentials across sessions. No remote code, no network requests, no minified code, no build step. Source: https://github.com/mbaker-wv/airlock-firefox
```

## Screenshots to add

1280×800 works best.

1. Three tabs with different Airlock colors, each signed into a different account
2. The toolbar button's menu, showing a renamed session and the Keep option
3. The welcome and setup page
