import { HttpError } from "@nuttoo/errors";
import type { PrismaClient } from "@nuttoo/db";
import type { QueueClient } from "@nuttoo/queue";

export type CreateRunInput = {
  moduleId: string;
  forkId?: string;
  input?: unknown;
};

export class RunService {
  constructor(private readonly db: PrismaClient, private readonly queue: QueueClient | null) {}

  async list(take: number) {
    return this.db.run.findMany({ orderBy: { createdAt: "desc" }, take, include: { module: true, fork: true } });
  }

  async get(id: string) {
    const r = await this.db.run.findUnique({ where: { id }, include: { module: true, fork: true } });
    if (!r) throw new HttpError(404, "NOT_FOUND", "Run not found");
    return r;
  }

  async create(input: CreateRunInput) {
    if (!input.moduleId) throw new HttpError(400, "VALIDATION_ERROR", "moduleId is required");

    const mod = await this.db.module.findUnique({ where: { id: input.moduleId } });
    if (!mod) throw new HttpError(404, "NOT_FOUND", "Module not found");

    if (input.forkId) {
      const fork = await this.db.fork.findUnique({ where: { id: input.forkId } });
      if (!fork) throw new HttpError(404, "NOT_FOUND", "Fork not found");
      if (fork.moduleId !== input.moduleId) throw new HttpError(400, "VALIDATION_ERROR", "forkId must belong to moduleId");
    }

    const run = await this.db.run.create({
      data: {
        moduleId: input.moduleId,
        forkId: input.forkId ?? null,
        input: (input.input ?? {}) as any,
        status: this.queue ? "QUEUED" : "CREATED",
      },
    });

    if (this.queue) {
      await this.queue.enqueue("run.execute", { runId: run.id });
    }

    return run;
  }
}
