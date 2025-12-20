/* eslint-disable no-console */
/**
 * Nuttoo database reset script
 *
 * Purpose:
 * - Reset database to a clean state for local/dev usage
 * - Optionally re-apply schema/migrations (Prisma) and re-seed
 *
 * Assumptions:
 * - Prisma is used
 * - schema path: packages/db/prisma/schema.prisma
 * - DATABASE_URL is set
 *
 * Usage:
 *   node --loader ts-node/esm scripts/db/reset.ts
 *   pnpm ts-node scripts/db/reset.ts
 *
 * Flags:
 *   --schema <path>     Prisma schema path (default: packages/db/prisma/schema.prisma)
 *   --migrate           Run `prisma migrate deploy` after reset
 *   --push              Run `prisma db push` after reset
 *   --seed              Run `scripts/db/seed.ts` after reset
 *   --force             Do not prompt
 *   --drop              Drop and recreate schema via Prisma (uses `prisma migrate reset`)
 *   --no-install-check  Skip checking pnpm/prisma availability
 *
 * Notes:
 * - In most dev cases, use:
 *     node --loader ts-node/esm scripts/db/reset.ts --drop --seed --force
 * - `--drop` uses Prisma's migrate reset which drops and recreates the database schema.
 */

import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

type Args = {
  schema: string;
  migrate: boolean;
  push: boolean;
  seed: boolean;
  force: boolean;
  drop: boolean;
  noInstallCheck: boolean;
};

function die(msg: string): never {
  console.error(`[db-reset] error: ${msg}`);
  process.exit(1);
}

function log(msg: string): void {
  console.log(`[db-reset] ${msg}`);
}

function run(cmd: string, args: string[], opts?: { quiet?: boolean }): void {
  const r = spawnSync(cmd, args, { stdio: opts?.quiet ? "ignore" : "inherit" });
  if (r.status !== 0) {
    die(`command failed: ${cmd} ${args.join(" ")}`);
  }
}

function hasCmd(cmd: string): boolean {
  const r = spawnSync(cmd, ["--version"], { stdio: "ignore" });
  return r.status === 0;
}

function parseArgs(argv: string[]): Args {
  const args: Args = {
    schema: "packages/db/prisma/schema.prisma",
    migrate: false,
    push: false,
    seed: false,
    force: false,
    drop: false,
    noInstallCheck: false
  };

  for (let i = 0; i < argv.length; i++) {
    const a = argv[i] ?? "";
    if (a === "--schema") {
      const v = argv[++i];
      if (!v) die("Missing value for --schema");
      args.schema = v;
      continue;
    }
    if (a === "--migrate") {
      args.migrate = true;
      continue;
    }
    if (a === "--push") {
      args.push = true;
      continue;
    }
    if (a === "--seed") {
      args.seed = true;
      continue;
    }
    if (a === "--force") {
      args.force = true;
      continue;
    }
    if (a === "--drop") {
      args.drop = true;
      continue;
    }
    if (a === "--no-install-check") {
      args.noInstallCheck = true;
      continue;
    }
    if (a === "-h" || a === "--help") {
      console.log(`
Usage:
  node --loader ts-node/esm scripts/db/reset.ts [options]

Options:
  --schema <path>     Prisma schema path (default: packages/db/prisma/schema.prisma)
  --drop              Use prisma migrate reset (drops schema)
  --migrate           Run prisma migrate deploy
  --push              Run prisma db push
  --seed              Run scripts/db/seed.ts afterwards
  --force             Do not prompt
  --no-install-check  Skip checking pnpm/prisma availability
      `.trim());
      process.exit(0);
    }
    die(`Unknown argument: ${a}`);
  }

  if (args.migrate && args.push) {
    die("Choose only one: --migrate or --push");
  }

  return args;
}

function findRepoRoot(startDir: string): string {
  let dir = path.resolve(startDir);
  for (let i = 0; i < 12; i++) {
    const ws = path.join(dir, "pnpm-workspace.yaml");
    const pkg = path.join(dir, "package.json");
    if (fs.existsSync(ws) && fs.existsSync(pkg)) return dir;
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return path.resolve(startDir);
}

function promptYesNo(question: string): Promise<boolean> {
  return new Promise((resolve) => {
    process.stdout.write(`${question} [y/N]: `);
    process.stdin.setEncoding("utf8");
    process.stdin.once("data", (data) => {
      const v = String(data).trim().toLowerCase();
      resolve(v === "y" || v === "yes");
    });
  });
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  const repoRoot = findRepoRoot(process.cwd());

  const schemaPath = path.isAbsolute(args.schema) ? args.schema : path.join(repoRoot, args.schema);
  if (!fs.existsSync(schemaPath)) {
    die(`schema file not found: ${schemaPath}`);
  }

  if (!process.env.DATABASE_URL) {
    die("DATABASE_URL is not set");
  }

  if (!args.noInstallCheck) {
    if (!hasCmd("pnpm")) die("pnpm not found");
    // Prisma is usually executed via pnpm, so we only check pnpm here.
  }

  log(`repoRoot=${repoRoot}`);
  log(`schema=${schemaPath}`);
  log(`drop=${args.drop} migrate=${args.migrate} push=${args.push} seed=${args.seed}`);

  if (!args.force) {
    const ok = await promptYesNo("This will reset your database. Continue?");
    if (!ok) {
      log("aborted");
      return;
    }
  }

  // Strategy:
  // - If --drop: use prisma migrate reset (destructive)
  // - Else: apply schema changes via migrate deploy or db push (non-destructive-ish)
  if (args.drop) {
    log("running prisma migrate reset");
    run("pnpm", ["-s", "prisma", "migrate", "reset", "--force", "--skip-seed", "--schema", schemaPath]);
  } else if (args.migrate) {
    log("running prisma migrate deploy");
    run("pnpm", ["-s", "prisma", "migrate", "deploy", "--schema", schemaPath]);
  } else if (args.push) {
    log("running prisma db push");
    run("pnpm", ["-s", "prisma", "db", "push", "--schema", schemaPath]);
  } else {
    // Safe default: db push for local dev if nothing specified
    log("no migration mode specified; defaulting to prisma db push");
    run("pnpm", ["-s", "prisma", "db", "push", "--schema", schemaPath]);
  }

  if (args.seed) {
    log("running seed script");
    // Prefer ts-node/esm style invocation through pnpm when available
    // Assumes workspace scripts include ts-node/tsx. If not, user can run seed manually.
    run("pnpm", ["-s", "ts-node", "scripts/db/seed.ts"]);
  }

  log("done");
}

main().catch((e) => {
  const msg = e instanceof Error ? e.stack || e.message : String(e);
  die(msg);
});
