import React, { useMemo } from "react";
import { FALLOUT_THEME } from "../theme";

export type PromptLineProps = {
  cwd?: string;
  user?: string;
  command?: string;
};

export function PromptLine({ cwd = "~", user = "operator", command = "" }: PromptLineProps) {
  const t = FALLOUT_THEME;
  const prefix = useMemo(() => `[${user}@nuttoo:${cwd}]$`, [cwd, user]);
  return (
    <div style={{ display: "flex", gap: 8, whiteSpace: "pre" }}>
      <span style={{ color: t.accent }}>{prefix}</span>
      <span style={{ color: t.fg }}>{command}</span>
    </div>
  );
}
