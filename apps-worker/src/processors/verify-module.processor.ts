import type { Logger } from "pino";
import { z } from "zod";
import { ArtifactStore } from "../services/artifacts.js";
import { createAttestation } from "../services/attestation.js";
import { createHash } from "node:crypto";

export const VerifyModuleJobSchema = z.object({
  moduleId: z.string().min(1),
  packedArtifactKey: z.string().min(1),
});

export type VerifyModuleJob = z.infer<typeof VerifyModuleJobSchema>;

export type VerifyModuleResult = {
  moduleId: string;
  ok: boolean;
  attestation: ReturnType<typeof createAttestation>;
  fingerprint: string;
};

export async function verifyModuleProcessor(opts: { log: Logger; store: ArtifactStore; job: unknown }): Promise<VerifyModuleResult> {
  const { log, store } = opts;
  const job = VerifyModuleJobSchema.parse(opts.job);

  const bytes = await store.getBytes(job.packedArtifactKey);
  const json = JSON.parse(new TextDecoder().decode(bytes));

  if (!json || typeof json.entryFile !== "string" || !Array.isArray(json.files)) {
    throw new Error("VERIFY_INVALID_BUNDLE");
  }

  const fingerprint = createHash("sha256").update(JSON.stringify(json)).digest("hex");
  const attestation = createAttestation({ moduleId: job.moduleId, fingerprint });

  log.info({ moduleId: job.moduleId, fingerprint }, "module_verified");

  return { moduleId: job.moduleId, ok: true, attestation, fingerprint };
}
