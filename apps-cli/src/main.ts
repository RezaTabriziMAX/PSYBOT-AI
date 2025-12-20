#!/usr/bin/env node
import { createTerminal, formatCmd } from "./ui/terminal.js";
import { doctorCommand } from "./commands/doctor.js";
import { initCommand } from "./commands/init.js";
import { loginCommand } from "./commands/login.js";

import { moduleCreateCommand } from "./commands/module/create.js";
import { modulePackCommand } from "./commands/module/pack.js";
import { modulePublishCommand } from "./commands/module/publish.js";
import { moduleSearchCommand } from "./commands/module/search.js";
import { moduleRunCommand } from "./commands/module/run.js";

import { forkCreateCommand } from "./commands/fork/create.js";
import { forkListCommand } from "./commands/fork/list.js";
import { forkDiffCommand } from "./commands/fork/diff.js";

import { devnetStartCommand } from "./commands/devnet/start.js";
import { devnetResetCommand } from "./commands/devnet/reset.js";

type ArgMap = Record<string, string | boolean>;

function parseArgs(argv: string[]): { positionals: string[]; flags: ArgMap } {
  const positionals: string[] = [];
  const flags: ArgMap = {};

  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith("--")) {
      const [k, v] = a.slice(2).split("=", 2);
      if (typeof v === "string") {
        flags[k] = v;
      } else {
        const next = argv[i + 1];
        if (next && !next.startsWith("-")) {
          flags[k] = next;
          i++;
        } else {
          flags[k] = true;
        }
      }
      continue;
    }
    if (a.startsWith("-")) {
      flags[a.slice(1)] = true;
      continue;
    }
    positionals.push(a);
  }

  return { positionals, flags };
}

function help(): void {
  const t = createTerminal();
  t.header("CLI", "Fallout-terminal style interface for Nuttoo");
  t.hr();

  t.info("Usage:");
  t.info(`  ${formatCmd("nuttoo <command> [subcommand] [--flags]")}`);
  t.hr();

  t.info("Commands:");
  t.info(`  ${formatCmd("nuttoo doctor")}`);
  t.info(`  ${formatCmd("nuttoo init")}`);
  t.info(`  ${formatCmd("nuttoo login --token <token>")}`);
  t.info("");
  t.info("Module:");
  t.info(`  ${formatCmd("nuttoo module create --dir <path>")}`);
  t.info(`  ${formatCmd("nuttoo module pack --dir <path> --out <file>")}`);
  t.info(`  ${formatCmd("nuttoo module publish --bundle <file> --api <url>")}`);
  t.info(`  ${formatCmd("nuttoo module search --q <text> --api <url>")}`);
  t.info(`  ${formatCmd("nuttoo module run --moduleId <id> --forkId <id?> --input <json?> --api <url>")}`);
  t.info("");
  t.info("Fork:");
  t.info(`  ${formatCmd("nuttoo fork create --moduleId <id> --notes <text?> --api <url>")}`);
  t.info(`  ${formatCmd("nuttoo fork list --moduleId <id> --api <url>")}`);
  t.info(`  ${formatCmd("nuttoo fork diff --forkA <id> --forkB <id> --api <url>")}`);
  t.info("");
  t.info("Devnet:");
  t.info(`  ${formatCmd("nuttoo devnet start")}`);
  t.info(`  ${formatCmd("nuttoo devnet reset")}`);

  t.hr();
}

async function main(): Promise<number> {
  const t = createTerminal();
  const { positionals, flags } = parseArgs(process.argv.slice(2));

  const cmd = positionals[0];
  const sub = positionals[1];

  if (!cmd || cmd === "help" || cmd === "--help" || flags["help"] === true || flags["h"] === true) {
    help();
    return 0;
  }

  if (cmd === "doctor") return await doctorCommand();
  if (cmd === "init") return await initCommand();
  if (cmd === "login") return await loginCommand({ token: typeof flags["token"] === "string" ? String(flags["token"]) : undefined });

  if (cmd === "module") {
    if (sub === "create") return await moduleCreateCommand({ dir: asString(flags["dir"]) });
    if (sub === "pack") return await modulePackCommand({ dir: asString(flags["dir"]), out: asString(flags["out"]) });
    if (sub === "publish") return await modulePublishCommand({ bundle: asString(flags["bundle"]), api: asString(flags["api"]) });
    if (sub === "search") return await moduleSearchCommand({ q: asString(flags["q"]), api: asString(flags["api"]) });
    if (sub === "run") return await moduleRunCommand({ moduleId: asString(flags["moduleId"]), forkId: asString(flags["forkId"]), input: asString(flags["input"]), api: asString(flags["api"]) });
    t.error("Unknown module subcommand");
    help();
    return 2;
  }

  if (cmd === "fork") {
    if (sub === "create") return await forkCreateCommand({ moduleId: asString(flags["moduleId"]), notes: asString(flags["notes"]), api: asString(flags["api"]) });
    if (sub === "list") return await forkListCommand({ moduleId: asString(flags["moduleId"]), api: asString(flags["api"]) });
    if (sub === "diff") return await forkDiffCommand({ forkA: asString(flags["forkA"]), forkB: asString(flags["forkB"]), api: asString(flags["api"]) });
    t.error("Unknown fork subcommand");
    help();
    return 2;
  }

  if (cmd === "devnet") {
    if (sub === "start") return await devnetStartCommand();
    if (sub === "reset") return await devnetResetCommand();
    t.error("Unknown devnet subcommand");
    help();
    return 2;
  }

  t.error("Unknown command: " + cmd);
  help();
  return 2;
}

function asString(v: string | boolean | undefined): string | undefined {
  return typeof v === "string" ? v : undefined;
}

main().then((code) => {
  process.exitCode = code;
}).catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exitCode = 1;
});
