import { z } from "zod";
import { createLogger } from "@nuttoo/logger";
import { prisma } from "@nuttoo/db";
import { Connection } from "@solana/web3.js";
import { startPollingStream } from "./stream/polling.js";
import { startWebsocketStream } from "./stream/websockets.js";
import { MetricsService } from "./services/metrics.js";
import { PersistService } from "./services/persist.js";
import { Checkpoints } from "./sync/checkpoints.js";
import { backfill } from "./sync/backfill.js";

const EnvSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  SOLANA_RPC_URL: z.string().default("http://127.0.0.1:8899"),
  SOLANA_WS_URL: z.string().optional(),
  STREAM_MODE: z.enum(["polling", "websockets"]).default("polling"),
  POLL_INTERVAL_MS: z.coerce.number().int().positive().default(1500),
  PROGRAM_ID: z.string().optional(),
  INDEXER_NAME: z.string().default("nuttoo-indexer"),
});

type IndexerEnv = z.infer<typeof EnvSchema>;

async function main() {
  const env = loadEnv();
  const log = createLogger({ name: env.INDEXER_NAME, level: env.NODE_ENV === "production" ? "info" : "debug" });

  const conn = new Connection(env.SOLANA_RPC_URL, { commitment: "confirmed" });
  const metrics = new MetricsService();
  const persist = new PersistService(prisma, log, metrics);
  const checkpoints = new Checkpoints(prisma, log);

  log.info({ rpc: env.SOLANA_RPC_URL, mode: env.STREAM_MODE }, "indexer_boot");

  await backfill({ conn, persist, checkpoints, programId: env.PROGRAM_ID, log, metrics });

  if (env.STREAM_MODE === "websockets") {
    const ws = env.SOLANA_WS_URL ?? env.SOLANA_RPC_URL.replace(/^http/i, "ws");
    await startWebsocketStream({ conn, wsUrl: ws, persist, checkpoints, programId: env.PROGRAM_ID, log, metrics });
  } else {
    await startPollingStream({ conn, intervalMs: env.POLL_INTERVAL_MS, persist, checkpoints, programId: env.PROGRAM_ID, log, metrics });
  }
}

function loadEnv(input: NodeJS.ProcessEnv = process.env): IndexerEnv {
  const parsed = EnvSchema.safeParse(input);
  if (!parsed.success) {
    const msg = parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ");
    throw new Error(`Invalid env: ${msg}`);
  }
  return parsed.data;
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});
