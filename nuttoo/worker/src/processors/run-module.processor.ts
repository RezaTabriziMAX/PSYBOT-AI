import crypto from "node:crypto";
import { readSandboxLimits } from "../sandbox/limits.js";
import { ContainerSandbox } from "../sandbox/container.js";
import { FirejailSandbox } from "../sandbox/firejail.js";

export type RunModuleJob = {
  artifact: {
    image?: string;
    entry?: string;
    command?: string[];
    runtime: "node" | "container";
  };
  input: unknown;
  policy?: {   
    timeoutMs?: number;
    net?: "none" | "egress";
    memoryMb?: number;
  };
};

export type RunModuleResult = {
  ok: boolean;
  stdout: string;
  stderr: string;
  durationMs: number;
  outputHashSha256: string;
};

function sha256Hex(s: string) {
  return crypto.createHash("sha256").update(s, "utf-8").digest("hex");
}

export async function runModuleProcessor(job: RunModuleJob): Promise<RunModuleResult> {
  const baseLimits = readSandboxLimits(process.env);

  const limits = {
    ...baseLimits,
    timeoutMs: job.policy?.timeoutMs ?? baseLimits.timeoutMs,
    net: job.policy?.net ?? baseLimits.net,
    memoryMb: job.policy?.memoryMb ?? baseLimits.memoryMb,
  };

  const payload = JSON.stringify(job.input ?? {});
  const env = {
    NUTTOO_INPUT_JSON: payload,
    NODE_ENV: "production",
  };

  const mode = (process.env.SANDBOX_MODE ?? "container").toLowerCase();

  let stdout = "";
  let stderr = "";
  let durationMs = 0;

  if (job.artifact.runtime === "container") {
    const image = job.artifact.image ?? "nuttoo/module-runtime:latest";
    const command = job.artifact.command ?? ["node", job.artifact.entry ?? "/work/index.mjs"];
    const sbx = new ContainerSandbox(limits);
    const res = await sbx.run({ image, command, workdir: "/work", env, mounts: [] });
    stdout = res.stdout;
    stderr = res.stderr;
    durationMs = res.durationMs;
    if (!res.ok) throw new Error(`sandbox failed: exit=${res.exitCode} timedOut=${res.timedOut}`);
  } else {
    const cmd = job.artifact.command ?? ["node", job.artifact.entry ?? "index.mjs"];
    if (mode === "firejail") {
      const sbx = new FirejailSandbox(limits);
      const res = await sbx.run({ command: cmd, env, workdir: process.cwd() });
      stdout = res.stdout;
      stderr = res.stderr;
      durationMs = res.durationMs;
      if (!res.ok) throw new Error(`firejail failed: exit=${res.exitCode} timedOut=${res.timedOut}`);
    } else {
      const sbx = new ContainerSandbox(limits);
      const res = await sbx.run({
        image: "node:20-alpine",
        command: ["node", "-e", "console.log(process.env.NUTTOO_INPUT_JSON||'{}')"],
        env,
      });
      stdout = res.stdout;
      stderr = res.stderr;
      durationMs = res.durationMs;
      if (!res.ok) throw new Error(`container failed: exit=${res.exitCode} timedOut=${res.timedOut}`);
    }
  }

  return {
    ok: true,
    stdout,
    stderr,
    durationMs,
    outputHashSha256: sha256Hex(stdout.trim()),
  };
}
