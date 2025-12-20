import { Worker } from "bullmq";
import { JobName } from "./jobs";

export async function shutdownWorkers(workers: Worker[]): Promise<void> {
  const closeOne = async (w: Worker) => {
    try {
      await w.close();
    } catch {
      // ignore
    }
  };
  await Promise.all(workers.map(closeOne));
}

export function workerId(service: string, name: JobName): string {
  return `${service}:${name}:${process.pid}`;
}
