export type TelemetryEvent = {
  name: string;
  ts: number;
  props?: Record<string, unknown>;
};

export function track(event: TelemetryEvent): void {
  if (typeof window === "undefined") return;
  const enabled = (process.env.NEXT_PUBLIC_TELEMETRY ?? "false").toLowerCase() === "true";
  if (!enabled) return;

  try {
    const payload = { ...event, ts: event.ts ?? Date.now() };
    console.debug("[telemetry]", payload);
  } catch {
    // ignore
  }
}
