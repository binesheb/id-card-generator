# Jayalakshmi ID Card Generator

A Windows desktop application for generating high-quality employee ID cards from approved front and rear overlay artwork.

## Phase 1 — Windows Desktop

Phase 1 is completely independent of HROne.

### Workflow

1. Open the Windows application.
2. Enter Employee Name, Employee Code and Designation.
3. Upload the employee photograph.
4. Drag, zoom and position the photograph inside the approved photo area.
5. Load the standard Front and Rear overlay files.
6. Enter Emergency Address, Emergency Contact and Blood Group.
7. Preview both sides.
8. Choose an output folder and generate the two JPG files.

### Output

- `<EMPLOYEE_CODE>_FRONT.jpg`
- `<EMPLOYEE_CODE>_BACK.jpg`

The application renders directly from the card canvas instead of taking a browser screenshot. JPEG export uses maximum encoder quality (`1.0`) and attempts to stamp the JPEG JFIF density to **600 DPI**. The supplied overlay pixel dimensions are authoritative; the application does not silently resize the production artwork to an assumed card ratio.

The project uses a 600-DPI print-master target for calibration/documentation. DPI metadata does not create additional image detail, so the final overlay should be supplied at the desired pixel dimensions for printing.

## Project file map

- `index.html` — desktop application UI and form structure.
- `styles.css` — application styling and bundled font declarations.
- `app.js` — ID-card rendering, photo crop/positioning, variable text, validation and JPG export.
- `electron-main.js` — Electron main process, secure IPC, native output-folder selection, file writing and update service.
- `preload.js` — narrow context-isolated bridge between the renderer and Electron main process.
- `updater-renderer.js` — update status UI, download and installation controls.
- `package.json` — dependencies, scripts, Electron Builder configuration and GitHub update provider.
- `fonts/` — bundled fonts used by the application. Keeping these files in the package avoids depending on fonts installed on the Windows PC.
- `TEMPLATE.md` — current template/rendering specification and provisional geometry.
- `tests/smoke-check.js` — repository-level structural and configuration smoke test.
- `.github/workflows/windows-build.yml` — Windows CI, automated tests, packaging, artifact verification and tagged release publishing.

## Windows Application

Built with Electron and electron-builder.

The GitHub Actions workflow:

- Installs dependencies
- Runs syntax and structural smoke tests
- Builds Windows NSIS installer and portable executable
- Verifies installer, portable executable and updater metadata
- Calculates SHA-256 hashes in the build log
- Uploads Windows artifacts for testing
- Publishes tagged releases with updater metadata

### Local development

```bash
npm install
npm start
```

### Validate source

```bash
npm test
```

### Build Windows packages

```bash
npm run dist
```

## Release status

The current `main` branch is version **0.2.0** and contains the changes recorded under `0.2.0` in `CHANGELOG.md`. The latest published GitHub Release is **v0.1.5**. Until `v0.2.0` is published, production PCs should continue using the latest published release rather than treating an unreleased `main` build as an update channel.

## Self-update

Installed Windows builds use `electron-updater` with GitHub Releases as the update provider. The application checks for updates shortly after startup and also provides a manual **Check for Updates** action. When a release is available it can be downloaded and installed with an application restart.

Production updates require a published GitHub Release containing the installer and generated updater metadata. The portable build is provided for convenience; the **NSIS installed build is the recommended deployment target for self-updating production PCs**.

## Overlay Model

The final visual design is controlled by the supplied overlay artwork.

### Front

- Employee Name
- Designation
- Employee Code (position reserved and configurable)
- Employee Photo

### Rear

- Emergency Address
- Emergency Contact
- Blood Group

Front and rear overlays must have identical pixel dimensions. Transparent PNG is recommended when the overlay contains artwork that should sit above the employee photo or variable fields.

The photo is clipped to the configured photo rectangle, scaled to cover that rectangle, and constrained while dragging so blank gaps cannot accidentally be introduced into the final card.

## Phase 2 — HROne

HROne integration will be added later and will use only the permitted HROne External API:

`https://openapi.hrone.cloud/api/external/`

Phase 1 has no HROne dependency.

## Production calibration

Before using the generator for final PVC printing, supply the actual high-resolution front and rear overlay files. The current proportional photo/text coordinates are based on the supplied visual reference and are intentionally treated as provisional until the production overlays are available.

## License

Project-specific implementation. License to be finalized.
