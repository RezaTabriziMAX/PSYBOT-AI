import type { Logger } from "pino";
import { Connection } from "@solana/web3.js";
import type { PersistService } from "../services/persist.js";
import type { Checkpoints } from "../sync/checkpoints.js";
import type { MetricsService } from "../services/metrics.js";
import { parseRegistryEventsFromLogs } from "../parsers/registry.events.js";
import { parseForkEventsFromLogs } from "../parsers/fork.events.js";
import { parseRunEventsFromLogs } from "../parsers/run.events.js";

export async function startPollingStream(opts: {
  conn: Connection;
  intervalMs: number;
  persist: PersistService;
  checkpoints: Checkpoints;
  programId?: string;
  log: Logger;
  metrics: MetricsService;
}) {
  const { conn, intervalMs, persist, checkpoints, log, metrics } = opts;

  const key = "polling";
  let last = await checkpoints.getLatest(key);
  log.info({ lastSlot: last }, "polling_stream_boot");

  // eslint-disable-next-line no-constant-condition
  while (true) {
    try {
      const current = await conn.getSlot("confirmed");
      metrics.setCurrentSlot(current);

      const from = last ? last + 1 : Math.max(0, current - 50);
      const to = current;

      if (from <= to) {
        for (let slot = from; slot <= to; slot++) {
          metrics.onSlotScan();

          const sigs = await conn.getBlockSignatures(slot, { commitment: "confirmed" })
            .then((x) => x.signatures ?? [])
            .catch(() => []);

          for (const signature of sigs.slice(0, 200)) {
            const tx = await conn.getTransaction(signature, { commitment: "confirmed", maxSupportedTransactionVersion: 0 }).catch(() => null);
            if (!tx?.meta?.logMessages) continue;

            metrics.onLogBatch();

            const logs = tx.meta.logMessages;
            const registry = parseRegistryEventsFromLogs(logs);
            const forks = parseForkEventsFromLogs(logs);
            const runs = parseRunEventsFromLogs(logs);

            if (registry.length || forks.length || runs.length) {
              await persist.persistEvents({ slot, signature, registry, forks, runs });
            }
          }

          last = slot;
          await checkpoints.saveLatest(key, slot);
        }
      }

      await new Promise((r) => setTimeout(r, intervalMs));
    } catch (err) {
      log.error({ err }, "polling_stream_error");
      await new Promise((r) => setTimeout(r, Math.min(10_000, intervalMs * 2)));
    }
  }
}
