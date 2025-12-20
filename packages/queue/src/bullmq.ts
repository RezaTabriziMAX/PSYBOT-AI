import { Queue, Worker, QueueEvents, JobsOptions, Processor } from "bullmq";
import IORedis from "ioredis";
import { JobName, JobPayload } from "./jobs";

export type QueueConfig = {
  name: string;
  redis: {
    host: string;
    port: number;
    password?: string;
    tls?: boolean;
  };
  prefix?: string;
};

export function createRedisConnection(cfg: QueueConfig["redis"]): IORedis {
  return new IORedis({
    host: cfg.host,
    port: cfg.port,
    password: cfg.password,
    tls: cfg.tls ? {} : undefined,
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
  });
}

export function createQueue(cfg: QueueConfig): Queue {
  const conn = createRedisConnection(cfg.redis);
  return new Queue(cfg.name, {
    connection: conn,
    prefix: cfg.prefix,
    defaultJobOptions: {
      removeOnComplete: 1000,
      removeOnFail: 1000,
      attempts: 10,
      backoff: { type: "exponential", delay: 1000 },
    },
  });
}

export function createQueueEvents(cfg: QueueConfig): QueueEvents {
  const conn = createRedisConnection(cfg.redis);
  return new QueueEvents(cfg.name, { connection: conn, prefix: cfg.prefix });
}

export function createWorker<N extends JobName>(
  cfg: QueueConfig,
  concurrency: number,
  name: N,
  processor: Processor<JobPayload<N>, any, N>
): Worker<JobPayload<N>, any, N> {
  const conn = createRedisConnection(cfg.redis);
  return new Worker<JobPayload<N>, any, N>(cfg.name, processor, {
    connection: conn,
    concurrency,
    prefix: cfg.prefix,
    autorun: true,
  });
}

export async function addJob<N extends JobName>(
  queue: Queue,
  name: N,
  payload: JobPayload<N>,
  opts?: JobsOptions
): Promise<void> {
  await queue.add(name, payload as any, opts);
}
