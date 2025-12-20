import { spawn } from "node:child_process";
import { RuntimeLimits, DEFAULT_LIMITS } from "./limits";

export type SandboxRunOptions = {
  cwd: string;
  command: string;
  args?: string[];
  env?: Record<string, string>;
  limits?: Partial<RuntimeLimits>;
  stdin?: string;
};

export type SandboxResult = {
  code: number | null;
  signal: NodeJS.Signals | null;
  stdout: string;
  stderr: string;
  durationMs: number;
  truncated: boolean;
};

export async function runInSandbox(opts: SandboxRunOptions): Promise<SandboxResult> {
  const limits = { ...DEFAULT_LIMITS, ...(opts.limits ?? {}) };
  const start = Date.now();

  return new Promise((resolve, reject) => {
    const child = spawn(opts.command, opts.args ?? [], {
      cwd: opts.cwd,
      env: { ...process.env, ...(opts.env ?? {}) },
      stdio: ["pipe", "pipe", "pipe"],
    });

    let stdout = "";
    let stderr = "";
    let truncated = false;

    const capAppend = (dst: string, chunk: Buffer) => {
      const next = dst + chunk.toString("utf8");
      if (Buffer.byteLength(next, "utf8") > limits.maxOutputBytes) {
        truncated = true;
        return next.slice(0, limits.maxOutputBytes);
      }
      return next;
    };

    const timer = setTimeout(() => {
      child.kill("SIGKILL");
    }, limits.timeoutMs);

    child.stdout.on("data", (d) => {
      stdout = capAppend(stdout, d);
    });
    child.stderr.on("data", (d) => {
      stderr = capAppend(stderr, d);
    });

    child.on("error", (e) => {
      clearTimeout(timer);
      reject(e);
    });

    child.on("close", (code, signal) => {
      clearTimeout(timer);
      resolve({
        code,
        signal,
        stdout,
        stderr,
        durationMs: Date.now() - start,
        truncated,
      });
    });

    if (opts.stdin != null) child.stdin.write(opts.stdin);
    child.stdin.end();
  });
}
