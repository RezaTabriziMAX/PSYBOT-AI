export type AuthConfig = {
  jwt?: string;
  sharedSecret?: string;
};

export function authHeaders(auth?: AuthConfig): Record<string, string> {
  const headers: Record<string, string> = {};
  if (auth?.jwt) headers["Authorization"] = `Bearer ${auth.jwt}`;
  if (auth?.sharedSecret) headers["X-Nuttoo-Internal"] = auth.sharedSecret;
  return headers;
}
