import type { Logger } from "pino";
import { z } from "zod";
import { createHash } from "node:crypto";
import { ArtifactStore } from "../services/artifacts.js";

export const PackModuleJobSchema = z.object({
  moduleId: z.string().min(1),
  source: z.object({
    kind: z.enum(["git", "tarball", "inline"]),
    uri: z.string().optional(),
    files: z.array(z.object({ relPath: z.string(), content: z.string() })).optional(),
    entryFile: z.string().optional(),
  }),
  outputPrefix: z.string().default("modules/packed"),
});

export type PackModuleJob = z.infer<typeof PackModuleJobSchema>;

export type PackModuleResult = {
  moduleId: string;
  artifact: { key: string; sha256: string; size: number; contentType: string };
  manifestSha256: string;
};

export async function packModuleProcessor(opts: { log: Logger; store: ArtifactStore; job: unknown }): Promise<PackModuleResult> {
  const { log, store } = opts;
  const job = PackModuleJobSchema.parse(opts.job);

  // In this reference implementation, we only support inline packaging.
  if (job.source.kind !== "inline" || !job.source.files || !job.source.entryFile) {
    throw new Error("PACK_UNSUPPORTED_SOURCE");
  }

  const bundle = JSON.stringify({
    entryFile: job.source.entryFile,
    files: job.source.files,
  });

  const bytes = new TextEncoder().encode(bundle);
  const artifact = await store.putBytes(job.outputPrefix, bytes, "application/json");

  const manifestSha256 = createHash("sha256").update(bundle).digest("hex");
  log.info({ moduleId: job.moduleId, key: artifact.key }, "module_packed");

  return { moduleId: job.moduleId, artifact, manifestSha256 };
}
