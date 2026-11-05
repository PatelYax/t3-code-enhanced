import * as Option from "effect/Option";

export type JoinPath = (first: string, ...segments: string[]) => string;

function normalizeConfiguredBaseDir(AI_HUBHome: Option.Option<string>): Option.Option<string> {
  if (Option.isNone(AI_HUBHome)) {
    return Option.none();
  }
  const trimmed = AI_HUBHome.value.trim();
  return trimmed.length > 0 ? Option.some(trimmed) : Option.none();
}

export function resolveDesktopBaseDir(input: {
  readonly homeDirectory: string;
  readonly joinPath: JoinPath;
  readonly AI_HUBHome: Option.Option<string>;
}): string {
  return Option.getOrElse(normalizeConfiguredBaseDir(input.AI_HUBHome), () =>
    input.joinPath(input.homeDirectory, ".atqor_ai_hub"),
  );
}

export function resolveDesktopStateDir(input: {
  readonly baseDir: string;
  readonly isDevelopment: boolean;
  readonly joinPath: JoinPath;
  readonly AI_HUBHome: Option.Option<string>;
}): string {
  const useDevSubdir =
    input.isDevelopment && Option.isNone(normalizeConfiguredBaseDir(input.AI_HUBHome));
  return input.joinPath(input.baseDir, useDevSubdir ? "dev" : "userdata");
}
