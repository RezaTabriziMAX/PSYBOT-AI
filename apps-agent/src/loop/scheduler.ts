import type { Logger } from "pino";

export type ScheduleConfig = {
  minLoopDelayMs: number;
  maxLoopDelayMs: number;
  jitterMs: number;
  heartbeatEveryTicks: number;
};

export function defaultScheduleConfig(): ScheduleConfig {
  return {
    minLoopDelayMs: 750,
    maxLoopDelayMs: 12_000,
    jitterMs: 250,
    heartbeatEveryTicks: 3,
  };
}

export async function sleep(ms: number): Promise<void> {
  await new Promise((r) => setTimeout(r, ms));
}

export function computeLoopDelayMs(cfg: ScheduleConfig, tick: number, log: Logger): number {
  const base = Math.min(cfg.maxLoopDelayMs, cfg.minLoopDelayMs + Math.floor(tick / 10) * 250);
  const jitter = Math.floor(Math.random() * cfg.jitterMs);
  const delay = base + jitter;
  log.debug({ tick, delay }, "loop_delay");
  return delay;
}
