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

The application renders directly from the card canvas instead of taking a browser screenshot. JPEG export uses maximum encoder quality (`1.0`). The supplied overlay pixel dimensions are authoritative; the application does not silently resize the production artwork to an assumed card ratio.

The project uses a 600-DPI print-master target for calibration/documentation. The actual exported pixel dimensions come from the production overlay artwork. This is intentional: DPI metadata alone does not create additional image detail, so the final overlay should be supplied at the desired print resolution.

## Windows Application

Built with Electron and electron-builder.

The GitHub Actions workflow:

- Installs dependencies
- Performs JavaScript syntax validation
- Builds Windows NSIS installer and portable executable
- Verifies that build artifacts were created
- Uploads the Windows artifacts for testing

### Local development

```bash
npm install
npm start
```

### Validate source

```bash
npm run check
```

### Build Windows packages

```bash
npm run dist
```

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
