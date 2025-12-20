import { mkdir, writeFile, readFile, stat } from "node:fs/promises";
import path from "node:path";
import { createHash } from "node:crypto";

export type BlobRef = { key: string; sha256: string; size: number };

export class BlobStore {
  constructor(private readonly dir: string) {}

  async put(bytes: Uint8Array): Promise<BlobRef> {
    await mkdir(this.dir, { recursive: true });
    const sha256 = createHash("sha256").update(bytes).digest("hex");
    const key = `blob/${sha256}`;
    const file = path.join(this.dir, key);
    await mkdir(path.dirname(file), { recursive: true });
    await writeFile(file, bytes);
    return { key, sha256, size: bytes.byteLength };
  }

  async get(key: string): Promise<Uint8Array> {
    const file = path.join(this.dir, key);
    const b = await readFile(file);
    return new Uint8Array(b);
  }

  async head(key: string): Promise<{ size: number }> {
    const file = path.join(this.dir, key);
    const s = await stat(file);
    return { size: s.size };
  }
}
