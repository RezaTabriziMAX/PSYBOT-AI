import { NuttooClient } from "./client";
import { ForkRecord } from "./types";

export class ForksAPI {
  constructor(private readonly client: NuttooClient) {}

  create(moduleId: string, notes?: string): Promise<ForkRecord> {
    return this.client.post(`/forks`, { moduleId, notes });
  }

  get(id: string): Promise<ForkRecord> {
    return this.client.get(`/forks/${encodeURIComponent(id)}`);
  }
}
