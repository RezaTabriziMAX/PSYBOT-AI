import chalk from "chalk";

export type Terminal = {
  info: (msg: string) => void;
  warn: (msg: string) => void;
  error: (msg: string) => void;
  success: (msg: string) => void;
  header: (title: string, subtitle?: string) => void;
  kv: (key: string, value: string) => void;
  hr: () => void;
};

export function createTerminal(): Terminal {
  return {
    info(msg) { process.stdout.write(chalk.cyan(msg) + "\n"); },
    warn(msg) { process.stdout.write(chalk.yellow(msg) + "\n"); },
    error(msg) { process.stderr.write(chalk.red(msg) + "\n"); },
    success(msg) { process.stdout.write(chalk.green(msg) + "\n"); },
    header(title, subtitle) {
      process.stdout.write(chalk.greenBright("NUTTOO") + " " + chalk.whiteBright(title) + "\n");
      if (subtitle) process.stdout.write(chalk.gray(subtitle) + "\n");
    },
    kv(key, value) {
      process.stdout.write(chalk.gray(key.padEnd(18)) + chalk.white(value) + "\n");
    },
    hr() {
      process.stdout.write(chalk.gray("─".repeat(Math.min(process.stdout.columns || 80, 100))) + "\n");
    },
  };
}

export function formatCmd(cmd: string): string {
  return chalk.whiteBright(cmd);
}

export function formatPath(p: string): string {
  return chalk.gray(p);
}
