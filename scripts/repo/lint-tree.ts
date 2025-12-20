/* eslint-disable no-console */
/**
 * Nuttoo repository tree linter
 *
 * Purpose:
 * - Enforce repository structure rules (folders/files existence)
 * - Catch common mistakes before CI (missing scripts, wrong casing, accidental large files)
 * - Produce human-friendly output and CI-friendly exit codes
 *
 * Usage:
 *   node --loader ts-node/esm scripts/repo/lint-tree.ts
 *
 * Examples:
 *   node --loader ts-node/esm scripts/repo/lint-tree.ts --strict
 *   node --loader ts-node/esm scripts/repo/lint-tree.ts --max-file-mb 10
 *   node --loader ts-node/esm scripts/repo/lint-tree.ts --json
 *
 * Options:
 *   --root <dir>            Repo root (default: auto-detect)
 *   --strict                Treat warnings as failures
 *   --json                  Output JSON
 *   --max-file-mb <n>       Warn/fail if any file exceeds N MB (default: 25)
 *   --deny-ext <a,b,c>      Deny file extensions (default: .zip,.7z,.rar,.exe,.dll)
 *   --deny-name <a,b,c>     Deny file names (default: .env,.env.production)
 *   --require <path>        Require specific path to exist (can repeat)
 *   --deny <path>           Deny specific path to exist (can repeat)
 *   --print                 Print to stdout (default: true)
 *   --no-print              Disable stdout printing
 *
 * Exit codes:
 *   0 -> OK
 *   1 -> Warnings only
 *   2 -> Failures
 */

import fs from "node:fs";
import path from "node:path";

type Args = {
  root: string;
  strict: boolean;
  json: boolean;
  maxFileMb: number;
  denyExt: Set<string>;
  denyName: Set<string>;
  requirePaths: string[];
  denyPaths: string[];
  print: boolean;
};

type IssueLevel = "warn" | "fail";

type Issue = {
  level: IssueLevel;
  code: string;
  message: string;
  path?: string;
};

function die(msg: string): never {
  console.error(`[lint-tree] error: ${msg}`);
  process.exit(2);
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

function parseArgs(argv: string[]): Args {
  const args: Args = {
    root: "",
    strict: false,
    json: false,
    maxFileMb: 25,
    denyExt: new Set([".zip", ".7z", ".rar", ".exe", ".dll"]),
    denyName: new Set([".env", ".env.production"]),
    requirePaths: [],
    denyPaths: [],
    print: true
  };

  for (let i = 0; i < argv.length; i++) {
    const a = argv[i] ?? "";
    if (a === "--root") {
      const v = argv[++i];
      if (!v) die("Missing value for --root");
      args.root = v;
      continue;
    }
    if (a === "--strict") {
      args.strict = true;
      continue;
    }
    if (a === "--json") {
      args.json = true;
      continue;
    }
    if (a === "--max-file-mb") {
      const v = argv[++i];
      if (!v) die("Missing value for --max-file-mb");
      const n = Number(v);
      if (!Number.isFinite(n) || n <= 0) die("Invalid --max-file-mb");
      args.maxFileMb = n;
      continue;
    }
    if (a === "--deny-ext") {
      const v = argv[++i];
      if (!v) die("Missing value for --deny-ext");
      args.denyExt = new Set(
        v
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
          .map((s) => (s.startsWith(".") ? s : `.${s}`))
          .map((s) => s.toLowerCase())
      );
      continue;
    }
    if (a === "--deny-name") {
      const v = argv[++i];
      if (!v) die("Missing value for --deny-name");
      args.denyName = new Set(v.split(",").map((s) => s.trim()).filter(Boolean));
      continue;
    }
    if (a === "--require") {
      const v = argv[++i];
      if (!v) die("Missing value for --require");
      args.requirePaths.push(v);
      continue;
    }
    if (a === "--deny") {
      const v = argv[++i];
      if (!v) die("Missing value for --deny");
      args.denyPaths.push(v);
      continue;
    }
    if (a === "--print") {
      args.print = true;
      continue;
    }
    if (a === "--no-print") {
      args.print = false;
      continue;
    }
    if (a === "-h" || a === "--help") {
      console.log(`
Usage:
  node --loader ts-node/esm scripts/repo/lint-tree.ts [options]

Options:
  --root <dir>            Repo root (default: auto-detect)
  --strict                Treat warnings as failures
  --json                  Output JSON
  --max-file-mb <n>       Max file size MB (default: 25)
  --deny-ext <a,b,c>      Deny extensions
  --deny-name <a,b,c>     Deny exact filenames
  --require <path>        Require path to exist (repeatable)
  --deny <path>           Deny path to exist (repeatable)
  --print/--no-print      Control stdout printing
      `.trim());
      process.exit(0);
    }
    die(`Unknown argument: ${a}`);
  }

  if (!args.root) args.root = findRepoRoot(process.cwd());
  args.root = path.resolve(args.root);

  return args;
}

function rel(root: string, p: string): string {
  const r = path.relative(root, p);
  return r.length === 0 ? "." : r;
}

function exists(root: string, p: string): boolean {
  return fs.existsSync(path.join(root, p));
}

function isDir(p: string): boolean {
  try {
    return fs.statSync(p).isDirectory();
  } catch {
    return false;
  }
}

function walk(
  root: string,
  dir: string,
  onFile: (abs: string, st: fs.Stats) => void
): void {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    const abs = path.join(dir, e.name);
    if (e.isDirectory()) {
      walk(root, abs, onFile);
    } else if (e.isFile()) {
      const st = fs.statSync(abs);
      onFile(abs, st);
    }
  }
}

