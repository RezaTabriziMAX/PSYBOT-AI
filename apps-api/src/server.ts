import Fastify from "fastify";
import sensible from "@fastify/sensible";
import cors from "@fastify/cors";
import { Registry } from "prom-client";
import { createLogger } from "@nuttoo/logger";
import { prisma } from "@nuttoo/db";
import { createQueueClient } from "@nuttoo/queue";
import { loadEnv } from "./config/env.js";
import { parseCorsOrigins } from "./config/cors.js";
import { requestIdPlugin } from "./middleware/request-id.js";
import { errorPlugin } from "./middleware/error.js";
import { rateLimitPlugin } from "./middleware/rate-limit.js";
import { authPlugin } from "./middleware/auth.js";
import { registerOpenApi } from "./openapi/build-openapi.js";
import { healthRoutes } from "./routes/health.js";
import { authRoutes } from "./routes/auth.js";
import { modulesRoutes } from "./routes/modules.js";
import { forksRoutes } from "./routes/forks.js";
import { runsRoutes } from "./routes/runs.js";
import { webhooksRoutes } from "./routes/webhooks.js";
import { PolicyService } from "./services/policy.service.js";
import { StorageService } from "./services/storage.service.js";
import { ModuleService } from "./services/module.service.js";
import { ForkService } from "./services/fork.service.js";
import { RunService } from "./services/run.service.js";

export async function buildServer() {
  const env = loadEnv();

  const app = Fastify({
    logger: createLogger({ name: "nuttoo-api", level: env.NODE_ENV === "production" ? "info" : "debug" }),
    disableRequestLogging: true,
  });

  await app.register(sensible);
  await app.register(requestIdPlugin);
  await app.register(errorPlugin);

  await app.register(cors, { origin: parseCorsOrigins(env.CORS_ORIGINS), credentials: true });
  await app.register(rateLimitPlugin, { max: env.RATE_LIMIT_MAX, timeWindowMs: env.RATE_LIMIT_TIME_WINDOW_MS });
  await app.register(authPlugin, { mode: env.AUTH_MODE, sharedSecret: env.AUTH_SHARED_SECRET });

  const registry = new Registry();

  const policy = new PolicyService();
  const storage = new StorageService(env.STORAGE_MODE, env.STORAGE_LOCAL_DIR);

  const queue = env.REDIS_URL ? createQueueClient({ redisUrl: env.REDIS_URL, logger: app.log }) : null;

  const modules = new ModuleService(prisma, storage);
  const forks = new ForkService(prisma);
  const runs = new RunService(prisma, queue);

  await registerOpenApi(app);

  await app.register(healthRoutes, { registry });
  await app.register(authRoutes);
  await app.register(modulesRoutes, { policy, modules });
  await app.register(forksRoutes, { policy, forks });
  await app.register(runsRoutes, { policy, runs });
  await app.register(webhooksRoutes, { sharedSecret: env.WEBHOOK_SHARED_SECRET });

  app.get("/", async () => ({ ok: true, name: "nuttoo-api", version: "0.1.0" }));

  return { app, env };
}
