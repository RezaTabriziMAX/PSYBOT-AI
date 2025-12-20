import type { FastifyPluginAsync } from "fastify";
import rateLimit from "@fastify/rate-limit";

export const rateLimitPlugin: FastifyPluginAsync<{ max: number; timeWindowMs: number }> = async (app, opts) => {
  await app.register(rateLimit, {
    max: opts.max,
    timeWindow: opts.timeWindowMs,
    keyGenerator: (req) => req.headers["x-forwarded-for"]?.toString() ?? req.ip,
  });
};
