import { z } from "zod";
import { createLogger } from "@nuttoo/logger";
import type { Logger } from "pino";
import { ArtifactStore } from "./services/artifacts.js";
import { packModuleProcessor } from "./processors/pack-module.processor.js";
import { verifyModuleProcessor } from "./processors/verify-module.processor.js";
import { runModuleProcessor } from "./processors/run-module.processor.js";
import { publishModuleProcessor } from "./processors/publish-module.processor.js";

const EnvSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  WORKER_NAME: z.string().default("nuttoo-worker"),

  ARTIFACTS_DIR: z.string().default("./.nuttoo-artifacts"),

  QUEUE_PROVIDER: z.enum(["inmemory"]).default("inmemory"),

  WORKER_CONCURRENCY: z.coerce.number().int().positive().default(4),
});

type Env = z.infer<typeof EnvSchema>;

type JobEnvelope = { type: string; payload: unknown };

type InMemoryQueue = {
  push: (job: JobEnvelope) => void;
  pull: () => JobEnvelope | null;
};

function createInMemoryQueue(): InMemoryQueue {
  const arr: JobEnvelope[] = [];
  return {
    push(job) { arr.push(job); },
    pull() { return arr.shift() ?? null; },
  };
}

async function main() {
  const env = loadEnv();
  const log = createLogger({ name: env.WORKER_NAME, level: env.NODE_ENV === "production" ? "info" : "debug" });

  const store = new ArtifactStore(env.ARTIFACTS_DIR);

  // Reference worker uses an in-memory queue. Production uses Redis + BullMQ via @nuttoo/queue.
  const q = createInMemoryQueue();

  // Self-test job seeds for dev mode.
  if (env.NODE_ENV !== "production") {
    seedDemoJobs(q);
  }

  log.info({ provider: env.QUEUE_PROVIDER, concurrency: env.WORKER_CONCURRENCY }, "worker_started");

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const job = q.pull();
    if (!job) {
      await sleep(250);
      continue;
    }

    await handleJob({ log, store, job }).catch((err) => {
      log.error({ err, type: job.type }, "job_failed");
    });
  }
}

async function handleJob(opts: { log: Logger; store: ArtifactStore; job: JobEnvelope }): Promise<void> {
  const { log, store, job } = opts;

  switch (job.type) {
    case "pack-module": {
      const res = await packModuleProcessor({ log, store, job: job.payload });
      log.info({ res }, "job_done");
      return;
    }
    case "verify-module": {
      const res = await verifyModuleProcessor({ log, store, job: job.payload });
      log.info({ res }, "job_done");
      return;
    }
    case "run-module": {
      const res = await runModuleProcessor({ log, store, job: job.payload });
      log.info({ res }, "job_done");
      return;
    }
    case "publish-module": {
      const res = await publishModuleProcessor({ log, job: job.payload });
      log.info({ res }, "job_done");
      return;
    }
    default:
      log.warn({ type: job.type }, "unknown_job_type");
  }
}

function seedDemoJobs(q: InMemoryQueue) {
  q.push({
    type: "pack-module",
    payload: {
      moduleId: "demo",
      source: {
        kind: "inline",
        entryFile: "index.mjs",
        files: [
          { relPath: "index.mjs", content: "console.log('hello from module');" },
        ],
      },
      outputPrefix: "modules/packed",
    },
  });
}

function loadEnv(): Env {
  const parsed = EnvSchema.safeParse(process.env);
  if (!parsed.success) {
    const msg = parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ");
    throw new Error(`Invalid env: ${msg}`);
  }
  return parsed.data;
}

async function sleep(ms: number): Promise<void> {
  await new Promise((r) => setTimeout(r, ms));
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});
