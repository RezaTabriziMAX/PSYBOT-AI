import type { FastifyPluginAsync } from "fastify";
import type { PolicyService } from "../services/policy.service.js";
import type { RunService } from "../services/run.service.js";
import { registerRunsController } from "../controllers/runs.controller.js";

export const runsRoutes: FastifyPluginAsync<{ policy: PolicyService; runs: RunService }> = async (app, opts) => {
  registerRunsController(app, opts);
};
