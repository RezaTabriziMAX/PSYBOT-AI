import { NuttooClient } from "./client";
import { RunRecord } from "./types";

export class RunsAPI {
  constructor(private readonly client: NuttooClient) {}

  create(moduleId: string, input?: unknown, forkId?: string): Promise<RunRecord> {
    return this.client.post(`/runs`, { moduleId, input, forkId });
  }

  get(id: string): Promise<RunRecord> {
    return this.client.get(`/runs/${encodeURIComponent(id)}`);
  }
}
