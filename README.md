# ID Card Generator

A self-hosted, high-quality employee ID card generator designed for standard overlay-based card printing.

## Phase 1

Phase 1 is intentionally independent of HROne.

### Features

- Upload passport-size employee photo
- Crop, zoom and reposition the photo to the exact template photo area
- Enter employee name
- Enter employee code
- Enter designation
- Enter emergency address
- Enter emergency contact number
- Select blood group
- Use fixed front and rear standard overlays
- Live front/back preview
- Generate high-resolution JPG files
- Maximum-quality JPEG export for printing
- Automatic filenames:
  - `<EMPLOYEE_CODE>_FRONT.jpg`
  - `<EMPLOYEE_CODE>_BACK.jpg`
- Print-ready physical card dimensions

## Phase 2

Hro​ne integration will be added separately using only the HROne External API available under:

`https://openapi.hrone.cloud/api/external/`

No HROne dependency is included in Phase 1.

## Template

The standard front and rear overlay supplied for the project will define the exact visual design, card dimensions, photo area, and text placement.

## Output

The generator should render the final card at print resolution rather than exporting a browser screenshot. The target is high-quality output suitable for Epson L8050 printing.

## License

Project-specific implementation. License to be finalized.
