export type RegistryEvent =
  | { type: "ModuleRegistered"; moduleId: string; name?: string; version?: string; manifestSha256?: string }
  | { type: "ModuleStatusChanged"; moduleId: string; status: string };

const RE_REGISTER = /NUTTOO:MODULE_REGISTERED\s+moduleId=([^\s]+)(?:\s+name=([^\s]+))?(?:\s+version=([^\s]+))?(?:\s+sha=([^\s]+))?/i;
const RE_STATUS = /NUTTOO:MODULE_STATUS\s+moduleId=([^\s]+)\s+status=([^\s]+)/i;

export function parseRegistryEventsFromLogs(logs: string[]): RegistryEvent[] {
  const out: RegistryEvent[] = [];
  for (const line of logs) {
    const m1 = line.match(RE_REGISTER);
    if (m1) {
      out.push({
        type: "ModuleRegistered",
        moduleId: m1[1],
        name: m1[2] || undefined,
        version: m1[3] || undefined,
        manifestSha256: m1[4] || undefined,
      });
      continue;
    }
    const m2 = line.match(RE_STATUS);
    if (m2) {
      out.push({ type: "ModuleStatusChanged", moduleId: m2[1], status: m2[2] });
      continue;
    }
  }
  return out;
}
