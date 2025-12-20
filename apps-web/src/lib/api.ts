import { NuttooClient } from "@nuttoo/sdk";

export type ApiConfig = {
  baseUrl: string;
  jwt?: string;
  sharedSecret?: string;
};

export function createApiClient(cfg: ApiConfig): NuttooClient {
  return new NuttooClient({
    baseUrl: cfg.baseUrl,
    auth: { jwt: cfg.jwt, sharedSecret: cfg.sharedSecret },
    timeoutMs: 15_000,
  });
}

export function apiBaseUrl(): string {
  const envUrl = process.env.NEXT_PUBLIC_NUTTOO_API_URL;
  if (envUrl && envUrl.trim().length > 0) return envUrl.trim();
  return "http://localhost:8080";
}
