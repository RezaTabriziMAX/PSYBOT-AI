import { z } from "zod";
import type { FastifyInstance } from "fastify";
import { PolicyService } from "../services/policy.service.js";
import { ForkService } from "../services/fork.service.js";

const CreateForkSchema = z.object({
  moduleId: z.string().min(1),
  notes: z.string().optional(),
  parentForkId: z.string().optional(),
});

export function registerForksController(app: FastifyInstance, deps: { policy: PolicyService; forks: ForkService }) {
  app.get("/modules/:moduleId/forks", async (req) => {
    deps.policy.assertCanRead(actorFrom(req));
    const moduleId = (req.params as any).moduleId as string;
    return deps.forks.listByModule(moduleId);
  });

  app.post("/forks", async (req) => {
    deps.policy.assertCanWrite(actorFrom(req));
    const body = CreateForkSchema.parse(req.body);
    return deps.forks.create(body);
  });
}

function actorFrom(req: any) {
  return { subject: req.auth?.subject ?? "anonymous", mode: req.auth?.mode ?? "off" };
}
