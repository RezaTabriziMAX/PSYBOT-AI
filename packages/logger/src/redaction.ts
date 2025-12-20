export type RedactionOptions = {
  paths: string[];
  censor?: string;
};

const DEFAULT_CENSOR = "[REDACTED]";

export function redactObject<T extends Record<string, any>>(obj: T, opts: RedactionOptions): T {
  const censor = opts.censor ?? DEFAULT_CENSOR;
  const clone: any = Array.isArray(obj) ? [...obj] : { ...obj };

  for (const path of opts.paths) {
    const parts = path.split(".");
    let cur: any = clone;
    for (let i = 0; i < parts.length; i++) {
      const key = parts[i];
      if (cur == null || typeof cur !== "object") break;
      if (i === parts.length - 1) {
        if (key in cur) cur[key] = censor;
      } else {
        cur = cur[key];
      }
    }
  }
  return clone;
}
