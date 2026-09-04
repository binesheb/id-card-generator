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

The application renders from the card canvas rather than taking a browser screenshot. JPEG export uses maximum quality (`1.0`). The production overlay dimensions are authoritative so the supplied print artwork is not arbitrarily resized to a generic ID-card ratio.

## Windows Application

Built with Electron and electron-builder. The repository includes a GitHub Actions workflow that builds both:

- Windows NSIS installer
- Windows portable executable

After a successful GitHub Actions build, the files are available from the workflow's artifacts.

## Overlay Model

The final visual design is controlled by the supplied overlay artwork. The variable content is:

### Front

- Employee Name
- Designation
- Employee Code (position reserved and configurable)
- Employee Photo

### Rear

- Emergency Address
- Emergency Contact
- Blood Group

The final production overlay will be used to calibrate the exact photo and text positions.

## Phase 2 — HROne

HROne integration will be added later and will use only the permitted HROne External API:

`https://openapi.hrone.cloud/api/external/`

Phase 1 has no HROne dependency.

## Development

```bash
npm install
npm start
```

Build Windows packages:

```bash
npm run dist
```

## License

Project-specific implementation. License to be finalized.
