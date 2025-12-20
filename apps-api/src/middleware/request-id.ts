import type { FastifyPluginAsync } from "fastify";
import { ulid } from "ulid";

declare module "fastify" {
  interface FastifyRequest {
    requestId: string;
  }
}

export const requestIdPlugin: FastifyPluginAsync = async (app) => {
  app.addHook("onRequest", async (req, reply) => {
    const header = req.headers["x-request-id"];
    const rid = typeof header === "string" && header.length > 4 ? header : ulid();
    req.requestId = rid;
    reply.header("x-request-id", rid);
  });
};
