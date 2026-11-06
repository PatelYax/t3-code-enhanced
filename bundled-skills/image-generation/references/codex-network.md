# atQor MCP connectivity and image rendering

The existing filename is retained, but this reference covers the Azure MCP
workflow rather than a separate CLI or sandbox configuration.

## Separate network paths

1. The agent's MCP client must reach the configured atQor server.
2. The server must reach its Azure OpenAI endpoint and Azure Blob Storage.
3. The chat renderer must be able to fetch the returned image URL.

Success on one path does not prove that the others work. For example, the
server may upload through private networking while the chat renderer cannot
fetch the private blob.

## MCP unavailable

Discover the mounted image tools using their actual runtime names. If they
are missing, report that the configured atQor server is not connected and use
the startup reference only when needed. Do not bypass runtime permissions,
disable sandbox protections, or switch to another provider automatically.

## Azure generation or upload errors

The configuration tool is offline; it cannot validate network connectivity,
deployment access, model support, or storage permissions. Report the safe error
returned by generation rather than exposing raw service responses or secrets.

Do not automatically retry timed-out generation. A timeout can happen after
Azure processes and charges the request. Upload can also fail after generation;
calling the tool again generates another paid image, not merely an upload retry.

## Image URL does not render

Use `![description](<returned blob_url>)` outside code fences. A plain URL,
text-only link, local filesystem path, or JSON block will not embed an image.

The current Blob utility removes SAS query parameters. A private container's
URL requires authorization and may fail to render even when upload succeeded.
Other causes include storage firewall rules, a renderer that blocks remote
images, or a renderer that cannot reach the storage network.

If a supported remote-image tool is available and visual validation is needed,
inspect the returned URL. Do not use a local-file image viewer on a URL or claim
to have seen pixels without inspection. Do not generate another paid image
merely because its URL is inaccessible.

When access is known to be blocked, keep the returned Markdown image and explain
that authenticated access is required or that the renderer cannot fetch it.
Do not invent a SAS token, append a connection string or account key, make the
container public, or change firewall rules. Secure delivery changes require a
separate authorized server or storage change.
