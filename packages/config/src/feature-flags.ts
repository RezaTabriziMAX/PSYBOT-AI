import { z } from "zod";

export const FeatureFlagsSchema = z.object({
  enableOpenAPI: z.boolean().default(true),
  enableMetrics: z.boolean().default(true),
  enableTracing: z.boolean().default(false),
  enableRedis: z.boolean().default(true),
});

export type FeatureFlags = z.infer<typeof FeatureFlagsSchema>;

export function parseFeatureFlags(env: Record<string, string | undefined>): FeatureFlags {
  const raw = {
    enableOpenAPI: env.ENABLE_OPENAPI,
    enableMetrics: env.ENABLE_METRICS,
    enableTracing: env.ENABLE_TRACING,
    enableRedis: env.REDIS_ENABLED,
  };

  const toBool = (v: unknown, fallback: boolean) => {
    if (typeof v !== "string" || v.trim() === "") return fallback;
    const s = v.toLowerCase();
    if (["1", "true", "yes", "y", "on"].includes(s)) return true;
    if (["0", "false", "no", "n", "off"].includes(s)) return false;
    return fallback;
  };

  return FeatureFlagsSchema.parse({
    enableOpenAPI: toBool(raw.enableOpenAPI, true),
    enableMetrics: toBool(raw.enableMetrics, true),
    enableTracing: toBool(raw.enableTracing, false),
    enableRedis: toBool(raw.enableRedis, true),
  });
}
