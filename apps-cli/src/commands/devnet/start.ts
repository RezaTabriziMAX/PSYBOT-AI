import { createTerminal } from "../../ui/terminal.js";
import { promptConfirm } from "../../ui/prompts.js";

export async function devnetStartCommand(): Promise<number> {
  const t = createTerminal();
  t.header("Devnet Start", "Start local services for development");

  t.warn("This command is a local helper. Production uses docker/k8s manifests.");
  const ok = await promptConfirm({ message: "Continue?", initial: true });
  if (!ok) return 0;

  t.info("Suggested steps:");
  t.info("- Start Postgres and Redis");
  t.info("- Start API: pnpm --filter @nuttoo/api dev");
  t.info("- Start worker: pnpm --filter @nuttoo/worker dev");
  t.info("- Start web: pnpm --filter @nuttoo/web dev");
  t.success("Done.");
  return 0;
}
