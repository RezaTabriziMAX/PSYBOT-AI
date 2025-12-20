import React from "react";

export function TerminalFooter() {
  return (
    <footer style={{ marginTop: 26, color: "var(--dim)", fontSize: 12 }}>
      <div className="hr" />
      <div style={{ display: "flex", justifyContent: "space-between", gap: 14, flexWrap: "wrap" }}>
        <span>NUTTOO :: ONLINE</span>
        <span>Signal: stable · Noise: acceptable</span>
      </div>
    </footer>
  );
}
