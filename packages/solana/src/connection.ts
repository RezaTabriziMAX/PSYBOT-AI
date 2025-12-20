import { Connection, Commitment } from "@solana/web3.js";

export type SolanaConnectionOptions = {
  rpcUrl: string;
  commitment?: Commitment;
  wsEndpoint?: string;
};

export function createConnection(opts: SolanaConnectionOptions): Connection {
  return new Connection(opts.rpcUrl, {
    commitment: opts.commitment ?? "confirmed",
    wsEndpoint: opts.wsEndpoint,
    confirmTransactionInitialTimeout: 60_000,
  });
}
