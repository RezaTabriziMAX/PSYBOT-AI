import fs from "node:fs/promises";
import tar from "tar";

export type UnpackOptions = {
  archiveFile: string;
  outDir: string;
};

export async function unpackModule(opts: UnpackOptions): Promise<void> {
  await fs.mkdir(opts.outDir, { recursive: true });
  await tar.x({
    file: opts.archiveFile,
    cwd: opts.outDir,
    gzip: true,
    strict: true,
  });
}
