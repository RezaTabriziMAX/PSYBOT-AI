import { doctorCommand } from "./commands/doctor.js";
import { initCommand } from "./commands/init.js";

function help() {
  process.stdout.write(
    [
      "nuttoo",
      "",
      "Commands:",
      "  doctor        Validate local environment",
      "  init          Initialize local Nuttoo config directories",
      "",
    ].join("\n") + "\n"
  );
}

async function main() {
  const cmd = process.argv[2] ?? "help";
  if (cmd === "help" || cmd === "-h" || cmd === "--help") return help();
  if (cmd === "doctor") return doctorCommand();
  if (cmd === "init") return initCommand();

  process.stderr.write(`Unknown command: ${cmd}\n`);
  help();
  process.exitCode = 1;
}

main().catch((e) => {
  process.stderr.write(String(e?.stack ?? e) + "\n");
  process.exitCode = 1;
});
