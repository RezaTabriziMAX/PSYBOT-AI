/* eslint-disable no-console */
/**
 * Nuttoo prod env generator
 *
 * Purpose:
 * - Generate a production-ready `.env.production` (or any output path)
 * - Enforce required keys (fail fast)
 * - Avoid unsafe defaults for production (no localhost DB by default)
 * - Support deterministic generation for CI via provided secrets
 *
 * Usage examples:
 *   node --loader ts-node/esm scripts/env/gen-prod-env.ts --out .env.production --set NODE_ENV=production
 *   node --loader ts-node/esm scripts/env/gen-prod-env.ts --out .env.production \
 *     --set DATABASE_URL=postgresql://user:pass@host:5432/nuttoo \
 *     --set REDIS_URL=redis://host:6379 \
 *     --set JWT_SECRET=... \
 *     --set API_KEY_SALT=...
 *
 * Arguments:
 *   --out <path>               Output file (default: .env.production)
 *   --force                    Overwrite output file
 *   --merge                    Merge with existing output file (default: false for prod)
 *   --set KEY=VALUE            Apply overrides (can be repeated)
 *   --print                    Print resulting env to stdout (still writes unless --dry-run)
 *   --dry-run                  Do not write, only print
 *   --allow-localhost          Allow localhost database/redis URLs (not recommended)
 *   --no-secrets               Do not generate secrets; require user to provide them
 *   --require KEY              Add custom required keys (can be repeated)
 *
 * Exit:
 *   Non-zero on missing required variables or unsafe config.
 */

import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import crypto from "node:crypto";

type KV = Record<string, string>;

type Args = {
  outPath: string;
  force: boolean;
  merge: boolean;
  print: boolean;
  dryRun: boolean;
  allowLocalhost: boolean;
  noSecrets: boolean;
  overrides: KV;
  requiredExtra: string[];
};

function die(msg: string): never {
  console.error(`[gen-prod-env] error: ${msg}`);
  process.exit(1);
}

function log(msg: string): void {
  console.log(`[gen-prod-env] ${msg}`);
}

function randomSecret(bytes = 32): string {
  return crypto.randomBytes(bytes).toString("hex");
}

function parseArgs(argv: string[]): Args {
  const args: Args = {
    outPath: ".env.production",
    force: false,
    merge: false, // prod defaults to non-merge for safety
    print: false,
    dryRun: false,
    allowLocalhost: false,
    noSecrets: false,
    overrides: {},
    requiredExtra: []
  };

  for (let i = 0; i < argv.length; i++) {
    const a = argv[i] ?? "";
    if (a === "--out") {
      const v = argv[++i];
      if (!v) die("Missing value for --out");
      args.outPath = v;
      continue;
    }
    if (a === "--force") {
      args.force = true;
      continue;
    }
    if (a === "--merge") {
      args.merge = true;
      continue;
    }
    if (a === "--print") {
      args.print = true;
      continue;
    }
    if (a === "--dry-run") {
      args.dryRun = true;
      continue;
    }
    if (a === "--allow-localhost") {
      args.allowLocalhost = true;
      continue;
    }
    if (a === "--no-secrets") {
      args.noSecrets = true;
      continue;
    }
    if (a === "--require") {
      const v = argv[++i];
      if (!v) die("Missing value for --require");
      args.requiredExtra.push(v);
      continue;
    }
    if (a === "--set") {
      const kv = argv[++i];
      if (!kv) die("Missing value for --set KEY=VALUE");
      const idx = kv.indexOf("=");
      if (idx <= 0) die(`Invalid --set format: ${kv}`);
      const key = kv.slice(0, idx).trim();
      const value = kv.slice(idx + 1).trim();
      if (!key) die(`Invalid --set key: ${kv}`);
      args.overrides[key] = value;
      continue;
    }

    // Allow bare KEY=VALUE for convenience
    if (a.includes("=") && !a.startsWith("--")) {
      const idx = a.indexOf("=");
      const key = a.slice(0, idx).trim();
      const value = a.slice(idx + 1).trim();
      if (key) args.overrides[key] = value;
      continue;
    }

    die(`Unknown argument: ${a}`);
  }

  return args;
}

function parseEnvFile(content: string): KV {
  const out: KV = {};
  const lines = content.split(/\r?\n/);

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    if (trimmed.startsWith("#")) continue;

    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;

    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1);

    value = value.trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    if (key) out[key] = value;
  }

  return out;
}

