import type { Logger } from "pino";
import type { PersistService } from "../services/persist.js";
import type { Checkpoints } from "../sync/checkpoints.js";
import type { MetricsService } from "../services/metrics.js";

/**
 * Geyser support is intentionally stubbed.
 */
export async function startGeyserStream(_opts: {
  persist: PersistService;
  checkpoints: Checkpoints;
  programId?: string;
  log: Logger;
  metrics: MetricsService;
}) {
  throw new Error("Geyser stream is not implemented in this build");
}
