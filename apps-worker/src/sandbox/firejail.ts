import { spawn } from "node:child_process";
import type { SandboxLimits } from "./limits.js";

export type FirejailOptions = {
  cwd: string;
  env?: Record<string, string>;
  args: string[];
  limits: SandboxLimits;
};

export type FirejailResult = {
  code: number | null;
  signal: NodeJS.Signals | null;
  stdout: string;
  stderr: string;
  timedOut: boolean;
};

export function canUseFirejail(): boolean {
  return process.platform === "linux";
}

export async function runWithFirejail(opts: FirejailOptions): Promise<FirejailResult> {
  const { cwd, env, args, limits } = opts;

  const firejailArgs: string[] = [
    "--quiet",
    "--private",
    "--noroot",
    "--nonewprivs",
    "--caps.drop=all",
    "--seccomp",
    "--net=none",
    "--dns=0.0.0.0",
    "--rlimit-as=" + String(limits.maxMemoryMb * 1024 * 1024),
    "--rlimit-fsize=" + String(limits.maxFileBytes),
    "--",
    ...args,
  ];

  return await spawnAndCollect({
    cmd: "firejail",
    args: firejailArgs,
    cwd,
    env,
    timeoutMs: limits.wallTimeMs,
    maxOutputBytes: limits.maxOutputBytes,
  });
}

async function spawnAndCollect(input: {
  cmd: string;
  args: string[];
  cwd: string;
  env?: Record<string, string>;
  timeoutMs: number;
  maxOutputBytes: number;
}): Promise<FirejailResult> {
  const child = spawn(input.cmd, input.args, {
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
