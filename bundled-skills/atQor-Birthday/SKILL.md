---
name: atQor-Birthday
description: Create atQor employee birthday PNG cards with the branded template, enhancing poor-quality supplied photos before deterministic rendering. Use the separate atQor-Work-Anniversary skill for work anniversaries.
---

# atQor Birthday

Create shareable 1080 x 1080 PNG cards inspired by the supplied atQor birthday reference. Preserve the capital Q in atQor everywhere, including this skill identifier, folder, and output filenames. The casing is an explicit user convention.

## Inputs and rendering

Use the employee name, occasion, and photo supplied by the user. Ask for missing required inputs; do not invent employee information, birthdays, service years, or photos. This skill is for birthdays; set `occasion` to `birthday`. Accept a custom message and greeting when supplied. Route work anniversary requests to [atQor-Work-Anniversary](../atQor-Work-Anniversary/SKILL.md).

Use [assets/atQor-example.json](assets/atQor-example.json) as the editable input template. Photo paths resolve relative to the input JSON. `photo_focus` is [horizontal, vertical], both 0 to 1, controlling the crop within the overflow of a cover-scaled image. Defaults are [0.5, 0.4]. `photo_zoom` defaults to 1 and accepts 1 to 3. It enlarges the photograph before cropping; use it to improve framing. An image already matching the frame aspect ratio has no positional movement at zoom 1.

Run from any directory, replacing the paths with actual absolute paths:

```powershell
python -m pip install -r "<skill-folder>/scripts/atQor-requirements.txt"
python "<skill-folder>/scripts/atQor-render.py" --config "<input-folder>/atQor-card.json" --output "<output-folder>/atQor-birthday.png"
```

For several employees, provide a JSON array of card objects and set `--output` to a directory. Each card receives its own numbered atQor PNG. This creates local images; it does not schedule morning runs, fetch HR data, or send messages. Only publish or send cards when the user requests it.

## Photo preparation

Inspect the supplied photo before rendering. If it is dark, blurry, noisy, backlit, obstructed by a finger, or has distracting people or clutter, enhance it first using the sibling [image-generation skill](../image-generation/SKILL.md) and its atQor MCP edit_image tool. This is part of making the requested card; do not ask for redundant approval for the enhancement call. Skip AI editing when the photo is already suitable.

Preserve the employee's recognizable face, facial proportions, skin tone, hair, expression, and clothing. Improve exposure, white balance, noise and gentle sharpness naturally. Remove camera obstructions and distracting background elements when useful; use a softly blurred office or neutral background. Request a head-and-upper-torso portrait with space above the head. Do not invent a different face, makeup, or employee information. If the face is too obscured to recover faithfully, request a clearer photo.

Use direct attachment bytes for the edit, never just a filename. Download the returned PNG locally because the card renderer needs a local photo, and use that path in the card JSON. Keep the original upload. Follow image-generation's error handling; do not automatically retry a timed-out paid call or failed upload. If editing is unavailable, explain the limitation and make only useful local crop adjustments without claiming AI enhancement.

## Assets and layout

- [assets/atQor-template.png](assets/atQor-template.png): blank reusable branded canvas.
- [assets/atQor-background.png](assets/atQor-background.png): recreated purple/blue gradient background.
- [assets/atQor-logo.png](assets/atQor-logo.png): transparent logo extracted from the supplied card; use it rather than retyping the logo.
- [assets/atQor-photo-mask.png](assets/atQor-photo-mask.png): full-canvas grayscale curved frame mask.
- [assets/atQor-overlay.png](assets/atQor-overlay.png): frame outline, logo, and bottom border.
- The regular and bold fonts are bundled for consistent local rendering.
- [assets/atQor-birthday-lettering.png](assets/atQor-birthday-lettering.png): original decorative Happy Birthday lettering extracted from the user's reference as transparent artwork. Always use this for the default birthday greeting; do not replace it with a typed font.

The photo occupies x=235..872, y=235..695, with its lower curved section filled by the name band. Keep the employee name in the safe left section of this band. Preserve the reference's birthday typography: regular employee name, bold “Wish” and “happy birthday” in the message, and the supplied calligraphic artwork at the bottom right. Do not substitute fonts or restyle the lettering unless requested. The renderer wraps and reduces custom text size to fit bounded regions; if the minimum size cannot fit, shorten the text instead of clipping. The background is a recreation; the exact source font for editable text is unavailable, so the bundled sans serif remains an approximation. Custom greeting wording uses editable text because only the default birthday artwork has been supplied.

Inspect each resulting PNG with the available image viewer. Check face visibility, crop, name spelling, message wrapping, logo clarity, and occasion. Adjust focus/zoom and rerender if the head is cut off. Return the PNG and its absolute file link. For user-requested template changes, edit the assets or renderer deliberately and verify a sample output.
