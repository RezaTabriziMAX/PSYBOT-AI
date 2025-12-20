import type { Logger } from "pino";
import { z } from "zod";
import type { ModuleizationPlan } from "./moduleizer.js";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { HttpError } from "@nuttoo/errors";

export const ForkSuggestConfigSchema = z.object({
  mode: z.enum(["heuristic", "llm"]).default("heuristic"),
  llmEndpoint: z.string().url().optional(),
  llmApiKey: z.string().optional(),
  llmModel: z.string().default("gpt-4.1-mini"),
  timeoutMs: z.coerce.number().int().positive().default(45_000),
  promptsDir: z.string().default("./src/prompts"),
});

export type ForkSuggestConfig = z.infer<typeof ForkSuggestConfigSchema>;

export type ForkSuggestion = {
  moduleName: string;
  rationale: string;
  suggestedForkNotes: string;
};

export async function suggestForks(opts: {
  log: Logger;
  cfg: ForkSuggestConfig;
  plan: ModuleizationPlan;
  summary: string;
}): Promise<ForkSuggestion[]> {
  const { log, cfg, plan, summary } = opts;

  if (cfg.mode === "heuristic") {
    return heuristicForks(plan);
  }

  const prompt = await readFile(path.join(cfg.promptsDir, "fork.md"), "utf-8").catch(() => null);
  if (!prompt) {
    log.warn("missing fork prompt; falling back to heuristic");
    return heuristicForks(plan);
  }
  if (!cfg.llmEndpoint) throw new HttpError(400, "LLM_ENDPOINT_REQUIRED", "LLM endpoint is required");

  const msg = `${prompt}\n\nSUMMARY:\n${summary}\n\nPLAN_JSON:\n${JSON.stringify(plan, null, 2)}`;
  const text = await callLlm({ cfg, log, message: msg });

  const suggestions = parseSuggestions(text);
  return suggestions ?? heuristicForks(plan);
}

function heuristicForks(plan: ModuleizationPlan): ForkSuggestion[] {
  return plan.modules.slice(0, 3).map((m) => ({
    moduleName: m.name,
    rationale: "A fork can introduce alternative policies or I/O schemas while preserving lineage.",
    suggestedForkNotes: "Fork to adjust runtime limits and input validation; keep outputs stable.",
  }));
}

async function callLlm(opts: { cfg: ForkSuggestConfig; log: Logger; message: string }): Promise<string> {
  const { cfg, log, message } = opts;

  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), cfg.timeoutMs);

  try {
    const res = await fetch(cfg.llmEndpoint!, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        ...(cfg.llmApiKey ? { authorization: `Bearer ${cfg.llmApiKey}` } : {}),
      },
      body: JSON.stringify({ model: cfg.llmModel, input: message }),
      signal: controller.signal,
    });

    const raw = await res.text();
    if (!res.ok) {
      log.warn({ status: res.status, raw: raw.slice(0, 600) }, "llm_call_failed");
      throw new HttpError(502, "LLM_ERROR", "LLM request failed", { status: res.status });
    }

    const json = safeJson(raw);
    if (typeof json?.output === "string") return json.output;
    if (typeof json?.text === "string") return json.text;
    const c = json?.choices?.[0]?.message?.content;
    if (typeof c === "string") return c;
    return raw;
  } finally {
    clearTimeout(t);
  }
}

function safeJson(s: string): any {
  try { return JSON.parse(s); } catch { return null; }
}

function parseSuggestions(text: string): ForkSuggestion[] | null {
  const m = text.match(/```json\s*([\s\S]*?)\s*```/i);
  const jsonText = m ? m[1] : null;
  if (!jsonText) return null;
  try {
    const obj = JSON.parse(jsonText);
    const arr = Array.isArray(obj) ? obj : obj?.suggestions;
    if (!Array.isArray(arr)) return null;
    return arr.map((x: any) => ({
      moduleName: String(x.moduleName ?? x.module ?? "module"),
      rationale: String(x.rationale ?? ""),
      suggestedForkNotes: String(x.suggestedForkNotes ?? x.notes ?? ""),
    }));
  } catch {
    return null;
  }
}
