# atQor image MCP contract

The image app performs text-to-image generation through Azure OpenAI and
uploads a single PNG to Azure Blob Storage. Use the MCP tool, not a raw API
request. The configured deployment is selected by the server's settings.

## Generate tool

On the combined host, discover `image_generation_generate_image`. A client may
prepend its own server identifier. A directly connected image app exposes
`generate_image`.

| Argument     | Allowed values                                             | Default               |
| ------------ | ---------------------------------------------------------- | --------------------- |
| `prompt`     | Non-whitespace text, maximum 32,000 characters             | Required              |
| `size`       | `1024x1024`, `1536x1024`, `1024x1536`, `auto`              | `1024x1024`           |
| `quality`    | `low`, `medium`, `high`, `auto`                            | `medium`              |
| `background` | `auto`, `opaque`, `transparent`; deployment support varies | `auto`                |
| `filename`   | Simple PNG blob name with no directory components          | Unique generated name |

The filename must match `[A-Za-z0-9][A-Za-z0-9_-]{0,120}\.png`.
The tool does not accept `model`, `n`, `image`, `mask`, `input_fidelity`,
`output_format`, `output_dir`, or `path`. Prompt recipes do not add arguments
to this schema. Larger dimensions are not supported by the current wrapper.

Example tool arguments:

```json
{
  "prompt": "A watercolor mountain village at sunrise, soft natural colors, no text",
  "size": "1536x1024",
  "quality": "medium",
  "background": "auto"
}
```

## Response

Example response shape; the illustrative URL is not a generated asset:

```json
{
  "blob_url": "https://example.blob.core.windows.net/generated-images/image-example.png",
  "container": "generated-images",
  "blob_name": "image-example.png",
  "mime_type": "image/png",
  "bytes": 123456,
  "size": "1536x1024",
  "quality": "medium"
}
```

`size` and `quality` echo the request; `auto` is not a measured pixel dimension
or a reported quality decision. The response contains no local file path.

The server decodes the returned PNG in memory, uploads with
`Content-Type: image/png` and `overwrite=False`, and closes its SDK clients.
An existence check happens before the paid generation call; the upload also
guards against concurrent creation of the same blob.

## Required chat output

Substitute the actual `blob_url` into this Markdown image template and emit it
as rendered Markdown in the final answer, not inside a code block:

```markdown
![Watercolor mountain village at sunrise](<returned blob_url>)
```

Use the exact URL returned by the tool. Do not invent a URL, append credentials,
replace it with a local path, or use only a text hyperlink. For multiple assets,
emit one image per result with meaningful alt text. A separate open-image link
is optional and must not replace the image.

The Blob utility strips SAS query parameters. Private containers require
authorized access; Markdown alone does not make a private image readable.
If access is blocked, include the image markup and disclose the limitation
without claiming successful rendering or changing the access policy.

## Configuration tool

`image_generation_check_configuration` takes no arguments. When configured,
it returns `configured: true`, `blob_container`, and an offline-check message.
When invalid, it returns `configured: false` and safe field-name diagnostics.
Do not use this check as proof that the URL is publicly accessible.

## Errors and capabilities

Only text-to-image is supported. Edits, image references, masks, native vector
output, and guaranteed transparency are not implemented by this MCP.
Issue one generation call per requested image; batching uses separate calls,
not a batch parameter. Avoid extra paid variants for connection testing.

Never automatically retry a timeout or upload failure. The image may already
have been generated and charged, even when no URL was returned. Report the
safe tool error and explain this risk before another user-authorized attempt.
