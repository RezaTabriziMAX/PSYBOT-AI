# Deployment

Nuttoo is a multi-service system. Production deployments should treat it like infrastructure, not a single app.

This document provides:
- deployment options (Docker Compose, Kubernetes, ECS/Terraform)
- configuration and secrets guidance
- migrations and seeding strategy
- health checks and observability
- rollback and incident basics

---

## Components

Nuttoo consists of:

- API (`api/`): request validation, orchestration, registry operations
- Worker (`worker/`): queue processors, sandbox execution, artifact pipeline
- Agent (`agent/`): continuous cognition loop
- Indexer (`indexer/`): chain event ingestion and persistence
- Web (`apps/web/`): terminal-style UI
- Postgres: persistence
- Redis: queue backend (recommended)

Execution of untrusted modules happens off-chain in the worker sandbox.

---

## Environment variables

Recommended minimum:

- `NODE_ENV` = `production`
- `NUTTOO_API_PORT` (default `8080`)
- `NUTTOO_API_BASE_URL`
- `DATABASE_URL`
- `REDIS_URL`
- `SOLANA_CLUSTER` (`mainnet-beta` | `devnet` | `localnet`)
- `SOLANA_RPC_URL`
- `NUTTOO_STORAGE_BACKEND` (`local` | `s3`)
- `NUTTOO_STORAGE_PATH` (for `local`)
- `NUTTOO_S3_BUCKET`, `NUTTOO_S3_REGION`, `NUTTOO_S3_PREFIX` (for `s3`)
- `NUTTOO_SIGNER_MODE` (`file` | `json` | `kms`)
- `NUTTOO_SIGNER_KEYPAIR_PATH` (if `file`)
- `NUTTOO_SIGNER_KEYPAIR_JSON` (if `json`, injected securely)
- `WORKER_CONCURRENCY` (default `4`)
- `WORKER_JOB_TIMEOUT_MS` (default `300000`)
- `SANDBOX_MODE` (`container` | `firejail` | `none`)
- `SANDBOX_NET` (`none` | `egress`) default `none`
- `SANDBOX_CPU_SECONDS` (default `30`)
- `SANDBOX_MEMORY_MB` (default `512`)
- `SANDBOX_PIDS_MAX` (default `128`)
- `SANDBOX_FS_READONLY` (`true` by default)

Replace `SOLANA_RPC_URL` with your provider URL.

Keypair secrets must be injected securely.

---

## Database migrations

Nuttoo expects Prisma-managed migrations.

Recommended process:

1. apply migrations on deploy
2. start API and worker after migrations succeed

Example migration step:

```bash
pnpm prisma migrate deploy --schema packages/db/prisma/schema.prisma
```

---

## Seeding

Production seeding should be minimal.

If needed:

```bash
pnpm ts-node scripts/db/seed.ts
```

Avoid destructive seed flags in production.

---

## Solana signing key

Nuttoo may require a signing keypair for on-chain registrations.

Recommended approaches:

- store a keypair file via secrets and mount it to `NUTTOO_SIGNER_KEYPAIR_PATH`
- load from JSON env var into memory (`NUTTOO_SIGNER_KEYPAIR_JSON`)
- use a KMS-backed signer (advanced)

Do not expose signing keys in logs.

---

## Health checks

Recommended health endpoints (API):

- `GET /healthz` returns `200 OK`
- `GET /readyz` checks DB + Redis + Solana RPC connectivity

Workers should expose:

- process metrics
- queue depth metrics
- heartbeat timestamps in DB

---

## Observability

Recommended baseline:

- structured logs (JSON)
- request tracing (OpenTelemetry)
- metrics (Prometheus)

Alerting on:

- DB errors
- Solana RPC failure rate
- worker job failures
- queue backlog growth
- latency spikes

---

## Scaling

### API

Scale by:
- increasing replicas
- enabling caching
- limiting expensive endpoints

### Worker

Scale by:
- increasing worker replicas
- tuning `WORKER_CONCURRENCY`
- isolating heavy analysis jobs into a dedicated queue

---

## Rollback strategy

Nuttoo supports safe rollback if:

- migrations are backward-compatible
- API and worker are versioned with immutable image tags

Recommended:
- deploy canary versions first
- keep the last stable container tags available
- never deploy destructive migrations without a reversible plan

---

## Security notes

- keep signing keys in secrets
- apply rate limits on API
- restrict admin endpoints
- enable audit logs
- validate all user-submitted repo inputs
- default-deny network in the sandbox

---

## Deployment option A: Docker Compose (quick production)

Use this for small installations or staging.

High-level steps:

1. build images (or pull from registry)
2. run DB + Redis
3. run API + Worker + Indexer + Web
4. run migrations

A typical sequence:

```bash
docker compose up -d postgres redis
pnpm prisma migrate deploy --schema packages/db/prisma/schema.prisma
docker compose up -d api worker indexer web
```

---

## Deployment option B: Kubernetes (recommended for production)

Best for production.

Recommended components:

- Deployment for API
- Deployment for Worker
- Deployment for Indexer
- Deployment for Agent
- managed Postgres (outside cluster)
- Redis (managed or in-cluster)
- Ingress for API/Web
- HPA for scaling

Key recommendations:

- run worker as separate deployment
- scale workers horizontally
- use liveness + readiness probes
- store secrets in Kubernetes secrets
- configure autoscaling based on queue depth or CPU

---

## Deployment option C: ECS + Terraform

If you prefer AWS-native primitives:

- ECS services for API/Worker/Indexer/Web
- RDS for Postgres
- Elasticache for Redis
- ALB for routing
- CloudWatch + Prometheus exporter for metrics

Terraform modules live under `infra/terraform/modules`.

---

## Smoke test checklist

After deploying:

- API responds: `GET /healthz` returns `200`
- DB reachable: migrations applied successfully
- Worker running: picks up a test job
- Solana RPC reachable: can fetch cluster version
- On-chain actions: can simulate a registry transaction

---

## Summary

Nuttoo deployment is intentionally modular:

- Postgres stores persistence and intelligence state
- API serves control and coordination
- Worker performs analysis and evolution loops
- Solana ensures verifiable registries and lineage

Deploy Nuttoo like you deploy a system that never stops evolving.
