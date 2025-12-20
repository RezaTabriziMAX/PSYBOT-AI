export const APP_NAME = "Nuttoo";
export const DEFAULT_PORT = 8080;

export const DEFAULTS = {
  nodeEnv: "production",
  logLevel: "info",
  logFormat: "json",
  solanaCommitment: "confirmed",
  workerConcurrency: 8,
  workerPollIntervalMs: 250,
  indexerPollIntervalMs: 500,
  indexerBatchSize: 200,
  agentTickIntervalMs: 1000,
  ingestMaxRepoMb: 250,
  ingestMaxFiles: 25000,
  ingestTimeoutSec: 600,
} as const;

export const ENV_PREFIX = "NUTTOO_";

export const SERVICE_NAMES = ["api", "worker", "agent", "indexer", "web"] as const;
export type ServiceName = typeof SERVICE_NAMES[number];
