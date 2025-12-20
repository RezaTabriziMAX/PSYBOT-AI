export type JobName = "analyze_repo" | "pack_module" | "run_module" | "index_chain" | "agent_tick";

export type JobPayloads = {
  analyze_repo: { repoUrl: string; ref?: string; requestId: string };
  pack_module: { moduleId: string; requestId: string };
  run_module: { runId: string; requestId: string };
  index_chain: { cursor?: string; requestId: string };
  agent_tick: { tick: number; requestId: string };
};

export type JobPayload<N extends JobName> = JobPayloads[N];

export const JOBS: JobName[] = ["analyze_repo", "pack_module", "run_module", "index_chain", "agent_tick"];
