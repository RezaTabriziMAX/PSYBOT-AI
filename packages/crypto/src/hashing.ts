import crypto from "node:crypto";

export function sha256(data: Uint8Array | string): Buffer {
  const buf = typeof data === "string" ? Buffer.from(data, "utf8") : Buffer.from(data);
  return crypto.createHash("sha256").update(buf).digest();
}

export function sha256Hex(data: Uint8Array | string): string {
  return sha256(data).toString("hex");
}
