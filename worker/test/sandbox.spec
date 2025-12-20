import test from "node:test";
import assert from "node:assert/strict";
import { readSandboxLimits } from "../src/sandbox/limits.js";

test("readSandboxLimits applies defaults", () => {
  const limits = readSandboxLimits({});
  assert.equal(limits.net, "none");
  assert.ok(limits.memoryMb > 0);
  assert.ok(limits.timeoutMs > 0);
});

test("readSandboxLimits validates numbers", () => {
  const limits = readSandboxLimits({
    SANDBOX_MEMORY_MB: "not-a-number",
    WORKER_JOB_TIMEOUT_MS: "-1",
    SANDBOX_PIDS_MAX: "0",
    SANDBOX_CPU_SECONDS: "10",
    SANDBOX_NET: "egress",
    SANDBOX_FS_READONLY: "false",
  } as any);

  assert.equal(limits.cpuSeconds, 10);
  assert.equal(limits.net, "egress");
  assert.equal(limits.fsReadOnly, false);
});
