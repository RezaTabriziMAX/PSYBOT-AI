import { spawn } from "node:child_process";
import { SandboxLimits } from "./limits.js";

export type FirejailRunInput = {
  command: string[];
  env?: Record<string, string>;
  workdir?: string;
  stdin?: string;
};

export type FirejailRunResult = {
  ok: boolean;
  exitCode: number | null;
  timedOut: boolean;
  stdout: string;
  stderr: string;
  durationMs: number;
};

function nowMs() {
  return Date.now();
}

export class FirejailSandbox {
  constructor(private readonly limits: SandboxLimits) {}

  async run(input: FirejailRunInput): Promise<FirejailRunResult> {
    const start = nowMs();
    const env = input.env ?? {};

    const args: string[] = [
      "--quiet",
      "--noprofile",
      "--nosound",
      "--private",
      "--private-tmp",
      "--private-dev",
      "--caps.drop=all",
      "--nonewprivs",
      "--rlimit-as=" + String(this.limits.memoryMb * 1024 * 1024),
      "--rlimit-cpu=" + String(this.limits.cpuSeconds),
      "--rlimit-nproc=" + String(this.limits.pidsMax),
    ];

    if (this.limits.net === "none") args.push("--net=none");
    if (input.workdir) args.push("--cwd=" + input.workdir);

    for (const [k, v] of Object.entries(env)) {
      args.push("--env=" + `${k}=${v}`);
    }

    args.push("--", ...input.command);

    let stdout = "";
    let stderr = "";
    let timedOut = false;

    const child = spawn("firejail", args, { stdio: ["pipe", "pipe", "pipe"] });

    child.stdout.on("data", (b) => (stdout += b.toString("utf-8")));
    child.stderr.on("data", (b) => (stderr += b.toString("utf-8")));

    if (input.stdin) child.stdin.write(input.stdin, "utf-8");
    child.stdin.end();

    const exitCode = await new Promise<number | null>((resolve) => {
      const t = setTimeout(() => {
        timedOut = true;
        try { child.kill("SIGKILL"); } catch {}
      }, this.limits.timeoutMs);

      child.on("close", (code) => {
        clearTimeout(t);
        resolve(code);
      });
    });

    const durationMs = nowMs() - start;
    const ok = !timedOut && exitCode === 0;
    return { ok, exitCode, timedOut, stdout, stderr, durationMs };
  }
}
