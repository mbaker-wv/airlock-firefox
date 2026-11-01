# Security

## Reporting a problem

Please don't open a public issue for security problems. Use GitHub's
**Security → Report a vulnerability** on this repository to report privately.

## How Airlock stays up to date

- **Firefox itself** (the engine that loads pages) is patched by Mozilla and updates automatically.
- **Airlock has no third-party libraries**, so there are no dependencies to patch.
  All code is plain, readable JavaScript in this repository.
- **Checks run on every change and weekly:** Mozilla's add-on linter (`.github/workflows/check.yml`)
  flags anything Mozilla's review would reject, including Firefox API changes.
- **Dependabot** checks the build tooling (GitHub Actions) for updates weekly.
- **Fixes ship through addons.mozilla.org:** a new version is signed and reviewed by Mozilla,
  and Firefox updates installed copies automatically.

## Supported versions

Only the latest release is supported.
