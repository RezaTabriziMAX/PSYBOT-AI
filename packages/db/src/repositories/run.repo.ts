import { PrismaClient, Run, RunStatus } from "@prisma/client";

export class RunRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async createRun(params: {
    moduleId: string;
    forkId?: string | null;
    ownerId?: string | null;
    input?: any;
    traceId?: string | null;
  }): Promise<Run> {
    return this.prisma.run.create({
      data: {
        moduleId: params.moduleId,
        forkId: params.forkId ?? undefined,
        ownerId: params.ownerId ?? undefined,
        input: params.input ?? undefined,
        traceId: params.traceId ?? undefined,
        status: RunStatus.QUEUED,
      },
    });
  }

  async updateStatus(id: string, status: RunStatus, patch?: { output?: any; error?: string | null }): Promise<Run> {
    const now = new Date();
    const startedAt = status === RunStatus.RUNNING ? now : undefined;
    const finishedAt = [RunStatus.SUCCEEDED, RunStatus.FAILED, RunStatus.CANCELED].includes(status) ? now : undefined;

    return this.prisma.run.update({
      where: { id },
      data: {
        status,
        startedAt,
        finishedAt,
        output: patch?.output ?? undefined,
        error: patch?.error ?? undefined,
      },
    });
  }

  async getById(id: string): Promise<Run | null> {
    return this.prisma.run.findUnique({ where: { id } });
  }
}
