import path from "node:path";
import fs from "node:fs/promises";
import { runInSandbox } from "./sandbox";
import { RuntimeLimits } from "./limits";

export type RunModuleOptions = {
  moduleDir: string;
  entrypoint: string;
  input: unknown;
  env?: Record<string, string>;
  limits?: Partial<RuntimeLimits>;
};

export type RunModuleResult = {
  ok: boolean;
  output?: unknown;
  stdout: string;
  stderr: string;
  durationMs: number;
  truncated: boolean;
};

export async function runModule(opts: RunModuleOptions): Promise<RunModuleResult> {
  const entry = path.join(opts.moduleDir, opts.entrypoint);

  await fs.access(entry);

  const result = await runInSandbox({
    cwd: opts.moduleDir,
    command: "node",
    args: [entry],
    env: { ...(opts.env ?? {}), NUTTOO_INPUT: JSON.stringify(opts.input ?? {}) },
    limits: opts.limits,
  });

  let output: unknown = undefined;
  try {
    output = tryParseJsonFromStdout(result.stdout);
  } catch {
    output = undefined;
  }

  const ok = (result.code ?? 1) === 0;

  return { ok, output, stdout: result.stdout, stderr: result.stderr, durationMs: result.durationMs, truncated: result.truncated };
}

function tryParseJsonFromStdout(stdout: string): unknown {
  const lines = stdout.trim().split("\n");
  for (let i = lines.length - 1; i >= 0; i--) {
    const line = lines[i].trim();
    if (!line) continue;
    if (line.startsWith("{") || line.startsWith("[")) {
      return JSON.parse(line);
    }
  }
  throw new Error("No JSON output detected");
}
