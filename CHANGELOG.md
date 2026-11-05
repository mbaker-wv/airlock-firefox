# Changelog

## 1.1.0

- **New name: Hatrack** (was Airlock), with a new top-hat icon. Sessions are now called "hats".
- **Your hats, in the toolbar menu:** every hat with its tab count. Click one to jump to it, or + for another tab in it.
- **Manage hats page:** rename, recolor, keep, go to, close tabs, forget, or erase every hat you haven't kept.
- **Open Link in New Hat:** right-click any link to open it signed out, or as a different account.
- **The toolbar button shows your current hat**: its number or initials, in its color.
- **A short wait before erasing** (2 minutes by default, adjustable or immediate), so a tab you
  closed by accident can be reopened with ⇧⌘T still signed in.
- **Hat numbers are reused**, so they stay small instead of counting up forever.
- **Fewer permissions:** "access your data for all websites" is now only requested if you turn on
  "links from other apps" on the setup page. Turning it off gives the permission back.
- **Works alongside Multi-Account Containers:** leave "links from other apps" off if you use its
  "Always open this site in…" feature.
- **Fix:** a link opened from another app could also leave an extra empty tab behind.
- **Fix:** the menu showed "New tab in this hat" on tabs that didn't have a hat.
- Requires Firefox 140 or newer, the first version that understands Hatrack's "collects no data" declaration.
- Friendlier, plainer wording on the welcome and setup page.

## 1.0.0

- First release: every new tab gets its own private session, erased when its last tab closes.
- Same-session tabs (⌥⌘T / Ctrl+Alt+T), color-coded and renamable sessions, and "Keep" for accounts you use daily.
- Links from other apps open in a new session; Firefox's password saving stays off.
- Toolbar icon with light and dark versions.
