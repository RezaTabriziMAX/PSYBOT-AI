import crypto from "node:crypto";
import stableStringify from "fast-json-stable-stringify";

export type Integrity = {
  alg: "sha256";
  hash: string;
};

export function integrityOfManifest(manifest: unknown): Integrity {
  const normalized = stableStringify(manifest);
  const hash = crypto.createHash("sha256").update(normalized).digest("hex");
  return { alg: "sha256", hash };
}

export function verifyIntegrity(manifest: unknown, integrity: Integrity): boolean {
  if (integrity.alg !== "sha256") return false;
  return integrityOfManifest(manifest).hash === integrity.hash;
}
