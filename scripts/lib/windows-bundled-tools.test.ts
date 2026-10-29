// @effect-diagnostics nodeBuiltinImport:off - Verify download digests against the build helper's native crypto implementation.
import * as NodeCrypto from "node:crypto";
import { assert, describe, it } from "@effect/vitest";

import { readBundledAzureProfile, verifyDownload } from "./windows-bundled-tools.ts";

describe("Windows bundled tools", () => {
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
