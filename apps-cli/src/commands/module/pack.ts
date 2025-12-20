import { createTerminal } from "../../ui/terminal.js";
import { readFile, writeFile, readdir } from "node:fs/promises";
import path from "node:path";

type PackedBundle = {
  entryFile: string;
  files: Array<{ relPath: string; content: string }>;
};

async function readDirRecursive(base: string, rel = ""): Promise<string[]> {
  const dir = path.join(base, rel);
  const entries = await readdir(dir, { withFileTypes: true });
  const out: string[] = [];
  for (const e of entries) {
    if (e.name === "node_modules" || e.name.startsWith(".git")) continue;
    const nextRel = path.join(rel, e.name);
    if (e.isDirectory()) out.push(...await readDirRecursive(base, nextRel));
    else out.push(nextRel);
  }
  return out;
}

export async function modulePackCommand(args: { dir?: string; out?: string }): Promise<number> {
  const t = createTerminal();
  t.header("Module Pack", "Bundle module files into a portable artifact");

  const dir = path.resolve(args.dir ?? ".");
  const manifestPath = path.join(dir, "module.json");
  const manifest = JSON.parse(await readFile(manifestPath, "utf-8"));
  const entryFile = String(manifest.entryFile ?? "index.mjs");

  const filesList = await readDirRecursive(dir);
  const files: PackedBundle["files"] = [];
  for (const rel of filesList) {
    const content = await readFile(path.join(dir, rel), "utf-8");
    files.push({ relPath: rel.replace(/\\/g, "/"), content });
  }

  const bundle: PackedBundle = { entryFile, files };
  const outPath = path.resolve(args.out ?? path.join(dir, ".nuttoo.bundle.json"));
  await writeFile(outPath, JSON.stringify(bundle, null, 2), "utf-8");

  t.success(`Packed: ${outPath}`);
  return 0;
}
