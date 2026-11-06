---
name: "image-generation"
description: "Use when asked to generate, create, edit, modify, combine, or restyle images, illustrations, photos, textures, sprites, mockups, website assets, or visual variants, or explicitly invoke $imagegen. Use the atQor MCP image_generation tools; edits accept 1-16 Blob image URLs per call. Both operations upload one PNG to Azure Blob Storage and return blob_url for Markdown image display in chat."
---

# Image Generation

Use the image-generation app in `atQor_mcp/image_generation`, mounted by `atQor_mcp/main.py`. It generates or edits one PNG using the configured Azure OpenAI deployment and uploads the bytes directly to Azure Blob Storage through `atQor_mcp/utils/blob_storage.py`. No local image file is saved. A normal image-generation or edit request authorizes the corresponding paid call; do not repeat setup when configuration is present.

## Execution routing

1. Discover the configured atQor MCP tools and inspect their actual schemas. The combined server exposes `image_generation_generate_image`, `image_generation_edit_image`, and `image_generation_check_configuration`. Runtime names may add a server prefix; match the operation rather than hardcoding a client-specific name. A directly connected child server exposes `generate_image`, `edit_image`, and `check_configuration` without the mount prefix.
2. If configuration is uncertain, call the image app's configuration tool. It checks configuration offline and returns `configured`, `blob_container`, and `message`; it does not prove deployment or storage access.
3. Use `generate_image` for new text-only images. Use `edit_image` for changes to existing images, image-based references, or combining images, supplying 1-16 input URLs in the intended order. Do not substitute generation for an edit without the user's agreement. Do not call `ai_search` for image operations or bypass MCP with the old CLI, a new SDK runner, or another provider.
4. If the tool is unavailable, explain that the atQor server must be connected. For server setup only, consult [references/cli.md](references/cli.md). This skill does not register an MCP server automatically.
5. If generation or storage fails, report the safe tool error. Never automatically retry a timed-out generation or an upload failure: generation may already have incurred a charge. Do not ask for secrets in chat, read `.env`, print credentials, or change storage access policies.
6. Use another tool, model, or provider only when the user explicitly chooses an alternative for unsupported capabilities.

The deployment is selected by the image app's settings, not by this skill. Do not assume a fixed model or expose a `model` argument that the MCP tool does not accept.

## Azure MCP contract

`generate_image` accepts:

- `prompt`: the complete generation prompt, containing non-whitespace text and no more than 32,000 characters.
- `size`: `1024x1024` (default), `1536x1024`, `1024x1536`, or `auto`.
- `quality`: `low`, `medium` (default), `high`, or `auto`.
- `background`: `auto` (default), `opaque`, or `transparent`; support depends on the deployment.
- `filename`: optional PNG blob name. Its stem starts with a letter or digit, has 1-121 characters using letters, digits, underscores, or hyphens, and ends in lowercase `.png`. No directory paths; existing blobs are never overwritten. Omit it to get a unique generated name.

The tool returns `blob_url`, `container`, `blob_name`, `mime_type`, `bytes`, `size`, and `quality`. Use the exact returned `blob_url`, not a local path or a reconstructed storage URL. The wrapper supports only the sizes above, even if the underlying deployment supports other dimensions. See [references/image-api.md](references/image-api.md) for request and response examples.

Issue one call per requested asset or distinct variant. Do not generate extra paid variants merely to verify tool wiring. Use medium quality for ordinary final images, low for requested drafts, and high when the request benefits from additional detail.

### Edit contract

`edit_image` accepts the same `prompt`, `size`, `quality`, `background`, and `filename` options, plus required `image_urls`: an ordered list of **at least 1 and at most 16 URLs per call**. It returns the same Blob response fields as generation and produces one output image, not one output per input.

