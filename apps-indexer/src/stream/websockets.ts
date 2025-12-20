import type { Logger } from "pino";
import { Connection, PublicKey } from "@solana/web3.js";
import type { PersistService } from "../services/persist.js";
import type { Checkpoints } from "../sync/checkpoints.js";
import type { MetricsService } from "../services/metrics.js";
import { parseRegistryEventsFromLogs } from "../parsers/registry.events.js";
import { parseForkEventsFromLogs } from "../parsers/fork.events.js";
import { parseRunEventsFromLogs } from "../parsers/run.events.js";

export async function startWebsocketStream(opts: {
  conn: Connection;
  wsUrl: string;
  persist: PersistService;
  checkpoints: Checkpoints;
  programId?: string;
  log: Logger;
  metrics: MetricsService;
}) {
  const { conn, programId, log, persist, checkpoints, metrics } = opts;

  const pk = programId ? new PublicKey(programId) : null;

  const subId = pk
    ? conn.onLogs(pk, async (logs, ctx) => {
        metrics.onLogBatch();
        const slot = ctx.slot;
        const sig = logs.signature;

        const registry = parseRegistryEventsFromLogs(logs.logs);
        const forks = parseForkEventsFromLogs(logs.logs);
        const runs = parseRunEventsFromLogs(logs.logs);

        await persist.persistEvents({ slot, signature: sig, registry, forks, runs });
        await checkpoints.saveLatest("logs", slot);
      }, "confirmed")
    : conn.onLogs("all", async (logs, ctx) => {
        metrics.onLogBatch();
        const slot = ctx.slot;
        const sig = logs.signature;

        const registry = parseRegistryEventsFromLogs(logs.logs);
        const forks = parseForkEventsFromLogs(logs.logs);
        const runs = parseRunEventsFromLogs(logs.logs);

        await persist.persistEvents({ slot, signature: sig, registry, forks, runs });
        await checkpoints.saveLatest("logs", slot);
      }, "confirmed");

  log.info({ subId }, "websocket_stream_started");

  // eslint-disable-next-line no-constant-condition
  while (true) {
    await new Promise((r) => setTimeout(r, 60_000));
  }
}
