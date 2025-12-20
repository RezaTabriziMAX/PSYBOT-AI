import { RegistryEntry, REGISTRY } from "./registry";
import { box } from "../ascii";
import { parseCommand } from "./parse";

export type BuiltinResult = { ok: true; lines: string[] } | { ok: false; lines: string[] };

export function runBuiltin(line: string): BuiltinResult | null {
  const cmd = parseCommand(line);
  if (!cmd.name) return null;

  if (cmd.name === "help") {
    const lines = ["Available commands:"].concat(REGISTRY.map((c: RegistryEntry) => `- ${c.usage} :: ${c.description}`));
    return { ok: true, lines: box(lines, 74) };
  }

  return null;
}
