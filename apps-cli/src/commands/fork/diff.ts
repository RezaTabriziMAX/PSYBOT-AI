import { createTerminal } from "../../ui/terminal.js";
import { NuttooClient } from "@nuttoo/sdk";
import { getCliPaths } from "../../config/paths.js";
import { readFile } from "node:fs/promises";

export async function forkDiffCommand(args: { forkA?: string; forkB?: string; api?: string }): Promise<number> {
  const t = createTerminal();
  t.header("Fork Diff", "Compare two forks");

  const forkA = (args.forkA ?? "").trim();
  const forkB = (args.forkB ?? "").trim();
  if (!forkA || !forkB) {
    t.error("Missing --forkA or --forkB");
    return 2;
  }

  const paths = getCliPaths();
  const token = await readFile(paths.tokensFile, "utf-8").then((s) => JSON.parse(s).apiToken as string).catch(() => "");
  const baseUrl = (args.api ?? process.env.NUTTOO_API_BASE_URL ?? "http://localhost:8080").trim();

  const client = new NuttooClient({ baseUrl, token: token || undefined });

  const res = await client.diffForks({ forkA, forkB }).catch((err) => {
    t.error("Diff failed: " + String(err));
    return null;
  });

  if (!res) return 2;

  t.hr();
  t.info(res.diffText || "(no diff)");
  t.hr();
  return 0;
}
