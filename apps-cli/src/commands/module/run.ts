import { createTerminal } from "../../ui/terminal.js";
import { NuttooClient } from "@nuttoo/sdk";
import { getCliPaths } from "../../config/paths.js";
import { readFile } from "node:fs/promises";

export async function moduleRunCommand(args: { moduleId?: string; forkId?: string; input?: string; api?: string }): Promise<number> {
  const t = createTerminal();
  t.header("Module Run", "Create a run for a module");

  const moduleId = (args.moduleId ?? "").trim();
  if (!moduleId) {
    t.error("Missing --moduleId");
    return 2;
  }

  const input = args.input ? safeJson(args.input) : null;

  const paths = getCliPaths();
  const token = await readFile(paths.tokensFile, "utf-8").then((s) => JSON.parse(s).apiToken as string).catch(() => "");
  const baseUrl = (args.api ?? process.env.NUTTOO_API_BASE_URL ?? "http://localhost:8080").trim();

  if (!token) {
    t.error("No token found. Run: nuttoo login");
    return 2;
  }

  const client = new NuttooClient({ baseUrl, token });

  const res = await client.createRun({ moduleId, forkId: args.forkId, input }).catch((err) => {
    t.error("Run failed: " + String(err));
    return null;
  });

  if (!res) return 2;

  t.success(`Run created: ${res.id}`);
  return 0;
}

function safeJson(s: string): any {
  try { return JSON.parse(s); } catch { return s; }
}
