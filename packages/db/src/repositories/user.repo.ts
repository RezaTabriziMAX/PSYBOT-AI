import { PrismaClient, User } from "@prisma/client";

export class UserRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async upsertUser(params: { wallet?: string | null; handle?: string | null }): Promise<User> {
    const wallet = params.wallet ?? null;
    const handle = params.handle ?? null;

    if (!wallet && !handle) {
      throw new Error("wallet or handle required");
    }

    if (wallet) {
      return this.prisma.user.upsert({
        where: { wallet },
        update: { handle: handle ?? undefined },
        create: { wallet, handle: handle ?? undefined },
      });
    }

    return this.prisma.user.upsert({
      where: { handle: handle as string },
      update: { wallet: wallet ?? undefined },
      create: { handle: handle as string, wallet: wallet ?? undefined },
    });
  }

  async getById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { id } });
  }
}
