/* eslint-disable no-console */
/**
 * Nuttoo IDL exporter
 *
 * Purpose:
 * - Export Anchor IDLs from `target/idl` into a stable repo location:
 *     packages/solana/idls/
 * - Optionally export program key metadata (if available) alongside IDLs
 * - Validate JSON and produce an index file for consumers
 *
 * Assumptions:
 * - Anchor workspace lives under `programs/`
 * - `anchor build` has been run, producing `target/idl/*.json`
 *
 * Usage:
 *   node --loader ts-node/esm scripts/solana/export-idls.ts
 *
 * Examples:
 *   node --loader ts-node/esm scripts/solana/export-idls.ts --program nuttoo_registry
 *   node --loader ts-node/esm scripts/solana/export-idls.ts --out packages/solana/idls --force
 *   node --loader ts-node/esm scripts/solana/export-idls.ts --anchor-workspace programs --target target
 *
 * Options:
 *   --anchor-workspace <dir>   Anchor workspace dir (default: programs)
 *   --target <dir>             Anchor target dir (default: target) relative to workspace parent
 *   --out <dir>                Output directory (default: packages/solana/idls)
 *   --program <name>           Export only a single program (matches <name>.json)
 *   --force                    Overwrite output directory contents for selected files
 *   --clean                    Remove output directory before exporting
 *   --index                    Generate index.ts + index.json (default: true)
 *   --no-index                 Disable index generation
 *   --print                    Print summary
 *
 * Notes:
 * - This script does not run `anchor build` automatically by default.
 * - It is safe to run repeatedly; it will produce stable outputs.
 */

import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

type Args = {
  anchorWorkspaceDir: string;
  targetDir: string;
  outDir: string;
  program?: string;
  force: boolean;
  clean: boolean;
  makeIndex: boolean;
  print: boolean;
};

type IdlMeta = {
  name: string;
  idlFile: string;
  sha256: string;
};

function die(msg: string): never {
  console.error(`[export-idls] error: ${msg}`);
  process.exit(1);
}

function log(msg: string): void {
  console.log(`[export-idls] ${msg}`);
}

