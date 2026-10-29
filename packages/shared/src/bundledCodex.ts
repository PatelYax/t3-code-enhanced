export interface BundledCodexProfile {
  readonly provider?: "azure" | "openai";
  readonly endpoint: string;
  readonly deployment: string;
  readonly apiKey: string;
}

export function parseBundledCodexProfile(value: unknown): BundledCodexProfile {
  if (typeof value !== "object" || value === null) {
    throw new Error("Bundled Codex requires a profile object.");
  }
  const profile = value as Record<string, unknown>;
  if (
    typeof profile.endpoint !== "string" ||
    typeof profile.deployment !== "string" ||
    !profile.deployment.trim() ||
    typeof profile.apiKey !== "string" ||
    !profile.apiKey.trim()
  ) {
    throw new Error("Bundled Codex requires endpoint, deployment, and apiKey.");
  }
  if (
    profile.provider !== undefined &&
    profile.provider !== "azure" &&
    profile.provider !== "openai"
  ) {
    throw new Error('Bundled Codex provider must be "azure" or "openai".');
  }
  let endpoint: URL;
  try {
    endpoint = new URL(profile.endpoint);
  } catch {
    throw new Error("Bundled Codex endpoint must be a valid API base URL.");
  }
  const loopback = ["localhost", "127.0.0.1", "[::1]"].includes(endpoint.hostname);
  const azurePath = /^\/openai\/v1\/?$/.test(endpoint.pathname);
  const azureHost = /\.(openai|cognitiveservices)\.azure\.(com|us|cn)$/.test(endpoint.hostname);
  const provider =
    profile.provider ??
    (azurePath || (azureHost && endpoint.pathname === "/") ? "azure" : "openai");
  if (
    (endpoint.protocol !== "https:" &&
      !(provider === "openai" && loopback && endpoint.protocol === "http:")) ||
    endpoint.username ||
    endpoint.password ||
    endpoint.search ||
    endpoint.hash ||
    (provider === "azure" && endpoint.pathname !== "/" && !azurePath) ||
    /\/(responses|chat\/completions)\/?$/.test(endpoint.pathname)
  ) {
    throw new Error(
      'Bundled Codex requires an HTTPS API base URL (HTTP is allowed for loopback OpenAI proxies), without query parameters or credentials. Azure requires a resource root or /openai/v1; use provider "openai" for other API bases. Do not include /responses or /chat/completions.',
    );
  }
  if (endpoint.pathname === "/") endpoint.pathname = provider === "azure" ? "/openai/v1" : "/v1";
  return {
    provider,
    endpoint: endpoint.href.replace(/\/$/, ""),
    deployment: profile.deployment.trim(),
    apiKey: profile.apiKey.trim(),
  };
}

export function renderBundledCodexConfig(profile: BundledCodexProfile): string {
  const azure = profile.provider !== "openai";
  const provider = azure ? "azure" : "openai_proxy";
  return [
    `model = ${JSON.stringify(profile.deployment)}`,
    `model_provider = ${JSON.stringify(provider)}`,
    'web_search = "disabled"',
    "",
    `[model_providers.${provider}]`,
    `name = ${JSON.stringify(azure ? "Azure OpenAI" : "OpenAI proxy")}`,
    `base_url = ${JSON.stringify(profile.endpoint)}`,
    'wire_api = "responses"',
    "requires_openai_auth = false",
    "supports_websockets = false",
    azure
      ? 'env_http_headers = { "api-key" = "AZURE_OPENAI_API_KEY" }'
      : 'env_key = "OPENAI_API_KEY"',
    "",
  ].join("\n");
}
