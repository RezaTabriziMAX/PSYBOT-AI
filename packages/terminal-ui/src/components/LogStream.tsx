import React from "react";
import { FALLOUT_THEME } from "../theme";

export type LogLine = {
  ts: string;
  level: "trace" | "debug" | "info" | "warn" | "error";
  message: string;
};

export type LogStreamProps = {
  lines: LogLine[];
  height?: number;
};

export function LogStream({ lines, height = 260 }: LogStreamProps) {
  const t = FALLOUT_THEME;
  return (
    <div style={{
      height,
      overflow: "auto",
      border: `1px solid ${t.dim}`,
      borderRadius: 10,
      padding: 10
    }}>
      {lines.map((l, idx) => (
        <div key={idx} style={{ display: "flex", gap: 10, fontSize: 12, whiteSpace: "pre-wrap" }}>
          <span style={{ color: t.dim, minWidth: 140 }}>{l.ts}</span>
          <span style={{ color: levelColor(l.level) }}>{l.level.toUpperCase()}</span>
          <span style={{ color: t.fg }}>{l.message}</span>
        </div>
      ))}
    </div>
  );

  function levelColor(level: LogLine["level"]) {
    if (level === "error") return t.danger;
    if (level === "warn") return t.warn;
    return t.fg;
  }
}
