import type { FastifyPluginAsync } from "fastify";
import type { PolicyService } from "../services/policy.service.js";
import type { ForkService } from "../services/fork.service.js";
import { registerForksController } from "../controllers/forks.controller.js";

export const forksRoutes: FastifyPluginAsync<{ policy: PolicyService; forks: ForkService }> = async (app, opts) => {
  registerForksController(app, opts);
};
