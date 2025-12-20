import type { FastifyPluginAsync } from "fastify";
import { collectDefaultMetrics, Registry } from "prom-client";

export const healthRoutes: FastifyPluginAsync<{ registry: Registry }> = async (app, opts) => {
  collectDefaultMetrics({ register: opts.registry });

  app.get("/healthz", async () => ({ ok: true, ts: Date.now() }));

  app.get("/readyz", async () => ({ ok: true, ts: Date.now() }));

  app.get("/metrics", async (_req, reply) => {
    reply.header("content-type", opts.registry.contentType);
    return opts.registry.metrics();
  });
};
