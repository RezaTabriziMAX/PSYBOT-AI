import crypto from "node:crypto";
import { z } from "zod";

export type VerifyJob = {
  manifest: unknown;
  artifactSha256: string;
  allowedRuntimes?: Array<"node" | "container" | "native">;
};

export type VerifyResult = {
  ok: boolean;
  normalizedManifest: any;
};

const ManifestSchema = z.object({
  name: z.string().min(1),
  version: z.string().min(1),
  description: z.string().optional().default(""),
  kind: z.string().optional().default("module"),
  entryFile: z.string().min(1),
  runtime: z.object({
    kind: z.enum(["node", "container", "native"]).default("node"),
    version: z.string().default(">=18"),
  }),
  inputs: z.record(z.any()).optional().default({}),
  outputs: z.record(z.any()).optional().default({}),
  files: z
    .object({
      include: z.array(z.string()).optional().default(["**/*"]),
      exclude: z.array(z.string()).optional().default(["node_modules/**", "dist/**", "target/**"]),
    })
    .optional()
    .default({ include: ["**/*"], exclude: ["node_modules/**", "dist/**", "target/**"] }),
});

function isHex(s: string) {
  return /^[0-9a-f]{64}$/i.test(s);
}

export async function verifyModuleProcessor(job: VerifyJob): Promise<VerifyResult> {
  if (!isHex(job.artifactSha256)) throw new Error("invalid artifactSha256");

  const normalized = ManifestSchema.parse(job.manifest);

  const allowed = new Set(job.allowedRuntimes ?? ["node", "container", "native"]);
  if (!allowed.has(normalized.runtime.kind)) throw new Error(`runtime not allowed: ${normalized.runtime.kind}`);

  if (!/^[a-z0-9][a-z0-9\-_.]{1,80}$/i.test(normalized.name)) throw new Error("invalid module name");

  crypto.createHash("sha256").update(job.artifactSha256, "utf-8").digest("hex");

  return { ok: true, normalizedManifest: normalized };
}
