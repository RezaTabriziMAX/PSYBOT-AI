import { createTerminal } from "../../ui/terminal.js";
import { NuttooClient } from "@nuttoo/sdk";
import { getCliPaths } from "../../config/paths.js";
import { readFile } from "node:fs/promises";

export async function forkListCommand(args: { moduleId?: string; api?: string }): Promise<number> {
  const t = createTerminal();
  t.header("Fork List", "List forks for a module");

  const moduleId = (args.moduleId ?? "").trim();
  if (!moduleId) {
    t.error("Missing --moduleId");
    return 2;
  }

  const paths = getCliPaths();
  const token = await readFile(paths.tokensFile, "utf-8").then((s) => JSON.parse(s).apiToken as string).catch(() => "");
  const baseUrl = (args.api ?? process.env.NUTTOO_API_BASE_URL ?? "http://localhost:8080").trim();

  const client = new NuttooClient({ baseUrl, token: token || undefined });

  const res = await client.listForks({ moduleId }).catch((err) => {
    t.error("List failed: " + String(err));
    return null;
  });

  if (!res) return 2;

  t.hr();
  for (const f of res.items) t.kv(f.id, f.notes ?? "");
  t.hr();
  return 0;
}
