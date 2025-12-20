import fs from "node:fs/promises";
import path from "node:path";
import tar from "tar";
import { integrityOfManifest } from "./integrity";

export type PackOptions = {
  moduleDir: string;
  outFile: string;
  manifestFile?: string;
};

export async function packModule(opts: PackOptions): Promise<{ outFile: string; integrityHash: string }> {
  const manifestFile = opts.manifestFile ?? "module.json";
  const manifestPath = path.join(opts.moduleDir, manifestFile);

  const raw = await fs.readFile(manifestPath, "utf8");
  const manifest = JSON.parse(raw);
  const integrity = integrityOfManifest(manifest);

  manifest.integrity = integrity;

  await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2), "utf8");

  await tar.c(
    {
      gzip: true,
      file: opts.outFile,
      cwd: opts.moduleDir,
      portable: true,
      noMtime: true,
    },
    ["."]
  );

  return { outFile: opts.outFile, integrityHash: integrity.hash };
}
