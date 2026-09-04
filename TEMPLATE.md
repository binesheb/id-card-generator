# Standard ID Card Template Specification

## Approved visual reference

The supplied reference image establishes the intended final look:

- Portrait employee ID card
- Fixed brand artwork/background supplied as an overlay
- Variable employee photograph
- Variable employee name
- Variable designation
- Employee code reserved as a configurable variable field; final code format and exact visual position remain to be finalized
- Rear side contains emergency address, emergency contact number and blood group

## Overlay model

The generator accepts separate Front Overlay and Rear Overlay image files.

Recommended format: **transparent PNG** containing only the fixed artwork. Variable content is rendered by the application.

Rendering order:

1. White/base canvas
2. Employee photo (front)
3. Standard overlay artwork
4. Variable text

This keeps the supplied design authoritative while allowing employee-specific content to change.

## Reference geometry

The uploaded visual reference is 625 × 965 pixels. The current prototype uses proportional coordinates derived from that reference so the layout scales with the production overlay.

The production overlay's own dimensions will become authoritative when it is supplied.

## Front variable fields

- Employee Name
- Designation
- Employee Code

The name and designation positions are established from the supplied reference. Employee Code is currently reserved between the designation and lower fixed branding area and can be moved by changing one configuration object in `app.js`.

## Photo

The photo area is defined proportionally from the supplied reference. The user can:

- Upload JPG, PNG or WebP
- Zoom
- Drag/reposition
- Reset

The photo is clipped to the configured photo rectangle before the overlay is applied.

## Output

- 600 DPI rendering target
- JPEG quality 100%
- `<EMPLOYEE_CODE>_FRONT.jpg`
- `<EMPLOYEE_CODE>_BACK.jpg`

## HROne

HROne integration is Phase 2 only. Phase 1 has no dependency on HROne.
