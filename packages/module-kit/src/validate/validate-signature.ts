import { verifyIntegrity, Integrity } from "../pack/integrity";
import { verifyPayload, SignatureEnvelope } from "@nuttoo/crypto";

export type SignedManifest = Record<string, any> & {
  integrity?: Integrity;
  signature?: SignatureEnvelope;
};

export function validateSignature(manifest: SignedManifest): { ok: true } | { ok: false; reason: string } {
  if (!manifest.integrity) return { ok: false, reason: "Missing integrity" };
  if (!verifyIntegrity(stripSignatureFields(manifest), manifest.integrity)) {
    return { ok: false, reason: "Integrity mismatch" };
  }
  if (!manifest.signature) return { ok: false, reason: "Missing signature" };
  if (!verifyPayload(stripSignatureFields(manifest), manifest.signature)) {
    return { ok: false, reason: "Signature invalid" };
  }
  return { ok: true };
}

function stripSignatureFields(m: SignedManifest): any {
  const clone = { ...m };
  delete clone.signature;
  return clone;
}
