export type ForkEvent =
  | { type: "ForkCreated"; forkId: string; moduleId: string; parentForkId?: string }
  | { type: "ForkStatusChanged"; forkId: string; status: string };

const RE_CREATED = /NUTTOO:FORK_CREATED\s+forkId=([^\s]+)\s+moduleId=([^\s]+)(?:\s+parentForkId=([^\s]+))?/i;
const RE_STATUS = /NUTTOO:FORK_STATUS\s+forkId=([^\s]+)\s+status=([^\s]+)/i;

export function parseForkEventsFromLogs(logs: string[]): ForkEvent[] {
  const out: ForkEvent[] = [];
  for (const line of logs) {
    const m1 = line.match(RE_CREATED);
    if (m1) {
      out.push({ type: "ForkCreated", forkId: m1[1], moduleId: m1[2], parentForkId: m1[3] || undefined });
      continue;
    }
    const m2 = line.match(RE_STATUS);
    if (m2) {
      out.push({ type: "ForkStatusChanged", forkId: m2[1], status: m2[2] });
      continue;
    }
  }
  return out;
}
