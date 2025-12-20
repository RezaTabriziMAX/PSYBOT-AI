import type { Logger } from "pino";

export class OnchainSource {
  constructor(private readonly opts: { apiBaseUrl?: string; log: Logger }) {}

  async health(): Promise<{ ok: boolean } | null> {
    if (!this.opts.apiBaseUrl) return null;
    const url = `${this.opts.apiBaseUrl.replace(/\/$/, "")}/healthz`;
    const res = await fetch(url);
    if (!res.ok) return { ok: false };
    return { ok: true };
  }
}
