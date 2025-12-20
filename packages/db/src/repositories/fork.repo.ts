import { PrismaClient, Fork } from "@prisma/client";

export class ForkRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async createFork(params: {
    moduleId: string;
    ownerId?: string | null;
    parentForkId?: string | null;
    lineageHash: string;
    notes?: string | null;
  }): Promise<Fork> {
    return this.prisma.fork.create({
      data: {
        moduleId: params.moduleId,
        ownerId: params.ownerId ?? undefined,
        parentForkId: params.parentForkId ?? undefined,
        lineageHash: params.lineageHash,
        notes: params.notes ?? undefined,
      },
    });
  }

  async getById(id: string): Promise<Fork | null> {
    return this.prisma.fork.findUnique({ where: { id } });
  }

  async listByModule(moduleId: string, take = 50): Promise<Fork[]> {
    return this.prisma.fork.findMany({
      where: { moduleId },
      orderBy: { createdAt: "desc" },
      take,
    });
  }
}
