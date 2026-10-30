import * as NodeServices from "@effect/platform-node/NodeServices";
import { assert, describe, it } from "@effect/vitest";
import { currentDesktopBootstrapToken } from "@t3tools/shared/desktopBootstrapToken";
import * as Clock from "effect/Clock";
import * as Effect from "effect/Effect";
import * as FileSystem from "effect/FileSystem";
import * as Layer from "effect/Layer";
import * as ManagedRuntime from "effect/ManagedRuntime";
import * as Option from "effect/Option";
import * as Path from "effect/Path";
import { ChildProcessSpawner } from "effect/process";

import * as DesktopEnvironment from "../app/DesktopEnvironment.ts";
import * as DesktopBackendConfiguration from "./DesktopBackendConfiguration.ts";
import * as DesktopShellEnvironment from "../shell/DesktopShellEnvironment.ts";
import * as DesktopBundledTools from "./DesktopBundledTools.ts";
import * as DesktopConfig from "../app/DesktopConfig.ts";
import * as DesktopServerExposure from "./DesktopServerExposure.ts";
import * as DesktopAppSettings from "../settings/DesktopAppSettings.ts";
import * as DesktopWslEnvironment from "../wsl/DesktopWslEnvironment.ts";
import * as DesktopWslServerTree from "../wsl/DesktopWslServerTree.ts";

const layerShellEnvironment = (prepared = true) =>
  Layer.succeed(DesktopShellEnvironment.DesktopShellEnvironment, {
    installIntoProcess: Effect.succeed(prepared),
  });

const layerBackendConfiguration = (prepared = true) =>
  DesktopBackendConfiguration.layer.pipe(Layer.provide(layerShellEnvironment(prepared)));

const layerServerExposure = Layer.succeed(DesktopServerExposure.DesktopServerExposure, {
  getState: Effect.die("unexpected getState"),
  backendConfig: Effect.succeed({
    port: 4888,
    bindHost: "0.0.0.0",
    httpBaseUrl: new URL("http://127.0.0.1:4888"),
    tailscaleServeEnabled: true,
    tailscaleServePort: 8443,
  }),
  configureFromSettings: () => Effect.die("unexpected configureFromSettings"),
  setMode: () => Effect.die("unexpected setMode"),
  setTailscaleServeEnabled: () => Effect.die("unexpected setTailscaleServeEnabled"),
  getAdvertisedEndpoints: Effect.succeed([]),
} satisfies DesktopServerExposure.DesktopServerExposure["Service"]);

function layerEnvironment(
  baseDir: string,
  options?: {
    readonly appPath?: string;
    readonly dirname?: string;
    readonly isPackaged?: boolean;
    readonly devServerUrl?: string;
    readonly platform?: NodeJS.Platform;
    readonly resourcesPath?: string;
    readonly appVersion?: string;
    readonly processArch?: NodeJS.Architecture;
    readonly otlpTracesUrl?: string;
    readonly otlpMetricsUrl?: string;
    readonly otlpLogsUrl?: string;
  },
) {
  return DesktopEnvironment.layer({
    dirname: options?.dirname ?? "/repo/apps/desktop/src",
    homeDirectory: baseDir,
    platform: options?.platform ?? "darwin",
    processArch: options?.processArch ?? "x64",
    appVersion: options?.appVersion ?? "1.2.3",
    appPath: options?.appPath ?? "/repo",
    isPackaged: options?.isPackaged ?? true,
    resourcesPath: options?.resourcesPath ?? "/missing/resources",
    runningUnderArm64Translation: false,
  }).pipe(
    Layer.provide(
      Layer.mergeAll(
        NodeServices.layer,
        DesktopConfig.layerTest({
          T3CODE_HOME: baseDir,
          T3CODE_PORT: "9999",
          T3CODE_MODE: "desktop",
          T3CODE_DESKTOP_LAN_HOST: "192.168.1.50",
          VITE_DEV_SERVER_URL: options?.devServerUrl,
          T3CODE_OTLP_TRACES_URL: options?.otlpTracesUrl,
          T3CODE_OTLP_METRICS_URL: options?.otlpMetricsUrl,
          T3CODE_OTLP_LOGS_URL: options?.otlpLogsUrl,
        }),
      ),
    ),
  );
}

const restoreEnv = (name: string, value: string | undefined) => {
  if (value === undefined) {
    delete process.env[name];
  } else {
    process.env[name] = value;
  }
};

const withHarness = <A, E, R>(
  effect: Effect.Effect<
    A,
    E,
    | R
    | DesktopEnvironment.DesktopEnvironment
    | FileSystem.FileSystem
    | DesktopBackendConfiguration.DesktopBackendConfiguration
  >,
  optionsOrPrepared:
    | boolean
    | { readonly platform: NodeJS.Platform; readonly isPackaged?: boolean } = true,
) =>
  Effect.gen(function* () {
    const prepared = typeof optionsOrPrepared === "boolean" ? optionsOrPrepared : true;
    const options = typeof optionsOrPrepared === "boolean" ? undefined : optionsOrPrepared;
    const fileSystem = yield* FileSystem.FileSystem;
    const baseDir = yield* fileSystem.makeTempDirectoryScoped({
      prefix: "t3-desktop-backend-config-test-",
    });

    return yield* effect.pipe(
      Effect.provide(
        layerBackendConfiguration(prepared).pipe(
          Layer.provideMerge(layerServerExposure),
          Layer.provideMerge(DesktopAppSettings.layerTest()),
          Layer.provideMerge(DesktopWslEnvironment.layerTest()),
          Layer.provideMerge(DesktopWslServerTree.layerTest()),
          Layer.provideMerge(
            layerEnvironment(baseDir, {
              ...options,
              ...(options?.platform === "win32" ? { resourcesPath: baseDir } : {}),
            }),
          ),
        ),
      ),
    );
  }).pipe(Effect.scoped, Effect.provide(NodeServices.layer));

interface PackagedWslHarnessContext {
  readonly baseDir: string;
  readonly archivePath: string;
  readonly hashPath: string;
  readonly archiveHash: string;
  readonly mountedAppRoot: string;
  readonly mountedEntryPath: string;
}

