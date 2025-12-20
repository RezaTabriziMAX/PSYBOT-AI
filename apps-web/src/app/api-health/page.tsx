import { apiBaseUrl } from "@/lib/api";

export const dynamic = "force-dynamic";

export default async function ApiHealthPage() {
  const base = apiBaseUrl();

  const checks = await Promise.allSettled([
    fetch(base + "/healthz", { cache: "no-store" }).then((r) => r.text()),
    fetch(base + "/readyz", { cache: "no-store" }).then((r) => r.text()),
  ]);

  const healthz = checks[0].status === "fulfilled" ? checks[0].value : String(checks[0].reason);
  const readyz = checks[1].status === "fulfilled" ? checks[1].value : String(checks[1].reason);

  return (
    <section className="card">
      <div style={{ color: "var(--accent)", letterSpacing: 1 }}>API HEALTH</div>
      <div style={{ color: "var(--dim)", marginTop: 8 }}>
        Base URL: <code>{base}</code>
      </div>
      <div className="hr" />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 12 }}>
        <div className="card" style={{ padding: 14 }}>
          <div style={{ color: "var(--accent)" }}>/healthz</div>
          <pre style={{ margin: "10px 0 0", whiteSpace: "pre-wrap" }}>{healthz}</pre>
        </div>

        <div className="card" style={{ padding: 14 }}>
          <div style={{ color: "var(--accent)" }}>/readyz</div>
          <pre style={{ margin: "10px 0 0", whiteSpace: "pre-wrap" }}>{readyz}</pre>
        </div>
      </div>
    </section>
  );
}
