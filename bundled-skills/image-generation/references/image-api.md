# atQor image MCP contract

The image app performs text-to-image generation and image editing through Azure OpenAI and
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

## Edit tool

Discover `image_generation_edit_image` on the combined host, or `edit_image`
on the child server. It accepts the same prompt and output options as generation,
plus optional `image_urls` and `image_uploads`. Each supplied list has `minItems: 1`
and `maxItems: 16`; omit unused lists. Runtime checks enforce 1-16 total inputs
across both lists before I/O, including rejection when neither is provided.

Each input must be a PNG, JPEG, or WebP smaller than 50 MiB.

`image_urls` entries must be HTTPS URLs in the configured account/container.
The server downloads through its Blob credentials and ignores URL query
credentials. Other accounts/containers and arbitrary remote URLs are unsupported.
Storage credentials need read permission for URL inputs.

`image_uploads` entries are objects containing exactly `filename` (1-255 characters)
and `data_base64` (base64 file bytes without a data-URL prefix). Original filenames
are metadata, never server paths. MIME type is inferred from the decoded file
signature, not the filename. Encoded and decoded size limits are checked. Direct
uploads are processed in memory without local files or a preliminary Blob upload.
MCP carries JSON, so the client must encode actual attachment bytes into this
field. No server filesystem path or multipart upload argument is exposed.

Inputs reach Azure in URL-list order followed by upload-list order. One call
still produces one output image. Never print file base64 in chat or logs.

Example edit arguments; replace the illustrative URL with an actual input URL:

```json
{
  "prompt": "Change only the background of Image 1 to a sunset sky; preserve the subject and its pose.",
  "image_urls": ["https://example.blob.core.windows.net/generated-images/source.png"],
  "size": "1536x1024",
  "quality": "medium",
  "background": "auto"
}
```

Example direct-upload arguments using an illustrative one-pixel PNG; replace
the sample data with the actual file bytes supplied by the client:

```json
{
  "prompt": "Change only the background of Image 1 to a sunset sky.",
  "image_uploads": [
    {
      "filename": "photo.png",
      "data_base64": "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aZ1sAAAAASUVORK5CYII="
    }
  ],
  "quality": "medium"
}
```

Both input lists can be present, provided their combined count is 1-16.
For multiple inputs, name their roles by index in the prompt. One edit produces
one output PNG, regardless of the number of inputs. It creates a new blob and
never overwrites the source images. Edit support depends on the deployment.

## Response

Both tools use this response shape; the illustrative URL is not a real asset:

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
An existence check happens before the paid generation or edit call; the upload also
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

Generation and image-conditioned edits are supported. Masks, native vector
output, input-fidelity controls, and guaranteed transparency are not exposed.
Issue one call per requested output image; batching uses separate calls, not a
batch parameter. Up to 16 inputs in one edit are references, not 16 output jobs.
Avoid extra paid variants for connection testing.

Never automatically retry a timeout or upload failure. The image may already
have been generated and charged, even when no URL was returned. Report the
safe tool error and explain this risk before another user-authorized attempt.
