import type { FastifyPluginAsync } from "fastify";
import { timingSafeEqual } from "node:crypto";
import { HttpError } from "@nuttoo/errors";

export const webhooksRoutes: FastifyPluginAsync<{ sharedSecret?: string }> = async (app, opts) => {
  app.post("/webhooks/pumpfun", async (req) => {
    if (!opts.sharedSecret) throw new HttpError(501, "WEBHOOKS_DISABLED", "Webhook secret is not configured");

    const header = req.headers["x-webhook-signature"];
    const sig = typeof header === "string" ? header.trim() : "";
    if (!safeEq(sig, opts.sharedSecret)) throw new HttpError(401, "UNAUTHORIZED", "Invalid webhook signature");

    app.log.info({ body: req.body }, "webhook_received");
    return { ok: true };
  });
};

function safeEq(a: string, b: string): boolean {
  if (!a || !b) return false;
  const aa = Buffer.from(a);
  const bb = Buffer.from(b);
  if (aa.length !== bb.length) return false;
  return timingSafeEqual(aa, bb);
}
