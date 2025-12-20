import { z } from "zod";

const EnvSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),

  HOST: z.string().default("0.0.0.0"),
  PORT: z.coerce.number().int().positive().default(8080),

  API_PUBLIC_BASE_URL: z.string().url().optional(),

  CORS_ORIGINS: z.string().default("*"),

  RATE_LIMIT_MAX: z.coerce.number().int().positive().default(1200),
  RATE_LIMIT_TIME_WINDOW_MS: z.coerce.number().int().positive().default(60_000),

  AUTH_MODE: z.enum(["off", "shared-secret", "jwt"]).default("shared-secret"),
  AUTH_SHARED_SECRET: z.string().min(16).optional(),

  DB_URL: z.string().optional(),
  REDIS_URL: z.string().optional(),

  STORAGE_MODE: z.enum(["local", "s3"]).default("local"),
  STORAGE_LOCAL_DIR: z.string().default("./.nuttoo-storage"),

  WEBHOOK_SHARED_SECRET: z.string().min(16).optional(),
});

export type ApiEnv = z.infer<typeof EnvSchema>;

export function loadEnv(input: NodeJS.ProcessEnv = process.env): ApiEnv {
  const parsed = EnvSchema.safeParse(input);
  if (!parsed.success) {
    const msg = parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ");
    throw new Error(`Invalid env: ${msg}`);
  }
  return parsed.data;
}
