import pino, { LoggerOptions, Logger as PinoLogger } from "pino";
import { currentTrace } from "./tracing";
import { normalizeLevel, isPretty } from "./formatters";
import { redactObject } from "./redaction";

export type Logger = PinoLogger;

export type CreateLoggerOptions = {
  level?: string;
  format?: "json" | "pretty";
  service?: string;
  redactPaths?: string[];
};

export function createLogger(opts: CreateLoggerOptions = {}): Logger {
  const level = normalizeLevel(opts.level ?? "info");
  const pretty = isPretty(opts.format);

  const base: Record<string, any> = {};
  if (opts.service) base.service = opts.service;

  const loggerOpts: LoggerOptions = {
    level,
    base,
    messageKey: "message",
    formatters: {
      level(label) {
        return { level: label };
      },
      bindings(bindings) {
        return { pid: bindings.pid, host: bindings.hostname };
      },
      log(object) {
        const traceCtx = currentTrace();
        const merged = { ...object, ...traceCtx };
        const redactPaths = opts.redactPaths ?? [
          "password",
          "token",
          "secret",
          "DATABASE_URL",
          "API_JWT_SECRET",
          "INTERNAL_SHARED_SECRET",
          "SOLANA_KEYPAIR_JSON",
        ];
        return redactObject(merged as any, { paths: redactPaths });
      },
    },
  };

  if (pretty) {
    return pino(loggerOpts, pino.transport({
      target: "pino-pretty",
      options: { colorize: true, translateTime: "SYS:standard" },
    }));
  }

  return pino(loggerOpts);
}
