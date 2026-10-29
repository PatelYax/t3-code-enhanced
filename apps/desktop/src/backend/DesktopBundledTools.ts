// @effect-diagnostics nodeBuiltinImport:off - Hash the bundled profile without storing another copy of its credential.
import * as NodeCrypto from "node:crypto";
import { parseBundledCodexProfile, renderBundledCodexConfig } from "@t3tools/shared/bundledCodex";
import { fromLenientJson } from "@t3tools/shared/schemaJson";
import * as Effect from "effect/Effect";
import * as FileSystem from "effect/FileSystem";
import * as Schema from "effect/Schema";

import * as DesktopEnvironment from "../app/DesktopEnvironment.ts";

const decodeDocument = Schema.decodeEffect(
  fromLenientJson(Schema.Record(Schema.String, Schema.Unknown)),
);
const decodeUnknownJson = Schema.decodeEffect(Schema.fromJsonString(Schema.Unknown));
const encodeDocument = Schema.encodeEffect(Schema.fromJsonString(Schema.Unknown));

class DesktopBundledToolsConfigurationError extends Schema.TaggedError<DesktopBundledToolsConfigurationError>()(
  "DesktopBundledToolsConfigurationError",
  {
    operation: Schema.Literals(["profile", "settings"]),
    cause: Schema.optionalKey(Schema.Defect()),
  },
) {
  override get message(): string {
    return `The bundled Codex ${this.operation} configuration is invalid.`;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export const prepare = Effect.fn("desktop.bundledTools.prepare")(function* () {
  const environment = yield* DesktopEnvironment.DesktopEnvironment;
  const fileSystem = yield* FileSystem.FileSystem;
  const patch: Record<string, string> = {};
  if (!environment.isPackaged || environment.platform !== "win32") return patch;

  const path = environment.path;
  const toolsDirectory = path.join(environment.resourcesPath, "tools");
  if (!(yield* fileSystem.exists(toolsDirectory))) return patch;
  const nodeDirectory = path.join(toolsDirectory, "node");
  const codexDirectory = path.join(toolsDirectory, "codex");
  const binaryPath = path.join(codexDirectory, "bin", "codex.exe");
  for (const executable of [path.join(nodeDirectory, "node.exe"), binaryPath]) {
    yield* fileSystem.access(executable);
  }
  const pathVariable =
    Object.keys(process.env).find((key) => key.toUpperCase() === "PATH") ?? "PATH";
  patch[pathVariable] = [
    nodeDirectory,
    path.join(codexDirectory, "bin"),
    path.join(codexDirectory, "codex-path"),
    process.env[pathVariable] ?? "",
  ].join(";");

  const profilePath = path.join(toolsDirectory, "azure.json");
  if (!(yield* fileSystem.exists(profilePath))) return patch;
  const document = yield* decodeUnknownJson(yield* fileSystem.readFileString(profilePath)).pipe(
    Effect.mapError(
      (cause) => new DesktopBundledToolsConfigurationError({ operation: "profile", cause }),
    ),
    Effect.orDie,
  );
  const profile = yield* Effect.try({
    try: () => parseBundledCodexProfile(document),
    catch: (cause) => new DesktopBundledToolsConfigurationError({ operation: "profile", cause }),
  }).pipe(Effect.orDie);
  const settings = (yield* fileSystem.exists(environment.serverSettingsPath))
    ? yield* decodeDocument(yield* fileSystem.readFileString(environment.serverSettingsPath)).pipe(
        Effect.mapError(
          (cause) => new DesktopBundledToolsConfigurationError({ operation: "settings", cause }),
        ),
        Effect.orDie,
      )
    : {};
  const instances = settings.providerInstances;
  if (instances !== undefined && !isRecord(instances)) {
    return yield* Effect.die(new DesktopBundledToolsConfigurationError({ operation: "settings" }));
  }
  const homePath = path.join(environment.stateDir, "bundled-codex");
  const existing = instances?.codex;
  const existingConfig = isRecord(existing) && isRecord(existing.config) ? existing.config : {};
  if (
    existing !== undefined &&
    (!isRecord(existing) ||
      typeof existingConfig.homePath !== "string" ||
      path.normalize(existingConfig.homePath).toLowerCase() !==
        path.normalize(homePath).toLowerCase())
  ) {
    return patch;
  }
  if (
    existing === undefined &&
    isRecord(settings.providers) &&
    Object.hasOwn(settings.providers, "codex")
  ) {
    return patch;
  }

  const encodedProfile = yield* encodeDocument(profile).pipe(Effect.orDie);
  const revision = NodeCrypto.createHash("sha256").update(encodedProfile).digest("hex");
  const revisionPath = path.join(homePath, ".bundled-profile.sha256");
  const previousRevision = (yield* fileSystem.exists(revisionPath))
    ? (yield* fileSystem.readFileString(revisionPath)).trim()
    : undefined;
  const profileChanged = revision !== previousRevision;
  if (existing !== undefined && !profileChanged && existingConfig.binaryPath === binaryPath)
    return patch;

  yield* fileSystem.makeDirectory(homePath, { recursive: true });
  const configPath = path.join(homePath, "config.toml");
  if (profileChanged || !(yield* fileSystem.exists(configPath))) {
    const temporaryConfig = `${configPath}.atqor-bootstrap.tmp`;
    yield* fileSystem.writeFileString(temporaryConfig, renderBundledCodexConfig(profile), {
      mode: 0o600,
    });
    yield* fileSystem.rename(temporaryConfig, configPath);
  }
  const selection = { instanceId: "codex", model: profile.deployment };
  const selectDefault = (current: unknown) =>
    current == null || (profileChanged && isRecord(current) && current.instanceId === "codex")
      ? selection
      : current;
  const azure = profile.provider !== "openai";
  const existingEnvironment =
    isRecord(existing) && Array.isArray(existing.environment)
      ? existing.environment.filter(
          (entry: unknown) =>
            isRecord(entry) &&
            entry.name !== "AZURE_OPENAI_API_KEY" &&
            entry.name !== "OPENAI_API_KEY",
        )
      : [];
  const customModels = Array.isArray(existingConfig.customModels)
    ? existingConfig.customModels.filter(
        (model: unknown) => typeof model === "string" && model !== profile.deployment,
      )
    : [];
  const next = {
    ...settings,
    defaultModelSelection: selectDefault(settings.defaultModelSelection),
    textGenerationModelSelection: selectDefault(settings.textGenerationModelSelection),
    sourceControlWriterModelSelection: selectDefault(settings.sourceControlWriterModelSelection),
    providerInstances: {
      ...instances,
      codex: {
        ...(isRecord(existing) ? existing : {}),
        driver: "codex",
        displayName: azure ? "Azure OpenAI" : "OpenAI proxy",
        enabled: isRecord(existing) ? (existing.enabled ?? true) : true,
        environment: [
          ...existingEnvironment,
          {
            name: azure ? "AZURE_OPENAI_API_KEY" : "OPENAI_API_KEY",
            value: profile.apiKey,
            sensitive: true,
          },
        ],
        config: {
          ...existingConfig,
          setupMode: "existing",
          binaryPath,
          homePath,
          customModels: [profile.deployment, ...customModels],
        },
      },
    },
  };
  yield* fileSystem.makeDirectory(path.dirname(environment.serverSettingsPath), {
    recursive: true,
  });
  const temporary = `${environment.serverSettingsPath}.atqor-bootstrap.tmp`;
  const contents = yield* encodeDocument(next).pipe(Effect.orDie);
  yield* fileSystem.writeFileString(temporary, `${contents}\n`, { mode: 0o600 });
  yield* fileSystem.rename(temporary, environment.serverSettingsPath);
  const temporaryRevision = `${revisionPath}.atqor-bootstrap.tmp`;
  yield* fileSystem.writeFileString(temporaryRevision, `${revision}\n`, { mode: 0o600 });
  yield* fileSystem.rename(temporaryRevision, revisionPath);
  return patch;
});
