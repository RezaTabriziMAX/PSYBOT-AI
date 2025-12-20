import { createTerminal } from "../../ui/terminal.js";
import { NuttooClient } from "@nuttoo/sdk";
import { getCliPaths } from "../../config/paths.js";
import { readFile } from "node:fs/promises";
import { promptText } from "../../ui/prompts.js";

export async function forkCreateCommand(args: { moduleId?: string; notes?: string; api?: string }): Promise<number> {
  const t = createTerminal();
  t.header("Fork Create", "Create a fork for a module");

  const moduleId = (args.moduleId ?? "").trim();
  if (!moduleId) {
    t.error("Missing --moduleId");
    return 2;
  }

  const notes = args.notes?.trim() || await promptText({ message: "Fork notes", initial: "Alternative policy/runtime tweaks" });

  const paths = getCliPaths();
  const token = await readFile(paths.tokensFile, "utf-8").then((s) => JSON.parse(s).apiToken as string).catch(() => "");
  const baseUrl = (args.api ?? process.env.NUTTOO_API_BASE_URL ?? "http://localhost:8080").trim();

  if (!token) {
    t.error("No token found. Run: nuttoo login");
    return 2;
  }

  const client = new NuttooClient({ baseUrl, token });

  const res = await client.createFork({ moduleId, notes }).catch((err) => {
    t.error("Fork failed: " + String(err));
    return null;
  });

  if (!res) return 2;
  t.success(`Fork created: ${res.id}`);
  return 0;
}
