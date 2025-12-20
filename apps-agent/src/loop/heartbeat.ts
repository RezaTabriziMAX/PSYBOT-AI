import type { Logger } from "pino";
import type { AgentState } from "./state.js";

export type HeartbeatSink = {
  emit: (hb: {
    agentId: string;
    ts: number;
    tick: number;
    phase: string;
    uptimeMs: number;
    lastError?: { at: number; message: string };
  }) => Promise<void>;
};

export function createLogHeartbeatSink(log: Logger): HeartbeatSink {
  return {
    async emit(hb) {
      log.info(hb, "agent_heartbeat");
    },
  };
}

export async function heartbeat(state: AgentState, sink: HeartbeatSink): Promise<AgentState> {
  const now = Date.now();
  await sink.emit({
    agentId: state.agentId,
    ts: now,
    tick: state.tick,
    phase: state.phase,
    uptimeMs: now - state.startedAt,
    lastError: state.lastError ? { at: state.lastError.at, message: state.lastError.message } : undefined,
  });
  return { ...state, lastHeartbeatAt: now };
}
