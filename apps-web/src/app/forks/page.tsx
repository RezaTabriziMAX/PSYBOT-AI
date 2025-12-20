import { apiBaseUrl, createApiClient } from "@/lib/api";

export const dynamic = "force-dynamic";

export default async function ForksPage({ searchParams }: { searchParams: { moduleId?: string } }) {
  const moduleId = searchParams.moduleId;
  const client = createApiClient({ baseUrl: apiBaseUrl() });

  let data: any = null;
  let error: string | null = null;

  try {
    if (moduleId) {
      data = await client.get(`/modules/${encodeURIComponent(moduleId)}`);
    }
  } catch (e: any) {
    error = e?.message ?? "Failed to load module";
  }

  return (
    <section className="card">
      <div style={{ color: "var(--accent)", letterSpacing: 1 }}>FORKS</div>
      <div style={{ color: "var(--dim)", marginTop: 8 }}>Forks create lineage. Lineage creates memory.</div>
      <div className="hr" />

      <div className="card" style={{ padding: 14 }}>
        <div style={{ color: "var(--accent)" }}>Create fork</div>
        <div style={{ color: "var(--dim)", marginTop: 8, fontSize: 12 }}>
          Use the API to create forks. This UI is intentionally read-only until auth is configured.
        </div>
        <div style={{ marginTop: 12, color: "var(--dim)", fontSize: 12 }}>
          POST /forks {"{ moduleId, notes }"}
        </div>
      </div>

      <div className="hr" />

      {moduleId ? (
        error ? (
          <div style={{ color: "var(--danger)" }}>{error}</div>
        ) : (
          <div className="card" style={{ padding: 14 }}>
            <div style={{ color: "var(--accent)" }}>Selected module</div>
            <pre style={{ margin: "10px 0 0", whiteSpace: "pre-wrap" }}>{JSON.stringify(data, null, 2)}</pre>
          </div>
        )
      ) : (
        <div style={{ color: "var(--dim)" }}>Select a module from <a href="/registry">Registry</a> to view fork context.</div>
      )}
    </section>
  );
}
