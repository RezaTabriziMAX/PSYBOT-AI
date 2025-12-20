import fetch from "node-fetch";
import { authHeaders, AuthConfig } from "./auth";
import { ApiError } from "./types";

export type ClientOptions = {
  baseUrl: string;
  auth?: AuthConfig;
  timeoutMs?: number;
};

export class NuttooClient {
  private readonly baseUrl: string;
  private readonly auth?: AuthConfig;
  private readonly timeoutMs: number;

  constructor(opts: ClientOptions) {
    this.baseUrl = opts.baseUrl.replace(/\/$/, "");
    this.auth = opts.auth;
    this.timeoutMs = opts.timeoutMs ?? 15_000;
  }

  async get<T>(path: string): Promise<T> {
    return this.request<T>("GET", path);
  }

  async post<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>("POST", path, body);
  }

  async request<T>(method: string, path: string, body?: unknown): Promise<T> {
    const url = this.baseUrl + path;
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), this.timeoutMs);

    try {
      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          ...authHeaders(this.auth),
        },
        body: body == null ? undefined : JSON.stringify(body),
        signal: ctrl.signal as any,
      } as any);

      const text = await res.text();
      const data = text ? safeJson(text) : null;

      if (!res.ok) {
        const err: ApiError = {
          code: data?.code ?? "E_HTTP",
          message: data?.message ?? `HTTP ${res.status}`,
          status: res.status,
          details: data?.details,
        };
        throw Object.assign(new Error(err.message), { apiError: err });
      }

      return (data as T) ?? ({} as T);
    } finally {
      clearTimeout(timer);
    }
  }
}

function safeJson(s: string): any {
  try {
    return JSON.parse(s);
  } catch {
    return { raw: s };
  }
}
