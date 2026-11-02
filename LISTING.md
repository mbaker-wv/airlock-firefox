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
- Links you click in other apps open in a new hat instead of whatever you were last signed into.
- Firefox's password saving stays off, so it can't fill in the wrong password.
- Don't want every tab sealed off? Turn automatic mode off and only open Hatrack tabs when you ask for them.

Managing a few admin dashboards for different organizations? Sign in once, then press ⌥⌘T to open the other tools for that same organization in the same hat, with no extra sign-in prompts.

Hatrack doesn't collect anything, doesn't track you, and never connects to the internet on its own. The code is open on GitHub if you'd like to look under the hood.
```

## Notes to reviewer

Only Mozilla's reviewers see these, so they're precise rather than friendly.

```
Hatrack uses contextualIdentities to give each tab its own container. When a blank new tab opens in the default container (firefox-default), Hatrack opens a replacement tab in a fresh container and closes the blank one. webRequest blocking on main_frame requests is used only to detect pages about to load in the default container and reopen them in a new container; requests in other containers are passed through untouched. browsingData.remove is called only with the cookieStoreId of containers Hatrack created, when their last tab closes or when the user clicks "Forget" on a kept session. privacy.services.passwordSavingEnabled is set to false so the password manager can't autofill credentials across sessions. No remote code, no network requests, no minified code, no build step. Source: https://github.com/mbaker-wv/hatrack
```

## Screenshots to add

1280×800 works best.

1. Three tabs with different hat colors, each signed into a different account
2. The toolbar button's menu, showing a renamed session and the Keep option
3. The welcome and setup page
