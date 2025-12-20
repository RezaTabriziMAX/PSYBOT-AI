import { ulid } from "ulid";

export type AgentPhase =
  | "BOOT"
  | "OBSERVE"
  | "SUMMARIZE"
  | "MODULEIZE"
  | "SUGGEST_FORKS"
  | "ACTIONS"
  | "SLEEP";

export type AgentState = {
  agentId: string;
  startedAt: number;
  tick: number;
  phase: AgentPhase;
  lastHeartbeatAt: number;
  lastError?: {
    at: number;
    message: string;
    stack?: string;
  };
  memory: {
    lastObserved?: number;
    lastGitHubETag?: string;
    lastNpmETag?: string;
    recentSummaries: Array<{ at: number; source: string; summary: string }>;
  };
};

export function createInitialState(): AgentState {
  const now = Date.now();
  return {
    agentId: ulid(),
    startedAt: now,
    tick: 0,
    phase: "BOOT",
    lastHeartbeatAt: now,
    memory: {
      recentSummaries: [],
    },
  };
}

export function recordError(state: AgentState, err: unknown): AgentState {
  const e = err instanceof Error ? err : new Error(String(err));
  return {
    ...state,
    lastError: {
      at: Date.now(),
      message: e.message,
      stack: e.stack,
    },
  };
}

export function pushSummary(state: AgentState, input: { source: string; summary: string }): AgentState {
  const next = { ...state };
  next.memory.recentSummaries = [
    { at: Date.now(), source: input.source, summary: input.summary },
    ...next.memory.recentSummaries,
  ].slice(0, 50);
  return next;
}
