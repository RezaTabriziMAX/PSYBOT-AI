/* eslint-disable no-console */
/**
 * Nuttoo database seed script
 *
 * Purpose:
 * - Initialize database with minimal, deterministic seed data
 * - Safe to run multiple times (idempotent)
 * - Designed for local/dev/test environments
 *
 * Assumptions:
 * - Prisma is used as ORM
 * - Prisma schema lives at packages/db/prisma/schema.prisma
 * - DATABASE_URL is set
 *
 * Usage:
 *   pnpm ts-node scripts/db/seed.ts
 *   node --loader ts-node/esm scripts/db/seed.ts
 *
 * Options (env):
 *   SEED_FORCE=1        Allow destructive reset of seed tables
 *   SEED_VERBOSE=1      Print detailed logs
 *
 * Exit codes:
 *   0 success
 *   1 failure
 */

import { PrismaClient } from "@prisma/client";
import crypto from "node:crypto";

const prisma = new PrismaClient();

type SeedConfig = {
  force: boolean;
  verbose: boolean;
};

function log(msg: string): void {
  console.log(`[seed] ${msg}`);
}

function vlog(cfg: SeedConfig, msg: string): void {
  if (cfg.verbose) console.log(`[seed][verbose] ${msg}`);
}

function die(msg: string): never {
  console.error(`[seed][error] ${msg}`);
  process.exit(1);
}

function envFlag(name: string): boolean {
  return process.env[name] === "1" || process.env[name] === "true";
}

function randomId(bytes = 8): string {
  return crypto.randomBytes(bytes).toString("hex");
}

async function ensureSystemUser(cfg: SeedConfig) {
  vlog(cfg, "ensuring system user");

  const existing = await prisma.user.findUnique({
    where: { handle: "nuttoo-system" }
  });

  if (existing) {
    vlog(cfg, "system user already exists");
    return existing;
  }

  const user = await prisma.user.create({
    data: {
      id: `sys_${randomId(6)}`,
      handle: "nuttoo-system",
      displayName: "Nuttoo System",
      role: "SYSTEM"
    }
  });

  log("created system user");
  return user;
}

async function ensureDefaultProject(cfg: SeedConfig, systemUserId: string) {
  vlog(cfg, "ensuring default project");

  const existing = await prisma.project.findUnique({
    where: { slug: "nuttoo-core" }
  });

  if (existing) {
    vlog(cfg, "default project already exists");
    return existing;
  }

  const project = await prisma.project.create({
    data: {
      id: `proj_${randomId(6)}`,
      slug: "nuttoo-core",
      name: "Nuttoo Core",
      description: "Core on-chain code organism",
      ownerId: systemUserId,
      visibility: "PUBLIC"
    }
  });

  log("created default project");
  return project;
}

async function ensureBaseModules(
  cfg: SeedConfig,
  projectId: string,
  systemUserId: string
) {
  vlog(cfg, "ensuring base modules");

  const modules = [
    {
      key: "runtime",
      name: "Runtime Core",
      description: "Minimal execution and lifecycle management"
    },
    {
      key: "registry",
      name: "Module Registry",
      description: "Module discovery and dependency resolution"
    },
    {
      key: "evolution",
      name: "Evolution Engine",
      description: "Learning, mutation, and fork tracking"
    },
    {
      key: "interface",
      name: "Developer Interface",
      description: "APIs and adapters for builders"
    }
  ];

  for (const m of modules) {
    const existing = await prisma.module.findUnique({
      where: {
        projectId_key: {
          projectId,
          key: m.key
        }
      }
    });

    if (existing) {
      vlog(cfg, `module exists: ${m.key}`);
      continue;
    }

    await prisma.module.create({
      data: {
        id: `mod_${randomId(6)}`,
        projectId,
        key: m.key,
        name: m.name,
        description: m.description,
        createdBy: systemUserId,
        version: "0.1.0",
        status: "ACTIVE"
      }
    });

    log(`created module: ${m.key}`);
  }
}

async function ensureSettings(cfg: SeedConfig) {
  vlog(cfg, "ensuring global settings");

  const settings = [
    { key: "nuttoo.name", value: "Nuttoo" },
    { key: "nuttoo.ticker", value: "NUTTOO" },
    { key: "nuttoo.mode", value: "development" },
    { key: "nuttoo.forking.enabled", value: "true" }
  ];

  for (const s of settings) {
    const existing = await prisma.setting.findUnique({
      where: { key: s.key }
    });

    if (existing) {
      vlog(cfg, `setting exists: ${s.key}`);
      continue;
    }

    await prisma.setting.create({
      data: {
        key: s.key,
        value: s.value
      }
    });

    log(`created setting: ${s.key}`);
  }
}

async function destructiveReset(cfg: SeedConfig) {
  if (!cfg.force) return;

  log("SEED_FORCE enabled, performing destructive reset");

  // Order matters due to foreign keys
  await prisma.module.deleteMany({});
  await prisma.project.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.setting.deleteMany({});

  log("destructive reset complete");
}

async function main(): Promise<void> {
  const cfg: SeedConfig = {
    force: envFlag("SEED_FORCE"),
    verbose: envFlag("SEED_VERBOSE")
  };

  log("starting seed");
  if (cfg.force) log("force mode enabled");

  try {
    await prisma.$connect();

    await destructiveReset(cfg);

    const systemUser = await ensureSystemUser(cfg);
    const project = await ensureDefaultProject(cfg, systemUser.id);
    await ensureBaseModules(cfg, project.id, systemUser.id);
    await ensureSettings(cfg);

    log("seed completed successfully");
  } catch (e) {
    const msg = e instanceof Error ? e.stack || e.message : String(e);
    die(msg);
  } finally {
    await prisma.$disconnect();
  }
}

main();
