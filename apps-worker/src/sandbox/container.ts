import { mkdtemp, rm, writeFile, readFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";
import type { SandboxLimits } from "./limits.js";
import { canUseFirejail, runWithFirejail } from "./firejail.js";

export type SandboxInput = {
  entryFile: string;
  files: Array<{ relPath: string; content: string }>;
  args?: string[];
  env?: Record<string, string>;
  limits: SandboxLimits;
};

export type SandboxOutput = {
  ok: boolean;
  exitCode: number | null;
  signal: NodeJS.Signals | null;
  stdout: string;
  stderr: string;
  durationMs: number;
};

export async function runSandbox(input: SandboxInput): Promise<SandboxOutput> {
  const started = Date.now();
  const dir = await mkdtemp(path.join(os.tmpdir(), "nuttoo-sbx-"));

  try {
    for (const f of input.files) {
      const filePath = path.join(dir, f.relPath);
      await ensureDir(path.dirname(filePath));
      await writeFile(filePath, f.content, "utf-8");
    }

    const nodeArgs = ["node", input.entryFile, ...(input.args ?? [])];
    const execArgs = nodeArgs;

    let result: { code: number | null; signal: NodeJS.Signals | null; stdout: string; stderr: string; timedOut: boolean };

    if (canUseFirejail()) {
      result = await runWithFirejail({
        cwd: dir,
        env: input.env,
        args: execArgs,
        limits: input.limits,
      });
    } else {
      result = await spawnPlain({
        cwd: dir,
        env: input.env,
        args: execArgs,
        timeoutMs: input.limits.wallTimeMs,
        maxOutputBytes: input.limits.maxOutputBytes,
      });
    }

    const durationMs = Date.now() - started;
    const ok = !!result && !result.timedOut && result.code === 0;

    return {
      ok,
      exitCode: result.code,
      signal: result.signal,
      stdout: result.stdout,
      stderr: result.stderr,
      durationMs,
    };
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

async function ensureDir(p: string): Promise<void> {
  await import("node:fs/promises").then(({ mkdir }) => mkdir(p, { recursive: true }));
}

async function spawnPlain(input: {
  cwd: string;
  env?: Record<string, string>;
  args: string[];
  timeoutMs: number;
  maxOutputBytes: number;
}): Promise<{ code: number | null; signal: NodeJS.Signals | null; stdout: string; stderr: string; timedOut: boolean }> {
  const child = spawn(input.args[0], input.args.slice(1), {
    cwd: input.cwd,
    env: { ...process.env, ...(input.env ?? {}) },
    stdio: ["ignore", "pipe", "pipe"],
  });

  let stdout = "";
  let stderr = "";
  let timedOut = false;

  const collect = (buf: Buffer, target: "stdout" | "stderr") => {
    const s = buf.toString("utf-8");
    if (target === "stdout") stdout += s;
    else stderr += s;

    if (stdout.length + stderr.length > input.maxOutputBytes) {
      child.kill("SIGKILL");
      stderr += "\nOUTPUT_LIMIT_EXCEEDED";
    }
  };

  child.stdout?.on("data", (b: Buffer) => collect(b, "stdout"));
  child.stderr?.on("data", (b: Buffer) => collect(b, "stderr"));

  const t = setTimeout(() => {
    timedOut = true;
    child.kill("SIGKILL");
  }, input.timeoutMs);

  const [code, signal] = await new Promise<[number | null, NodeJS.Signals | null]>((resolve) => {
    child.on("close", (c, s) => resolve([c, s]));
  });

  clearTimeout(t);

  return { code, signal, stdout, stderr, timedOut };
}
