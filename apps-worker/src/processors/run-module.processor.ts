import type { Logger } from "pino";
import { z } from "zod";
import { ArtifactStore } from "../services/artifacts.js";
import { clampLimits } from "../sandbox/limits.js";
import { runSandbox } from "../sandbox/container.js";

export const RunModuleJobSchema = z.object({
  runId: z.string().min(1),
  moduleId: z.string().min(1),
  forkId: z.string().optional(),
  packedArtifactKey: z.string().min(1),
  input: z.unknown().optional(),
  limits: z.object({
    cpuTimeMs: z.number().optional(),
    wallTimeMs: z.number().optional(),
    maxOutputBytes: z.number().optional(),
    maxMemoryMb: z.number().optional(),
    maxFileBytes: z.number().optional(),
    maxFiles: z.number().optional(),
    network: z.enum(["deny", "allow"]).optional(),
  }).partial().optional(),
});

export type RunModuleJob = z.infer<typeof RunModuleJobSchema>;

export type RunModuleResult = {
  runId: string;
  ok: boolean;
  stdout: string;
  stderr: string;
  exitCode: number | null;
  durationMs: number;
};

export async function runModuleProcessor(opts: { log: Logger; store: ArtifactStore; job: unknown }): Promise<RunModuleResult> {
  const { log, store } = opts;
  const job = RunModuleJobSchema.parse(opts.job);

  const bytes = await store.getBytes(job.packedArtifactKey);
  const bundle = JSON.parse(new TextDecoder().decode(bytes));

  const files = Array.isArray(bundle.files) ? bundle.files : [];
  const entryFile = String(bundle.entryFile ?? "index.js");
  const limits = clampLimits(job.limits ?? {});

  const runnerBootstrap = createRunnerBootstrap(entryFile, job.input);

  const sbx = await runSandbox({
    entryFile: "runner.mjs",
    files: [
      ...files.map((f: any) => ({ relPath: String(f.relPath), content: String(f.content) })),
      { relPath: "runner.mjs", content: runnerBootstrap },
    ],
    args: [],
    env: { NUTTOO_RUN_ID: job.runId, NUTTOO_MODULE_ID: job.moduleId },
    limits,
  });

  log.info({ runId: job.runId, ok: sbx.ok, exitCode: sbx.exitCode, durationMs: sbx.durationMs }, "run_completed");

  return {
    runId: job.runId,
    ok: sbx.ok,
    stdout: sbx.stdout,
    stderr: sbx.stderr,
    exitCode: sbx.exitCode,
    durationMs: sbx.durationMs,
  };
}

function createRunnerBootstrap(entryFile: string, input: unknown): string {
  const safeInput = JSON.stringify(input ?? null);
  return `
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

process.env.NUTTOO_INPUT_JSON = ${JSON.stringify(safeInput)};
const entry = path.join(__dirname, ${JSON.stringify(entryFile)});
await import(entry);
`;
}
