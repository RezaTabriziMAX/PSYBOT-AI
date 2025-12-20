import React from "react";
import { FALLOUT_THEME } from "../theme";

export type TerminalFrameProps = {
  title?: string;
  children: React.ReactNode;
};

export function TerminalFrame(props: TerminalFrameProps) {
  const t = FALLOUT_THEME;
  return (
    <div style={{
      background: t.bg,
      color: t.fg,
      fontFamily: t.fontFamily,
      border: `1px solid ${t.dim}`,
      borderRadius: 12,
      padding: 16,
      boxShadow: `0 0 0 1px ${t.bg}, 0 0 24px rgba(77,255,122,0.15)`,
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
        <div style={{ color: t.accent, letterSpacing: 1 }}>{props.title ?? "NUTTOO TERMINAL"}</div>
        <div style={{ color: t.dim, fontSize: 12 }}>{new Date().toLocaleString()}</div>
      </div>
      <div>{props.children}</div>
    </div>
  );
}
