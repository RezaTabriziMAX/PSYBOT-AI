import React, { useMemo, useState } from "react";
import { FALLOUT_THEME } from "../theme";

export type CommandItem = {
  id: string;
  label: string;
  hint?: string;
  onSelect: () => void;
};

export function CommandPalette({ items }: { items: CommandItem[] }) {
  const t = FALLOUT_THEME;
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    const s = q.toLowerCase().trim();
    if (!s) return items;
    return items.filter(i => (i.label + " " + (i.hint ?? "")).toLowerCase().includes(s));
  }, [q, items]);

  return (
    <div style={{ marginTop: 12 }}>
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search commands..."
        style={{
          width: "100%",
          padding: "10px 12px",
          background: t.bg,
          color: t.fg,
          border: `1px solid ${t.dim}`,
          borderRadius: 10,
          outline: "none",
          fontFamily: t.fontFamily
        }}
      />
      <div style={{ marginTop: 10, border: `1px solid ${t.dim}`, borderRadius: 10 }}>
        {filtered.map(i => (
          <button
            key={i.id}
            onClick={i.onSelect}
            style={{
              width: "100%",
              textAlign: "left",
              padding: "10px 12px",
              background: "transparent",
              color: t.fg,
              border: "none",
              borderBottom: `1px solid ${t.dim}`,
              cursor: "pointer",
              fontFamily: t.fontFamily
            }}
          >
            <div style={{ color: t.accent }}>{i.label}</div>
            {i.hint ? <div style={{ color: t.dim, fontSize: 12 }}>{i.hint}</div> : null}
          </button>
        ))}
      </div>
    </div>
  );
}
