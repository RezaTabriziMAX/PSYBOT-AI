import { HttpError } from "@nuttoo/errors";

export type SandboxPolicy = {
  network: boolean;
  filesystem: "none" | "read-only" | "read-write";
  maxCpuMs: number;
  maxMemoryMb: number;
};

export function validateSandboxPolicy(policy: SandboxPolicy): void {
  if (policy.maxCpuMs <= 0) throw new HttpError("E_SANDBOX", "maxCpuMs must be > 0");
  if (policy.maxMemoryMb <= 0) throw new HttpError("E_SANDBOX", "maxMemoryMb must be > 0");
}
