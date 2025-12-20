/* eslint-disable no-console */
/**
 * Nuttoo env validator
 *
 * Purpose:
 * - Validate that required environment variables exist and look sane
 * - Support multiple target modes: dev / prod / docker
 * - Print actionable diagnostics and exit with appropriate code
 *
 * Usage:
 *   node --loader ts-node/esm scripts/env/validate-env.ts --mode dev
 *   node --loader ts-node/esm scripts/env/validate-env.ts --mode prod --file .env.production
 *
 * Arguments:
 *   --mode <dev|prod|docker>   Validation mode (default: dev)
 *   --file <path>             Env file to load (default: .env for dev/docker, .env.production for prod)
 *   --require KEY             Additional required key (can be repeated)
 *   --allow-empty KEY         Allow key to be present but empty (can be repeated)
 *   --allow-localhost         Allow localhost URLs for DB/Redis in prod
 *   --print                   Print loaded env map (redacts secrets)
 *   --strict                  Treat warnings as failures
 *
 * Exit codes:
 *   0 -> valid
 *   1 -> warnings present (non-fatal unless --strict)
 *   2 -> failures present
 */

import fs from "node:fs";
import path from "node:path";

type Mode = "dev" | "prod" | "docker";

type KV = Record<string, string>;

type Args = {
  mode: Mode;
  filePath: string;
  requiredExtra: string[];
  allowEmpty: Set<string>;
  allowLocalhost: boolean;
  print: boolean;
  strict: boolean;
};

type IssueLevel = "warn" | "fail";

type Issue = {
  level: IssueLevel;
  key?: string;
  message: string;
};

function die(msg: string): never {
  console.error(`[validate-env] error: ${msg}`);
  process.exit(2);
}

function log(msg: string): void {
  console.log(`[validate-env] ${msg}`);
}

