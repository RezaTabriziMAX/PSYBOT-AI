import { apiBaseUrl, createApiClient } from "@/lib/api";
import { CopyButton } from "@/components/CopyButton";

export const dynamic = "force-dynamic";

export default async function RegistryPage() {
  const client = createApiClient({ baseUrl: apiBaseUrl() });

  let modules: any[] = [];
  let error: string | null = null;

  try {
    modules = await client.get("/modules");
  } catch (e: any) {
    error = e?.message ?? "Failed to load modules";
  }

  return (
    <section className="card">
      <div style={{ color: "var(--accent)", letterSpacing: 1 }}>REGISTRY</div>
      <div style={{ color: "var(--dim)", marginTop: 8 }}>Modules registered and ready for reuse.</div>
      <div className="hr" />

      {error ? (
        <div style={{ color: "var(--danger)" }}>{error}</div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 12 }}>
          {modules.map((m) => (
            <div key={m.id} className="card" style={{ padding: 14 }}>
              <div style={{ color: "var(--accent)" }}>{m.name}</div>
              <div style={{ color: "var(--dim)", fontSize: 12, marginTop: 6 }}>{m.version}</div>
              <p style={{ margin: "10px 0 0", lineHeight: 1.55 }}>{m.description ?? "No description"}</p>
              <div style={{ marginTop: 12, display: "flex", gap: 10, flexWrap: "wrap" }}>
                <CopyButton value={m.id} label="Copy Module ID" />
                <a className="kbd" href={`/runs?moduleId=${encodeURIComponent(m.id)}`}>Run</a>
                <a className="kbd" href={`/forks?moduleId=${encodeURIComponent(m.id)}`}>Fork</a>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
