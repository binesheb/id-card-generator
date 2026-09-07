# Software Versioning and Release Policy

This project treats every production feature, addition, and fix as a versioned software release.

## Version format

Semantic Versioning is used:

`MAJOR.MINOR.PATCH`

Examples:

- `0.1.5` → `v0.1.5`
- `0.1.6` → `v0.1.6`
- `0.2.0` → `v0.2.0`

## When to increment

### PATCH

Use a patch release for:

- Bug fixes
- Layout corrections
- Font-size/position corrections
- Rendering fixes
- Export/printing fixes
- Reliability improvements
- Security fixes that do not change the user-facing contract

Example: `0.1.5` → `0.1.6`

### MINOR

Use a minor release for:

- New user-facing features
- New template capabilities
- New import/export capabilities
- New integrations such as HROne
- New supported platform functionality that does not break existing use

Example: `0.1.6` → `0.2.0`

### MAJOR

Use a major release for breaking changes.

Example: `0.9.9` → `1.0.0`

## Release requirements

A production release is not complete until all of the following match:

1. `package.json` version
2. Git tag `vMAJOR.MINOR.PATCH`
3. Windows installer version
4. Windows portable executable version
5. `latest.yml` updater metadata
6. GitHub Release version
7. Changelog entry

## Release pipeline

1. Implement the feature/fix.
2. Update `CHANGELOG.md`.
3. Increment `package.json` using the appropriate SemVer level.
4. Commit the release change.
5. Create and push the matching `vMAJOR.MINOR.PATCH` tag.
6. GitHub Actions runs tests.
7. GitHub Actions builds the Windows installer and portable executable.
8. Build output is verified.
9. GitHub Actions publishes the GitHub Release with the Windows binaries and updater metadata.
10. Existing installations can discover the new version through the self-update mechanism.

Never publish a Windows executable whose version does not match its Git tag.
