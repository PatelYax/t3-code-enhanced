import { assert, describe, it } from "@effect/vitest";
import { bundledMcpOverrides, parseBundledMcpManifest } from "./bundledMcp.ts";

describe("bundled MCP manifest", () => {
  it("converts standard JSON servers without replacing existing MCP definitions", () => {
    const manifest = parseBundledMcpManifest({
      mcpServers: {
        search: {
          url: "https://example.com/mcp",
          headers: { "X-Company": "example" },
          startup_timeout_sec: 60,
        },
        local: {
          command: "node",
          args: ["server.js"],
          env: { MODE: "company" },
          startup_timeout_sec: 120,
        },
      },
    });
    const existing = {
      mcp_servers: { atqor_search: { command: "user-server" }, custom: { command: "custom" } },
      "mcp_servers.atqor_search_2.url": "https://example.com/user",
    };
    const snapshot = JSON.stringify(existing);
    assert.deepEqual(bundledMcpOverrides(manifest, existing), {
      "mcp_servers.atqor_local": {
        command: "node",
        args: ["server.js"],
        env: { MODE: "company" },
        startup_timeout_sec: 120,
      },
      "mcp_servers.atqor_search_3": {
        url: "https://example.com/mcp",
        http_headers: { "X-Company": "example" },
        startup_timeout_sec: 60,
      },
    });
    assert.equal(JSON.stringify(existing), snapshot);
    assert.deepEqual(
      bundledMcpOverrides(parseBundledMcpManifest({ mcpServers: {} }), existing),
      {},
    );
  });

  it("reserves generated names and preserves disabled servers", () => {
    const manifest = parseBundledMcpManifest({
      mcpServers: {
        search: { url: "https://example.com/mcp", enabled: false },
        search_2: { command: "node" },
      },
    });
    assert.deepEqual(
      bundledMcpOverrides(manifest, {
        mcp_servers: { atqor_search: { command: "user-server" } },
      }),
      {
        "mcp_servers.atqor_search_2": { url: "https://example.com/mcp", enabled: false },
        "mcp_servers.atqor_search_2_2": { command: "node" },
      },
    );
  });

  it("rejects malformed, ambiguous, or unsupported server definitions without exposing values", () => {
    for (const document of [
      {},
      { mcpServers: { "unsafe.name": { command: "node" } } },
      { mcpServers: { test: {} } },
      { mcpServers: { test: { command: "node", url: "https://example.com/mcp" } } },
      { mcpServers: { test: { command: "node", args: "secret-value" } } },
      { mcpServers: { test: { url: "not-a-url" } } },
      { mcpServers: { test: { url: "https://example.com/mcp", type: "sse" } } },
      ...[0, -1, "120", null, NaN, Infinity, -Infinity].map((startup_timeout_sec) => ({
        mcpServers: { test: { command: "node", startup_timeout_sec } },
      })),
    ]) {
      assert.throws(() => parseBundledMcpManifest(document), "Invalid bundled MCP manifest.");
    }
  });
});
