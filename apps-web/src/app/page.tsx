import { TerminalHero } from "@/components/TerminalHero";
import { CHAPTERS } from "@/content/copy/chapters";
import { GOOD_TO_KNOW } from "@/content/copy/good-to-know";
import { CONTACT_COPY } from "@/content/copy/contact";

export default function HomePage() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <TerminalHero />

      <section className="card">
        <div style={{ color: "var(--accent)", letterSpacing: 1, marginBottom: 10 }}>CHAPTERS</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 12 }}>
          {CHAPTERS.map((c) => (
            <div key={c.id} className="card" style={{ padding: 14 }}>
              <div style={{ color: "var(--accent)" }}>{c.title}</div>
              <div style={{ color: "var(--dim)", fontSize: 12, marginTop: 6 }}>{c.subtitle}</div>
              <p style={{ margin: "10px 0 0", lineHeight: 1.6 }}>{c.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="card">
        <div style={{ color: "var(--accent)", letterSpacing: 1, marginBottom: 10 }}>GOOD TO KNOW</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 12 }}>
          {GOOD_TO_KNOW.map((x, i) => (
            <div key={i} className="card" style={{ padding: 14 }}>
              <div style={{ color: "var(--accent)" }}>{x.q}</div>
              <p style={{ margin: "10px 0 0", lineHeight: 1.6, color: "var(--fg)" }}>{x.a}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="card">
        <div style={{ color: "var(--accent)", letterSpacing: 1, marginBottom: 10 }}>{CONTACT_COPY.title}</div>
        <ul style={{ margin: 0, paddingLeft: 18, color: "var(--fg)" }}>
          {CONTACT_COPY.lines.map((l, i) => (
            <li key={i} style={{ marginBottom: 6 }}>{l}</li>
          ))}
        </ul>
        <div className="hr" />
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
          <div style={{ color: "var(--dim)" }}>{CONTACT_COPY.cta}</div>
          <a href={CONTACT_COPY.xHref} className="kbd" target="_blank" rel="noreferrer">{CONTACT_COPY.xLabel}</a>
        </div>
      </section>
    </div>
  );
}
