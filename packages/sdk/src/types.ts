export type ModuleRecord = {
  id: string;
  name: string;
  version: string;
  description?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ForkRecord = {
  id: string;
  moduleId: string;
  parentForkId?: string | null;
  lineageHash: string;
  createdAt: string;
};

export type RunRecord = {
  id: string;
  moduleId: string;
  forkId?: string | null;
  status: string;
  createdAt: string;
  startedAt?: string | null;
  finishedAt?: string | null;
  output?: unknown;
  error?: string | null;
};

export type Pagination = { take?: number; skip?: number };

export type ApiError = {
  code: string;
  message: string;
  status: number;
  details?: unknown;
};
