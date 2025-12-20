import { HttpError } from "@nuttoo/errors";
import type { PrismaClient } from "@nuttoo/db";

export type CreateForkInput = {
  moduleId: string;
  notes?: string;
  parentForkId?: string;
};

export class ForkService {
  constructor(private readonly db: PrismaClient) {}

  async listByModule(moduleId: string) {
    return this.db.fork.findMany({ where: { moduleId }, orderBy: { createdAt: "desc" }, take: 200 });
  }

  async create(input: CreateForkInput) {
    if (!input.moduleId) throw new HttpError(400, "VALIDATION_ERROR", "moduleId is required");

    const mod = await this.db.module.findUnique({ where: { id: input.moduleId } });
    if (!mod) throw new HttpError(404, "NOT_FOUND", "Module not found");

    if (input.parentForkId) {
      const parent = await this.db.fork.findUnique({ where: { id: input.parentForkId } });
      if (!parent) throw new HttpError(404, "NOT_FOUND", "Parent fork not found");
      if (parent.moduleId !== input.moduleId) throw new HttpError(400, "VALIDATION_ERROR", "parentForkId must belong to the same module");
    }

    return this.db.fork.create({
      data: {
        moduleId: input.moduleId,
        notes: input.notes ?? null,
        parentForkId: input.parentForkId ?? null,
        status: "ACTIVE",
      },
    });
  }
}
