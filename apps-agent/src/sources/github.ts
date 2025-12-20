import type { Logger } from "pino";

export type GitHubRepoRef = { owner: string; repo: string };

export class GitHubSource {
  constructor(private readonly opts: { token?: string; log: Logger }) {}

  async getDefaultBranchHead(ref: GitHubRepoRef): Promise<{ sha: string; etag?: string } | null> {
    const url = `https://api.github.com/repos/${ref.owner}/${ref.repo}`;
    const res = await fetch(url, {
      headers: {
        "accept": "application/vnd.github+json",
        ...(this.opts.token ? { authorization: `Bearer ${this.opts.token}` } : {}),
        "user-agent": "nuttoo-agent",
      },
    });

    const etag = res.headers.get("etag") ?? undefined;

    if (res.status == 404) return null;
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      this.opts.log.warn({ status: res.status, text: text.slice(0, 400) }, "github_repo_fetch_failed");
      return null;
    }

    const json: any = await res.json();
    const branch = String(json.default_branch ?? "main");

    const bres = await fetch(`https://api.github.com/repos/${ref.owner}/${ref.repo}/commits/${branch}`, {
      headers: {
        "accept": "application/vnd.github+json",
        ...(this.opts.token ? { authorization: `Bearer ${this.opts.token}` } : {}),
        "user-agent": "nuttoo-agent",
      },
    });

    const betag = bres.headers.get("etag") ?? etag;

    if (!bres.ok) return null;
    const bjson: any = await bres.json();
    const sha = String(bjson.sha ?? "");
    if (!sha) return null;
    return { sha, etag: betag ?? undefined };
  }
}
