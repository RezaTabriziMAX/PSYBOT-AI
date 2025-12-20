import type { Logger } from "pino";
import type { NuttooClient } from "@nuttoo/sdk";
import type { ForkSuggestion } from "../cognition/fork-suggester.js";
import { isActionAllowed, type Allowlist } from "../policies/allowlist.js";
import type { SafetyPolicy } from "../policies/safety.js";

export async function proposeForks(opts: {
  log: Logger;
  client: NuttooClient;
  moduleNameToId: Map<string, string>;
  suggestions: ForkSuggestion[];
  allowlist: Allowlist;
  safety: SafetyPolicy;
}): Promise<Array<{ id: string; moduleId: string }>> {
  const { log, client, moduleNameToId, suggestions, allowlist, safety } = opts;

  if (!isActionAllowed(allowlist, "propose-fork")) {
    log.warn("propose-fork action is not allowed by allowlist");
    return [];
  }
  if (!safety.allowPublishing) {
    // Fork proposals require write access.
    log.info("fork proposals disabled by safety policy");
    return [];
  }

  const out: Array<{ id: string; moduleId: string }> = [];

  for (const s of suggestions) {
    const moduleId = moduleNameToId.get(s.moduleName);
    if (!moduleId) continue;

    const fork = await client.createFork({ moduleId, notes: s.suggestedForkNotes }).catch((err) => {
      log.warn({ err, moduleId }, "fork_create_failed");
      return null;
    });

    if (fork) out.push({ id: fork.id, moduleId });
  }

  return out;
}
