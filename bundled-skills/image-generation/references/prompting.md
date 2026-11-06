# Prompting for the atQor image MCP

These principles apply to `image_generation_generate_image` and
`image_generation_edit_image`. Prompt structure does not extend their schemas. The output is a
PNG uploaded to Blob Storage and must be embedded using its returned `blob_url`.

## Structure

Use a consistent order: scene/backdrop, subject, key details, composition,
lighting, constraints, and intended use. For complex requests, use short labeled
lines inside the single `prompt` argument. Keep the prompt within 32,000 characters.

## Specificity

- Preserve the user's exact requirements, wording, intended use, and exclusions.
- For a detailed prompt, organize rather than add creative requirements.
- For a generic prompt, add scene, medium, framing, or lighting details only when
  they support the request. Do not invent brands, slogans, characters, or props.
- Treat sample recipes as examples, not a requirement to augment every prompt.

## Composition and materials

Specify framing and viewpoint when useful: close-up, wide shot, top-down, or
eye-level. Request negative space only when the asset needs room for copy or UI.
Do not impose side-specific placement without a layout requirement.

For photorealism, state it explicitly and name real-world textures and material
details. For people, describe body framing, gaze, scale, and interactions when
they matter. For product images, preserve product shape, materials, and labels.

## Text in images

Quote literal text and require verbatim rendering with no extra words. Specify
typography, placement, and contrast. Use medium or high quality for dense labels
when supported and useful. Generated text can still be imperfect; do not claim
it is correct without inspecting the image with a supported remote-image tool.

## Supported controls

- `size`: square `1024x1024`, landscape `1536x1024`, portrait `1024x1536`, or `auto`.
- `quality`: low for requested drafts, medium for ordinary final images, high
  when additional detail benefits the request, or auto when appropriate.
- `background`: auto or opaque; transparent only with confirmed deployment support.
- `filename`: optional simple `.png` blob basename, never a local output path.

Editing also requires `image_urls`: an ordered list of 1-16 URLs in the configured
Blob account and container. Each image must be PNG, JPEG, or WebP smaller than 50 MiB.

Do not pass model names, 4K dimensions, raw image bytes, masks, batch counts, output
formats, or output directories. See [image-api.md](image-api.md) for the contract.

## References, edits, and transparency

Use `edit_image` when the user supplies images to change, combine, or use as
references. Supply 1-16 valid Blob URLs in order and name each role in the prompt:
"Image 1: base scene; Image 2: subject; Image 3: style reference." State the exact
change and invariants, such as "change only the background; preserve the face,
pose, clothing, and composition." Preservation is prompt-guided, not guaranteed.

The tool reads private inputs using storage credentials. If references are local
attachments or external URLs, ask for URLs in the configured account/container
or a separately authorized upload workflow. Do not claim to edit an image that
was not supplied to the tool. Masks and input-fidelity controls are unavailable.

Do not promise an alpha channel based on prompt wording. Confirm deployment
support before using `background="transparent"`; otherwise discuss the limitation
without silently selecting a different model or inventing a removal workflow.

## Iteration

For changes to an existing result, use its returned `blob_url` as an input to
`edit_image`, not a fresh generation call. Each operation uploads a new PNG.
Carry forward important constraints and change only the requested details.
Explain preservation limits where relevant and avoid unnecessary paid variants.
Never automatically retry generation or upload failures.

## Use-case tips

- Photography: concrete lens, light, framing, and real texture; avoid unwanted polish.
- Product mockups: clear silhouettes, materials, exact label text, and practical context.
- UI mockups: requested fidelity, hierarchy, legible text, and realistic controls.
- Infographics: explicit labels, accurate relationships, clear flow, and readable spacing.
- Logos: simple, balanced silhouettes; output remains raster PNG, not native vector.
- Educational diagrams: correct terminology, audience, lesson, and scientific constraints.
- Story illustrations: concrete scene beats; no guarantee of cross-image character identity.
- Game assets: intended framing, style, materials, and readable silhouettes.
- Historical scenes: location, date, period clothing, architecture, and excluded modern elements.

## Delivery

Use the returned `blob_url` as `![brief description](<returned blob_url>)` in the
final response, outside code fences. Do not save to an output directory, use
local-path image markup, or replace the image with a text link. Private storage
can prevent rendering; see [codex-network.md](codex-network.md).

For generation and edit recipes, see [sample-prompts.md](sample-prompts.md).
