# Security

## Found a problem?

Please **don't** post security problems in public issues. Instead, go to this repository's
**Security** tab and click **Report a vulnerability**. Only the maintainer sees it, and
you'll get a reply there.

## How Airlock stays safe and up to date

**Firefox does the heavy lifting.** The part that actually loads web pages is Firefox
itself, and Mozilla patches and updates it automatically.

**Airlock is small and has no outside code.** It doesn't use any third-party libraries,
so there's nothing hidden inside it that could go out of date. Every file is plain,
readable JavaScript in this repository.

**Every version is checked twice before it reaches you:**

1. **Here on GitHub:** every change, plus a weekly check every Monday, runs Mozilla's own
   add-on checker. Anything Mozilla would reject, including features Firefox is retiring,
   shows up here first.
2. **At Mozilla:** each new version is reviewed and signed by Mozilla before it's published.
   Firefox refuses to install add-ons Mozilla hasn't signed.

**Updates arrive on their own.** When a new version is approved, Firefox updates your copy
automatically, usually within a day.

**The build tools are watched too.** GitHub's Dependabot checks the tools used to test
and release Airlock every week and suggests updates.

## Supported versions

Only the latest version gets fixes. Firefox keeps you on it automatically.
