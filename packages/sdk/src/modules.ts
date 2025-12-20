import { NuttooClient } from "./client";
import { ModuleRecord, Pagination } from "./types";

export class ModulesAPI {
  constructor(private readonly client: NuttooClient) {}

  list(p: Pagination = {}): Promise<ModuleRecord[]> {
    const qs = new URLSearchParams();
    if (p.take != null) qs.set("take", String(p.take));
    if (p.skip != null) qs.set("skip", String(p.skip));
    const q = qs.toString();
    return this.client.get(`/modules${q ? "?" + q : ""}`);
  }

  get(id: string): Promise<ModuleRecord> {
    return this.client.get(`/modules/${encodeURIComponent(id)}`);
  }
}
