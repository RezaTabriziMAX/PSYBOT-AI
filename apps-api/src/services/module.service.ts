import { HttpError } from "@nuttoo/errors";
import { createHash } from "node:crypto";
import type { PrismaClient } from "@nuttoo/db";
import { StorageService } from "./storage.service.js";

export type CreateModuleInput = {
  name: string;
  version: string;
  description?: string;
  manifest?: unknown;
  artifactBase64?: string;
};

export class ModuleService {
  constructor(private readonly db: PrismaClient, private readonly storage: StorageService) {}

  async list() {
    return this.db.module.findMany({ orderBy: { createdAt: "desc" }, take: 200 });
  }

  async get(id: string) {
    const m = await this.db.module.findUnique({ where: { id }, include: { forks: true } });
    if (!m) throw new HttpError(404, "NOT_FOUND", "Module not found");
    return m;
  }

  async create(input: CreateModuleInput) {
    if (!input.name || !input.version) throw new HttpError(400, "VALIDATION_ERROR", "name and version are required");

    let artifactKey: string | null = null;
    let artifactSha256: string | null = null;
    let artifactSize: number | null = null;

    if (input.artifactBase64) {
      const bytes = Buffer.from(input.artifactBase64, "base64");
      const put = await this.storage.putObject({ bytes });
      artifactKey = put.key;
      artifactSha256 = put.sha256;
      artifactSize = put.size;
    }

    const manifestSha = createHash("sha256").update(JSON.stringify(input.manifest ?? {})).digest("hex");

    return this.db.module.create({
      data: {
        name: input.name,
        version: input.version,
        description: input.description ?? null,
        manifest: (input.manifest ?? {}) as any,
        manifestSha256: manifestSha,
        artifactKey,
        artifactSha256,
        artifactSize,
        status: "ACTIVE",
      },
    });
  }
}
