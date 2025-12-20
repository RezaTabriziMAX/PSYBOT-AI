/* eslint-disable no-console */
/**
 * Nuttoo test wallet generator
 *
 * Purpose:
 * - Generate multiple Solana keypairs for local/dev testing
 * - Store them under a deterministic directory (default: storage/local/solana-keys/test-wallets)
 * - Optionally fund them via `solana airdrop` (localnet/devnet)
 *
 * Requirements:
 * - Solana CLI installed (solana-keygen, solana)
 *
 * Usage:
 *   node --loader ts-node/esm scripts/solana/create-test-wallets.ts
 *
 * Examples:
 *   node --loader ts-node/esm scripts/solana/create-test-wallets.ts --count 10
 *   node --loader ts-node/esm scripts/solana/create-test-wallets.ts --count 20 --prefix dev
 *   node --loader ts-node/esm scripts/solana/create-test-wallets.ts --count 5 --fund --amount 2
 *   node --loader ts-node/esm scripts/solana/create-test-wallets.ts --count 5 --fund --amount 50 --url http://127.0.0.1:8899
 *
 * Options:
 *   --out <dir>           Output directory
 *   --count <n>           Number of wallets to create (default: 5)
 *   --prefix <name>       File prefix for wallets (default: wallet)
 *   --force               Overwrite existing wallet files
 *   --fund                Airdrop SOL to each generated wallet
 *   --amount <n>          SOL amount per wallet (default: 2)
 *   --url <rpc>           RPC URL (passed to solana)
 *   --keypair <path>      Signer keypair for airdrop requests (passed to solana)
 *   --commitment <c>      processed|confirmed|finalized (default: confirmed)
 *   --sleep <ms>          Sleep between airdrops (default: 250)
 *   --print               Print wallet pubkeys and file paths
 *   --json                Print machine-readable JSON to stdout
 *
 * Notes:
 * - For localnet: use `scripts/solana/init-localnet.sh` first and then run with `--fund --amount 50`.
 * - This script does not require any JS Solana libraries; it delegates to Solana CLI tools.
 */

import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { spawnSync } from "node:child_process";

type Args = {
  outDir: string;
  count: number;
  prefix: string;
  force: boolean;
  fund: boolean;
  amount: string;
  url?: string;
  keypair?: string;
  commitment: string;
  sleepMs: number;
  print: boolean;
  json: boolean;
};

type WalletRecord = {
  name: string;
  file: string;
  pubkey: string;
};

function die(msg: string): never {
  console.error(`[create-test-wallets] error: ${msg}`);
  process.exit(1);
}

function log(msg: string): void {
  console.log(`[create-test-wallets] ${msg}`);
}

function hasCmd(cmd: string): boolean {
  const r = spawnSync(cmd, ["--version"], { stdio: "ignore", shell: false });
  return r.status === 0;
}

