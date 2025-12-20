import { createTerminal } from "../ui/terminal.js";

type Check = { name: string; ok: boolean; details?: string };

async function cmdVersion(bin: string, args: string[]): Promise<{ ok: boolean; out: string }> {
  try {
    const { spawn } = await import("node:child_process");
    const out = await new Promise<string>((resolve) => {
      const p = spawn(bin, args, { stdio: ["ignore", "pipe", "pipe"] });
      let s = "";
      p.stdout.on("data", (b) => s += b.toString("utf-8"));
      p.stderr.on("data", (b) => s += b.toString("utf-8"));
      p.on("close", () => resolve(s.trim()));
    });
    return { ok: out.length > 0, out };
  } catch (err) {
    return { ok: false, out: String(err) };
  }
}

export async function doctorCommand(): Promise<number> {
  const t = createTerminal();
  t.header("Doctor", "Environment checks for Nuttoo");

  const checks: Check[] = [];

  const node = { name: "node", ...await cmdVersion("node", ["-v"]) };
  checks.push({ name: "Node.js", ok: node.ok, details: node.out });

  const pnpm = { name: "pnpm", ...await cmdVersion("pnpm", ["-v"]) };
  checks.push({ name: "pnpm", ok: pnpm.ok, details: pnpm.out });

  const solana = { name: "solana", ...await cmdVersion("solana", ["--version"]) };
  checks.push({ name: "solana", ok: solana.ok, details: solana.out });

  const psql = { name: "psql", ...await cmdVersion("psql", ["--version"]) };
  checks.push({ name: "psql", ok: psql.ok, details: psql.out });

  t.hr();
  for (const c of checks) {
    const status = c.ok ? "OK" : "MISSING";
    t.kv(c.name, `${status}${c.details ? " · " + c.details : ""}`);
  }
  t.hr();

  const ok = checks.every((c) => c.ok);
  if (!ok) {
    t.warn("Some dependencies are missing. Install the missing tools and retry.");
    return 2;
  }
  t.success("All checks passed.");
  return 0;
}
