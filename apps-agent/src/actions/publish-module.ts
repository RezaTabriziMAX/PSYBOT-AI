import type { Logger } from "pino";
import type { NuttooClient } from "@nuttoo/sdk";
import type { ModuleizationPlan } from "../cognition/moduleizer.js";
import { isActionAllowed, type Allowlist } from "../policies/allowlist.js";
import type { SafetyPolicy } from "../policies/safety.js";

export async function publishModules(opts: {
  log: Logger;
  client: NuttooClient;
  plan: ModuleizationPlan;
  allowlist: Allowlist;
  safety: SafetyPolicy;
}): Promise<Array<{ id: string; name: string }>> {
  const { log, client, plan, allowlist, safety } = opts;

  if (!isActionAllowed(allowlist, "publish-module")) {
    log.warn("publish-module action is not allowed by allowlist");
    return [];
  }
  if (!safety.allowPublishing) {
    log.info("publishing disabled by safety policy");
    return [];
  }

  const created: Array<{ id: string; name: string }> = [];
  for (const m of plan.modules) {
    const res = await client.createModule({
      name: m.name,
      version: m.version,
      description: m.description,
      manifest: {
        suggestedInputs: m.suggestedInputs,
        suggestedOutputs: m.suggestedOutputs,
        safetyNotes: m.safetyNotes,
      },
    }).catch((err) => {
      log.warn({ err, module: m.name }, "module_publish_failed");
      return null;
    });

    if (res) created.push({ id: res.id, name: res.name });
  }
  return created;
}
