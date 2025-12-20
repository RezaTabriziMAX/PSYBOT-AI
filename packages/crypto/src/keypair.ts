import bs58 from "bs58";
import nacl from "tweetnacl";
import { Keypair } from "@solana/web3.js";

export type KeypairSource =
  | { kind: "json"; secretKey: number[] }
  | { kind: "base58"; secretKey: string }
  | { kind: "solana"; keypair: Keypair };

export function keypairFromJson(secretKey: number[]): Keypair {
  const u8 = Uint8Array.from(secretKey);
  return Keypair.fromSecretKey(u8);
}

export function keypairFromBase58(secretKey: string): Keypair {
  const u8 = bs58.decode(secretKey);
  return Keypair.fromSecretKey(u8);
}

export function keypairFromEnv(env: Record<string, string | undefined>): Keypair | null {
  const json = env.SOLANA_KEYPAIR_JSON;
  const b58 = env.SOLANA_KEYPAIR_BASE58;
  if (json && json.trim().startsWith("[")) {
    return keypairFromJson(JSON.parse(json));
  }
  if (b58 && b58.trim().length > 0) {
    return keypairFromBase58(b58.trim());
  }
  return null;
}

export function signDetached(message: Uint8Array, secretKey: Uint8Array): Uint8Array {
  return nacl.sign.detached(message, secretKey);
}

export function verifyDetached(message: Uint8Array, signature: Uint8Array, publicKey: Uint8Array): boolean {
  return nacl.sign.detached.verify(message, signature, publicKey);
}
