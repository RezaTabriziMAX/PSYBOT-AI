import os from "node:os";
import path from "node:path";
import { mkdirSync, existsSync } from "node:fs";

export type CliPaths = {
  homeDir: string;
  configDir: string;
  cacheDir: string;
  tokensFile: string;
  settingsFile: string;
};

export function getCliPaths(appName = "nuttoo"): CliPaths {
  const homeDir = os.homedir();
  const base = process.env.NUTTOO_HOME?.trim()
    ? path.resolve(process.env.NUTTOO_HOME.trim())
    : path.join(homeDir, `.${appName}`);

  const configDir = path.join(base, "config");
  const cacheDir = path.join(base, "cache");

  if (!existsSync(configDir)) mkdirSync(configDir, { recursive: true });
  if (!existsSync(cacheDir)) mkdirSync(cacheDir, { recursive: true });

  return {
    homeDir: base,
    configDir,
    cacheDir,
    tokensFile: path.join(configDir, "tokens.json"),
    settingsFile: path.join(configDir, "settings.json"),
  };
}
