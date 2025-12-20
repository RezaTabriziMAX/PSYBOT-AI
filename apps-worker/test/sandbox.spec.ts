import test from "node:test";
import assert from "node:assert/strict";
import { runSandbox } from "../src/sandbox/container.js";
import { defaultSandboxLimits } from "../src/sandbox/limits.js";

test("sandbox runs module entry and captures stdout", async () => {
  const limits = defaultSandboxLimits();
  const out = await runSandbox({
    entryFile: "entry.mjs",
    files: [
      { relPath: "entry.mjs", content: "console.log('ok');" },
    ],
    limits,
  });

  assert.equal(out.ok, true);
  assert.match(out.stdout, /ok/);
});

test("sandbox enforces wall time timeout", async () => {
  const limits = { ...defaultSandboxLimits(), wallTimeMs: 300 };
  const out = await runSandbox({
    entryFile: "entry.mjs",
    files: [
      { relPath: "entry.mjs", content: "await new Promise(r=>setTimeout(r, 5000));" },
    ],
    limits,
  });

  assert.equal(out.ok, false);
  assert.equal(out.exitCode === 0, false);
});

test("sandbox enforces output limit", async () => {
  const limits = { ...defaultSandboxLimits(), maxOutputBytes: 2000 };
  const out = await runSandbox({
    entryFile: "entry.mjs",
    files: [
      { relPath: "entry.mjs", content: "console.log('x'.repeat(50000));" },
    ],
    limits,
  });

  assert.equal(out.ok, false);
  assert.match(out.stderr, /OUTPUT_LIMIT_EXCEEDED/);
});
