import { spawn } from "node:child_process";
import { randomUUID } from "node:crypto";
import { SandboxLimits } from "./limits.js";

export type SandboxRunInput = {
  image: string;
  command: string[];
  workdir?: string;
  env?: Record<string, string>;
  mounts?: Array<{ hostPath: string; containerPath: string; readOnly: boolean }>;
  stdin?: string;
};

export type SandboxRunResult = {
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

function withDefault<T>(v: T | undefined, d: T): T {
  return v === undefined ? d : v;
}

export class ContainerSandbox {
  constructor(private readonly limits: SandboxLimits) {}

  async run(input: SandboxRunInput): Promise<SandboxRunResult> {
    const start = nowMs();
    const id = `nuttoo-${randomUUID()}`;

    const mounts = input.mounts ?? [];
    const env = input.env ?? {};

    const args: string[] = [
      "run",
      "--rm",
      "--name",
      id,
      "--network",
      this.limits.net === "egress" ? "bridge" : "none",
      "--pids-limit",
      String(this.limits.pidsMax),
      "--memory",
      `${this.limits.memoryMb}m`,
      "--cpus",
      "1",
      "--security-opt",
      "no-new-privileges",
      "--cap-drop",
      "ALL",
    ];

    if (this.limits.fsReadOnly) {
      args.push("--read-only");
      args.push("--tmpfs", "/tmp:rw,noexec,nosuid,size=64m");
    }

    for (const m of mounts) {
      const ro = m.readOnly ? "ro" : "rw";
      args.push("-v", `${m.hostPath}:${m.containerPath}:${ro}`);
    }

    for (const [k, v] of Object.entries(env)) {
      args.push("-e", `${k}=${v}`);
    }

    const workdir = withDefault(input.workdir, "/work");
    args.push("-w", workdir);

    args.push(input.image, ...input.command);

    let stdout = "";
    let stderr = "";
    let timedOut = false;

    const child = spawn("docker", args, { stdio: ["pipe", "pipe", "pipe"] });

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
