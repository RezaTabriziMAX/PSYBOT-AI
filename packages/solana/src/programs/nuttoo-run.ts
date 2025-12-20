import { PublicKey, TransactionInstruction } from "@solana/web3.js";
import { utf8, pda } from "../pdas";

export type RunProgram = {
  programId: PublicKey;
};

export function runPda(programId: PublicKey, runId: Buffer): [PublicKey, number] {
  return pda(programId, [utf8("run"), runId]);
}

export function ixCommitRun(_program: RunProgram, _params: {
  runId: Buffer;
  resultHash: Buffer;
  authority: PublicKey;
}): TransactionInstruction {
  throw new Error("Not implemented: ixCommitRun (requires on-chain program IDL)");
}
