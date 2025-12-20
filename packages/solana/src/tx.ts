import {
  Connection,
  Transaction,
  TransactionInstruction,
  sendAndConfirmTransaction,
  Signer,
  PublicKey,
} from "@solana/web3.js";

export type SendTxOptions = {
  feePayer: Signer;
  signers?: Signer[];
  preInstructions?: TransactionInstruction[];
  instructions: TransactionInstruction[];
  postInstructions?: TransactionInstruction[];
  commitment?: "processed" | "confirmed" | "finalized";
};

export async function sendTx(conn: Connection, opts: SendTxOptions): Promise<string> {
  const tx = new Transaction();
  tx.feePayer = opts.feePayer.publicKey;

  for (const ix of opts.preInstructions ?? []) tx.add(ix);
  for (const ix of opts.instructions) tx.add(ix);
  for (const ix of opts.postInstructions ?? []) tx.add(ix);

  const sig = await sendAndConfirmTransaction(conn, tx, [opts.feePayer, ...(opts.signers ?? [])], {
    commitment: opts.commitment ?? "confirmed",
    maxRetries: 3,
  });
  return sig;
}

export async function getClusterVersion(conn: Connection): Promise<string> {
  const v = await conn.getVersion();
  return `${v["solana-core"]}`;
}

export async function assertAccountExists(conn: Connection, pubkey: PublicKey): Promise<void> {
  const info = await conn.getAccountInfo(pubkey, "confirmed");
  if (!info) throw new Error(`Account not found: ${pubkey.toBase58()}`);
}
