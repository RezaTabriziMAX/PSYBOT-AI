import { z } from "zod";
import type { FastifyInstance } from "fastify";
import { PolicyService } from "../services/policy.service.js";
import { ModuleService } from "../services/module.service.js";

const CreateModuleSchema = z.object({
  name: z.string().min(1),
  version: z.string().min(1),
  description: z.string().optional(),
  manifest: z.unknown().optional(),
  artifactBase64: z.string().optional(),
});

export function registerModulesController(app: FastifyInstance, deps: { policy: PolicyService; modules: ModuleService }) {
  app.get("/modules", async (req) => {
    deps.policy.assertCanRead(actorFrom(req));
    return deps.modules.list();
  });

  app.get("/modules/:id", async (req) => {
    deps.policy.assertCanRead(actorFrom(req));
    const id = (req.params as any).id as string;
    return deps.modules.get(id);
  });

  app.post("/modules", async (req) => {
    deps.policy.assertCanWrite(actorFrom(req));
    const body = CreateModuleSchema.parse(req.body);
    return deps.modules.create(body);
  });
}

function actorFrom(req: any) {
  return { subject: req.auth?.subject ?? "anonymous", mode: req.auth?.mode ?? "off" };
}
