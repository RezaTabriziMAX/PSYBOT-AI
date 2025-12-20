import { PublicKey, TransactionInstruction } from "@solana/web3.js";
import { utf8, pda } from "../pdas";

export type ForkProgram = {
  programId: PublicKey;
};

export function forkPda(programId: PublicKey, lineageHash: Buffer): [PublicKey, number] {
  return pda(programId, [utf8("fork"), lineageHash]);
}

export function ixCreateFork(_program: ForkProgram, _params: {
  lineageHash: Buffer;
  authority: PublicKey;
}): TransactionInstruction {
  throw new Error("Not implemented: ixCreateFork (requires on-chain program IDL)");
}
