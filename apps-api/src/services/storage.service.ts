import { createHash } from "node:crypto";
import { mkdir, writeFile, readFile, stat } from "node:fs/promises";
import path from "node:path";
import { HttpError } from "@nuttoo/errors";

export type PutObjectInput = {
  bytes: Uint8Array;
  contentType?: string;
};

export type PutObjectResult = {
  key: string;
  sha256: string;
  size: number;
};

export class StorageService {
  constructor(private readonly mode: "local" | "s3", private readonly localDir: string) {}

  async putObject(input: PutObjectInput): Promise<PutObjectResult> {
    if (this.mode !== "local") {
      throw new HttpError(501, "STORAGE_NOT_IMPLEMENTED", "S3 storage is not implemented in this build");
    }

    await mkdir(this.localDir, { recursive: true });

    const sha256 = createHash("sha256").update(input.bytes).digest("hex");
    const key = `obj/${sha256}`;
    const file = path.join(this.localDir, key);

    await mkdir(path.dirname(file), { recursive: true });
    await writeFile(file, input.bytes);

    return { key, sha256, size: input.bytes.byteLength };
  }

  async getObject(key: string): Promise<Uint8Array> {
    if (this.mode !== "local") throw new HttpError(501, "STORAGE_NOT_IMPLEMENTED", "S3 storage is not implemented in this build");
    const file = path.join(this.localDir, key);
    try {
      const b = await readFile(file);
      return new Uint8Array(b);
    } catch {
      throw new HttpError(404, "NOT_FOUND", "Object not found");
    }
  }

  async headObject(key: string): Promise<{ size: number }> {
    if (this.mode !== "local") throw new HttpError(501, "STORAGE_NOT_IMPLEMENTED", "S3 storage is not implemented in this build");
    const file = path.join(this.localDir, key);
    try {
      const s = await stat(file);
      return { size: s.size };
    } catch {
      throw new HttpError(404, "NOT_FOUND", "Object not found");
    }
  }
}
