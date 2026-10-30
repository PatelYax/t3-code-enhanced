import * as Schema from "effect/Schema";

const StringMap = Schema.Record(Schema.String, Schema.String);
const Server = Schema.Struct({
  type: Schema.optionalKey(Schema.Literals(["stdio", "http"])),
  command: Schema.optionalKey(Schema.String),
  args: Schema.optionalKey(Schema.Array(Schema.String)),
  env: Schema.optionalKey(StringMap),
  url: Schema.optionalKey(Schema.String),
  headers: Schema.optionalKey(StringMap),
  enabled: Schema.optionalKey(Schema.Boolean),
  startup_timeout_sec: Schema.optionalKey(Schema.Number),
});
const Manifest = Schema.Struct({ mcpServers: Schema.Record(Schema.String, Server) });
const decodeManifest = Schema.decodeUnknownSync(Manifest, { onExcessProperty: "error" });

export function parseBundledMcpManifest(document: unknown) {
  try {
    const manifest = decodeManifest(document);
    for (const [name, server] of Object.entries(manifest.mcpServers)) {
      if (!/^[a-zA-Z0-9_-]+$/.test(name)) throw new Error();
      if (
        server.startup_timeout_sec !== undefined &&
        (!Number.isFinite(server.startup_timeout_sec) || server.startup_timeout_sec <= 0)
      ) {
        throw new Error();
      }
      if (server.command !== undefined) {
        if (
          !server.command.trim() ||
          server.url !== undefined ||
          server.headers !== undefined ||
          server.type === "http"
        ) {
          throw new Error();
        }
      } else {
        if (
          server.url === undefined ||
          server.args !== undefined ||
          server.env !== undefined ||
          server.type === "stdio"
        ) {
          throw new Error();
        }
        const url = new URL(server.url);
        if (url.protocol !== "https:" && url.protocol !== "http:") throw new Error();
      }
    }
    return manifest;
  } catch {
    throw new Error("Invalid bundled MCP manifest.");
  }
}

export function bundledMcpOverrides(
  manifest: ReturnType<typeof parseBundledMcpManifest>,
  effectiveConfig: Readonly<Record<string, unknown>>,
) {
  const occupied = new Set<string>();
  const servers = effectiveConfig.mcp_servers;
  if (typeof servers === "object" && servers !== null) {
    for (const name of Object.keys(servers)) occupied.add(name);
  }
  for (const key of Object.keys(effectiveConfig)) {
    if (key.startsWith("mcp_servers.")) occupied.add(key.split(".")[1]!);
  }
  const overrides: Record<string, Schema.Json> = {};
  for (const name of Object.keys(manifest.mcpServers).sort()) {
    const server = manifest.mcpServers[name]!;
    const baseName = `atqor_${name}`;
    let allocatedName = baseName;
    let suffix = 2;
    while (occupied.has(allocatedName)) allocatedName = `${baseName}_${suffix++}`;
    occupied.add(allocatedName);
    const { type: _type, headers, ...config } = server;
    overrides[`mcp_servers.${allocatedName}`] = {
      ...config,
      ...(headers === undefined ? {} : { http_headers: headers }),
    };
  }
  return overrides;
}
