# Changelog

All user-facing features, fixes, and improvements are released as versioned builds.

## Unreleased

- Refined rounded photo presentation and positioning.
- Improved front-side employee name and employee-code readability.
- Improved rear-side emergency information cards for readability.
- Continued Windows build and validation hardening.

## 0.1.5

- Added production-oriented Windows packaging.
- Added self-update infrastructure using GitHub Releases.
- Added bundled production fonts.
- Added high-quality JPEG export and print-density metadata.
- Added automated source and build verification.

## Release policy

- **PATCH** (`0.1.x`): bug fixes, rendering corrections, reliability fixes, documentation-only production fixes.
- **MINOR** (`0.x.0`): new user-facing features or meaningful capability additions.
- **MAJOR** (`x.0.0`): breaking changes to templates, workflows, APIs, or stored data formats.

Every production change must have a versioned Git tag in the form `vMAJOR.MINOR.PATCH`. The Windows installer, portable executable, updater metadata, and GitHub Release must all use the same version.
