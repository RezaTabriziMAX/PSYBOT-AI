import { createTerminal } from "../../ui/terminal.js";
import { promptText } from "../../ui/prompts.js";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

export async function moduleCreateCommand(args: { dir?: string }): Promise<number> {
  const t = createTerminal();
  t.header("Module Create", "Scaffold a runnable module directory");

  const dir = path.resolve(args.dir ?? "./nuttoo-module");
  await mkdir(dir, { recursive: true });

  const name = await promptText({ message: "Module name", initial: path.basename(dir) });
  const version = await promptText({ message: "Version", initial: "0.1.0" });
  const description = await promptText({ message: "Description", initial: "A Nuttoo module" });

  const manifest = {
    name,
    version,
    description,
    entryFile: "index.mjs",
    inputs: { example: "string" },
    outputs: { result: "string" },
    runtime: { kind: "node", version: ">=18" },
  };

  const entry = `
const input = JSON.parse(process.env.NUTTOO_INPUT_JSON || "null");
console.log(JSON.stringify({ ok: true, input }));
`;

  await writeFile(path.join(dir, "module.json"), JSON.stringify(manifest, null, 2), "utf-8");
  await writeFile(path.join(dir, "index.mjs"), entry.trim() + "\n", "utf-8");
  await writeFile(path.join(dir, "README.md"), `# ${name}\n\n${description}\n`, "utf-8");

  t.success(`Module created at ${dir}`);
  return 0;
}
