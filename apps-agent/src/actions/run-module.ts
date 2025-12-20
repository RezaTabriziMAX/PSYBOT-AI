import type { Logger } from "pino";
import type { NuttooClient } from "@nuttoo/sdk";
import { isActionAllowed, type Allowlist } from "../policies/allowlist.js";
import type { SafetyPolicy } from "../policies/safety.js";

export async function runModule(opts: {
  log: Logger;
  client: NuttooClient;
  moduleId: string;
  forkId?: string;
  input?: unknown;
  allowlist: Allowlist;
  safety: SafetyPolicy;
}): Promise<{ id: string } | null> {
  const { log, client, moduleId, forkId, input, allowlist, safety } = opts;

  if (!isActionAllowed(allowlist, "run-module")) {
    log.warn("run-module action is not allowed by allowlist");
    return null;
  }
  if (!safety.allowRunning) {
    log.info("runs disabled by safety policy");
    return null;
  }

  return await client.createRun({ moduleId, forkId, input }).catch((err) => {
    log.warn({ err, moduleId }, "run_create_failed");
    return null;
  });
}
