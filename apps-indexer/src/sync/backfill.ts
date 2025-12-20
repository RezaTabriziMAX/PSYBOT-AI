import type { Logger } from "pino";
import type { Connection } from "@solana/web3.js";
import type { PersistService } from "../services/persist.js";
import type { Checkpoints } from "./checkpoints.js";
import type { MetricsService } from "../services/metrics.js";

export async function backfill(opts: {
  conn: Connection;
  persist: PersistService;
  checkpoints: Checkpoints;
  programId?: string;
  log: Logger;
  metrics: MetricsService;
}) {
  const { conn, checkpoints, log } = opts;

  const current = await conn.getSlot("confirmed");
  const last = await checkpoints.getLatest("polling");
  const start = last ? Math.min(last, current) : Math.max(0, current - 100);

  log.info({ startSlot: start, currentSlot: current }, "backfill_ready");

  if (!last) await checkpoints.saveLatest("polling", start);
  if (!(await checkpoints.getLatest("logs"))) await checkpoints.saveLatest("logs", start);
}
