import { PublicKey, TransactionInstruction } from "@solana/web3.js";
import { utf8, pda } from "../pdas";

export type RegistryProgram = {
  programId: PublicKey;
};

export function registryPda(programId: PublicKey): [PublicKey, number] {
  return pda(programId, [utf8("registry")]);
}

export function ixRegisterModule(_program: RegistryProgram, _params: {
  moduleHash: Buffer;
  authority: PublicKey;
}): TransactionInstruction {
  throw new Error("Not implemented: ixRegisterModule (requires on-chain program IDL)");
}