function run(cmd: string, args: string[], opts?: { quiet?: boolean }): { ok: boolean; out: string } {
  const r = spawnSync(cmd, args, { encoding: "utf8" });
  const out = (r.stdout ?? "") + (r.stderr ?? "");
  if (!opts?.quiet) {
    // Intentionally not printing command by default to keep output clean
  }
  return { ok: r.status === 0, out };
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function parseArgs(argv: string[]): Args {
  const home = os.homedir();
  const defaults: Args = {
    outDir: path.join(process.cwd(), "storage", "local", "solana-keys", "test-wallets"),
    count: 5,
    prefix: "wallet",
    force: false,
    fund: false,
    amount: "2",
    commitment: "confirmed",
    sleepMs: 250,
    print: false,
    json: false
  };

  // Silence unused var warning; keep home for future improvements
  void home;

  for (let i = 0; i < argv.length; i++) {
    const a = argv[i] ?? "";
    if (a === "--out") {
      const v = argv[++i];
      if (!v) die("Missing value for --out");
      defaults.outDir = v;
      continue;
    }
    if (a === "--count") {
      const v = argv[++i];
      if (!v) die("Missing value for --count");
      const n = Number(v);
      if (!Number.isFinite(n) || !Number.isInteger(n) || n <= 0 || n > 500) die("Invalid --count (1..500)");
      defaults.count = n;
      continue;
    }
    if (a === "--prefix") {
      const v = argv[++i];
      if (!v) die("Missing value for --prefix");
      defaults.prefix = v;
      continue;
    }
    if (a === "--force") {
      defaults.force = true;
      continue;
    }
    if (a === "--fund") {
      defaults.fund = true;
      continue;
    }
    if (a === "--amount") {
      const v = argv[++i];
      if (!v) die("Missing value for --amount");
      defaults.amount = v;
      continue;
    }
    if (a === "--url") {
      const v = argv[++i];
      if (!v) die("Missing value for --url");
      defaults.url = v;
      continue;
    }
    if (a === "--keypair") {
      const v = argv[++i];
      if (!v) die("Missing value for --keypair");
      defaults.keypair = v;
      continue;
    }
    if (a === "--commitment") {
      const v = argv[++i];
      if (!v) die("Missing value for --commitment");
      defaults.commitment = v;
      continue;
    }
    if (a === "--sleep") {
      const v = argv[++i];
      if (!v) die("Missing value for --sleep");
      const n = Number(v);
      if (!Number.isFinite(n) || n < 0 || n > 60000) die("Invalid --sleep (0..60000)");
      defaults.sleepMs = Math.floor(n);
      continue;
    }
    if (a === "--print") {
      defaults.print = true;
      continue;
    }
    if (a === "--json") {
      defaults.json = true;
      continue;
    }
    if (a === "-h" || a === "--help") {
      console.log(`
Usage:
  node --loader ts-node/esm scripts/solana/create-test-wallets.ts [options]

Options:
  --out <dir>           Output directory
  --count <n>           Number of wallets (default: 5)
  --prefix <name>       File prefix (default: wallet)
  --force               Overwrite existing files
  --fund                Airdrop SOL to each wallet
  --amount <n>          SOL per wallet (default: 2)
  --url <rpc>           RPC URL override
  --keypair <path>      Signer keypair override
  --commitment <c>      Commitment (default: confirmed)
  --sleep <ms>          Sleep between airdrops (default: 250)
  --print               Print results
  --json                Print JSON output
      `.trim());
      process.exit(0);
    }
    die(`Unknown argument: ${a}`);
  }

  return defaults;
}

function buildSolanaArgs(base: Args): string[] {
  const args: string[] = [];
  if (base.url) args.push("--url", base.url);
  if (base.keypair) args.push("--keypair", base.keypair);
  return args;
}

function ensureDir(dir: string): void {
  fs.mkdirSync(dir, { recursive: true });
}

function walletFile(outDir: string, prefix: string, idx: number): string {
  const n = String(idx).padStart(3, "0");
  return path.join(outDir, `${prefix}-${n}.json`);
}

function generateWallet(file: string, force: boolean): void {
  if (fs.existsSync(file)) {
    if (!force) die(`File already exists: ${file} (use --force to overwrite)`);
    fs.rmSync(file, { force: true });
  }

  const r = run("solana-keygen", ["new", "--no-bip39-passphrase", "--outfile", file, "--silent"]);
  if (!r.ok) die(`solana-keygen failed for ${file}\n${r.out}`);
}

function readPubkey(file: string): string {
  const r = run("solana-keygen", ["pubkey", file]);
  if (!r.ok) die(`solana-keygen pubkey failed for ${file}\n${r.out}`);
  return r.out.trim().split(/\r?\n/).pop() ?? "";
}

async function fundWallet(pubkey: string, base: Args): Promise<void> {
  const solanaArgs = buildSolanaArgs(base);
  const cmdArgs = [...solanaArgs, "airdrop", base.amount, pubkey, "--commitment", base.commitment];
  const r = run("solana", cmdArgs, { quiet: true });
  if (!r.ok) {
    throw new Error(`airdrop failed for ${pubkey}\n${r.out}`);
  }
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));

  if (!hasCmd("solana-keygen")) die("solana-keygen not found (install Solana CLI first)");
  if (!hasCmd("solana")) die("solana not found (install Solana CLI first)");

  const outDirAbs = path.isAbsolute(args.outDir) ? args.outDir : path.join(process.cwd(), args.outDir);
  ensureDir(outDirAbs);

  log(`outDir=${outDirAbs}`);
  log(`count=${args.count} prefix=${args.prefix}`);
  if (args.fund) {
    log(`funding enabled amount=${args.amount} commitment=${args.commitment}`);
    if (args.url) log(`rpc=${args.url}`);
    if (args.keypair) log(`signer=${args.keypair}`);
  }

  const wallets: WalletRecord[] = [];

  for (let i = 1; i <= args.count; i++) {
    const file = walletFile(outDirAbs, args.prefix, i);
    generateWallet(file, args.force);
    const pubkey = readPubkey(file);
    wallets.push({ name: path.basename(file, ".json"), file, pubkey });

    if (args.print && !args.json) {
      console.log(`${wallets[wallets.length - 1].name} ${pubkey} ${file}`);
    }
  }

  if (args.fund) {
    for (const w of wallets) {
      log(`airdrop -> ${w.pubkey}`);
      try {
        await fundWallet(w.pubkey, args);
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        die(msg);
      }
      if (args.sleepMs > 0) await sleep(args.sleepMs);
    }
  }

  if (args.json) {
    console.log(JSON.stringify({ outDir: outDirAbs, wallets }, null, 2));
  } else if (!args.print) {
    log(`generated ${wallets.length} wallets`);
    log(`example: solana balance ${wallets[0]?.pubkey ?? ""}`.trim());
  }

  log("done");
}

main().catch((e) => {
  const msg = e instanceof Error ? e.stack || e.message : String(e);
  die(msg);
});
