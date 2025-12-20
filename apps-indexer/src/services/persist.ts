import type { PrismaClient } from "@nuttoo/db";
import type { Logger } from "pino";
import type { MetricsService } from "./metrics.js";
import type { RegistryEvent } from "../parsers/registry.events.js";
import type { ForkEvent } from "../parsers/fork.events.js";
import type { RunEvent } from "../parsers/run.events.js";

export class PersistService {
  constructor(private readonly db: PrismaClient, private readonly log: Logger, private readonly _metrics: MetricsService) {}

  async persistEvents(input: {
    slot: number;
    signature: string;
    registry: RegistryEvent[];
    forks: ForkEvent[];
    runs: RunEvent[];
  }) {
    const { slot, signature, registry, forks, runs } = input;

    await this.db.indexerEvent.create({
      data: { slot, signature, payload: { registry, forks, runs } as any },
    }).catch((err) => {
      this.log.warn({ err, slot, signature }, "indexer_event_insert_failed");
    });

    for (const e of registry) {
      if (e.type === "ModuleRegistered") {
        await this.db.module.upsert({
          where: { id: e.moduleId },
          create: {
            id: e.moduleId,
            name: e.name ?? "unknown",
            version: e.version ?? "0.0.0",
            description: null,
            manifest: {},
            manifestSha256: e.manifestSha256 ?? "",
            status: "ACTIVE",
          },
          update: {
            name: e.name ?? undefined,
            version: e.version ?? undefined,
            manifestSha256: e.manifestSha256 ?? undefined,
          },
        }).catch((err) => this.log.warn({ err, e }, "module_upsert_failed"));
      }

      if (e.type === "ModuleStatusChanged") {
        await this.db.module.update({ where: { id: e.moduleId }, data: { status: e.status as any } })
          .catch((err) => this.log.warn({ err, e }, "module_status_update_failed"));
      }
    }

    for (const e of forks) {
      if (e.type === "ForkCreated") {
        await this.db.fork.upsert({
          where: { id: e.forkId },
          create: {
            id: e.forkId,
            moduleId: e.moduleId,
            parentForkId: e.parentForkId ?? null,
            notes: null,
            status: "ACTIVE",
          },
          update: { parentForkId: e.parentForkId ?? undefined },
        }).catch((err) => this.log.warn({ err, e }, "fork_upsert_failed"));
      }

      if (e.type === "ForkStatusChanged") {
        await this.db.fork.update({ where: { id: e.forkId }, data: { status: e.status as any } })
          .catch((err) => this.log.warn({ err, e }, "fork_status_update_failed"));
      }
    }

    for (const e of runs) {
      if (e.type === "RunCreated") {
        await this.db.run.upsert({
          where: { id: e.runId },
          create: {
            id: e.runId,
            moduleId: e.moduleId,
            forkId: e.forkId ?? null,
            input: {},
            status: "CREATED",
          },
          update: { moduleId: e.moduleId, forkId: e.forkId ?? undefined },
        }).catch((err) => this.log.warn({ err, e }, "run_upsert_failed"));
      }

      if (e.type === "RunStatus") {
        await this.db.run.update({ where: { id: e.runId }, data: { status: e.status as any } })
          .catch((err) => this.log.warn({ err, e }, "run_status_update_failed"));
      }
    }
  }
}
