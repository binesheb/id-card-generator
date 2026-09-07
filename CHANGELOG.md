# Changelog

All user-facing features, fixes, and improvements are released as versioned builds.

## Unreleased

Future changes will remain here until the next version is prepared.

## 0.2.0

- Redesigned the Windows application shell to closely match the supplied Jayalakshmi ID Card Generator reference UI.
- Added a polished title bar with Templates, Settings/update access, About and native window controls.
- Added the Employee Details / Design navigation treatment and production-style form layout.
- Added responsive front/rear card preview workspace with zoom controls and print toolbar.
- Added visual photo thumbnail feedback after upload.
- Added Download JPG and Print actions to the redesigned workflow.
- Added frameless Electron window support with secure minimize, maximize and close IPC controls.
- Fixed the desktop JPG export call to use the existing `save-jpgs` IPC contract.
- Bumped the application version to `0.2.0`.

## 0.1.6

- Refined rounded photo presentation and positioning.
- Moved the employee name lower to avoid photo overlap.
- Increased employee-code size and improved placement for print readability.
- Improved rear-side emergency address, contact, and blood-group cards for readability.
- Added mandatory release versioning and release validation.
- Added a documented release policy for Windows installer, portable executable, updater metadata, and GitHub Releases.

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
