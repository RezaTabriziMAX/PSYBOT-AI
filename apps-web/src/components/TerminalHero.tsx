import React from "react";
import { HERO_COPY } from "@/content/copy/hero";

export function TerminalHero() {
  return (
    <section className="card" style={{ position: "relative", overflow: "hidden" }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
        <div>
          <div style={{ letterSpacing: 1, color: "var(--accent)" }}>{HERO_COPY.kicker}</div>
          <h1 style={{ margin: "10px 0 8px", fontSize: 38, letterSpacing: 1 }}>{HERO_COPY.title}</h1>
          <p style={{ margin: 0, color: "var(--fg)", maxWidth: 740, lineHeight: 1.6 }}>{HERO_COPY.subtitle}</p>
        </div>
        <div style={{ minWidth: 240, textAlign: "right" }}>
          <div style={{ color: "var(--dim)", fontSize: 12 }}>Ticker</div>
          <div style={{ fontSize: 22, color: "var(--accent)", letterSpacing: 2 }}>NUTTOO</div>
          <div style={{ color: "var(--dim)", fontSize: 12, marginTop: 8 }}>Mode</div>
          <div style={{ color: "var(--fg)" }}>Terminal</div>
        </div>
      </div>

      <div style={{ marginTop: 16, display: "flex", gap: 10, flexWrap: "wrap" }}>
        {HERO_COPY.links.map((l) => (
          <a key={l.href} href={l.href} className="kbd">
            {l.label}
          </a>
        ))}
      </div>

      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          opacity: 0.08,
          backgroundImage: "url(/terminal-noise.png)",
          backgroundSize: "420px 420px",
          mixBlendMode: "screen",
        }}
      />
    </section>
  );
}
