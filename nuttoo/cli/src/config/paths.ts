import os from "node:os";
import path from "node:path";

export type NuttooPaths = {
  home: string;
  configDir: string;
  cacheDir: string;
  artifactsDir: string;
};

export function getNuttooPaths(): NuttooPaths {
  const home = os.homedir();
  const configDir = process.env.NUTTOO_CONFIG_DIR ?? path.join(home, ".nuttoo");
  const cacheDir = process.env.NUTTOO_CACHE_DIR ?? path.join(configDir, "cache");
  const artifactsDir = process.env.NUTTOO_ARTIFACTS_DIR ?? path.join(configDir, "artifacts");
  return { home, configDir, cacheDir, artifactsDir };
}