const withPackagedWslHarness = <A, E, R>(
  input: {
    readonly archiveHash: string;
    readonly wsl: (
      context: PackagedWslHarnessContext,
    ) => DesktopWslEnvironment.DesktopWslEnvironmentTestStub;
    readonly forbidFallback?: string;
    readonly cleanupLegacy?: Effect.Effect<void>;
    readonly forbidCleanup?: string;
  },
  effect: (
    context: PackagedWslHarnessContext,
  ) => Effect.Effect<
    A,
    E,
    R | FileSystem.FileSystem | Path.Path | DesktopBackendConfiguration.DesktopBackendConfiguration
  >,
) =>
  Effect.gen(function* () {
    const fileSystem = yield* FileSystem.FileSystem;
    const path = yield* Path.Path;
    const baseDir = yield* fileSystem.makeTempDirectoryScoped({
      prefix: "t3-desktop-backend-config-test-",
    });
    const archivePath = path.join(baseDir, "wsl-runtime.tar.gz");
    const hashPath = `${archivePath}.sha256`;
    const mountedAppRoot = "/mnt/c/app.asar.unpacked";
    const mountedEntryPath = path.join(baseDir, "app.asar.unpacked/apps/server/dist/bin.mjs");
    yield* fileSystem.makeDirectory(path.dirname(mountedEntryPath), { recursive: true });
    yield* fileSystem.writeFileString(mountedEntryPath, "");
    yield* fileSystem.writeFileString(archivePath, "archive");
    yield* fileSystem.writeFileString(hashPath, `${input.archiveHash}\n`);

    const context = {
      baseDir,
      archivePath,
      hashPath,
      archiveHash: input.archiveHash,
      mountedAppRoot,
      mountedEntryPath,
    } satisfies PackagedWslHarnessContext;
    const layerServerTree = input.forbidFallback
      ? Layer.succeed(
          DesktopWslServerTree.DesktopWslServerTree,
          DesktopWslServerTree.DesktopWslServerTree.of({
            ensure: Effect.die(input.forbidFallback),
            cleanupLegacy: input.forbidCleanup
              ? Effect.die(input.forbidCleanup)
              : (input.cleanupLegacy ?? Effect.void),
          }),
        )
      : DesktopWslServerTree.layerTest({
          result: { ok: true, root: path.join(baseDir, "app.asar.unpacked") },
          cleanupLegacy: input.cleanupLegacy ?? Effect.void,
        });

    return yield* effect(context).pipe(
      Effect.provide(
        layerBackendConfiguration().pipe(
          Layer.provideMerge(layerServerExposure),
          Layer.provideMerge(DesktopAppSettings.layerTest()),
          Layer.provideMerge(layerServerTree),
          Layer.provideMerge(
            DesktopWslEnvironment.layerTest({
              isAvailable: true,
              distros: [{ name: "Ubuntu", isDefault: true, version: 2 }],
              windowsToWslPath: () => Option.some(mountedAppRoot),
              getDistroIp: () => Option.some("172.27.0.99"),
              ...input.wsl(context),
            }),
          ),
          Layer.provideMerge(
            layerEnvironment(baseDir, {
              appPath: baseDir,
              platform: "win32",
              resourcesPath: baseDir,
            }),
          ),
        ),
      ),
    );
  }).pipe(Effect.scoped, Effect.provide(NodeServices.layer));

