import type { Logger } from "pino";
import { z } from "zod";
import type { Observation } from "./observer.js";
import { HttpError } from "@nuttoo/errors";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";

export const SummarizeConfigSchema = z.object({
  mode: z.enum(["heuristic", "llm"]).default("heuristic"),
  llm: z.object({
    provider: z.enum(["openai", "anthropic", "custom"]).default("custom"),
    endpoint: z.string().url().optional(),
    apiKey: z.string().optional(),
    model: z.string().default("gpt-4.1-mini"),
    timeoutMs: z.coerce.number().int().positive().default(30_000),
  }).default({ provider: "custom", model: "gpt-4.1-mini" }),
  promptsDir: z.string().default("./src/prompts"),
});

export type SummarizeConfig = z.infer<typeof SummarizeConfigSchema>;

export async function summarize(opts: { log: Logger; cfg: SummarizeConfig; observation: Observation }): Promise<{ summary: string; fingerprint: string }> {
  const { log, cfg, observation } = opts;
  const fingerprint = createHash("sha256").update(JSON.stringify(observation)).digest("hex");

  if (cfg.mode === "heuristic") {
    const s = heuristicSummary(observation);
    return { summary: s, fingerprint };
  }

  const prompt = await loadPrompt(cfg.promptsDir, "summarize.md").catch(() => null);
  if (!prompt) {
    log.warn("missing summarize prompt; falling back to heuristic");
    return { summary: heuristicSummary(observation), fingerprint };
  }

  const msg = `${prompt}\n\nOBSERVATION_JSON:\n${JSON.stringify(observation, null, 2)}`;
  const text = await callLlm({ cfg, log, message: msg });
  return { summary: text.trim(), fingerprint };
}

function heuristicSummary(o: Observation): string {
  const parts: string[] = [];
  parts.push(`Observation @ ${new Date(o.at).toISOString()}`);

  if (o.github.length) {
    parts.push(`GitHub: ${o.github.length} repo(s) checked`);
    for (const r of o.github) parts.push(`- ${r.repo} head=${r.headSha ?? "unknown"}`);
  } else {
    parts.push("GitHub: none");
  }

  if (o.npm.length) {
    parts.push(`NPM: ${o.npm.length} package(s) checked`);
    for (const p of o.npm) parts.push(`- ${p.pkg} version=${p.version ?? "unknown"}`);
  } else {
    parts.push("NPM: none");
  }

  if (o.onchain.length) {
    parts.push(`Onchain: ${o.onchain.map((x) => `${x.kind}:${x.note}`).join(", ")}`);
  } else {
    parts.push("Onchain: none");
  }

  return parts.join("\n");
}

async function loadPrompt(dir: string, filename: string): Promise<string> {
  const p = path.join(dir, filename);
  return await readFile(p, "utf-8");
}

async function callLlm(opts: { cfg: SummarizeConfig; log: Logger; message: string }): Promise<string> {
  const { cfg, log, message } = opts;

  if (!cfg.llm.endpoint) throw new HttpError(400, "LLM_ENDPOINT_REQUIRED", "LLM endpoint is required");

  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), cfg.llm.timeoutMs);

  try {
    const res = await fetch(cfg.llm.endpoint, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        ...(cfg.llm.apiKey ? { authorization: `Bearer ${cfg.llm.apiKey}` } : {}),
      },
      body: JSON.stringify({ model: cfg.llm.model, input: message }),
      signal: controller.signal,
    });

    const text = await res.text();
    if (!res.ok) {
      log.warn({ status: res.status, text: text.slice(0, 600) }, "llm_call_failed");
      throw new HttpError(502, "LLM_ERROR", "LLM request failed", { status: res.status });
    }

    const json = safeJson(text);
    if (typeof json?.output === "string") return json.output;
    if (typeof json?.text === "string") return json.text;
    const c = json?.choices?.[0]?.message?.content;
    if (typeof c === "string") return c;

    return typeof text === "string" ? text : String(text);
  } finally {
    clearTimeout(t);
  }
}

function safeJson(s: string): any {
  try { return JSON.parse(s); } catch { return null; }
}
