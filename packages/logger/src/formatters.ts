export type LogFormat = "json" | "pretty";

export function normalizeLevel(level: string): string {
  const s = (level || "").toLowerCase().trim();
  if (!s) return "info";
  const allowed = new Set(["fatal", "error", "warn", "info", "debug", "trace"]);
  return allowed.has(s) ? s : "info";
}

export function isPretty(format: string | undefined): boolean {
  return (format || "").toLowerCase().trim() === "pretty";
}
