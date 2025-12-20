import type { FastifyPluginAsync } from "fastify";
import { HttpError } from "@nuttoo/errors";
import { timingSafeEqual } from "node:crypto";

declare module "fastify" {
  interface FastifyRequest {
    auth?: {
      mode: "off" | "shared-secret" | "jwt";
      subject?: string;
      scopes?: string[];
    };
  }
}

export type AuthMode = "off" | "shared-secret" | "jwt";

export const authPlugin: FastifyPluginAsync<{ mode: AuthMode; sharedSecret?: string }> = async (app, opts) => {
  app.decorateRequest("auth", null);

  app.addHook("preHandler", async (req) => {
    if (opts.mode === "off") {
      (req as any).auth = { mode: "off", subject: "anonymous" };
      return;
    }

    if (opts.mode === "shared-secret") {
      const header = req.headers["authorization"];
      const token = typeof header === "string" ? header.replace(/^Bearer\s+/i, "").trim() : "";
      if (!opts.sharedSecret) throw new Error("AUTH_SHARED_SECRET is required for shared-secret mode");

      const ok = safeEq(token, opts.sharedSecret);
      if (!ok) throw new HttpError(401, "UNAUTHORIZED", "Missing or invalid token");

      (req as any).auth = { mode: "shared-secret", subject: "shared-secret" };
      return;
    }

    throw new HttpError(501, "AUTH_NOT_IMPLEMENTED", "JWT auth is not enabled in this build");
  });
};

function safeEq(a: string, b: string): boolean {
  if (!a || !b) return false;
  const aa = Buffer.from(a);
  const bb = Buffer.from(b);
  if (aa.length !== bb.length) return false;
  return timingSafeEqual(aa, bb);
}
