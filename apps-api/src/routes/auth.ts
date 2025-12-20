import type { FastifyPluginAsync } from "fastify";

export const authRoutes: FastifyPluginAsync = async (app) => {
  app.get("/auth/me", async (req) => ({
    mode: (req as any).auth?.mode ?? "off",
    subject: (req as any).auth?.subject ?? "anonymous",
  }));
};