Inputs must be PNG, JPEG, or WebP images, each smaller than 50 MiB, at HTTPS Blob URLs in the configured storage account and container. Previously returned `blob_url` values can be used directly. The server reads inputs through its storage credentials; it ignores URL query credentials and does not require public access. It rejects arbitrary external URLs, other accounts or containers, local paths, and base64 strings. Do not invent an input URL or silently upload external user images; ask for usable URLs or a separately authorized upload workflow.

Preserve input order and describe roles in the prompt, such as "Image 1 is the base scene; Image 2 is the subject to insert." State what should change and what must remain unchanged. For a follow-up edit, use the prior result URL as an input. If more than 16 references are supplied, ask the user to select the needed subset; do not silently discard inputs or split a single edit into extra paid calls.

## Capability boundaries

The image MCP supports text-to-image generation and image-conditioned editing through the configured deployment. Deployment support for the edit API must be available; offline configuration checks cannot prove it. Editing can modify or combine supplied images, but exact pixel preservation, identity consistency, or exact text is not guaranteed. Masks, native vector output, input-fidelity controls, and external-image fetching are not exposed by these tools.

The `background` parameter is generic; support depends on the deployment. Do not promise native transparency without confirmed support. If the requested deployment does not support it, explain the limitation instead of silently switching providers or inventing a cutout tool.

## Display in chat

Read `blob_url` from the structured tool result, or parse its JSON text payload if the runtime exposes text content. Do not display the raw JSON in place of the image.

After successful generation or editing, include an actual Markdown image in the final response:

```markdown
![Brief description of the generated image](<returned blob_url>)
```

Replace `returned blob_url` with the exact URL from the tool result and use concise, meaningful alt text. The angle brackets delimit the URL; they are not part of it. The final image must not be inside a code fence, inline code, or an escaped Markdown string. A plain URL or a text-only hyperlink is not a substitute for the image.

For multiple requested images, embed every returned URL separately with descriptive alt text. An optional `[Open image](<returned blob_url>)` link may accompany an image, but not replace it. Do not claim to have inspected the visual result unless an available image-capable tool actually opened it.

The current Blob utility removes SAS query parameters. A private blob URL therefore requires authorization and may not render in chat. Still include the returned Markdown image, but disclose this limitation when access is known to be blocked; do not claim it is visible. Do not invent a SAS token or make the container public. For rendering diagnostics, consult [references/codex-network.md](references/codex-network.md).

## Prompt and output workflow

- Determine whether the user wants new generation or an edit. Respect the capability boundaries above.
- Preserve specific user requirements, exact text, intended use, and avoid constraints. For generic prompts, add tasteful scene, composition, and medium details that support the request; do not invent brands, slogans, or unrelated objects.
- For more involved prompts, consult [references/prompting.md](references/prompting.md) or [references/sample-prompts.md](references/sample-prompts.md) selectively. Their prompt recipes do not override the Azure tool's actual parameter schema.
- Generate or edit using the appropriate MCP route above. When visual validation is needed, use an available tool that can inspect a remote image URL. Local-file `view_image` cannot directly inspect a Blob URL; do not save a local copy merely to satisfy this skill.
- Embed the exact returned `blob_url` in Markdown so the chat renderer can display it. A simple request can finish with the image itself.
- For a project asset, use the returned URL in the consuming image reference when appropriate. Download only when the user or project explicitly requires a local asset; local persistence is not part of the generation tool.
- Iterate when the user asks for changes or a material requirement is unmet. Report the route or limitations when relevant; a simple generation request can finish with the image itself.

## References

- [references/cli.md](references/cli.md): atQor server startup and MCP connection checks, not a generation CLI.
- [references/image-api.md](references/image-api.md): supported tool parameters, Blob result, and Markdown examples.
- [references/codex-network.md](references/codex-network.md): Azure connectivity and image-URL rendering limitations.
- [references/prompting.md](references/prompting.md): prompt design within the MCP's capabilities.
- [references/sample-prompts.md](references/sample-prompts.md): generation and image-edit prompt recipes.
