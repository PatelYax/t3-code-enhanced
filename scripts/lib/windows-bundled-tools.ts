// @effect-diagnostics nodeBuiltinImport:off - Build staging owns native archives and subprocesses outside the application runtime.
// @effect-diagnostics globalFetch:off - Pinned runtime downloads run at the build boundary, before installation on user machines.
import * as NodeChildProcess from "node:child_process";
import * as NodeCrypto from "node:crypto";
import * as NodeFSP from "node:fs/promises";
import * as NodePath from "node:path";
import * as NodeUtil from "node:util";

import { parseBundledCodexProfile } from "@t3tools/shared/bundledCodex";

const execFile = NodeUtil.promisify(NodeChildProcess.execFile);
const BUNDLED_CODEX_VERSION = "0.164.0";
const BUNDLED_NODE_VERSION = "24.15.0";

export async function readBundledAzureProfile(environment: NodeJS.ProcessEnv) {
  const profilePath = environment.ATQOR_AZURE_PROFILE_PATH;
  if (!profilePath) return undefined;
  const contents = await NodeFSP.readFile(profilePath, "utf8");
  let document: unknown;
  try {
    document = JSON.parse(contents);
  } catch {
    throw new Error(
      "The private Azure profile is not valid JSON. Use quoted field names and no trailing commas.",
    );
  }
  return parseBundledCodexProfile(document);
}

export function verifyDownload(
  data: Uint8Array,
  algorithm: "sha256" | "sha512",
  expected: string,
  encoding: "hex" | "base64",
) {
  if (NodeCrypto.createHash(algorithm).update(data).digest(encoding) !== expected) {
    throw new Error("Bundled runtime download failed checksum verification.");
  }
}

async function download(url: string) {
  const response = await fetch(url, { signal: AbortSignal.timeout(180_000) });
  if (!response.ok) throw new Error(`Runtime download failed with HTTP ${response.status}.`);
  return new Uint8Array(await response.arrayBuffer());
}

export async function stageWindowsBundledTools(input: {
  readonly destination: string;
  readonly arch: "x64" | "arm64";
  readonly hostPlatform: NodeJS.Platform;
  readonly profile: Awaited<ReturnType<typeof readBundledAzureProfile>>;
}) {
  const archiveTool =
    input.hostPlatform === "win32"
      ? NodePath.join(process.env.SystemRoot ?? "C:\\Windows", "System32", "tar.exe")
      : "tar";
  await NodeFSP.mkdir(input.destination, { recursive: true });
  const temporary = await NodeFSP.mkdtemp(NodePath.join(input.destination, ".download-"));
  try {
    const version = `${BUNDLED_CODEX_VERSION}-win32-${input.arch}`;
    const metadataResponse = await fetch(`https://registry.npmjs.org/@openai%2Fcodex/${version}`, {
      signal: AbortSignal.timeout(30_000),
    });
    if (!metadataResponse.ok) throw new Error("Cannot resolve the pinned native Codex package.");
    const metadata: unknown = await metadataResponse.json();
    if (
      typeof metadata !== "object" ||
      metadata === null ||
      !("dist" in metadata) ||
      typeof metadata.dist !== "object" ||
      metadata.dist === null ||
      !("tarball" in metadata.dist) ||
      typeof metadata.dist.tarball !== "string" ||
      !("integrity" in metadata.dist) ||
      typeof metadata.dist.integrity !== "string" ||
      !metadata.dist.tarball.startsWith("https://registry.npmjs.org/") ||
      !metadata.dist.integrity.startsWith("sha512-")
    )
      throw new Error("The native Codex package has invalid download metadata.");
    const codexArchive = await download(metadata.dist.tarball);
    verifyDownload(codexArchive, "sha512", metadata.dist.integrity.slice(7), "base64");
    const codexArchivePath = NodePath.join(temporary, "codex.tgz");
    await NodeFSP.writeFile(codexArchivePath, codexArchive);
    await execFile(archiveTool, ["-xf", codexArchivePath, "-C", temporary], { windowsHide: true });
    const target = input.arch === "x64" ? "x86_64-pc-windows-msvc" : "aarch64-pc-windows-msvc";
    await NodeFSP.cp(
      NodePath.join(temporary, "package", "vendor", target),
      NodePath.join(input.destination, "codex"),
      {
        recursive: true,
      },
    );
    await NodeFSP.access(NodePath.join(input.destination, "codex", "bin", "codex.exe"));

    const nodeArchiveName = `node-v${BUNDLED_NODE_VERSION}-win-${input.arch}.zip`;
    const nodeBaseUrl = `https://nodejs.org/dist/v${BUNDLED_NODE_VERSION}`;
    const checksums = new TextDecoder().decode(await download(`${nodeBaseUrl}/SHASUMS256.txt`));
    const checksum = checksums
      .split(/\r?\n/)
      .map((line) => line.trim().split(/\s+/))
      .find((entry) => entry[1] === nodeArchiveName)?.[0];
    if (!checksum) throw new Error("The pinned Node runtime has no published checksum.");
    const nodeArchive = await download(`${nodeBaseUrl}/${nodeArchiveName}`);
    verifyDownload(nodeArchive, "sha256", checksum, "hex");
    const nodeArchivePath = NodePath.join(temporary, "node.zip");
    await NodeFSP.writeFile(nodeArchivePath, nodeArchive);
    const nodeRoot = `node-v${BUNDLED_NODE_VERSION}-win-${input.arch}`;
    await execFile(
      archiveTool,
      ["-xf", nodeArchivePath, "-C", temporary, `${nodeRoot}/node.exe`, `${nodeRoot}/LICENSE`],
      { windowsHide: true },
    );
    await NodeFSP.mkdir(NodePath.join(input.destination, "node"), { recursive: true });
    await NodeFSP.copyFile(
      NodePath.join(temporary, nodeRoot, "node.exe"),
      NodePath.join(input.destination, "node", "node.exe"),
    );
    await NodeFSP.copyFile(
      NodePath.join(temporary, nodeRoot, "LICENSE"),
      NodePath.join(input.destination, "node", "LICENSE"),
    );
    const codexLicense = await download(
      `https://raw.githubusercontent.com/openai/codex/rust-v${BUNDLED_CODEX_VERSION}/LICENSE`,
    );
    await NodeFSP.writeFile(NodePath.join(input.destination, "codex", "LICENSE"), codexLicense);
    if (input.profile) {
      await NodeFSP.writeFile(
        NodePath.join(input.destination, "azure.json"),
        `${JSON.stringify(input.profile)}\n`,
      );
    } else {
      await NodeFSP.rm(NodePath.join(input.destination, "azure.json"), { force: true });
    }
    await NodeFSP.writeFile(
      NodePath.join(input.destination, "versions.json"),
      JSON.stringify({
        codex: BUNDLED_CODEX_VERSION,
        node: BUNDLED_NODE_VERSION,
      }),
    );
  } finally {
    await NodeFSP.rm(temporary, { recursive: true, force: true });
  }
}
