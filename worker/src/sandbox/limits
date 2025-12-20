export type SandboxLimits = {
  cpuSeconds: number;
  memoryMb: number;
  pidsMax: number;
  timeoutMs: number;
  fsReadOnly: boolean;
  net: "none" | "egress";
};

export function readSandboxLimits(env: NodeJS.ProcessEnv): SandboxLimits {
  const num = (v: string | undefined, d: number) => {
    const n = v ? Number(v) : Number.NaN;
    return Number.isFinite(n) && n > 0 ? n : d;
  };

  const str = (v: string | undefined, d: string) => (v && v.trim() ? v.trim() : d);

  const net = str(env.SANDBOX_NET, "none");
  const netMode: SandboxLimits["net"] = net === "egress" ? "egress" : "none";

  return {
    cpuSeconds: num(env.SANDBOX_CPU_SECONDS, 30),
    memoryMb: num(env.SANDBOX_MEMORY_MB, 512),
    pidsMax: num(env.SANDBOX_PIDS_MAX, 128),
    timeoutMs: num(env.WORKER_JOB_TIMEOUT_MS, 300_000),
    fsReadOnly: str(env.SANDBOX_FS_READONLY, "true") === "true",
    net: netMode,
  };
}
