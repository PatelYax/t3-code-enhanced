import { assert, describe, it } from "@effect/vitest";

import { parseBundledCodexProfile, renderBundledCodexConfig } from "./bundledCodex.ts";

describe("bundled Codex Azure profile", () => {
  const profile = {
    endpoint: "https://example.openai.azure.com/openai/v1/",
    deployment: "company-codex",
    apiKey: "test-key-not-a-real-credential",
  };

  it("normalizes the endpoint and keeps credentials out of TOML", () => {
    const parsed = parseBundledCodexProfile(profile);
    assert.equal(parsed.endpoint, "https://example.openai.azure.com/openai/v1");
    const config = renderBundledCodexConfig(parsed);
    assert.include(config, 'model = "company-codex"');
    assert.include(config, '"api-key" = "AZURE_OPENAI_API_KEY"');
    assert.notInclude(config, profile.apiKey);
  });

  it.each(["https://example.openai.azure.com", "https://example.openai.azure.com/"])(
    "accepts an Azure resource root: %s",
    (endpoint) => {
      assert.equal(
        parseBundledCodexProfile({ ...profile, endpoint }).endpoint,
        "https://example.openai.azure.com/openai/v1",
      );
    },
  );

  it.each([
    "not-a-url",
    "http://example.openai.azure.com/openai/v1",
    "https://example.openai.azure.com/?api-key=secret",
    "https://example.openai.azure.com/openai/v1/responses",
    "https://example.openai.azure.com/openai/v1?api-key=secret",
    "https://user:secret@example.openai.azure.com/openai/v1",
  ])("rejects an invalid API base URL: %s", (endpoint) => {
    assert.throws(() => parseBundledCodexProfile({ ...profile, endpoint }));
  });

  it("rejects missing deployment and credentials", () => {
    assert.throws(() => parseBundledCodexProfile({ ...profile, deployment: " " }));
    assert.throws(() => parseBundledCodexProfile({ ...profile, apiKey: " " }));
  });

  it.each(["http://localhost:8080", "http://127.0.0.1:8080/", "http://[::1]:8080/"])(
    "supports a loopback OpenAI proxy: %s",
    (endpoint) => {
      const parsed = parseBundledCodexProfile({ ...profile, endpoint });
      assert.equal(parsed.provider, "openai");
      assert.equal(new URL(parsed.endpoint).pathname, "/v1");
      const config = renderBundledCodexConfig(parsed);
      assert.include(config, 'model_provider = "openai_proxy"');
      assert.include(config, 'env_key = "OPENAI_API_KEY"');
      assert.notInclude(config, "env_http_headers");
      assert.notInclude(config, profile.apiKey);
    },
  );

  it("recognizes an HTTPS OpenAI v1 base", () => {
    const parsed = parseBundledCodexProfile({
      ...profile,
      endpoint: "https://proxy.example.com/v1/",
    });
    assert.equal(parsed.provider, "openai");
    assert.equal(parsed.endpoint, "https://proxy.example.com/v1");
  });

  it.each([
    "https://example-proxy.southindia-01.azurewebsites.net",
    "https://example-proxy.southindia-01.azurewebsites.net/",
    "https://proxy.example.com",
  ])("uses the OpenAI v1 route for a proxy root: %s", (endpoint) => {
    const parsed = parseBundledCodexProfile({ ...profile, endpoint });
    assert.equal(parsed.provider, "openai");
    assert.equal(parsed.endpoint, `${new URL(endpoint).origin}/v1`);
    assert.equal(new URL(`${parsed.endpoint}/responses`).pathname, "/v1/responses");
    const config = renderBundledCodexConfig(parsed);
    assert.include(config, `base_url = "${parsed.endpoint}"`);
    assert.include(config, 'env_key = "OPENAI_API_KEY"');
    assert.notInclude(config, "/openai/v1");
  });

  it("keeps explicit Azure roots on custom domains supported", () => {
    const parsed = parseBundledCodexProfile({
      ...profile,
      provider: "azure",
      endpoint: "https://custom.example.com",
    });
    assert.equal(parsed.provider, "azure");
    assert.equal(parsed.endpoint, "https://custom.example.com/openai/v1");
  });

  it("supports an explicit OpenAI proxy with a custom API prefix", () => {
    const parsed = parseBundledCodexProfile({
      ...profile,
      provider: "openai",
      endpoint: "https://proxy.example.com/api/openai/",
    });
    assert.equal(parsed.endpoint, "https://proxy.example.com/api/openai");
    assert.equal(parsed.provider, "openai");
  });

  it("normalizes an explicit OpenAI resource root to v1", () => {
    const parsed = parseBundledCodexProfile({
      ...profile,
      provider: "openai",
      endpoint: "https://proxy.example.com",
    });
    assert.equal(parsed.endpoint, "https://proxy.example.com/v1");
  });

  it.each([
    "http://proxy.example.com/v1",
    "http://192.168.1.10:8080/v1",
    "https://proxy.example.com/v1/responses",
    "https://proxy.example.com/v1/chat/completions",
    "https://proxy.example.com/v1?api-key=secret",
    "https://user:secret@proxy.example.com/v1",
    "https://proxy.example.com/v1#secret",
  ])("rejects an invalid OpenAI proxy base: %s", (endpoint) => {
    assert.throws(() => parseBundledCodexProfile({ ...profile, provider: "openai", endpoint }));
  });

  it("rejects unknown provider types", () => {
    assert.throws(() => parseBundledCodexProfile({ ...profile, provider: "other" }));
  });
});
