import type { FastifyPluginAsync } from "fastify";
import type { PolicyService } from "../services/policy.service.js";
import type { ModuleService } from "../services/module.service.js";
import { registerModulesController } from "../controllers/modules.controller.js";

export const modulesRoutes: FastifyPluginAsync<{ policy: PolicyService; modules: ModuleService }> = async (app, opts) => {
  registerModulesController(app, opts);
};
