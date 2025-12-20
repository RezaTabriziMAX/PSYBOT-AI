export type SandboxLimits = {
  cpuTimeMs: number;
  wallTimeMs: number;
  maxOutputBytes: number;
  maxMemoryMb: number;
  maxFileBytes: number;
  maxFiles: number;
  network: "deny" | "allow";
};

export function defaultSandboxLimits(): SandboxLimits {
  return {
    cpuTimeMs: 2_000,
    wallTimeMs: 8_000,
    maxOutputBytes: 512_000,
    maxMemoryMb: 256,
    maxFileBytes: 10_000_000,
    maxFiles: 200,
    network: "deny",
  };
}

export function clampLimits(input: Partial<SandboxLimits>): SandboxLimits {
  const d = defaultSandboxLimits();
  const out: SandboxLimits = {
    cpuTimeMs: Math.max(250, Math.min(30_000, input.cpuTimeMs ?? d.cpuTimeMs)),
    wallTimeMs: Math.max(500, Math.min(120_000, input.wallTimeMs ?? d.wallTimeMs)),
    maxOutputBytes: Math.max(8_192, Math.min(10_000_000, input.maxOutputBytes ?? d.maxOutputBytes)),
    maxMemoryMb: Math.max(64, Math.min(4096, input.maxMemoryMb ?? d.maxMemoryMb)),
    maxFileBytes: Math.max(256_000, Math.min(200_000_000, input.maxFileBytes ?? d.maxFileBytes)),
    maxFiles: Math.max(10, Math.min(10_000, input.maxFiles ?? d.maxFiles)),
    network: input.network ?? d.network,
  };
  return out;
}
