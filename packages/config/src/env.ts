import { config as dotenv } from "dotenv";
import { z } from "zod";
import { DEFAULTS } from "./constants";
import { parseFeatureFlags, FeatureFlags } from "./feature-flags";

dotenv();

const EnvSchema = z.object({
  NODE_ENV: z.string().default(DEFAULTS.nodeEnv),
  LOG_LEVEL: z.string().default(DEFAULTS.logLevel),
  LOG_FORMAT: z.string().default(DEFAULTS.logFormat),

  PORT: z.coerce.number().default(DEFAULTS ? 8080 : 8080),

  SOLANA_CLUSTER: z.string().default("mainnet-beta"),
  SOLANA_RPC_URL: z.string().url(),
  SOLANA_COMMITMENT: z.string().default(DEFAULTS.solanaCommitment),

  DATABASE_URL: z.string().min(1),
  REDIS_ENABLED: z.string().optional(),
  REDIS_HOST: z.string().optional(),
  REDIS_PORT: z.coerce.number().optional(),
  REDIS_PASSWORD: z.string().optional(),

  API_JWT_SECRET: z.string().optional(),
  INTERNAL_SHARED_SECRET: z.string().optional(),

  WORKER_CONCURRENCY: z.coerce.number().default(DEFAULTS.workerConcurrency),
  WORKER_POLL_INTERVAL_MS: z.coerce.number().default(DEFAULTS.workerPollIntervalMs),
  WORKER_MAX_RETRIES: z.coerce.number().default(10),

  INDEXER_POLL_INTERVAL_MS: z.coerce.number().default(DEFAULTS.indexerPollIntervalMs),
  INDEXER_BATCH_SIZE: z.coerce.number().default(DEFAULTS.indexerBatchSize),

  AGENT_TICK_INTERVAL_MS: z.coerce.number().default(DEFAULTS.agentTickIntervalMs),

  INGEST_MAX_REPO_MB: z.coerce.number().default(DEFAULTS.ingestMaxRepoMb),
  INGEST_MAX_FILES: z.coerce.number().default(DEFAULTS.ingestMaxFiles),
  INGEST_TIMEOUT_SEC: z.coerce.number().default(DEFAULTS.ingestTimeoutSec),

  OTEL_EXPORTER_OTLP_ENDPOINT: z.string().optional(),
  SENTRY_DSN: z.string().optional(),
});

export type NuttooEnv = z.infer<typeof EnvSchema> & { features: FeatureFlags };

export function loadEnv(overrides?: Record<string, string | undefined>): NuttooEnv {
  const env = { ...process.env, ...(overrides ?? {}) } as Record<string, string | undefined>;
  const base = EnvSchema.parse(env);
  const features = parseFeatureFlags(env);
  return { ...base, features };
}