function parseArgs(argv: string[]): Args {
  const args: Args = {
    anchorWorkspaceDir: "programs",
    targetDir: "target",
    outDir: "packages/solana/idls",
    program: undefined,
    force: false,
    clean: false,
    makeIndex: true,
    print: false
  };

  for (let i = 0; i < argv.length; i++) {
    const a = argv[i] ?? "";
    if (a === "--anchor-workspace") {
      const v = argv[++i];
      if (!v) die("Missing value for --anchor-workspace");
      args.anchorWorkspaceDir = v;
      continue;
    }
    if (a === "--target") {
      const v = argv[++i];
      if (!v) die("Missing value for --target");
      args.targetDir = v;
      continue;
    }
    if (a === "--out") {
      const v = argv[++i];
      if (!v) die("Missing value for --out");
      args.outDir = v;
      continue;
    }
    if (a === "--program") {
      const v = argv[++i];
      if (!v) die("Missing value for --program");
      args.program = v;
      continue;
    }
    if (a === "--force") {
      args.force = true;
      continue;
    }
    if (a === "--clean") {
      args.clean = true;
      continue;
    }
    if (a === "--index") {
      args.makeIndex = true;
      continue;
    }
    if (a === "--no-index") {
      args.makeIndex = false;
      continue;
    }
    if (a === "--print") {
      args.print = true;
      continue;
    }
    if (a === "-h" || a === "--help") {
      console.log(`
Usage:
  node --loader ts-node/esm scripts/solana/export-idls.ts [options]

Options:
  --anchor-workspace <dir>   Anchor workspace dir (default: programs)
  --target <dir>             Target dir name (default: target)
  --out <dir>                Output dir (default: packages/solana/idls)
  --program <name>           Export only <name>.json
  --force                    Overwrite files
  --clean                    Remove output dir before export
  --index / --no-index       Enable/disable index generation
  --print                    Print summary
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

function sha256File(file: string): string {
  const r = spawnSync("shasum", ["-a", "256", file], { encoding: "utf8" });
  if (r.status === 0 && r.stdout) {
    return r.stdout.trim().split(/\s+/)[0] ?? "";
  }
  // Fallback if shasum is not available (Linux might use sha256sum)
  const r2 = spawnSync("sha256sum", [file], { encoding: "utf8" });
  if (r2.status === 0 && r2.stdout) {
    return r2.stdout.trim().split(/\s+/)[0] ?? "";
  }
  // Last resort: no hash available
  return "";
}

function ensureDir(dir: string): void {
  fs.mkdirSync(dir, { recursive: true });
}

function rmrf(p: string): void {
  fs.rmSync(p, { recursive: true, force: true });
}

function readJson(file: string): unknown {
  const raw = fs.readFileSync(file, "utf8");
  try {
    return JSON.parse(raw) as unknown;
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    die(`Invalid JSON: ${file} (${msg})`);
  }
}

function listIdlFiles(idlDir: string, program?: string): string[] {
  if (!fs.existsSync(idlDir)) return [];
  const files = fs
    .readdirSync(idlDir)
    .filter((f) => f.endsWith(".json"))
    .map((f) => path.join(idlDir, f));

  if (program) {
    const expected = path.join(idlDir, `${program}.json`);
    return files.filter((f) => path.resolve(f) === path.resolve(expected));
  }

  return files.sort((a, b) => a.localeCompare(b));
}

function writeIndex(outDir: string, metas: IdlMeta[]): void {
  const indexJsonPath = path.join(outDir, "index.json");
  const indexTsPath = path.join(outDir, "index.ts");

  const indexJson = {
    generatedAt: new Date().toISOString(),
    idls: metas
  };

  fs.writeFileSync(indexJsonPath, JSON.stringify(indexJson, null, 2) + "\n", "utf8");

  const lines: string[] = [];
  lines.push("/* eslint-disable */");
  lines.push("// Auto-generated by scripts/solana/export-idls.ts");
  lines.push("");

  for (const m of metas) {
    const base = path.basename(m.idlFile);
    const varName = m.name.replace(/[^a-zA-Z0-9_]/g, "_");
    lines.push(`import ${varName} from "./${base}" assert { type: "json" };`);
  }

  lines.push("");
  lines.push("export const idls = {");
  for (const m of metas) {
    const varName = m.name.replace(/[^a-zA-Z0-9_]/g, "_");
    lines.push(`  ${JSON.stringify(m.name)}: ${varName},`);
  }
  lines.push("} as const;");
  lines.push("");
  lines.push("export type IdlName = keyof typeof idls;");
  lines.push("");

  fs.writeFileSync(indexTsPath, lines.join("\n") + "\n", "utf8");
}

function copyFile(src: string, dst: string, force: boolean): void {
  if (fs.existsSync(dst) && !force) {
    die(`Destination exists: ${dst} (use --force to overwrite)`);
  }
  fs.copyFileSync(src, dst);
}

function main(): void {
  const args = parseArgs(process.argv.slice(2));
  const repoRoot = findRepoRoot(process.cwd());

  const workspaceDir = path.isAbsolute(args.anchorWorkspaceDir)
    ? args.anchorWorkspaceDir
    : path.join(repoRoot, args.anchorWorkspaceDir);

  // Anchor usually places target/ next to Anchor.toml (workspace root)
  // Here we assume `programs/` contains Anchor.toml in the future, but allow flexibility:
  // targetDir resolves relative to workspaceDir's parent by default, since many repos use:
  // repo/programs/Anchor.toml and repo/target/idl.
  const workspaceParent = path.dirname(workspaceDir);
  const targetDirAbs = path.isAbsolute(args.targetDir)
    ? args.targetDir
    : path.join(workspaceParent, args.targetDir);

  const idlDir = path.join(targetDirAbs, "idl");
  const outDirAbs = path.isAbsolute(args.outDir) ? args.outDir : path.join(repoRoot, args.outDir);

  log(`repoRoot=${repoRoot}`);
  log(`anchorWorkspace=${workspaceDir}`);
  log(`targetDir=${targetDirAbs}`);
  log(`idlDir=${idlDir}`);
  log(`outDir=${outDirAbs}`);

  if (args.clean) {
    log(`cleaning outDir: ${outDirAbs}`);
    rmrf(outDirAbs);
  }
  ensureDir(outDirAbs);

  const idlFiles = listIdlFiles(idlDir, args.program);
  if (idlFiles.length === 0) {
    die(`No IDL files found in: ${idlDir}. Run "anchor build" first.`);
  }

  const metas: IdlMeta[] = [];

  for (const file of idlFiles) {
    const base = path.basename(file);
    const name = base.replace(/\.json$/, "");
    readJson(file); // validate JSON

    const dst = path.join(outDirAbs, base);
    copyFile(file, dst, args.force);

    const hash = sha256File(dst);
    metas.push({ name, idlFile: base, sha256: hash });
    if (args.print) {
      log(`exported ${base} -> ${dst}`);
    }
  }

  if (args.makeIndex) {
    writeIndex(outDirAbs, metas);
    if (args.print) log("index generated");
  }

  if (args.print) {
    log(`exported ${metas.length} idl(s)`);
  }

  log("done");
}

main();
