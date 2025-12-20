export type WalletState = {
  connected: boolean;
  publicKey?: string;
};

type PhantomProvider = {
  isPhantom?: boolean;
  connect: () => Promise<{ publicKey: { toString(): string } }>;
  disconnect: () => Promise<void>;
  publicKey?: { toString(): string };
  on?: (event: string, handler: (...args: any[]) => void) => void;
};

export function getPhantom(): PhantomProvider | null {
  const w = globalThis as any;
  const p = w?.solana as PhantomProvider | undefined;
  if (p && p.isPhantom) return p;
  return null;
}

export async function connectWallet(): Promise<WalletState> {
  const p = getPhantom();
  if (!p) return { connected: false };
  const res = await p.connect();
  const pk = res.publicKey?.toString?.() ?? p.publicKey?.toString?.();
  return { connected: true, publicKey: pk };
}

export async function disconnectWallet(): Promise<void> {
  const p = getPhantom();
  if (!p) return;
  await p.disconnect();
}
