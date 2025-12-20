import { createTerminal } from "../../ui/terminal.js";
import { promptConfirm } from "../../ui/prompts.js";

export async function devnetResetCommand(): Promise<number> {
  const t = createTerminal();
  t.header("Devnet Reset", "Reset local dev environment");

  const ok = await promptConfirm({ message: "Reset local state (dangerous)?", initial: false });
  if (!ok) {
    t.info("Cancelled.");
    return 0;
  }

  t.warn("Reset steps are repo-specific. Use scripts/db/reset.ts and localnet scripts when available.");
  t.info("Suggested:");
  t.info("- pnpm ts-node scripts/db/reset.ts");
  t.info("- pnpm ts-node scripts/solana/init-localnet.sh");
  t.success("Done.");
  return 0;
}
