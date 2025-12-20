import type { Logger } from "pino";
import { z } from "zod";
import { GitHubSource, type GitHubRepoRef } from "../sources/github.js";
import { NpmSource } from "../sources/npm.js";
import { OnchainSource } from "../sources/onchain.js";

export type Observation = {
  at: number;
  github: Array<{ repo: string; headSha?: string; filesChanged?: number; note?: string }>;
  npm: Array<{ pkg: string; version?: string; note?: string }>;
  onchain: Array<{ kind: string; note: string }>;
};

export const ObserveConfigSchema = z.object({
  github: z.object({
    enabled: z.boolean().default(true),
    repos: z.array(z.string()).default([]),
    token: z.string().optional(),
  }).default({ enabled: true, repos: [] }),
  npm: z.object({
    enabled: z.boolean().default(true),
    packages: z.array(z.string()).default([]),
  }).default({ enabled: true, packages: [] }),
  onchain: z.object({
    enabled: z.boolean().default(true),
    apiBaseUrl: z.string().url().optional(),
  }).default({ enabled: true }),
});

export type ObserveConfig = z.infer<typeof ObserveConfigSchema>;

export async function observe(opts: {
  log: Logger;
  cfg: ObserveConfig;
  etags?: { github?: string; npm?: string };
}): Promise<{ observation: Observation; etags: { github?: string; npm?: string } }> {
  const { log, cfg } = opts;
  const at = Date.now();

  const gh = new GitHubSource({ token: cfg.github.token, log });
  const npm = new NpmSource({ log });
  const onchain = new OnchainSource({ apiBaseUrl: cfg.onchain.apiBaseUrl, log });

  const github: Observation["github"] = [];
  const npmObs: Observation["npm"] = [];
  const onchainObs: Observation["onchain"] = [];

  let githubETag: string | undefined;
  let npmETag: string | undefined;

  if (cfg.github.enabled && cfg.github.repos.length) {
    for (const repo of cfg.github.repos) {
      const ref: GitHubRepoRef = parseRepo(repo);
      const head = await gh.getDefaultBranchHead(ref).catch((err) => {
        log.warn({ err, repo }, "github_head_failed");
        return null;
      });
      github.push({
        repo,
        headSha: head?.sha,
        note: head ? undefined : "unavailable",
      });
      githubETag = head?.etag ?? githubETag;
    }
  }

  if (cfg.npm.enabled && cfg.npm.packages.length) {
    for (const pkg of cfg.npm.packages) {
      const meta = await npm.getPackageMeta(pkg).catch((err) => {
        log.warn({ err, pkg }, "npm_meta_failed");
        return null;
      });
      npmObs.push({
        pkg,
        version: meta?.version,
        note: meta ? undefined : "unavailable",
      });
      npmETag = meta?.etag ?? npmETag;
    }
  }

  if (cfg.onchain.enabled) {
    const health = await onchain.health().catch(() => null);
    onchainObs.push({ kind: "api", note: health?.ok ? "ok" : "unknown" });
  }

  return {
    observation: { at, github, npm: npmObs, onchain: onchainObs },
    etags: { github: githubETag, npm: npmETag },
  };
}

function parseRepo(s: string): GitHubRepoRef {
  const cleaned = s.replace(/^https:\/\//, "").replace(/^github\.com\//, "");
  const parts = cleaned.split("/").filter(Boolean);
  if (parts.length < 2) throw new Error(`Invalid repo ref: ${s}`);
  return { owner: parts[0], repo: parts[1] };
}
