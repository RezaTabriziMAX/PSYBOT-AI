import fs from "node:fs/promises";
import path from "node:path";
import { getNuttooPaths } from "../config/paths.js";

export async function initCommand(): Promise<void> {
  const p = getNuttooPaths();
  await fs.mkdir(p.configDir, { recursive: true });
  await fs.mkdir(p.cacheDir, { recursive: true });
  await fs.mkdir(p.artifactsDir, { recursive: true });

  const cfgPath = path.join(p.configDir, "config.json");
  try {
    await fs.access(cfgPath);
  } catch {
    const cfg = {
      apiBaseUrl: process.env.NUTTOO_API_BASE_URL ?? "http://localhost:8080",
      createdAt: new Date().toISOString(),
    };
    await fs.writeFile(cfgPath, JSON.stringify(cfg, null, 2) + "\n", "utf-8");
  }

  process.stdout.write(`Initialized ${p.configDir}\n`);
}
