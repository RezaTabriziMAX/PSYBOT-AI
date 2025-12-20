import { ComputeBudgetProgram, TransactionInstruction } from "@solana/web3.js";

export function setComputeUnitLimit(units: number): TransactionInstruction {
  return ComputeBudgetProgram.setComputeUnitLimit({ units });
}

export function setComputeUnitPrice(microLamports: number): TransactionInstruction {
  return ComputeBudgetProgram.setComputeUnitPrice({ microLamports });
}
