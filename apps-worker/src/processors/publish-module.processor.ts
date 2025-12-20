import type { Logger } from "pino";
import { z } from "zod";
import { createAttestation } from "../services/attestation.js";

export const PublishModuleJobSchema = z.object({
  moduleId: z.string().min(1),
  packedArtifactKey: z.string().min(1),
  verifiedFingerprint: z.string().min(1),
  destination: z.enum(["registry"]).default("registry"),
});

export type PublishModuleJob = z.infer<typeof PublishModuleJobSchema>;

export type PublishModuleResult = {
  moduleId: string;
  ok: boolean;
  attestation: ReturnType<typeof createAttestation>;
  destination: string;
};

export async function publishModuleProcessor(opts: { log: Logger; job: unknown }): Promise<PublishModuleResult> {
  const { log } = opts;
  const job = PublishModuleJobSchema.parse(opts.job);

  // In a full deployment, this would push artifacts to a registry and/or on-chain registry.
  // This reference version emits an attestation to be persisted by the API.
  const attestation = createAttestation({
    moduleId: job.moduleId,
    packedArtifactKey: job.packedArtifactKey,
    verifiedFingerprint: job.verifiedFingerprint,
    destination: job.destination,
  });

  log.info({ moduleId: job.moduleId, destination: job.destination }, "module_published");

  return { moduleId: job.moduleId, ok: true, attestation, destination: job.destination };
}
