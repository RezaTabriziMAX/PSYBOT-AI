/* eslint-disable no-console */
/**
 * Nuttoo CI version helper
 *
 * Purpose:
 * - Compute a CI-friendly version string for builds, images, artifacts
 * - Provide deterministic output for GitHub Actions / CI systems
 * - Optionally write VERSION files for packages/apps
 *
 * Outputs:
 * - SemVer-like version, e.g.:
 *     0.1.0-dev.123+gabcdef1
 *     0.1.0-ci.456+gabcdef1
 *     0.1.0+gabcdef1
 *
 * Sources (priority):
 * - --base <semver> or package.json version
 * - git commit SHA
 * - CI run number envs when available
 *
 * Usage:
 *   node --loader ts-node/esm scripts/ci/version.ts
 *
 * Examples:
 *   node --loader ts-node/esm scripts/ci/version.ts --print
 *   node --loader ts-node/esm scripts/ci/version.ts --write
 *   node --loader ts-node/esm scripts/ci/version.ts --base 0.2.0 --tag ci --write --out VERSION
 *
 * Options:
 *   --base <semver>        Base version (default: root package.json version)
 *   --tag <dev|ci|release> Pre-release tag (default: dev)
 *   --out <file>           Output file path (default: VERSION)
 *   --write                Write version to file (in repo root, and optionally targets)
 *   --targets <a,b,c>      Comma-separated list of directories to also write VERSION in
 *   --print                Print computed version to stdout
 *   --json                 Print JSON object { version, sha, base, tag, build }
 *   --strict               Fail if git is unavailable or SHA cannot be determined
 *
 * Environment inputs:
 * - GITHUB_SHA, GITHUB_RUN_NUMBER
 * - CI, BUILD_NUMBER, RUN_NUMBER
 */

import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

type Tag = "dev" | "ci" | "release";

type Args = {
  base?: string;
  tag: Tag;
  outFile: string;
  write: boolean;
  targets: string[];
  print: boolean;
  json: boolean;
  strict: boolean;
};

type VersionInfo = {
  version: string;
  base: string;
  tag: Tag;
  sha: string;
  build: string;
};

function die(msg: string): never {
  console.error(`[ci-version] error: ${msg}`);
  process.exit(1);
}

function log(msg: string): void {
  console.log(`[ci-version] ${msg}`);
}

function parseArgs(argv: string[]): Args {
  const args: Args = {
    base: undefined,
    tag: "dev",
    outFile: "VERSION",
    write: false,
    targets: [],
    print: true,
    json: false,
    strict: false
  };

  for (let i = 0; i < argv.length; i++) {
    const a = argv[i] ?? "";
    if (a === "--base") {
      const v = argv[++i];
      if (!v) die("Missing value for --base");
      args.base = v;
      continue;
    }
    if (a === "--tag") {
      const v = argv[++i] as Tag | undefined;
      if (!v) die("Missing value for --tag");
      if (v !== "dev" && v !== "ci" && v !== "release") die(`Invalid tag: ${v}`);
      args.tag = v;
      continue;
    }
    if (a === "--out") {
      const v = argv[++i];
      if (!v) die("Missing value for --out");
      args.outFile = v;
      continue;
    }
    if (a === "--write") {
      args.write = true;
      continue;
    }
    if (a === "--targets") {
      const v = argv[++i];
      if (!v) die("Missing value for --targets");
      args.targets = v.split(",").map((s) => s.trim()).filter(Boolean);
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
    if (a === "--json") {
      args.json = true;
      continue;
    }
    if (a === "--strict") {
      args.strict = true;
      continue;
    }
    if (a === "-h" || a === "--help") {
      console.log(`
Usage:
  node --loader ts-node/esm scripts/ci/version.ts [options]

Options:
  --base <semver>        Base version (default: root package.json version)
  --tag <dev|ci|release> Tag to use (default: dev)
  --out <file>           Output file name (default: VERSION)
  --write                Write version file(s)
  --targets <a,b,c>      Also write to these directories
  --print / --no-print   Print to stdout (default: print)
  --json                 Output JSON
  --strict               Fail if git SHA is missing
      `.trim());
      process.exit(0);
    }
    die(`Unknown argument: ${a}`);
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

function readPackageJsonVersion(repoRoot: string): string {
  const pkgPath = path.join(repoRoot, "package.json");
  if (!fs.existsSync(pkgPath)) die(`package.json not found at ${pkgPath}`);
  const raw = fs.readFileSync(pkgPath, "utf8");
  const json = JSON.parse(raw) as { version?: string };
  const v = json.version;
  if (!v) die("package.json version is missing");
  return v;
}

function gitShaShort(): string {
  // Prefer CI env first
  const envSha = process.env.GITHUB_SHA || process.env.CI_COMMIT_SHA || process.env.COMMIT_SHA;
  if (envSha && envSha.length >= 7) return envSha.slice(0, 7);

  const r = spawnSync("git", ["rev-parse", "--short=7", "HEAD"], { encoding: "utf8" });
  if (r.status === 0) {
    const out = (r.stdout ?? "").trim();
    if (out) return out;
  }
  return "";
}

function buildNumber(): string {
  // Prefer GitHub Actions
  const gh = process.env.GITHUB_RUN_NUMBER;
  if (gh && /^[0-9]+$/.test(gh)) return gh;

  const envs = [process.env.BUILD_NUMBER, process.env.RUN_NUMBER, process.env.CI_PIPELINE_IID];
  for (const v of envs) {
    if (v && /^[0-9]+$/.test(v)) return v;
  }
  return "";
}

function normalizeBase(v: string): string {
  // Very light semver validation: X.Y.Z
  const m = v.match(/^(\d+)\.(\d+)\.(\d+)(?:.*)?$/);
  if (!m) die(`Invalid base version (expected X.Y.Z): ${v}`);
  return `${m[1]}.${m[2]}.${m[3]}`;
}

function computeVersion(base: string, tag: Tag, sha: string, build: string): string {
  // release: base + build metadata
  // dev/ci: base + pre-release + build metadata
  const meta = sha ? `+g${sha}` : "";
  if (tag === "release") {
    return `${base}${meta}`;
  }

  const b = build ? build : "0";
  return `${base}-${tag}.${b}${meta}`;
}

function writeFileSafe(filePath: string, content: string): void {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content, "utf8");
}

function main(): void {
  const args = parseArgs(process.argv.slice(2));
  const repoRoot = findRepoRoot(process.cwd());

  const base = normalizeBase(args.base ?? readPackageJsonVersion(repoRoot));
  const sha = gitShaShort();
  const build = buildNumber();

  if (args.strict && !sha) {
    die("Unable to determine git SHA (set GITHUB_SHA or run inside a git repo)");
  }

  const version = computeVersion(base, args.tag, sha, build);

  const infoObj: VersionInfo = {
    version,
    base,
    tag: args.tag,
    sha,
    build
  };

  if (args.json) {
    console.log(JSON.stringify(infoObj, null, 2));
  } else if (args.print) {
    console.log(version);
  }

  if (args.write) {
    const rootOut = path.join(repoRoot, args.outFile);
    writeFileSafe(rootOut, version + "\n");
    log(`wrote ${rootOut}`);

    for (const t of args.targets) {
      const abs = path.isAbsolute(t) ? t : path.join(repoRoot, t);
      const out = path.join(abs, args.outFile);
      writeFileSafe(out, version + "\n");
      log(`wrote ${out}`);
    }
  }
}

main();
