import { createTerminal, formatPath } from "../ui/terminal.js";
import { getCliPaths } from "../config/paths.js";
import { writeFile } from "node:fs/promises";

export async function initCommand(): Promise<number> {
  const t = createTerminal();
  t.header("Init", "Create local config directories and default settings");

  const paths = getCliPaths();
  const defaultSettings = {
    apiBaseUrl: process.env.NUTTOO_API_BASE_URL ?? "http://localhost:8080",
    telemetry: { enabled: true },
    module: { defaultRuntime: "node" },
  };

  await writeFile(paths.settingsFile, JSON.stringify(defaultSettings, null, 2), "utf-8").catch(() => undefined);

  t.hr();
  t.kv("Home", formatPath(paths.homeDir));
  t.kv("Config", formatPath(paths.configDir));
  t.kv("Cache", formatPath(paths.cacheDir));
  t.kv("Settings", formatPath(paths.settingsFile));
  t.kv("Tokens", formatPath(paths.tokensFile));
  t.hr();
  t.success("Initialized.");
  return 0;
}
