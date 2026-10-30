// @effect-diagnostics nodeBuiltinImport:off - Verify download digests against the build helper's native crypto implementation.
import * as NodeCrypto from "node:crypto";
import * as NodeFSP from "node:fs/promises";
import * as NodeOS from "node:os";
import * as NodePath from "node:path";
import { assert, describe, expect, it } from "@effect/vitest";

import {
  readBundledAzureProfile,
  stageBundledMcp,
  stageBundledSkills,
  verifyDownload,
} from "./windows-bundled-tools.ts";

describe("Windows bundled tools", () => {
  it("stages validated MCP JSON and removes stale artifacts when the source is absent", async () => {
    const temporary = await NodeFSP.mkdtemp(NodePath.join(NodeOS.tmpdir(), "bundled-mcp-"));
    try {
      const source = NodePath.join(temporary, "bundled-mcp.json");
      const destination = NodePath.join(temporary, "tools", "bundled-mcp.json");
      const contents = JSON.stringify({ mcpServers: { company: { command: "node" } } });
      await NodeFSP.writeFile(source, contents);
      await stageBundledMcp(source, destination);
      assert.equal(await NodeFSP.readFile(destination, "utf8"), contents);
      await NodeFSP.writeFile(source, "invalid JSON");
      await expect(stageBundledMcp(source, destination)).rejects.toThrow(
        "Invalid bundled MCP manifest.",
      );
      assert.equal(await NodeFSP.readFile(destination, "utf8"), contents);
      await NodeFSP.rm(source);
      await stageBundledMcp(source, destination);
      await expect(NodeFSP.access(destination)).rejects.toThrow();
    } finally {
      await NodeFSP.rm(temporary, { recursive: true, force: true });
    }
  });

  it("stages the entire skills tree unchanged and permits a missing source", async () => {
    const temporary = await NodeFSP.mkdtemp(NodePath.join(NodeOS.tmpdir(), "bundled-skills-"));
    try {
      const source = NodePath.join(temporary, "source");
      const destination = NodePath.join(temporary, "tools", "skills");
      await stageBundledSkills(source, destination);
      await NodeFSP.mkdir(NodePath.join(source, "company", "assets"), { recursive: true });
      await NodeFSP.mkdir(NodePath.join(source, "empty"), { recursive: true });
      await NodeFSP.writeFile(NodePath.join(source, "company", "SKILL.md"), "skill contents");
      const asset = new Uint8Array([0, 255, 17, 128]);
      await NodeFSP.writeFile(NodePath.join(source, "company", "assets", "data.bin"), asset);
      await NodeFSP.writeFile(NodePath.join(source, ".metadata"), "metadata");
      await stageBundledSkills(source, destination);
      assert.equal(
        await NodeFSP.readFile(NodePath.join(destination, "company", "SKILL.md"), "utf8"),
        "skill contents",
      );
      assert.deepEqual(
        new Uint8Array(
          await NodeFSP.readFile(NodePath.join(destination, "company", "assets", "data.bin")),
        ),
        asset,
      );
      assert.equal(
        await NodeFSP.readFile(NodePath.join(destination, ".metadata"), "utf8"),
        "metadata",
      );
      assert.isTrue((await NodeFSP.stat(NodePath.join(destination, "empty"))).isDirectory());
    } finally {
      await NodeFSP.rm(temporary, { recursive: true, force: true });
    }
  });

  it("rejects corrupted downloads", () => {
    const data = new TextEncoder().encode("runtime");
    const checksum = NodeCrypto.createHash("sha256").update(data).digest("hex");
    assert.doesNotThrow(() => verifyDownload(data, "sha256", checksum, "hex"));
    assert.throws(() => verifyDownload(new Uint8Array(), "sha256", checksum, "hex"));
  });

  it("does not require or inspect ambient Azure credentials for ordinary builds", async () => {
    assert.isUndefined(await readBundledAzureProfile({}));
  });
});
