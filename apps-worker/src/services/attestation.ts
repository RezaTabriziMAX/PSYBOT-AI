import { createHash } from "node:crypto";

export type Attestation = {
  sha256: string;
  payloadSha256: string;
  createdAt: string;
  signer: "ephemeral";
  signature: string;
};

export function createAttestation(payload: unknown): Attestation {
  const payloadJson = JSON.stringify(payload);
  const payloadSha256 = createHash("sha256").update(payloadJson).digest("hex");

  const createdAt = new Date().toISOString();
  const sha256 = createHash("sha256").update(payloadSha256 + createdAt).digest("hex");

  // Placeholder signature, for local/dev. Replace with KMS-backed signer in production.
  const signature = createHash("sha256").update("nuttoo" + sha256).digest("hex");

  return {
    sha256,
    payloadSha256,
    createdAt,
    signer: "ephemeral",
    signature,
  };
}
