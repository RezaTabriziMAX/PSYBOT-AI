import { apiBaseUrl, createApiClient } from "@/lib/api";

export const dynamic = "force-dynamic";

export default async function RunsPage({ searchParams }: { searchParams: { moduleId?: string } }) {
  const moduleId = searchParams.moduleId;
  const client = createApiClient({ baseUrl: apiBaseUrl() });

  return (
    <section className="card">
      <div style={{ color: "var(--accent)", letterSpacing: 1 }}>RUNS</div>
      <div style={{ color: "var(--dim)", marginTop: 8 }}>Execution is the truth. Everything else is marketing.</div>
      <div className="hr" />

      <div className="card" style={{ padding: 14 }}>
        <div style={{ color: "var(--accent)" }}>Create run</div>
        <div style={{ color: "var(--dim)", marginTop: 8, fontSize: 12 }}>
          This UI is read-only until your API enables authenticated mutations.
        </div>
        <div style={{ marginTop: 12, color: "var(--dim)", fontSize: 12 }}>
          POST /runs {"{ moduleId, input, forkId? }"}
        </div>
        {moduleId ? (
          <div style={{ marginTop: 10, color: "var(--fg)" }}>
            Selected moduleId: <code>{moduleId}</code>
          </div>
        ) : null}
      </div>

      <div className="hr" />

      <RecentRuns client={client} />
    </section>
  );
}

async function RecentRuns({ client }: { client: any }) {
  let runs: any[] = [];
  let error: string | null = null;
  try {
    runs = await client.get("/runs?take=20");
  } catch (e: any) {
    error = e?.message ?? "Failed to load runs";
  }

  if (error) return <div style={{ color: "var(--danger)" }}>{error}</div>;
  if (!runs.length) return <div style={{ color: "var(--dim)" }}>No runs yet.</div>;

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 12 }}>
      {runs.map((r) => (
        <div key={r.id} className="card" style={{ padding: 14 }}>
          <div style={{ color: "var(--accent)" }}>Run {short(r.id)}</div>
          <div style={{ color: "var(--dim)", fontSize: 12, marginTop: 6 }}>{r.status}</div>
          <div style={{ marginTop: 10, fontSize: 12, color: "var(--dim)" }}>moduleId</div>
          <code style={{ color: "var(--fg)" }}>{r.moduleId}</code>

          {r.error ? (
            <>
              <div style={{ marginTop: 10, color: "var(--danger)", fontSize: 12 }}>error</div>
              <pre style={{ whiteSpace: "pre-wrap" }}>{String(r.error)}</pre>
            </>
          ) : null}

          {r.output ? (
            <>
              <div style={{ marginTop: 10, color: "var(--accent)", fontSize: 12 }}>output</div>
              <pre style={{ whiteSpace: "pre-wrap" }}>{JSON.stringify(r.output, null, 2)}</pre>
            </>
          ) : null}
        </div>
      ))}
    </div>
  );
}

function short(s: string) {
  return s.length <= 10 ? s : s.slice(0, 6) + "…" + s.slice(-4);
}
