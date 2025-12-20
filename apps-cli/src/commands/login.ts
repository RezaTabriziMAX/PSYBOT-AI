import { createTerminal } from "../ui/terminal.js";
import { getCliPaths } from "../config/paths.js";
import { promptText } from "../ui/prompts.js";
import { readFile, writeFile } from "node:fs/promises";

type TokensFile = {
  apiToken?: string;
  updatedAt?: string;
};

export async function loginCommand(args: { token?: string }): Promise<number> {
  const t = createTerminal();
  t.header("Login", "Store an API token locally");

  const paths = getCliPaths();
  const existing: TokensFile = await readFile(paths.tokensFile, "utf-8").then((s) => JSON.parse(s)).catch(() => ({}));

  const token = args.token?.trim() || await promptText({
    message: "Paste your API token",
    initial: existing.apiToken ? "(stored)" : "",
    validate: (v) => v.trim().length >= 10 ? true : "Token looks too short",
  });

  const next: TokensFile = { apiToken: token.trim(), updatedAt: new Date().toISOString() };
  await writeFile(paths.tokensFile, JSON.stringify(next, null, 2), "utf-8");

  t.success("Token saved.");
  return 0;
}
