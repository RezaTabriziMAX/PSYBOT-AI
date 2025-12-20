import { PublicKey } from "@solana/web3.js";

export function pda(programId: PublicKey, seeds: (Buffer | Uint8Array)[]): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(seeds, programId);
}

export function utf8(s: string): Buffer {
  return Buffer.from(s, "utf8");
}
