import type { Logger } from "pino";

export class NpmSource {
  constructor(private readonly opts: { log: Logger }) {}

  async getPackageMeta(name: string): Promise<{ version?: string; etag?: string } | null> {
    const url = `https://registry.npmjs.org/${encodeURIComponent(name)}`;
    const res = await fetch(url, { headers: { "accept": "application/json" } });
    const etag = res.headers.get("etag") ?? undefined;

    if (res.status === 404) return null;
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      this.opts.log.warn({ status: res.status, text: text.slice(0, 400) }, "npm_fetch_failed");
      return null;
    }

    const json: any = await res.json();
    const distTags = json["dist-tags"] ?? {};
    const version = typeof distTags.latest === "string" ? distTags.latest : undefined;
    return { version, etag };
  }
}