function defaultRequiredPaths(): string[] {
  return [
    "package.json",
    "pnpm-workspace.yaml",
    "scripts",
    "scripts/db",
    "scripts/env",
    "scripts/solana",
    "scripts/ci",
    "packages"
  ];
}

function lintStructure(args: Args): Issue[] {
  const issues: Issue[] = [];

  const req = Array.from(new Set([...defaultRequiredPaths(), ...args.requirePaths]));
  for (const p of req) {
    if (!exists(args.root, p)) {
      issues.push({
        level: "fail",
        code: "REQUIRED_MISSING",
        message: `required path is missing: ${p}`,
        path: p
      });
    }
  }

  for (const p of args.denyPaths) {
    if (exists(args.root, p)) {
      issues.push({
        level: "fail",
        code: "DENIED_PRESENT",
        message: `denied path exists: ${p}`,
        path: p
      });
    }
  }

  // Ensure scripts folders are directories when present
  const scriptDirs = ["scripts", "scripts/db", "scripts/env", "scripts/solana", "scripts/ci", "scripts/repo"];
  for (const p of scriptDirs) {
    const abs = path.join(args.root, p);
    if (fs.existsSync(abs) && !isDir(abs)) {
      issues.push({
        level: "fail",
        code: "EXPECTED_DIRECTORY",
        message: `expected directory but found file: ${p}`,
        path: p
      });
    }
  }

  return issues;
}

function lintFiles(args: Args): Issue[] {
  const issues: Issue[] = [];
  const maxBytes = Math.floor(args.maxFileMb * 1024 * 1024);

  walk(args.root, args.root, (abs, st) => {
    const name = path.basename(abs);
    const ext = path.extname(abs).toLowerCase();
    const r = rel(args.root, abs);

    if (args.denyName.has(name)) {
      issues.push({
        level: "fail",
        code: "DENY_NAME",
        message: `denied filename detected: ${name}`,
        path: r
      });
    }

    if (ext && args.denyExt.has(ext)) {
      issues.push({
        level: "fail",
        code: "DENY_EXT",
        message: `denied extension detected: ${ext}`,
        path: r
      });
    }

    if (st.size > maxBytes) {
      issues.push({
        level: "warn",
        code: "LARGE_FILE",
        message: `large file detected: ${(st.size / (1024 * 1024)).toFixed(2)} MB (limit ${args.maxFileMb} MB)`,
        path: r
      });
    }

    // Warn if binaries appear in repo unintentionally
    if (!ext && st.size > 0 && st.size < 1024 * 1024) {
      // no extension small files are OK; do nothing
    }
  });

  return issues;
}

function printIssues(issues: Issue[]): void {
  for (const i of issues) {
    const tag = i.level === "fail" ? "FAIL" : "WARN";
    const p = i.path ? ` (${i.path})` : "";
    console.log(`[lint-tree] ${tag} ${i.code}${p}: ${i.message}`);
  }
}

function main(): void {
  const args = parseArgs(process.argv.slice(2));

  const issues: Issue[] = [];
  issues.push(...lintStructure(args));
  issues.push(...lintFiles(args));

  const fails = issues.filter((i) => i.level === "fail");
  const warns = issues.filter((i) => i.level === "warn");

  if (args.json) {
    const out = {
      root: args.root,
      strict: args.strict,
      maxFileMb: args.maxFileMb,
      issues,
      summary: {
        warnings: warns.length,
        failures: fails.length
      }
    };
    console.log(JSON.stringify(out, null, 2));
    process.exit(fails.length > 0 ? 2 : warns.length > 0 ? (args.strict ? 2 : 1) : 0);
  }

  if (args.print) {
    console.log(`[lint-tree] root=${args.root}`);
    printIssues(issues);
    console.log(`[lint-tree] warnings=${warns.length} failures=${fails.length}`);
  }

  if (fails.length > 0) process.exit(2);
  if (warns.length > 0 && args.strict) process.exit(2);
  if (warns.length > 0) process.exit(1);
  process.exit(0);
}

main();
