# atQor MCP startup and connection reference

This file covers starting the existing server, not generating images through a
separate CLI. All generation requests use the configured image MCP tool.

## Project layout

- `atQor_mcp/main.py`: combined FastMCP host.
- `atQor_mcp/image_generation/server.py`: image tool registration.
- `atQor_mcp/image_generation/settings.py`: image and storage Pydantic settings.
- `atQor_mcp/image_generation/tools/generate_image.py`: generation and upload.
- `atQor_mcp/utils/blob_storage.py`: shared asynchronous Blob utility.

## Startup

If the user asks to install or start the server, use the chosen Python
environment and run from the `atQor_mcp` directory:

```bash
python -m pip install -r requirements.txt
python main.py
```

The current host uses streamable HTTP with host and port from its settings.
Connect the MCP client to the configured server endpoint; do not assume a fixed
port, a client-specific tool prefix, or a particular machine's install path.
Do not start another server when the configured one is already available.

## Tool discovery

The combined host mounts the image app with `prefix="image_generation"`:

- `image_generation_generate_image`
- `image_generation_check_configuration`

The same host also mounts `ai_search`; its tools are not image generators.
Client runtimes may prepend their own server identifiers. Inspect the exposed
schemas and select the corresponding image operation.

## Configuration

The host's settings and image settings have separate module-local `.env` files.
The image app uses these configuration names:

- `AZURE_OPENAI_ENDPOINT`
- `AZURE_OPENAI_DEPLOYMENT_NAME`
- `AZURE_OPENAI_API_KEY`
- `AZURE_OPENAI_API_VERSION` (optional; default `2025-04-01-preview`)
- `AZURE_STORAGE_CONNECTION_STRING`
- `AZURE_STORAGE_CONTAINER_NAME`

Do not read or print `.env` values or request credentials in chat. Ask the user
to configure missing values privately. The container must already exist and
credentials must permit blob existence checks and uploads.

The configuration tool checks values offline without contacting Azure. A
successful check is not proof of network access, deployment support, storage
permissions, or public readability of the returned image URL.

## No local-file fallback

Do not use the parent project's old image CLI, a built-in provider, or a new
SDK runner as an automatic fallback. They are not the atQor Blob-upload route.
If MCP is unavailable, report the connection problem. Use an alternative only
when the user explicitly chooses it.

After successful generation, use the exact `blob_url` in an unfenced Markdown
image. See [image-api.md](image-api.md) for the contract and output example.
