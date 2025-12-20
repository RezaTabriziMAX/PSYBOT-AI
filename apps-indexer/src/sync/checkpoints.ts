import type { PrismaClient } from "@nuttoo/db";
import type { Logger } from "pino";

export class Checkpoints {
  constructor(private readonly db: PrismaClient, private readonly log: Logger) {}

  async getLatest(stream: string): Promise<number | null> {
    const row = await this.db.indexerCheckpoint.findUnique({ where: { stream } }).catch(() => null);
    return row?.slot ?? null;
  }

  async saveLatest(stream: string, slot: number): Promise<void> {
    await this.db.indexerCheckpoint.upsert({
      where: { stream },
      create: { stream, slot },
      update: { slot },
    }).catch((err) => {
      this.log.error({ err, stream, slot }, "checkpoint_upsert_failed");
    });
  }
}