describe("DesktopBackendConfiguration", () => {
  it.effect("provisions and upgrades bundled Codex without replacing user data", () =>
    withHarness(
      Effect.gen(function* () {
        const fileSystem = yield* FileSystem.FileSystem;
        const environment = yield* DesktopEnvironment.DesktopEnvironment;
        const path = environment.path;
        const tools = path.join(environment.resourcesPath, "tools");
        yield* fileSystem.makeDirectory(path.join(tools, "node"), { recursive: true });
        yield* fileSystem.makeDirectory(path.join(tools, "codex", "bin"), { recursive: true });
        const bundledSkill = path.join(tools, "skills", "company-skill");
        yield* fileSystem.makeDirectory(path.join(bundledSkill, "references"), { recursive: true });
        yield* fileSystem.writeFileString(path.join(bundledSkill, "SKILL.md"), "bundled skill");
        yield* fileSystem.writeFileString(
          path.join(bundledSkill, "references", "guide.md"),
          "supporting file",
        );
        yield* fileSystem.writeFileString(path.join(tools, "node", "node.exe"), "fixture");
        yield* fileSystem.writeFileString(path.join(tools, "codex", "bin", "codex.exe"), "fixture");
        yield* fileSystem.writeFileString(
          path.join(tools, "azure.json"),
          JSON.stringify({
            endpoint: "https://example.openai.azure.com/openai/v1/",
            deployment: "company-codex",
            apiKey: "fixture-key",
          }),
        );
        const configuration = yield* DesktopBackendConfiguration.DesktopBackendConfiguration;
        const start = yield* configuration.resolvePrimary;
        const pathValue = Object.entries(start.env).find(
          ([key]) => key.toUpperCase() === "PATH",
        )?.[1];
        assert.isTrue(pathValue?.startsWith(path.join(tools, "node")));
        assert.equal(start.env.ATQOR_BUNDLED_MCP_PATH, path.join(tools, "bundled-mcp.json"));
        const settings = JSON.parse(
          yield* fileSystem.readFileString(environment.serverSettingsPath),
        );
        assert.equal(
          settings.providerInstances.codex.config.binaryPath,
          path.join(tools, "codex", "bin", "codex.exe"),
        );
        assert.equal(settings.providerInstances.codex.config.setupMode, "existing");
        assert.deepEqual(settings.defaultModelSelection, {
          instanceId: "codex",
          model: "company-codex",
        });
        assert.isTrue(settings.providerInstances.codex.environment[0].sensitive);
        assert.isUndefined(start.env.AZURE_OPENAI_API_KEY);
        const config = yield* fileSystem.readFileString(
          path.join(settings.providerInstances.codex.config.homePath, "config.toml"),
        );
        assert.include(config, 'model_provider = "azure"');
        assert.notInclude(config, "fixture-key");
        const historyPath = path.join(environment.stateDir, "statev2.sqlite");
        yield* fileSystem.writeFileString(historyPath, "existing chat history fixture");
        const otherProvider = { driver: "codex", config: { homePath: "custom-home" } };
        const otherSelection = { instanceId: "custom", model: "custom-model" };
        settings.appearance = { theme: "dark" };
        settings.providerInstances.custom = otherProvider;
        settings.providerInstances.codex.enabled = false;
        settings.providerInstances.codex.environment.push({
          name: "CUSTOM_ENV",
          value: "preserved",
        });
        settings.textGenerationModelSelection = otherSelection;
        yield* fileSystem.writeFileString(environment.serverSettingsPath, JSON.stringify(settings));
        yield* fileSystem.remove(
          path.join(settings.providerInstances.codex.config.homePath, ".bundled-profile.sha256"),
        );
        yield* fileSystem.writeFileString(
          path.join(tools, "azure.json"),
          JSON.stringify({
            endpoint: "http://127.0.0.1:8080",
            deployment: "proxy-model",
            apiKey: "updated-proxy-key",
          }),
        );
        yield* DesktopBundledTools.prepare();
        const upgraded = JSON.parse(
          yield* fileSystem.readFileString(environment.serverSettingsPath),
        );
        assert.deepEqual(upgraded.providerInstances.codex.environment, [
          { name: "CUSTOM_ENV", value: "preserved" },
          { name: "OPENAI_API_KEY", value: "updated-proxy-key", sensitive: true },
        ]);
        assert.equal(upgraded.providerInstances.codex.displayName, "OpenAI proxy");
        assert.isFalse(upgraded.providerInstances.codex.enabled);
        assert.deepEqual(upgraded.providerInstances.custom, otherProvider);
        assert.deepEqual(upgraded.appearance, settings.appearance);
        assert.deepEqual(upgraded.defaultModelSelection, {
          instanceId: "codex",
          model: "proxy-model",
        });
        assert.deepEqual(upgraded.textGenerationModelSelection, otherSelection);
        assert.equal(
          yield* fileSystem.readFileString(historyPath),
          "existing chat history fixture",
        );
        const upgradedConfigPath = path.join(
          upgraded.providerInstances.codex.config.homePath,
          "config.toml",
        );
        const upgradedConfig = yield* fileSystem.readFileString(upgradedConfigPath);
        assert.include(upgradedConfig, 'model_provider = "openai_proxy"');
        assert.include(upgradedConfig, 'base_url = "http://127.0.0.1:8080/v1"');
        assert.include(upgradedConfig, 'env_key = "OPENAI_API_KEY"');
        assert.notInclude(upgradedConfig, "updated-proxy-key");
        const locallyEditedConfig = `${upgradedConfig}\n# local preference\n`;
        yield* fileSystem.writeFileString(upgradedConfigPath, locallyEditedConfig);
        const skillsPath = path.join(upgraded.providerInstances.codex.config.homePath, "skills");
        assert.equal(
          yield* fileSystem.readFileString(path.join(skillsPath, "company-skill", "SKILL.md")),
          "bundled skill",
        );
        assert.equal(
          yield* fileSystem.readFileString(
            path.join(skillsPath, "company-skill", "references", "guide.md"),
          ),
          "supporting file",
        );
        yield* fileSystem.makeDirectory(path.join(skillsPath, "user-skill"), { recursive: true });
        yield* fileSystem.writeFileString(
          path.join(skillsPath, "user-skill", "SKILL.md"),
          "user skill",
        );
        yield* fileSystem.writeFileString(path.join(bundledSkill, "SKILL.md"), "updated skill");
        const obsoletePath = path.join(skillsPath, "company-skill", "obsolete.md");
        yield* fileSystem.writeFileString(obsoletePath, "old bundled content");
        yield* DesktopBundledTools.prepare();
        assert.isFalse(yield* fileSystem.exists(obsoletePath));
        assert.equal(
          yield* fileSystem.readFileString(path.join(skillsPath, "company-skill", "SKILL.md")),
          "updated skill",
        );
        assert.equal(
          yield* fileSystem.readFileString(path.join(skillsPath, "user-skill", "SKILL.md")),
          "user skill",
        );
        assert.equal(yield* fileSystem.readFileString(upgradedConfigPath), locallyEditedConfig);
        assert.equal(
          yield* fileSystem.readFileString(historyPath),
          "existing chat history fixture",
        );
        yield* fileSystem.writeFileString(
          path.join(tools, "azure.json"),
          JSON.stringify({
            endpoint: "http://127.0.0.1:8080",
            deployment: "proxy-model",
            apiKey: "rotated-proxy-key",
          }),
        );
        yield* DesktopBundledTools.prepare();
        const rotated = JSON.parse(
          yield* fileSystem.readFileString(environment.serverSettingsPath),
        );
        assert.deepEqual(rotated.providerInstances.codex.environment, [
          { name: "CUSTOM_ENV", value: "preserved" },
          { name: "OPENAI_API_KEY", value: "rotated-proxy-key", sensitive: true },
        ]);
        assert.deepEqual(rotated.providerInstances.custom, otherProvider);
        assert.deepEqual(rotated.textGenerationModelSelection, otherSelection);
        assert.equal(
          yield* fileSystem.readFileString(historyPath),
          "existing chat history fixture",
        );
        yield* fileSystem.writeFileString(
          environment.serverSettingsPath,
          '{"providerInstances":{"codex":{"enabled":false}}}',
        );
        yield* DesktopBundledTools.prepare();
        assert.equal(
          yield* fileSystem.readFileString(environment.serverSettingsPath),
          '{"providerInstances":{"codex":{"enabled":false}}}',
        );
      }),
      { platform: "win32" },
    ),
  );

  it.effect("resolvePrimary produces a stable scoped bootstrap token", () =>
    withHarness(
      Effect.gen(function* () {
        const environment = yield* DesktopEnvironment.DesktopEnvironment;
        const configuration = yield* DesktopBackendConfiguration.DesktopBackendConfiguration;

        const first = yield* configuration.resolvePrimary;
        const second = yield* configuration.resolvePrimary;

        assert.equal(first.executablePath, process.execPath);
        assert.deepEqual(first.args.slice(0, 3), [
          "--require",
          environment.compileCachePath,
          environment.backendEntryPath,
        ]);
        assert.equal(first.entryPath, environment.backendEntryPath);
        assert.equal(first.cwd, environment.backendCwd);
        assert.equal(first.captureOutput, true);
        assert.equal(first.env.ELECTRON_RUN_AS_NODE, "1");
        assert.isUndefined(first.env.T3CODE_PORT);
        assert.isUndefined(first.env.T3CODE_MODE);
        assert.isUndefined(first.env.T3CODE_DESKTOP_LAN_HOST);

        assert.equal(first.bootstrap.mode, "desktop");
        assert.equal(first.bootstrap.noBrowser, true);
        assert.equal(first.bootstrap.port, 4888);
        assert.equal(first.bootstrap.host, "0.0.0.0");
        assert.equal(first.bootstrap.t3Home, environment.baseDir);
        assert.equal(first.bootstrap.tailscaleServeEnabled, true);
        assert.equal(first.bootstrap.tailscaleServePort, 8443);
        assert.match(first.bootstrap.desktopBootstrapSecret ?? "", /^[0-9a-f]{64}$/i);
        assert.equal(
          second.bootstrap.desktopBootstrapSecret,
          first.bootstrap.desktopBootstrapSecret,
        );
        assert.equal(
          first.bootstrap.desktopBootstrapToken,
          currentDesktopBootstrapToken(
            first.bootstrap.desktopBootstrapSecret ?? "",
            yield* Clock.currentTimeMillis,
          ),
        );
        assert.equal(
          yield* configuration.currentBootstrapToken,
          first.bootstrap.desktopBootstrapToken,
        );
      }),
    ),
  );

  it.effect("resolvePrimary starts from server.asar without materializing the WSL tree", () =>
    Effect.gen(function* () {
      const fileSystem = yield* FileSystem.FileSystem;
      const path = yield* Path.Path;
      const baseDir = yield* fileSystem.makeTempDirectoryScoped({
        prefix: "t3-desktop-backend-config-test-",
      });
      const resourcesPath = path.join(baseDir, "resources");

      const config = yield* Effect.gen(function* () {
        const configuration = yield* DesktopBackendConfiguration.DesktopBackendConfiguration;
        return yield* configuration.resolvePrimary;
      }).pipe(
        Effect.provide(
          layerBackendConfiguration().pipe(
            Layer.provideMerge(layerServerExposure),
            Layer.provideMerge(DesktopAppSettings.layerTest()),
            Layer.provideMerge(DesktopWslEnvironment.layerTest()),
            Layer.provideMerge(
              Layer.succeed(
                DesktopWslServerTree.DesktopWslServerTree,
                DesktopWslServerTree.DesktopWslServerTree.of({
                  ensure: Effect.die("Windows primary must not extract the WSL server tree"),
                  cleanupLegacy: Effect.die("Windows primary must not clean the WSL server tree"),
                }),
              ),
            ),
            Layer.provideMerge(
              layerEnvironment(baseDir, {
                appPath: `${resourcesPath}/app.asar`,
                platform: "win32",
                resourcesPath,
              }),
            ),
          ),
        ),
      );

      assert.equal(
        config.entryPath,
        path.join(resourcesPath, "server.asar/apps/server/dist/bin.mjs"),
      );
      assert.equal(config.env.ELECTRON_RUN_AS_NODE, "1");
    }).pipe(Effect.scoped, Effect.provide(NodeServices.layer)),
  );

  it.effect("resolveWsl pins a default-tracking run to the concrete default distro", () =>
    Effect.gen(function* () {
      const fileSystem = yield* FileSystem.FileSystem;
      const path = yield* Path.Path;
      const baseDir = yield* fileSystem.makeTempDirectoryScoped({
        prefix: "t3-desktop-backend-config-test-",
      });
      const entryPath = path.join(baseDir, "apps/server/dist/bin.mjs");
      yield* fileSystem.makeDirectory(path.dirname(entryPath), { recursive: true });
      yield* fileSystem.writeFileString(entryPath, "");

      const observedDistros: Array<string | null> = [];
      const config = yield* Effect.gen(function* () {
        const configuration = yield* DesktopBackendConfiguration.DesktopBackendConfiguration;
        return yield* configuration.resolveWsl({ port: 5000, distro: null });
      }).pipe(
        Effect.provide(
          layerBackendConfiguration().pipe(
            Layer.provideMerge(layerServerExposure),
            Layer.provideMerge(DesktopAppSettings.layerTest()),
            Layer.provideMerge(DesktopWslServerTree.layerTest()),
            Layer.provideMerge(
              DesktopWslEnvironment.layerTest({
                isAvailable: true,
                distros: [
                  { name: "Debian", isDefault: false, version: 2 },
                  { name: "Ubuntu", isDefault: true, version: 2 },
                ],
                windowsToWslPath: (distro) => {
                  observedDistros.push(distro);
                  return Option.some("/repo");
                },
                ensureNodePty: (distro) => {
                  observedDistros.push(distro);
                  return { ok: true, nodePath: "/usr/bin/node", resolvedPath: "/usr/bin:/bin" };
                },
                getDistroIp: (distro) => {
                  observedDistros.push(distro);
                  return Option.some("172.27.0.99");
                },
              }),
            ),
            Layer.provideMerge(
              layerEnvironment(baseDir, {
                appPath: baseDir,
                platform: "win32",
                resourcesPath: baseDir,
              }),
            ),
          ),
        ),
      );

      assert.equal(config.runningDistro, "Ubuntu");
      assert.deepEqual(config.args.slice(0, 2), ["-d", "Ubuntu"]);
      assert.deepEqual(observedDistros, ["Ubuntu", "Ubuntu", "Ubuntu"]);
      assert.isTrue(Option.isNone(config.preflightFailure));
    }).pipe(Effect.scoped, Effect.provide(NodeServices.layer)),
  );

  it.effect("resolveWsl launches a packaged backend from the WSL-local runtime cache", () => {
    const observedArchives: Array<{
      windowsArchivePath: string;
      runtimeId: string;
      sha256: string;
    }> = [];
    const observedProbeRoots: string[] = [];
    let legacyCleanupCount = 0;
    const linuxAppRoot = "/home/test/.t3/wsl-runtime/1.2.3-x64";
    const resolvedPath = "/home/test/.local/bin:/usr/bin:/bin";

    return withPackagedWslHarness(
      {
        archiveHash: "a".repeat(64),
        forbidFallback: "A valid WSL archive must not extract the Windows fallback",
        cleanupLegacy: Effect.sync(() => {
          legacyCleanupCount += 1;
        }),
        wsl: () => ({
          prepareRuntime: (_distro, archive) => {
            observedArchives.push({
              windowsArchivePath: archive.windowsPath,
              runtimeId: archive.runtimeId,
              sha256: archive.sha256,
            });
            return { ok: true, linuxAppRoot };
          },
          probeRuntime: (_distro, root) => {
            observedProbeRoots.push(root);
            return { ok: true, resolvedPath };
          },
          ensureNodePty: () => {
            throw new Error("the staged runtime must not probe for node-pty");
          },
        }),
      },
      ({ archiveHash, archivePath, baseDir }) =>
        Effect.gen(function* () {
          const path = yield* Path.Path;
          const configuration = yield* DesktopBackendConfiguration.DesktopBackendConfiguration;
          const config = yield* configuration.resolveWsl({ port: 5000, distro: "Ubuntu" });

          assert.deepEqual(observedArchives, [
            {
              windowsArchivePath: archivePath,
              runtimeId: `sha256-${archiveHash}`,
              sha256: archiveHash,
            },
          ]);
          assert.deepEqual(observedProbeRoots, [linuxAppRoot]);
          assert.equal(
            config.entryPath,
            path.join(baseDir, "server.asar/apps/server/dist/bin.mjs"),
          );
          assert.deepEqual(config.args, [
            "-d",
            "Ubuntu",
            "--exec",
            "env",
            `PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin:${resolvedPath}`,
            `${linuxAppRoot}/t3`,
            "--bootstrap-fd",
            "0",
          ]);
          assert.notInclude(config.args, "/usr/bin/node");
          assert.equal(config.wslRuntimeId, `sha256-${archiveHash}`);
          assert.equal(legacyCleanupCount, 1);
          assert.isTrue(Option.isNone(config.preflightFailure));
        }),
    );
  });

  it.effect("resolveWsl changes the cache id when the packaged archive changes", () => {
    const firstHash = "a".repeat(64);
    const secondHash = "b".repeat(64);
    const observedRuntimeIds: string[] = [];
    return withPackagedWslHarness(
      {
        archiveHash: firstHash,
        wsl: () => ({
          prepareRuntime: (_distro, archive) => {
            observedRuntimeIds.push(archive.runtimeId);
            return { ok: true, linuxAppRoot: `/runtime/${archive.runtimeId}` };
          },
          ensureNodePty: () => ({
            ok: true,
            nodePath: "/usr/bin/node",
            resolvedPath: "/usr/bin:/bin",
          }),
        }),
      },
      ({ hashPath, mountedAppRoot }) =>
        Effect.gen(function* () {
          const fileSystem = yield* FileSystem.FileSystem;
          const configuration = yield* DesktopBackendConfiguration.DesktopBackendConfiguration;
          const first = yield* configuration.resolveWsl({ port: 5000, distro: "Ubuntu" });
          yield* fileSystem.writeFileString(hashPath, secondHash);
          const second = yield* configuration.resolveWsl({ port: 5000, distro: "Ubuntu" });
          yield* fileSystem.writeFileString(hashPath, "not-a-sha256");
          const invalidIdentity = yield* configuration.resolveWsl({ port: 5000, distro: "Ubuntu" });

          assert.deepEqual(observedRuntimeIds, [`sha256-${firstHash}`, `sha256-${secondHash}`]);
          assert.equal(first.wslRuntimeId, observedRuntimeIds[0]);
          assert.include(first.args, `/runtime/sha256-${firstHash}/t3`);
          assert.equal(second.wslRuntimeId, observedRuntimeIds[1]);
          assert.include(second.args, `/runtime/sha256-${secondHash}/t3`);
          assert.isUndefined(invalidIdentity.wslRuntimeId);
          assert.include(invalidIdentity.args, "/usr/bin/node");
          assert.include(invalidIdentity.args, `${mountedAppRoot}/apps/server/dist/bin.mjs`);
        }),
    );
  });

  it.effect("resolveWsl falls back to the mounted runtime when archive staging fails", () => {
    const observedNodePtyRoots: string[] = [];
    return withPackagedWslHarness(
      {
        archiveHash: "b".repeat(64),
        wsl: () => ({
          prepareRuntime: () => ({ ok: false, reason: "archive is corrupt" }),
          invalidateRuntime: () => Effect.die("failed staging must not invalidate a runtime"),
          ensureNodePty: (_distro, root) => {
            observedNodePtyRoots.push(root);
            return { ok: true, nodePath: "/usr/bin/node", resolvedPath: "/usr/bin:/bin" };
          },
        }),
      },
      ({ mountedAppRoot, mountedEntryPath }) =>
        Effect.gen(function* () {
          const configuration = yield* DesktopBackendConfiguration.DesktopBackendConfiguration;
          const config = yield* configuration.resolveWsl({ port: 5000, distro: "Ubuntu" });

          assert.deepEqual(observedNodePtyRoots, [mountedAppRoot]);
          assert.equal(config.entryPath, mountedEntryPath);
          assert.include(config.args, "/usr/bin/node");
          assert.include(config.args, `${mountedAppRoot}/apps/server/dist/bin.mjs`);
          assert.isUndefined(config.wslRuntimeId);
          assert.isTrue(Option.isNone(config.preflightFailure));
        }),
    );
  });

  it.effect("resolveWsl retires a staged runtime whose executable does not start", () => {
    const archiveHash = "c".repeat(64);
    const stagedAppRoot = `/home/test/.t3/wsl-runtime/sha256-${archiveHash}`;
    const observedProbeRoots: string[] = [];
    const observedNodePtyRoots: string[] = [];
    const invalidatedRuntimeIds: string[] = [];
    return withPackagedWslHarness(
      {
        archiveHash,
        wsl: () => ({
          prepareRuntime: () => ({ ok: true, linuxAppRoot: stagedAppRoot }),
          invalidateRuntime: (_distro, runtimeId) =>
            Effect.sync(() => {
              invalidatedRuntimeIds.push(runtimeId);
            }),
          probeRuntime: (_distro, root) => {
            observedProbeRoots.push(root);
            return { ok: false, reason: `${root}/t3 --version failed (exit 127)` };
          },
          ensureNodePty: (_distro, root) => {
            observedNodePtyRoots.push(root);
            return { ok: true, nodePath: "/usr/bin/node", resolvedPath: "/usr/bin:/bin" };
          },
        }),
      },
      ({ mountedAppRoot, mountedEntryPath }) =>
        Effect.gen(function* () {
          const configuration = yield* DesktopBackendConfiguration.DesktopBackendConfiguration;
          const config = yield* configuration.resolveWsl({ port: 5000, distro: "Ubuntu" });

          assert.deepEqual(observedProbeRoots, [stagedAppRoot]);
          assert.deepEqual(observedNodePtyRoots, [mountedAppRoot]);
          assert.include(config.args, "/usr/bin/node");
          assert.include(config.args, `${mountedAppRoot}/apps/server/dist/bin.mjs`);
          assert.notInclude(config.args, `${stagedAppRoot}/t3`);
          assert.equal(config.entryPath, mountedEntryPath);
          assert.isUndefined(config.wslRuntimeId);
          assert.isTrue(Option.isNone(config.preflightFailure));
          assert.deepEqual(invalidatedRuntimeIds, [`sha256-${archiveHash}`]);
        }),
    );
  });

  it.effect("resolveWsl keeps WSL retryable when the mounted fallback fails transiently", () => {
    const stagedAppRoot = "/home/test/.t3/wsl-runtime/cache";
    const invalidatedRuntimeIds: string[] = [];
    return withPackagedWslHarness(
      {
        archiveHash: "f".repeat(64),
        wsl: () => ({
          prepareRuntime: () => ({ ok: true, linuxAppRoot: stagedAppRoot }),
          invalidateRuntime: (_distro, runtimeId) =>
            Effect.sync(() => {
              invalidatedRuntimeIds.push(runtimeId);
            }),
          probeRuntime: () => ({ ok: false, reason: "t3 --version failed (exit 1)" }),
          ensureNodePty: () => ({
            ok: false,
            reason: "WSL backend preflight timed out while probing for Node.js.",
            fatal: false,
          }),
        }),
      },
      () =>
        Effect.gen(function* () {
          const configuration = yield* DesktopBackendConfiguration.DesktopBackendConfiguration;
          const config = yield* configuration.resolveWsl({ port: 5000, distro: "Ubuntu" });
          const failure = Option.getOrThrow(config.preflightFailure);

          assert.isFalse(failure.fatal);
          assert.equal(failure.retryLimit, 12);
          assert.include(failure.reason, "timed out");
          assert.deepEqual(invalidatedRuntimeIds, []);
        }),
    );
  });

  it.effect(
    "resolveWsl preserves inherited PATH with quote-sensitive values as separate args",
    () =>
      Effect.gen(function* () {
        const fileSystem = yield* FileSystem.FileSystem;
        const path = yield* Path.Path;
        const baseDir = yield* fileSystem.makeTempDirectoryScoped({
          prefix: "t3-desktop-backend-config-test-",
        });
        const entryPath = path.join(baseDir, "apps/server/dist/bin.mjs");
        yield* fileSystem.makeDirectory(path.dirname(entryPath), { recursive: true });
        yield* fileSystem.writeFileString(entryPath, "");

        const nodePath = "/home/test user's/.nvm/versions/node/v22.0.0/bin/node";
        const linuxAppRoot = "/tmp/t3 code's launch";
        const linuxEntryPath = `${linuxAppRoot}/apps/server/dist/bin.mjs`;
        const resolvedPath = "/home/test user/bin:/opt/test's tools/bin:/usr/bin:/bin";
        const devServerUrl = "http://127.0.0.1:5733/dev%20assets/?label=hello%20world";
        const config = yield* Effect.gen(function* () {
          const configuration = yield* DesktopBackendConfiguration.DesktopBackendConfiguration;
          return yield* configuration.resolveWsl({ port: 5000, distro: "Ubuntu" });
        }).pipe(
          Effect.provide(
            layerBackendConfiguration().pipe(
              Layer.provideMerge(layerServerExposure),
              Layer.provideMerge(DesktopAppSettings.layerTest()),
              Layer.provideMerge(DesktopWslServerTree.layerTest()),
              Layer.provideMerge(
                DesktopWslEnvironment.layerTest({
                  isAvailable: true,
                  distros: [{ name: "Ubuntu", isDefault: true, version: 2 }],
                  windowsToWslPath: () => Option.some(linuxAppRoot),
                  ensureNodePty: () => ({ ok: true, nodePath, resolvedPath }),
                  getDistroIp: () => Option.some("172.27.0.99"),
                }),
              ),
              Layer.provideMerge(
                layerEnvironment(baseDir, {
                  appPath: baseDir,
                  devServerUrl,
                  isPackaged: true,
                  platform: "win32",
                  resourcesPath: baseDir,
                }),
              ),
            ),
          ),
        );

        assert.equal(config.bootstrapDelivery, "stdin");
        assert.deepEqual(config.args, [
          "-d",
          "Ubuntu",
          "--exec",
          "env",
          "PATH=/home/test user's/.nvm/versions/node/v22.0.0/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin:/home/test user/bin:/opt/test's tools/bin:/usr/bin:/bin",
          nodePath,
          linuxEntryPath,
          "--bootstrap-fd",
          "0",
          "--dev-url",
          devServerUrl,
        ]);
        assert.notInclude(config.args, "bash");
        assert.notInclude(config.args, "/bin/sh");
        assert.notInclude(config.args, "-c");
        assert.isTrue(Option.isNone(config.preflightFailure));
      }).pipe(Effect.scoped, Effect.provide(NodeServices.layer)),
  );

  it.effect("resolvePrimary and resolveWsl share one token under concurrent resolution", () =>
    withHarness(
      Effect.gen(function* () {
        const configuration = yield* DesktopBackendConfiguration.DesktopBackendConfiguration;

        const [primary, wsl] = yield* Effect.all(
          [configuration.resolvePrimary, configuration.resolveWsl({ port: 5000, distro: null })],
          { concurrency: "unbounded" },
        );

        assert.equal(wsl.bootstrap.desktopBootstrapToken, primary.bootstrap.desktopBootstrapToken);
      }),
    ),
  );

  it.effect("resolveWsl carries the kill switch and resource attributes into the distro", () =>
    Effect.gen(function* () {
      const fileSystem = yield* FileSystem.FileSystem;
      const baseDir = yield* fileSystem.makeTempDirectoryScoped({
        prefix: "t3-desktop-backend-config-test-",
      });

      const previousWslEnv = process.env.WSLENV;
      const previousDisabled = process.env.OTEL_SDK_DISABLED;
      const previousTelemetry = process.env.T3CODE_TELEMETRY_ENABLED;
      const previousResourceAttributes = process.env.OTEL_RESOURCE_ATTRIBUTES;
      try {
        delete process.env.WSLENV;
        process.env.OTEL_SDK_DISABLED = "true";
        process.env.T3CODE_TELEMETRY_ENABLED = "false";
        process.env.OTEL_RESOURCE_ATTRIBUTES = "deployment.environment.name=staging";

        yield* Effect.gen(function* () {
          const configuration = yield* DesktopBackendConfiguration.DesktopBackendConfiguration;
          const config = yield* configuration.resolveWsl({ port: 5050, distro: null });

          assert.equal(config.env.OTEL_SDK_DISABLED, "true");
          assert.include((config.env.WSLENV ?? "").split(":"), "OTEL_SDK_DISABLED");
          assert.equal(config.env.T3CODE_TELEMETRY_ENABLED, "false");
          assert.include((config.env.WSLENV ?? "").split(":"), "T3CODE_TELEMETRY_ENABLED");
          assert.equal(config.env.OTEL_RESOURCE_ATTRIBUTES, "deployment.environment.name=staging");
          assert.include((config.env.WSLENV ?? "").split(":"), "OTEL_RESOURCE_ATTRIBUTES");
        }).pipe(
          Effect.provide(
            layerBackendConfiguration().pipe(
              Layer.provideMerge(layerServerExposure),
              Layer.provideMerge(DesktopAppSettings.layerTest()),
              Layer.provideMerge(DesktopWslServerTree.layerTest()),
              Layer.provideMerge(
                DesktopWslEnvironment.layerTest({
                  isAvailable: true,
                  windowsToWslPath: () => Option.some("/mnt/c/repo/apps/server/src/index.ts"),
                  getDistroIp: () => Option.some("172.27.0.99"),
                }),
              ),
              Layer.provideMerge(layerEnvironment(baseDir, { platform: "win32" })),
            ),
          ),
        );
      } finally {
        restoreEnv("WSLENV", previousWslEnv);
        restoreEnv("OTEL_SDK_DISABLED", previousDisabled);
        restoreEnv("T3CODE_TELEMETRY_ENABLED", previousTelemetry);
        restoreEnv("OTEL_RESOURCE_ATTRIBUTES", previousResourceAttributes);
      }
    }).pipe(Effect.scoped, Effect.provide(NodeServices.layer)),
  );

  it.effect("resolveWsl preserves existing WSLENV entries when forwarding backend secrets", () =>
    Effect.gen(function* () {
      const fileSystem = yield* FileSystem.FileSystem;
      const baseDir = yield* fileSystem.makeTempDirectoryScoped({
        prefix: "t3-desktop-backend-config-test-",
      });

      const previousWslEnv = process.env.WSLENV;
      const previousOpenAiKey = process.env.OPENAI_API_KEY;
      const previousAnthropicKey = process.env.ANTHROPIC_API_KEY;
      const previousOtlpHeaders = process.env.T3CODE_OTLP_HEADERS;
      const previousOtlpProtocol = process.env.T3CODE_OTLP_PROTOCOL;
      const ambientOtel = Object.entries(process.env).filter(([name]) => name.startsWith("OTEL_"));
      try {
        for (const [name] of ambientOtel) delete process.env[name];
        process.env.WSLENV = "GOPATH/p:OPENAI_API_KEY/u:EMPTY::AZURE_DEVOPS_EXT_PAT/u";
        process.env.OPENAI_API_KEY = "openai-key";
        process.env.ANTHROPIC_API_KEY = "anthropic-key";
        process.env.T3CODE_OTLP_HEADERS = 'authorization="Bearer%20my-token"';
        process.env.T3CODE_OTLP_PROTOCOL = "http/protobuf";

        yield* Effect.gen(function* () {
          const configuration = yield* DesktopBackendConfiguration.DesktopBackendConfiguration;
          const config = yield* configuration.resolveWsl({ port: 5050, distro: null });

          assert.equal(config.executablePath, "wsl.exe");
          assert.equal(config.bootstrap.port, 5050);
          assert.equal(config.bootstrap.host, "0.0.0.0");
          assert.equal(config.bootstrap.tailscaleServeEnabled, false);
          assert.notProperty(config.bootstrap, "desktopTelemetryFd");
          assert.notProperty(config.bootstrap, "resourceMonitorPath");
          assert.equal(config.httpBaseUrl.href, "http://172.27.0.99:5050/");
          assert.equal(config.env.OPENAI_API_KEY, "openai-key");
          assert.equal(config.env.ANTHROPIC_API_KEY, "anthropic-key");
          assert.equal(config.env.T3CODE_OTLP_PROTOCOL, "http/protobuf");
          assert.equal(
            config.env.WSLENV,
            "GOPATH/p:OPENAI_API_KEY/u:EMPTY::AZURE_DEVOPS_EXT_PAT/u:ANTHROPIC_API_KEY:T3CODE_OTLP_HEADERS:T3CODE_OTLP_PROTOCOL",
          );
        }).pipe(
          Effect.provide(
            layerBackendConfiguration().pipe(
              Layer.provideMerge(layerServerExposure),
              Layer.provideMerge(DesktopAppSettings.layerTest()),
              Layer.provideMerge(DesktopWslServerTree.layerTest()),
              Layer.provideMerge(
                DesktopWslEnvironment.layerTest({
                  isAvailable: true,
                  windowsToWslPath: () => Option.some("/mnt/c/repo/apps/server/src/index.ts"),
                  getDistroIp: () => Option.some("172.27.0.99"),
                }),
              ),
              Layer.provideMerge(layerEnvironment(baseDir, { platform: "win32" })),
            ),
          ),
        );
      } finally {
        restoreEnv("WSLENV", previousWslEnv);
        restoreEnv("OPENAI_API_KEY", previousOpenAiKey);
        restoreEnv("ANTHROPIC_API_KEY", previousAnthropicKey);
        restoreEnv("T3CODE_OTLP_HEADERS", previousOtlpHeaders);
        restoreEnv("T3CODE_OTLP_PROTOCOL", previousOtlpProtocol);
        for (const [name, value] of ambientOtel) restoreEnv(name, value);
      }
    }).pipe(Effect.scoped, Effect.provide(NodeServices.layer)),
  );

  it.effect(
    "resolvePrimary falls back to the Windows primary when wsl-only but WSL is unavailable",
    () =>
      Effect.gen(function* () {
        const fileSystem = yield* FileSystem.FileSystem;
        const baseDir = yield* fileSystem.makeTempDirectoryScoped({
          prefix: "t3-desktop-backend-config-test-",
        });

        yield* Effect.gen(function* () {
          const environment = yield* DesktopEnvironment.DesktopEnvironment;
          const configuration = yield* DesktopBackendConfiguration.DesktopBackendConfiguration;
          const config = yield* configuration.resolvePrimary;

          assert.equal(config.executablePath, process.execPath);
          assert.equal(config.bootstrap.t3Home, environment.baseDir);
          assert.isTrue(Option.isNone(config.preflightFailure));
        }).pipe(
          Effect.provide(
            layerBackendConfiguration().pipe(
              Layer.provideMerge(layerServerExposure),
              Layer.provideMerge(
                DesktopAppSettings.layerTest({
                  ...DesktopAppSettings.DEFAULT_DESKTOP_SETTINGS,
                  wslBackendEnabled: true,
                  wslOnly: true,
                }),
              ),
              Layer.provideMerge(DesktopWslServerTree.layerTest()),
              Layer.provideMerge(DesktopWslEnvironment.layerTest({ isAvailable: false })),
              Layer.provideMerge(layerEnvironment(baseDir, { platform: "win32" })),
            ),
          ),
        );
      }).pipe(Effect.scoped, Effect.provide(NodeServices.layer)),
  );

  it.effect(
    "resolvePrimary marks a removed persisted WSL distro as a fatal preflight failure",
    () =>
      Effect.gen(function* () {
        const fileSystem = yield* FileSystem.FileSystem;
        const baseDir = yield* fileSystem.makeTempDirectoryScoped({
          prefix: "t3-desktop-backend-config-test-",
        });

        yield* Effect.gen(function* () {
          const configuration = yield* DesktopBackendConfiguration.DesktopBackendConfiguration;
          const config = yield* configuration.resolvePrimary;
          const failure = Option.getOrThrow(config.preflightFailure);

          assert.equal(config.executablePath, "wsl.exe");
          assert.isTrue(failure.fatal);
          assert.include(failure.reason, "Removed-Distro");
        }).pipe(
          Effect.provide(
            layerBackendConfiguration().pipe(
              Layer.provideMerge(layerServerExposure),
              Layer.provideMerge(
                DesktopAppSettings.layerTest({
                  ...DesktopAppSettings.DEFAULT_DESKTOP_SETTINGS,
                  wslBackendEnabled: true,
                  wslOnly: true,
                  wslDistro: "Removed-Distro",
                }),
              ),
              Layer.provideMerge(DesktopWslServerTree.layerTest()),
              Layer.provideMerge(
                DesktopWslEnvironment.layerTest({
                  isAvailable: true,
                  distros: [{ name: "Ubuntu", isDefault: true, version: 2 }],
                }),
              ),
              Layer.provideMerge(layerEnvironment(baseDir, { platform: "win32" })),
            ),
          ),
        );
      }).pipe(Effect.scoped, Effect.provide(NodeServices.layer)),
  );

  it.effect("resolveWsl marks a missing packaged server entry as fatal", () =>
    Effect.gen(function* () {
      const fileSystem = yield* FileSystem.FileSystem;
      const baseDir = yield* fileSystem.makeTempDirectoryScoped({
        prefix: "t3-desktop-backend-config-test-",
      });

      yield* Effect.gen(function* () {
        const configuration = yield* DesktopBackendConfiguration.DesktopBackendConfiguration;
        const config = yield* configuration.resolveWsl({ port: 5050, distro: "Ubuntu" });
        const failure = Option.getOrThrow(config.preflightFailure);

        assert.isTrue(failure.fatal);
        assert.include(failure.reason, "missing server entry");
      }).pipe(
        Effect.provide(
          layerBackendConfiguration().pipe(
            Layer.provideMerge(layerServerExposure),
            Layer.provideMerge(DesktopAppSettings.layerTest()),
            Layer.provideMerge(DesktopWslServerTree.layerTest()),
            Layer.provideMerge(
              DesktopWslEnvironment.layerTest({
                isAvailable: true,
                distros: [{ name: "Ubuntu", isDefault: true, version: 2 }],
              }),
            ),
            Layer.provideMerge(layerEnvironment(baseDir, { platform: "win32" })),
          ),
        ),
      );
    }).pipe(Effect.scoped, Effect.provide(NodeServices.layer)),
  );

  it.effect("prefers the external packaged resource monitor over the copy inside the asar", () =>
    Effect.gen(function* () {
      const fileSystem = yield* FileSystem.FileSystem;
      const path = yield* Path.Path;
      const baseDir = yield* fileSystem.makeTempDirectoryScoped({
        prefix: "t3-desktop-backend-config-test-",
      });
      const resourcesPath = path.join(baseDir, "resources");
      const dirname = `${resourcesPath}/app.asar/apps/desktop/dist-electron`;
      const embeddedMonitorPath = `${resourcesPath}/app.asar/apps/desktop/prod-resources/resource-monitor/t3-resource-monitor`;
      const monitorPath = path.join(resourcesPath, "resource-monitor/t3-resource-monitor");
      yield* fileSystem.makeDirectory(
        `${resourcesPath}/app.asar/apps/desktop/prod-resources/resource-monitor`,
        { recursive: true },
      );
      yield* fileSystem.makeDirectory(`${resourcesPath}/resource-monitor`, {
        recursive: true,
      });
      yield* fileSystem.writeFileString(embeddedMonitorPath, "embedded");
      yield* fileSystem.writeFileString(monitorPath, "binary");
      yield* fileSystem.chmod(monitorPath, 0o755);

      yield* Effect.gen(function* () {
        const configuration = yield* DesktopBackendConfiguration.DesktopBackendConfiguration;
        const config = yield* configuration.resolvePrimary;
        assert.equal(config.bootstrap.resourceMonitorPath, monitorPath);
        assert.equal(config.bootstrap.desktopTelemetryFd, 4);
        assert.equal(config.bootstrap.desktopTelemetryControlFd, 5);
      }).pipe(
        Effect.provide(
          layerBackendConfiguration().pipe(
            Layer.provideMerge(layerServerExposure),
            Layer.provideMerge(DesktopAppSettings.layerTest()),
            Layer.provideMerge(DesktopWslServerTree.layerTest()),
            Layer.provideMerge(DesktopWslEnvironment.layerTest()),
            Layer.provideMerge(
              layerEnvironment(baseDir, {
                appPath: `${resourcesPath}/app.asar`,
                dirname,
                isPackaged: true,
                resourcesPath,
              }),
            ),
          ),
        ),
      );
    }).pipe(Effect.scoped, Effect.provide(NodeServices.layer)),
  );

  it("resolvePrimaryLabel is runSync-safe against the real WSL availability probe", async () => {
    // oxlint-disable-next-line t3code/no-manual-effect-runtime-in-tests -- This test intentionally replicates the sync IPC handler's runSync path to catch a regression to async-only resolution; it.effect would mask it.
    const runtime = ManagedRuntime.make(
      layerBackendConfiguration().pipe(
        Layer.provideMerge(layerServerExposure),
        Layer.provideMerge(DesktopAppSettings.layerTest()),
        Layer.provideMerge(DesktopWslServerTree.layerTest()),
        Layer.provideMerge(DesktopWslEnvironment.layer),
        Layer.provideMerge(
          Layer.succeed(
            ChildProcessSpawner.ChildProcessSpawner,
            ChildProcessSpawner.make(() =>
              Effect.die("spawner should not be used while probing WSL availability"),
            ),
          ),
        ),
        Layer.provideMerge(layerEnvironment("/tmp/t3-wsl-isavailable", { platform: "win32" })),
        Layer.provide(NodeServices.layer),
      ),
    );
    try {
      const configuration = await runtime.runPromise(
        DesktopBackendConfiguration.DesktopBackendConfiguration,
      );
      // oxlint-disable-next-line t3code/no-manual-effect-runtime-in-tests -- Same reason: this is the synchronous resolution the IPC handler performs.
      const label = Effect.runSync(configuration.resolvePrimaryLabel);
      assert.equal(typeof label, "string");
    } finally {
      await runtime.dispose();
    }
  });
});
