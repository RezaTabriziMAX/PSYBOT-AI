import React from "react";
import { FALLOUT_THEME } from "../theme";

export type StatusBarProps = {
  left: string;
  right?: string;
};

export function StatusBar({ left, right }: StatusBarProps) {
  const t = FALLOUT_THEME;
  return (
    <div style={{
      display: "flex",
      justifyContent: "space-between",
      borderTop: `1px solid ${t.dim}`,
      marginTop: 12,
      paddingTop: 10,
      fontSize: 12,
      color: t.dim
    }}>
      <span>{left}</span>
      <span>{right ?? ""}</span>
    </div>
  );
}
