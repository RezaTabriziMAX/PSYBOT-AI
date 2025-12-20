import { PrismaClient, Module } from "@prisma/client";

export class ModuleRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async upsertModule(params: {
    name: string;
    version: string;
    description?: string | null;
    manifest: any;
    ownerId?: string | null;
  }): Promise<Module> {
    const { name, version, description, manifest, ownerId } = params;
    return this.prisma.module.upsert({
      where: { name_version: { name, version } },
      update: { description: description ?? undefined, manifest, ownerId: ownerId ?? undefined },
      create: { name, version, description: description ?? undefined, manifest, ownerId: ownerId ?? undefined },
    });
  }

  async getById(id: string): Promise<Module | null> {
    return this.prisma.module.findUnique({ where: { id } });
  }

  async getByNameVersion(name: string, version: string): Promise<Module | null> {
    return this.prisma.module.findUnique({ where: { name_version: { name, version } } });
  }

  async list(params: { take?: number; skip?: number } = {}): Promise<Module[]> {
    return this.prisma.module.findMany({
      orderBy: { createdAt: "desc" },
      take: params.take ?? 50,
      skip: params.skip ?? 0,
    });
  }
}
