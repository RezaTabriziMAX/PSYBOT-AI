import { z } from "zod";
import type { FastifyInstance } from "fastify";
import { PolicyService } from "../services/policy.service.js";
import { RunService } from "../services/run.service.js";

const CreateRunSchema = z.object({
  moduleId: z.string().min(1),
  forkId: z.string().optional(),
  input: z.unknown().optional(),
});

export function registerRunsController(app: FastifyInstance, deps: { policy: PolicyService; runs: RunService }) {
  app.get("/runs", async (req) => {
    deps.policy.assertCanRead(actorFrom(req));
    const take = Number((req.query as any)?.take ?? 20);
    return deps.runs.list(Number.isFinite(take) ? Math.min(Math.max(take, 1), 200) : 20);
  });

  app.get("/runs/:id", async (req) => {
    deps.policy.assertCanRead(actorFrom(req));
    const id = (req.params as any).id as string;
    return deps.runs.get(id);
  });

  app.post("/runs", async (req) => {
    deps.policy.assertCanWrite(actorFrom(req));
    const body = CreateRunSchema.parse(req.body);
    return deps.runs.create(body);
  });
}

function actorFrom(req: any) {
  return { subject: req.auth?.subject ?? "anonymous", mode: req.auth?.mode ?? "off" };
}
