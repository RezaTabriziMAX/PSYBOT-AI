/* eslint-disable no-console */
/**
 * Nuttoo repository tree generator
 *
 * Purpose:
 * - Print or export a deterministic directory tree of the repository
 * - Support ignore rules (.gitignore-like), depth limits, and size info
 * - Useful for documentation, audits, and CI artifacts
 *
 * Usage:
 *   node --loader ts-node/esm scripts/repo/tree.ts
 *
 * Examples:
 *   node --loader ts-node/esm scripts/repo/tree.ts --depth 4
 *   node --loader ts-node/esm scripts/repo/tree.ts --out TREE.md --format md
 *   node --loader ts-node/esm scripts/repo/tree.ts --json
 *   node --loader ts-node/esm scripts/repo/tree.ts --ignore node_modules,dist,target
 *
 * Options:
 *   --root <dir>           Root directory (default: repo root)
 *   --depth <n>            Max depth (default: unlimited)
 *   --files-only           Print only files
 *   --dirs-only            Print only directories
 *   --sizes                Include file sizes
 *   --follow-symlinks      Follow symlinks (default: false)
 *   --ignore <a,b,c>       Comma-separated ignore names (default includes common dirs)
 *   --use-gitignore        Parse .gitignore if present (best-effort)
 *   --format <text|md>     Output format (default: text)
 *   --out <file>           Write output to file
 *   --json                 Output JSON instead of text/markdown
 *   --sort <name|size>     Sort entries (default: name)
 *   --print                Print to stdout (default: true)
 *   --no-print             Disable stdout printing
 */

import fs from "node:fs";
import path from "node:path";

type Format = "text" | "md";
type SortBy = "name" | "size";

type Args = {
  root: string;
  depth?: number;
  filesOnly: boolean;
  dirsOnly: boolean;
  sizes: boolean;
  followSymlinks: boolean;
  ignore: Set<string>;
  useGitignore: boolean;
  format: Format;
  out?: string;
  json: boolean;
  sortBy: SortBy;
  print: boolean;
};

type Node = {
  name: string;
  path: string;
  isDir: boolean;
  size?: number;
  children?: Node[];
};

function die(msg: string): never {
  console.error(`[repo-tree] error: ${msg}`);
  process.exit(1);
}

function parseArgs(argv: string[]): Args {
  const defaults: Args = {
    root: "",
    depth: undefined,
    filesOnly: false,
    dirsOnly: false,
    sizes: false,
    followSymlinks: false,
    ignore: new Set([
      ".git",
      "node_modules",
      "dist",
      "build",
      "target",
      ".next",
      ".turbo",
      ".cache",
      ".DS_Store"
    ]),
    useGitignore: false,
    format: "text",
    json: false,
    sortBy: "name",
    print: true
  };

  for (let i = 0; i < argv.length; i++) {
    const a = argv[i] ?? "";
    if (a === "--root") {
      const v = argv[++i];
      if (!v) die("Missing value for --root");
      defaults.root = v;
      continue;
    }
    if (a === "--depth") {
      const v = argv[++i];
      if (!v) die("Missing value for --depth");
      const n = Number(v);
      if (!Number.isInteger(n) || n < 0) die("Invalid --depth");
      defaults.depth = n;
      continue;
    }
    if (a === "--files-only") {
      defaults.filesOnly = true;
      continue;
    }
    if (a === "--dirs-only") {
      defaults.dirsOnly = true;
      continue;
    }
    if (a === "--sizes") {
      defaults.sizes = true;
      continue;
    }
    if (a === "--follow-symlinks") {
      defaults.followSymlinks = true;
      continue;
    }
    if (a === "--ignore
