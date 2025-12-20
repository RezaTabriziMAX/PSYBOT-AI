export type RunEvent =
  | { type: "RunCreated"; runId: string; moduleId: string; forkId?: string }
  | { type: "RunStatus"; runId: string; status: string };

const RE_CREATED = /NUTTOO:RUN_CREATED\s+runId=([^\s]+)\s+moduleId=([^\s]+)(?:\s+forkId=([^\s]+))?/i;
const RE_STATUS = /NUTTOO:RUN_STATUS\s+runId=([^\s]+)\s+status=([^\s]+)/i;

export function parseRunEventsFromLogs(logs: string[]): RunEvent[] {
  const out: RunEvent[] = [];
  for (const line of logs) {
    const m1 = line.match(RE_CREATED);
    if (m1) {
      out.push({ type: "RunCreated", runId: m1[1], moduleId: m1[2], forkId: m1[3] || undefined });
      continue;
    }
    const m2 = line.match(RE_STATUS);
    if (m2) {
      out.push({ type: "RunStatus", runId: m2[1], status: m2[2] });
      continue;
    }
  }
  return out;
}
