import { createTerminal } from "../../ui/terminal.js";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { getCliPaths } from "../../config/paths.js";
import { NuttooClient } from "@nuttoo/sdk";

export async function modulePublishCommand(args: { bundle?: string; api?: string }): Promise<number> {
  const t = createTerminal();
  t.header("Module Publish", "Publish a packed module to the Nuttoo API");

  const bundlePath = path.resolve(args.bundle ?? ".nuttoo.bundle.json");
  const bundle = JSON.parse(await readFile(bundlePath, "utf-8"));

  const paths = getCliPaths();
  const token = await readFile(paths.tokensFile, "utf-8").then((s) => JSON.parse(s).apiToken as string).catch(() => "");
  const baseUrl = (args.api ?? process.env.NUTTOO_API_BASE_URL ?? "http://localhost:8080").trim();

  if (!token) {
    t.error("No token found. Run: nuttoo login");
    return 2;
  }

  const client = new NuttooClient({ baseUrl, token });

  const res = await client.createModule({
    name: bundle.name ?? "module",
    version: bundle.version ?? "0.1.0",
    description: bundle.description ?? "published via cli",
    manifest: bundle,
  }).catch((err) => {
    t.error("Publish failed: " + String(err));
    return null;
  });

  if (!res) return 2;

  t.success(`Published module: ${res.id}`);
  return 0;
}
