import { Keypair } from "@solana/web3.js";
import { sha256 } from "./hashing";
import { signDetached, verifyDetached } from "./keypair";

export type SignatureEnvelope = {
  alg: "ed25519";
  pubkey: string;
  sig: string;
  hash: string;
};

export function signPayload(payload: unknown, kp: Keypair): SignatureEnvelope {
  const bytes = Buffer.from(JSON.stringify(payload), "utf8");
  const digest = sha256(bytes);
  const sig = signDetached(digest, kp.secretKey);
  return {
    alg: "ed25519",
    pubkey: Buffer.from(kp.publicKey.toBytes()).toString("hex"),
    sig: Buffer.from(sig).toString("hex"),
    hash: digest.toString("hex"),
  };
}

export function verifyPayload(payload: unknown, env: SignatureEnvelope): boolean {
  const bytes = Buffer.from(JSON.stringify(payload), "utf8");
  const digest = sha256(bytes);
  if (digest.toString("hex") !== env.hash) return false;
  const pub = Buffer.from(env.pubkey, "hex");
  const sig = Buffer.from(env.sig, "hex");
  return verifyDetached(digest, sig, pub);
}
