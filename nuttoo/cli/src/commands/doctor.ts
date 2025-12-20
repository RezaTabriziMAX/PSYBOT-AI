import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

export async function doctorCommand(): Promise<void> {
  const script = process.env.NUTTOO_DOCTOR_SCRIPT ?? "scripts/doctor.sh";
  try {
    const { stdout, stderr } = await execFileAsync("bash", [script], { env: process.env });
    if (stdout) process.stdout.write(stdout);
    if (stderr) process.stderr.write(stderr);
  } catch (e: any) {
    process.stderr.write(String(e?.message ?? e) + "\n");
    process.exitCode = 1;
  }
}
