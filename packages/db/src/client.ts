import { PrismaClient } from "@prisma/client";

export type DbClient = PrismaClient;

let _client: PrismaClient | null = null;

export function getDbClient(): PrismaClient {
  if (_client) return _client;
  _client = new PrismaClient({
    log: [{ emit: "event", level: "error" }],
  });
  return _client;
}

export async function connectDb(): Promise<PrismaClient> {
  const c = getDbClient();
  await c.$connect();
  return c;
}

export async function disconnectDb(): Promise<void> {
  if (!_client) return;
  await _client.$disconnect();
  _client = null;
}
