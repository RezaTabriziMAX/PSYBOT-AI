import { readFile } from "node:fs/promises";
import path from "node:path";

export const dynamic = "force-static";

async function load(rel: string): Promise<string> {
  const p = path.join(process.cwd(), "src", "content", "docs", rel);
  return readFile(p, "utf8");
}

export default async function DocsPage() {
  const intro = await load("intro.mdx");
  const spec = await load("module-spec.mdx");

  return (
    <section className="card">
      <div style={{ color: "var(--accent)", letterSpacing: 1 }}>DOCS</div>
      <div style={{ color: "var(--dim)", marginTop: 8 }}>Terminal docs are intentionally plaintext-friendly.</div>
      <div className="hr" />
      <article style={{ display: "grid", gridTemplateColumns: "1fr", gap: 14 }}>
        <DocBlock title="intro.mdx" content={intro} />
        <DocBlock title="module-spec.mdx" content={spec} />
      </article>
    </section>
  );
}

function DocBlock({ title, content }: { title: string; content: string }) {
  return (
    <div className="card" style={{ padding: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
        <div style={{ color: "var(--accent)" }}>{title}</div>
        <div style={{ color: "var(--dim)", fontSize: 12 }}>render: raw</div>
      </div>
      <pre style={{ margin: "10px 0 0", whiteSpace: "pre-wrap", lineHeight: 1.55, color: "var(--fg)" }}>
{`{content}`}
      </pre>
    </div>
  );
}
