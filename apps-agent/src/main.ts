import { z } from "zod";
import type { Logger } from "pino";
import { createLogger } from "@nuttoo/logger";
import { NuttooClient } from "@nuttoo/sdk";
import { createInitialState, recordError, pushSummary, type AgentState } from "./loop/state.js";
import { defaultScheduleConfig, computeLoopDelayMs, sleep } from "./loop/scheduler.js";
import { heartbeat, createLogHeartbeatSink } from "./loop/heartbeat.js";
import { observe, ObserveConfigSchema } from "./cognition/observer.js";
import { summarize, SummarizeConfigSchema } from "./cognition/summarizer.js";
import { moduleize, ModuleizeConfigSchema } from "./cognition/moduleizer.js";
import { suggestForks, ForkSuggestConfigSchema } from "./cognition/fork-suggester.js";
import { defaultAllowlist } from "./policies/allowlist.js";
import { defaultLimits } from "./policies/limits.js";
import { defaultSafetyPolicy } from "./policies/safety.js";
import { publishModules } from "./actions/publish-module.js";
import { proposeForks } from "./actions/propose-fork.js";

const EnvSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  AGENT_NAME: z.string().default("nuttoo-agent"),

  API_BASE_URL: z.string().url().default("http://localhost:8080"),
  API_TOKEN: z.string().optional(),

  LOOP_MIN_DELAY_MS: z.coerce.number().int().positive().default(750),
  LOOP_MAX_DELAY_MS: z.coerce.number().int().positive().default(12_000),
  LOOP_JITTER_MS: z.coerce.number().int().positive().default(250),
  HEARTBEAT_EVERY_TICKS: z.coerce.number().int().positive().default(3),

  OBSERVE_CONFIG_JSON: z.string().optional(),
  SUMMARIZE_CONFIG_JSON: z.string().optional(),
  MODULEIZE_CONFIG_JSON: z.string().optional(),
  FORK_CONFIG_JSON: z.string().optional(),

  SAFETY_ALLOW_PUBLISHING: z.coerce.boolean().default(false),
  SAFETY_ALLOW_RUNNING: z.coerce.boolean().default(false),
});

type Env = z.infer<typeof EnvSchema>;

async function main() {
  const env = loadEnv();
  const log = createLogger({ name: env.AGENT_NAME, level: env.NODE_ENV === "production" ? "info" : "debug" });

  const client = new NuttooClient({
    baseUrl: env.API_BASE_URL,
    token: env.API_TOKEN,
  });

  const schedule = defaultScheduleConfig();
  schedule.minLoopDelayMs = env.LOOP_MIN_DELAY_MS;
  schedule.maxLoopDelayMs = env.LOOP_MAX_DELAY_MS;
  schedule.jitterMs = env.LOOP_JITTER_MS;
  schedule.heartbeatEveryTicks = env.HEARTBEAT_EVERY_TICKS;

  const allowlist = defaultAllowlist();
  const limits = defaultLimits();
  const safety = defaultSafetyPolicy();
  safety.allowPublishing = env.SAFETY_ALLOW_PUBLISHING;
  safety.allowRunning = env.SAFETY_ALLOW_RUNNING;

  const observeCfg = parseJsonOrDefault(env.OBSERVE_CONFIG_JSON, ObserveConfigSchema, log);
  const summarizeCfg = parseJsonOrDefault(env.SUMMARIZE_CONFIG_JSON, SummarizeConfigSchema, log);
  const moduleizeCfg = parseJsonOrDefault(env.MODULEIZE_CONFIG_JSON, ModuleizeConfigSchema, log);
  const forkCfg = parseJsonOrDefault(env.FORK_CONFIG_JSON, ForkSuggestConfigSchema, log);

  let state: AgentState = createInitialState();
  const hbSink = createLogHeartbeatSink(log);

  log.info({ agentId: state.agentId, api: env.API_BASE_URL }, "agent_started");

  // eslint-disable-next-line no-constant-condition
  while (true) {
    state = { ...state, tick: state.tick + 1 };

    try {
      state = await step({ log, state, client, observeCfg, summarizeCfg, moduleizeCfg, forkCfg, allowlist, limits, safety, hbSink });
    } catch (err) {
      state = recordError(state, err);
      log.error({ err }, "agent_tick_failed");
    }

    const delay = computeLoopDelayMs(schedule, state.tick, log);
    state = { ...state, phase: "SLEEP" };
    await sleep(delay);
  }
}

async function step(opts: {
  log: Logger;
  state: AgentState;
  client: NuttooClient;
  observeCfg: any;
  summarizeCfg: any;
  moduleizeCfg: any;
  forkCfg: any;
  allowlist: any;
  limits: any;
  safety: any;
  hbSink: any;
}): Promise<AgentState> {
  const { log, client, observeCfg, summarizeCfg, moduleizeCfg, forkCfg, allowlist, limits, safety, hbSink } = opts;
  let { state } = opts;

  if (state.tick % 3 === 0) {
    state = await heartbeat(state, hbSink);
  }

  state = { ...state, phase: "OBSERVE" };
  const obs = await observe({
    log,
    cfg: observeCfg,
    etags: { github: state.memory.lastGitHubETag, npm: state.memory.lastNpmETag },
  });

  state = {
    ...state,
    memory: {
      ...state.memory,
      lastObserved: obs.observation.at,
      lastGitHubETag: obs.etags.github ?? state.memory.lastGitHubETag,
      lastNpmETag: obs.etags.npm ?? state.memory.lastNpmETag,
      recentSummaries: state.memory.recentSummaries,
    },
  };

  state = { ...state, phase: "SUMMARIZE" };
  const sum = await summarize({ log, cfg: summarizeCfg, observation: obs.observation });
  state = pushSummary(state, { source: "observation", summary: sum.summary });

  state = { ...state, phase: "MODULEIZE" };
  const plan = await moduleize({ log, cfg: moduleizeCfg, observation: obs.observation, summary: sum.summary });
  const planModules = plan.modules.slice(0, limits.maxModulesPerTick);

  state = { ...state, phase: "SUGGEST_FORKS" };
  const forks = await suggestForks({ log, cfg: forkCfg, plan: { ...plan, modules: planModules }, summary: sum.summary });
  const forkSuggestions = forks.slice(0, limits.maxForkSuggestionsPerTick);

  state = { ...state, phase: "ACTIONS" };

  const published = await publishModules({ log, client, plan: { ...plan, modules: planModules }, allowlist, safety });
  const nameToId = new Map<string, string>(published.map((m: any) => [m.name, m.id]));

  await proposeForks({ log, client, moduleNameToId: nameToId, suggestions: forkSuggestions, allowlist, safety });

  return { ...state, phase: "SLEEP" };
}

function loadEnv(): Env {
  const parsed = EnvSchema.safeParse(process.env);
  if (!parsed.success) {
    const msg = parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ");
    throw new Error(`Invalid env: ${msg}`);
  }
  return parsed.data;
}

function parseJsonOrDefault<T>(raw: string | undefined, schema: any, log: Logger): T {
  if (!raw) return schema.parse({});
  try {
    const json = JSON.parse(raw);
    return schema.parse(json);
  } catch (err) {
    log.warn({ err }, "config_json_parse_failed");
    return schema.parse({});
  }
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});