function serializeEnvFile(kv: KV): string {
  const preferredOrder = [
    "NODE_ENV",
    "NUTTOO_NAME",
    "NUTTOO_TICKER",
    "PUBLIC_BASE_URL",
    "NUTTOO_API_PORT",
    "NUTTOO_WEB_PORT",
    "CORS_ORIGIN",
    "DATABASE_URL",
    "REDIS_URL",
    "JWT_SECRET",
    "API_KEY_SALT",
    "LOG_LEVEL"
  ];

  const keys = Object.keys(kv);
  const preferred = preferredOrder.filter((k) => keys.includes(k));
  const remaining = keys
    .filter((k) => !preferred.includes(k))
    .sort((a, b) => a.localeCompare(b));

  const ordered = [...preferred, ...remaining];

  const header = [
    "# Auto-generated by scripts/env/gen-prod-env.ts",
    "# Production environment file",
    "# Do not commit secrets.",
    `# Generated at: ${new Date().toISOString()}`,
    ""
  ].join("\n");

  const body = ordered
    .map((k) => {
      const v = kv[k] ?? "";
      const needsQuotes = /[\s#]/.test(v) || v.includes('"');
      if (!needsQuotes) return `${k}=${v}`;
      const escaped = v.replace(/"/g, '\\"');
      return `${k}="${escaped}"`;
    })
    .join("\n");

  return `${header}${body}\n`;
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

function looksLikeLocalhost(url: string): boolean {
  const u = url.toLowerCase();
  return (
    u.includes("localhost") ||
    u.includes("127.0.0.1") ||
    u.includes("0.0.0.0")
  );
}

function mergeEnv(base: KV, incoming: KV): KV {
  return { ...base, ...incoming };
}

function requiredKeys(base: string[], extra: string[]): string[] {
  const set = new Set<string>();
  for (const k of base) set.add(k);
  for (const k of extra) set.add(k);
  return Array.from(set);
}

function ensureRequired(env: KV, keys: string[]): void {
  const missing: string[] = [];
  for (const k of keys) {
    const v = env[k];
    if (!v || v.trim().length === 0) missing.push(k);
  }
  if (missing.length > 0) {
    die(`Missing required keys: ${missing.join(", ")}`);
  }
}

function buildProdBase(repoRoot: string): KV {
  // No unsafe infra defaults here; use placeholders the user must override.
  // The generator will enforce they are set.
  return {
    NODE_ENV: "production",
    NUTTOO_NAME: "Nuttoo",
    NUTTOO_TICKER: "NUTTOO",
    LOG_LEVEL: "info",

    // Public base URL used for callbacks, links, and CORS setup.
    // Example: https://nuttoo.example
    PUBLIC_BASE_URL: "",

    // Ports are deployment-specific; safe defaults are fine if you are behind a proxy.
    NUTTOO_API_PORT: "8787",
    NUTTOO_WEB_PORT: "5173",

    // CORS origin should match your public UI origin.
    // Example: https://nuttoo.example
    CORS_ORIGIN: "",

    // Must be provided for prod.
    DATABASE_URL: "",
    REDIS_URL: "",

    // Secrets must be provided for prod; may be generated if not --no-secrets.
    JWT_SECRET: "",
    API_KEY_SALT: "",

    // Useful metadata
    NUTTOO_REPO_ROOT: repoRoot,
    NUTTOO_MACHINE: os.hostname()
  };
}

function applySecrets(env: KV, noSecrets: boolean): KV {
  if (noSecrets) return env;

  const next = { ...env };
  if (!next.JWT_SECRET) next.JWT_SECRET = randomSecret(32);
  if (!next.API_KEY_SALT) next.API_KEY_SALT = randomSecret(16);
  return next;
}

function validateProd(env: KV, allowLocalhost: boolean): void {
  if (env.NODE_ENV !== "production") {
    die(`NODE_ENV must be "production" (got: ${env.NODE_ENV || "(empty)"})`);
  }

  if (!env.PUBLIC_BASE_URL) {
    die("PUBLIC_BASE_URL is required (example: https://nuttoo.example)");
  }

  if (!env.CORS_ORIGIN) {
    die("CORS_ORIGIN is required (example: https://nuttoo.example)");
  }

  if (!allowLocalhost) {
    if (looksLikeLocalhost(env.DATABASE_URL)) {
      die("DATABASE_URL looks like localhost; use a real database host or pass --allow-localhost");
    }
    if (looksLikeLocalhost(env.REDIS_URL)) {
      die("REDIS_URL looks like localhost; use a real redis host or pass --allow-localhost");
    }
  }

  // Basic secret quality checks (lightweight)
  if ((env.JWT_SECRET ?? "").length < 32) {
    die("JWT_SECRET is too short (min 32 chars recommended)");
  }
  if ((env.API_KEY_SALT ?? "").length < 16) {
    die("API_KEY_SALT is too short (min 16 chars recommended)");
  }
}

function main(): void {
  const args = parseArgs(process.argv.slice(2));
  const repoRoot = findRepoRoot(process.cwd());

  const absOut = path.isAbsolute(args.outPath)
    ? args.outPath
    : path.join(repoRoot, args.outPath);

  log(`repoRoot=${repoRoot}`);
  log(`out=${absOut}`);

  if (fs.existsSync(absOut) && !args.force && !args.merge) {
    die(`Output already exists. Use --force to overwrite or --merge to merge: ${absOut}`);
  }

  let env = buildProdBase(repoRoot);

  if (args.merge && fs.existsSync(absOut)) {
    const existing = parseEnvFile(fs.readFileSync(absOut, "utf8"));
    env = mergeEnv(env, existing);
    log(`merged existing env with ${Object.keys(existing).length} keys`);
  }

  // Apply generated secrets (unless disabled)
  env = applySecrets(env, args.noSecrets);

  // Apply overrides last
  env = mergeEnv(env, args.overrides);

  // Enforce required keys
  const required = requiredKeys(
    ["NODE_ENV", "PUBLIC_BASE_URL", "CORS_ORIGIN", "DATABASE_URL", "REDIS_URL", "JWT_SECRET", "API_KEY_SALT"],
    args.requiredExtra
  );
  ensureRequired(env, required);

  // Validate prod safety
  validateProd(env, args.allowLocalhost);

  const output = serializeEnvFile(env);

  if (args.print || args.dryRun) {
    console.log(output);
  }

  if (!args.dryRun) {
    fs.mkdirSync(path.dirname(absOut), { recursive: true });
    fs.writeFileSync(absOut, output, "utf8");
    log(`wrote ${Object.keys(env).length} keys`);
  } else {
    log("dry-run complete, no files written");
  }

  log("done");
}

main();
