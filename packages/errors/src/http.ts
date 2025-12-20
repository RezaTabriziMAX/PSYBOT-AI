import { ErrorCode, ERROR_HTTP_STATUS } from "./codes";

export class HttpError extends Error {
  public readonly code: ErrorCode;
  public readonly status: number;
  public readonly details?: unknown;

  constructor(code: ErrorCode, message: string, details?: unknown) {
    super(message);
    this.name = "HttpError";
    this.code = code;
    this.status = ERROR_HTTP_STATUS[code] ?? 500;
    this.details = details;
  }
}

export function isHttpError(err: unknown): err is HttpError {
  return err instanceof HttpError;
}

export function toHttpError(err: unknown): HttpError {
  if (isHttpError(err)) return err;
  const msg = err instanceof Error ? err.message : String(err);
  return new HttpError("E_INTERNAL", msg);
}
