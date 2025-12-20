import test from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

test("cli prints help", async () => {
  const cli = path.join(__dirname, "../dist/main.js");
  const out = await run([process.execPath, cli, "help"]);
  assert.match(out.stdout, /Usage:/);
});

function run(cmd: string[]): Promise<{ stdout: string; stderr: string; code: number | null }> {
  return new Promise((resolve) => {
    const p = spawn(cmd[0], cmd.slice(1), { stdio: ["ignore", "pipe", "pipe"] });
    let stdout = "";
    let stderr = "";
    p.stdout.on("data", (b) => stdout += b.toString("utf-8"));
    p.stderr.on("data", (b) => stderr += b.toString("utf-8"));
    p.on("close", (code) => resolve({ stdout, stderr, code }));
  });
}
