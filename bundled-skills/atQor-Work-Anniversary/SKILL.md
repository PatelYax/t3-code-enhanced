---
name: atQor-Work-Anniversary
description: Create atQor employee work anniversary PNG cards using the supplied white reference design with a circular portrait, Congratulations artwork, name, and service years. Enhance poor-quality supplied photos first. For birthdays use atQor-Birthday.
---

# atQor Work Anniversary

Create shareable 1080 x 1080 PNG cards matching [the supplied reference](assets/atQor-reference.jpg). Preserve the `atQor` prefix and capital Q in skill names, folders, filenames and branding. Reference employee details are examples, not defaults for new requests.

## Inputs and rendering

Require employee name, photo and completed service years. Ask for missing inputs; never infer years from a photo or reuse the reference person's details. Use [assets/atQor-example.json](assets/atQor-example.json) as the input structure; replace every example value. Years must be a nonnegative integer. The renderer prints `1 YEAR AT atQor` or `N YEARS AT atQor` with visual letter spacing.

Photo paths resolve relative to the JSON file. `photo_focus` is [horizontal, vertical], each 0 to 1; defaults [0.5, 0.4]. `photo_zoom` defaults to 1 and accepts 1 to 3. Adjust these after visual inspection to keep the full head visible in the circle.

```powershell
python -m pip install -r "<skill-folder>/scripts/atQor-requirements.txt"
python "<skill-folder>/scripts/atQor-render.py" --config "<input-folder>/atQor-card.json" --output "<output-folder>/atQor-anniversary.png"
```

For multiple employees, use a JSON array and an output directory; each gets a numbered atQor PNG. This creates local cards. Sending, publishing, or scheduling requires the user's request.

## Photo preparation

Inspect the supplied photo before rendering. If it is dark, blurry, noisy, backlit, obstructed by a finger, or has distracting people or clutter, enhance it first using the sibling [image-generation skill](../image-generation/SKILL.md) and its atQor MCP edit_image tool. This is part of making the requested card; do not ask for redundant approval for the enhancement call. Skip AI editing when the photo is already suitable.

Preserve the employee's recognizable face, facial proportions, skin tone, hair, expression, and clothing. Improve exposure, white balance, noise and gentle sharpness naturally. Remove camera obstructions and distracting background elements when useful; use a softly blurred office or neutral background. Request a head-and-upper-torso portrait with space above the head. Do not invent a different face, makeup, or employee information. If the face is too obscured to recover faithfully, request a clearer photo.

Use direct attachment bytes for the edit, never just a filename. Download the returned PNG locally because the card renderer needs a local photo, and use that path in the card JSON. Keep the original upload. Follow image-generation's error handling; do not automatically retry a timed-out paid call or failed upload. If editing is unavailable, explain the limitation and make only useful local crop adjustments without claiming AI enhancement.

## Design and verification

Use the bundled white template with thin purple-to-cyan top and bottom borders, the extracted atQor logo centered near the top, a circular portrait at x=313..766, y=200..652 with a cyan-to-purple outline and soft shadow, the extracted Congratulations artwork beneath the portrait, a centered gray employee name, and the service years near the bottom. Preserve the original decorative artwork rather than substituting a typed font. Bundled sans serif fonts approximate the editable reference text.

Inspect every final PNG with an image viewer for face visibility, crop, name spelling, correct years, lettering edges, logo clarity and text fitting. Adjust crop and rerender if needed. Do not clip long names; the renderer reduces size within a bounded region and rejects names that cannot fit. Return the PNG and its absolute file link.
