export type RuntimeLimits = {
  maxCpuMs: number;
  maxMemoryMb: number;
  timeoutMs: number;
  maxOutputBytes: number;
};

export const DEFAULT_LIMITS: RuntimeLimits = {
  maxCpuMs: 5_000,
  maxMemoryMb: 512,
  timeoutMs: 10_000,
  maxOutputBytes: 1_000_000,
};
