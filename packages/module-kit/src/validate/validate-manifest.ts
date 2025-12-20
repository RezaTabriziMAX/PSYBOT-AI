import Ajv from "ajv";
import schema from "../spec/module.manifest.schema.json";

const ajv = new Ajv({ allErrors: true, strict: true });

const validate = ajv.compile(schema as any);

export function validateManifest(manifest: unknown): { ok: true } | { ok: false; errors: any[] } {
  const ok = validate(manifest);
  if (ok) return { ok: true };
  return { ok: false, errors: validate.errors ?? [] };
}
