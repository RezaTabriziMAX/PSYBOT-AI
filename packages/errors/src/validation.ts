import { z, ZodError } from "zod";
import { HttpError } from "./http";

export function zodToHttp(err: ZodError): HttpError {
  return new HttpError("E_VALIDATION", "Validation failed", {
    issues: err.issues.map(i => ({
      path: i.path.join("."),
      message: i.message,
      code: i.code,
    })),
  });
}

export function parseOrThrow<T>(schema: z.ZodType<T>, input: unknown): T {
  const res = schema.safeParse(input);
  if (res.success) return res.data;
  throw zodToHttp(res.error);
}