function parseArgs(argv: string[]): Args {
  let mode: Mode = "dev";
  let filePath = "";
  const requiredExtra: string[] = [];
  const allowEmpty: Set<string> = new Set();
  let allowLocalhost = false;
  let print = false;
  let strict = false;

  for (let i = 0; i < argv.length; i++) {
    const a = argv[i] ?? "";
    if (a === "--mode") {
      const v = argv[++i] as Mode | undefined;
      if (!v) die("Missing value for --mode");
      if (v !== "dev" && v !== "prod" && v !== "docker") die(`Invalid mode: ${v}`);
      mode = v;
      continue;
    }
    if (a === "--file") {
      const v = argv[++i];
      if (!v) die("Missing value for --file");
      filePath = v;
      continue;
    }
    if (a === "--require") {
      const v = argv[++i];
      if (!v) die("Missing value for --require");
      requiredExtra.push(v);
      continue;
    }
    if (a === "--allow-empty") {
      const v = argv[++i];
      if (!v) die("Missing value for --allow-empty");
      allowEmpty.add(v);
      continue;
    }
    if (a === "--allow-localhost") {
      allowLocalhost = true;
      continue;
    }
    if (a === "--print") {
      print = true;
      continue;
    }
    if (a === "--strict") {
      strict = true;
      continue;
    }
    die(`Unknown argument: ${a}`);
  }

  if (!filePath) {
    filePath = mode === "prod" ? ".env.production" : ".env";
  }

  return { mode, filePath, requiredExtra, allowEmpty, allowLocalhost, print, strict };
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
    let value = trimmed.slice(eq + 1).trim();

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

function mergeEnv(base: KV, incoming: KV): KV {
  return { ...base, ...incoming };
}

function redact(k: string, v: string): string {
  const key = k.toUpperCase();
  const isSecret =
    key.includes("SECRET") ||
    key.includes("TOKEN") ||
    key.includes("PASSWORD") ||
    key.includes("KEY") ||
    key.includes("SALT");

  if (!isSecret) return v;

  if (!v) return "";
  if (v.length <= 6) return "***";
  return `${v.slice(0, 3)}***${v.slice(-3)}`;
}

function looksLikeUrl(v: string): boolean {
  return /^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//.test(v);
}

function looksLikeHttpUrl(v: string): boolean {
  return /^https?:\/\//.test(v);
}

function looksLikeLocalhost(v: string): boolean {
  const s = v.toLowerCase();
  return s.includes("localhost") || s.includes("127.0.0.1") || s.includes("0.0.0.0");
}

function asInt(v: string): number | null {
  if (!v) return null;
  const n = Number(v);
  if (!Number.isFinite(n)) return null;
  if (!Number.isInteger(n)) return null;
  return n;
}

function requiredKeysForMode(mode: Mode): string[] {
  if (mode === "prod") {
    return [
      "NODE_ENV",
      "PUBLIC_BASE_URL",
      "CORS_ORIGIN",
      "DATABASE_URL",
      "REDIS_URL",
      "JWT_SECRET",
      "API_KEY_SALT"
    ];
  }

  // dev/docker
  return [
    "NODE_ENV",
    "NUTTOO_NAME",
    "NUTTOO_TICKER",
    "NUTTOO_API_PORT",
    "NUTTOO_WEB_PORT",
    "DATABASE_URL",
    "REDIS_URL",
    "CORS_ORIGIN"
  ];
}

function validate(env: KV, args: Args): Issue[] {
  const issues: Issue[] = [];

  const required = Array.from(new Set([...requiredKeysForMode(args.mode), ...args.requiredExtra]));
  for (const k of required) {
    const v = env[k];
    if (v === undefined) {
      issues.push({ level: "fail", key: k, message: `missing required key: ${k}` });
      continue;
    }
    if (!v && !args.allowEmpty.has(k)) {
      issues.push({ level: "fail", key: k, message: `empty value is not allowed: ${k}` });
      continue;
    }
  }

  // NODE_ENV
  if (env.NODE_ENV) {
    const v = env.NODE_ENV.toLowerCase();
    const ok = v === "development" || v === "production" || v === "test";
    if (!ok) issues.push({ level: "warn", key: "NODE_ENV", message: `unexpected NODE_ENV: ${env.NODE_ENV}` });
    if (args.mode === "prod" && v !== "production") {
      issues.push({ level: "fail", key: "NODE_ENV", message: `prod mode requires NODE_ENV=production` });
    }
  }

  // Ports
  if (env.NUTTOO_API_PORT) {
    const n = asInt(env.NUTTOO_API_PORT);
    if (n === null || n <= 0 || n > 65535) {
      issues.push({ level: "fail", key: "NUTTOO_API_PORT", message: `invalid port: ${env.NUTTOO_API_PORT}` });
    }
  }
  if (env.NUTTOO_WEB_PORT) {
    const n = asInt(env.NUTTOO_WEB_PORT);
    if (n === null || n <= 0 || n > 65535) {
      issues.push({ level: "fail", key: "NUTTOO_WEB_PORT", message: `invalid port: ${env.NUTTOO_WEB_PORT}` });
    }
  }

  // URLs
  const db = env.DATABASE_URL;
  if (db) {
    if (!looksLikeUrl(db)) {
      issues.push({ level: "fail", key: "DATABASE_URL", message: "DATABASE_URL must be a valid URL" });
    }
    if (args.mode === "prod" && !args.allowLocalhost && looksLikeLocalhost(db)) {
      issues.push({ level: "fail", key: "DATABASE_URL", message: "DATABASE_URL looks like localhost in prod" });
    }
  }

  const redis = env.REDIS_URL;
  if (redis) {
    if (!looksLikeUrl(redis)) {
      issues.push({ level: "fail", key: "REDIS_URL", message: "REDIS_URL must be a valid URL" });
    }
    if (args.mode === "prod" && !args.allowLocalhost && looksLikeLocalhost(redis)) {
      issues.push({ level: "fail", key: "REDIS_URL", message: "REDIS_URL looks like localhost in prod" });
    }
  }

  // CORS / public base
  if (env.CORS_ORIGIN) {
    const c = env.CORS_ORIGIN;
    if (!looksLikeHttpUrl(c)) {
      issues.push({ level: "fail", key: "CORS_ORIGIN", message: "CORS_ORIGIN must be http(s)://..." });
    }
    if (args.mode === "prod" && looksLikeLocalhost(c) && !args.allowLocalhost) {
      issues.push({ level: "warn", key: "CORS_ORIGIN", message: "CORS_ORIGIN looks like localhost in prod" });
    }
  }

  if (args.mode === "prod") {
    const p = env.PUBLIC_BASE_URL;
    if (p && !looksLikeHttpUrl(p)) {
      issues.push({ level: "fail", key: "PUBLIC_BASE_URL", message: "PUBLIC_BASE_URL must be http(s)://..." });
    }
  }

  // Secrets
  const jwt = env.JWT_SECRET;
  if (args.mode === "prod" && jwt) {
    if (jwt.length < 32) {
      issues.push({ level: "fail", key: "JWT_SECRET", message: "JWT_SECRET is too short (min 32 chars recommended)" });
    }
  }

  const salt = env.API_KEY_SALT;
  if (args.mode === "prod" && salt) {
    if (salt.length < 16) {
      issues.push({ level: "fail", key: "API_KEY_SALT", message: "API_KEY_SALT is too short (min 16 chars recommended)" });
    }
  }

  // Optional consistency checks (dev)
  if (args.mode !== "prod") {
    const apiPort = env.NUTTOO_API_PORT;
    const base = env.VITE_API_BASE_URL;
    if (apiPort && base && looksLikeHttpUrl(base)) {
      // Simple mismatch detection: base url port should match NUTTOO_API_PORT if present
      try {
        const u = new URL(base);
        const bp = u.port || (u.protocol === "https:" ? "443" : "80");
        if (bp !== String(apiPort)) {
          issues.push({
            level: "warn",
            key: "VITE_API_BASE_URL",
            message: `VITE_API_BASE_URL port (${bp}) does not match NUTTOO_API_PORT (${apiPort})`
          });
        }
      } catch {
        issues.push({ level: "fail", key: "VITE_API_BASE_URL", message: "VITE_API_BASE_URL is not a valid URL" });
      }
    }
  }

  return issues;
}

function printEnv(env: KV): void {
  const keys = Object.keys(env).sort((a, b) => a.localeCompare(b));
  for (const k of keys) {
    const v = env[k] ?? "";
    console.log(`${k}=${redact(k, v)}`);
  }
}

function main(): void {
  const args = parseArgs(process.argv.slice(2));
  const repoRoot = findRepoRoot(process.cwd());

  const absFile = path.isAbsolute(args.filePath)
    ? args.filePath
    : path.join(repoRoot, args.filePath);

  log(`mode=${args.mode}`);
  log(`file=${absFile}`);

  if (!fs.existsSync(absFile)) {
    die(`env file does not exist: ${absFile}`);
  }

  const fileEnv = parseEnvFile(fs.readFileSync(absFile, "utf8"));

  // Merge order: file -> process.env (process wins)
  const env: KV = mergeEnv(fileEnv, process.env as unknown as KV);

  if (args.print) {
    log("loaded env (redacted):");
    printEnv(env);
  }

  const issues = validate(env, args);
  const fails = issues.filter((i) => i.level === "fail");
  const warns = issues.filter((i) => i.level === "warn");

  for (const i of issues) {
    const prefix = i.level === "fail" ? "FAIL" : "WARN";
    const k = i.key ? ` (${i.key})` : "";
    console.log(`[validate-env] ${prefix}${k}: ${i.message}`);
  }

  log(`warnings=${warns.length} failures=${fails.length}`);

  if (fails.length > 0) process.exit(2);
  if (warns.length > 0 && args.strict) process.exit(2);
  if (warns.length > 0) process.exit(1);
  process.exit(0);
}

main();
