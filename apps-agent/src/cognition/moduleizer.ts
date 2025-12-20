import type { Logger } from "pino";
import { z } from "zod";
import type { Observation } from "./observer.js";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { createHash } from "node:crypto";
import { HttpError } from "@nuttoo/errors";

export const ModuleizeConfigSchema = z.object({
  mode: z.enum(["heuristic", "llm"]).default("heuristic"),
  llmEndpoint: z.string().url().optional(),
  llmApiKey: z.string().optional(),
  llmModel: z.string().default("gpt-4.1-mini"),
  timeoutMs: z.coerce.number().int().positive().default(45_000),
  promptsDir: z.string().default("./src/prompts"),
});

export type ModuleizeConfig = z.infer<typeof ModuleizeConfigSchema>;

export type ModuleizationPlan = {
  fingerprint: string;
  modules: Array<{
    name: string;
    version: string;
    description: string;
    suggestedInputs: Record<string, string>;
    suggestedOutputs: Record<string, string>;
    safetyNotes: string[];
  }>;
};

export async function moduleize(opts: { log: Logger; cfg: ModuleizeConfig; observation: Observation; summary: string }): Promise<ModuleizationPlan> {
  const { log, cfg, observation, summary } = opts;
  const fingerprint = createHash("sha256").update(summary + JSON.stringify(observation)).digest("hex");

  if (cfg.mode === "heuristic") {
    return heuristicModuleize({ fingerprint, summary });
  }

  const prompt = await loadPrompt(cfg.promptsDir, "moduleize.md").catch(() => null);
  if (!prompt) {
    log.warn("missing moduleize prompt; falling back to heuristic");
    return heuristicModuleize({ fingerprint, summary });
  }

  if (!cfg.llmEndpoint) throw new HttpError(400, "LLM_ENDPOINT_REQUIRED", "LLM endpoint is required");

  const msg = `${prompt}\n\nSUMMARY:\n${summary}\n\nOBSERVATION_JSON:\n${JSON.stringify(observation, null, 2)}`;
  const text = await callLlm({ cfg, log, message: msg });

  const plan = parsePlan(text, fingerprint);
  return plan ?? heuristicModuleize({ fingerprint, summary });
}

function heuristicModuleize(input: { fingerprint: string; summary: string }): ModuleizationPlan {
  const seed = input.summary.length % 7;
  const name = seed % 2 === 0 ? "repo-intake" : "signal-scan";
  return {
    fingerprint: input.fingerprint,
    modules: [
      {
        name,
        version: "0.1.0",
        description: "A minimal module suggested by the agent to bootstrap modularization.",
        suggestedInputs: { source: "string", mode: "string" },
        suggestedOutputs: { report: "string", fingerprint: "string" },
        safetyNotes: ["Validate inputs", "Avoid exfiltration", "Rate limit external calls"],
      },
    ],
  };
}

async function loadPrompt(dir: string, filename: string): Promise<string> {
  return await readFile(path.join(dir, filename), "utf-8");
}

async function callLlm(opts: { cfg: ModuleizeConfig; log: Logger; message: string }): Promise<string> {
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

function parsePlan(text: string, fingerprint: string): ModuleizationPlan | null {
  const m = text.match(/```json\s*([\s\S]*?)\s*```/i);
  const jsonText = m ? m[1] : null;
  if (!jsonText) return null;
  try {
    const obj = JSON.parse(jsonText);
    if (!obj || !Array.isArray(obj.modules)) return null;
    return {
      fingerprint,
      modules: obj.modules.map((x: any) => ({
        name: String(x.name ?? "module"),
        version: String(x.version ?? "0.1.0"),
        description: String(x.description ?? ""),
        suggestedInputs: (x.suggestedInputs ?? {}) as Record<string, string>,
        suggestedOutputs: (x.suggestedOutputs ?? {}) as Record<string, string>,
        safetyNotes: Array.isArray(x.safetyNotes) ? x.safetyNotes.map(String) : [],
      })),
    };
  } catch {
    return null;
  }
}
