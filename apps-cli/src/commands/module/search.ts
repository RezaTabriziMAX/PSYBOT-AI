import { createTerminal } from "../../ui/terminal.js";
import { NuttooClient } from "@nuttoo/sdk";
import { getCliPaths } from "../../config/paths.js";
import { readFile } from "node:fs/promises";

export async function moduleSearchCommand(args: { q?: string; api?: string }): Promise<number> {
  const t = createTerminal();
  t.header("Module Search", "Search modules");

  const q = (args.q ?? "").trim();
  if (!q) {
    t.error("Missing query. Use: nuttoo module search --q <text>");
    return 2;
  }

  const paths = getCliPaths();
  const token = await readFile(paths.tokensFile, "utf-8").then((s) => JSON.parse(s).apiToken as string).catch(() => "");
  const baseUrl = (args.api ?? process.env.NUTTOO_API_BASE_URL ?? "http://localhost:8080").trim();

  const client = new NuttooClient({ baseUrl, token: token || undefined });

  const res = await client.searchModules({ q }).catch((err) => {
    t.error("Search failed: " + String(err));
    return null;
  });

  if (!res) return 2;

  t.hr();
  for (const m of res.items) {
    t.kv(m.id, `${m.name}@${m.version}`);
  }
  t.hr();
  return 0;
}
