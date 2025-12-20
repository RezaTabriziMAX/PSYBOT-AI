import { mkdir, writeFile, readFile, rm, stat } from "node:fs/promises";
import path from "node:path";
import { createHash } from "node:crypto";

export type ArtifactRef = {
  key: string;
  sha256: string;
  size: number;
  contentType: string;
};

export class ArtifactStore {
  constructor(private readonly baseDir: string) {}

  async putBytes(keyPrefix: string, bytes: Uint8Array, contentType: string): Promise<ArtifactRef> {
    await mkdir(this.baseDir, { recursive: true });
    const sha256 = createHash("sha256").update(bytes).digest("hex");
    const key = path.join(keyPrefix, sha256);
    const file = path.join(this.baseDir, key);
    await mkdir(path.dirname(file), { recursive: true });
    await writeFile(file, bytes);
    const s = await stat(file);
    return { key, sha256, size: s.size, contentType };
  }

  async getBytes(key: string): Promise<Uint8Array> {
    const file = path.join(this.baseDir, key);
    const b = await readFile(file);
    return new Uint8Array(b);
  }

  async delete(key: string): Promise<void> {
    const file = path.join(this.baseDir, key);
    await rm(file, { force: true });
  }
}
