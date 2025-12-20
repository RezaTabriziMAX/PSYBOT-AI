# Nuttoo — Deployment

This document describes how to deploy Nuttoo in production-like environments.

Nuttoo is designed as a hybrid system:
- A minimal on-chain coordination layer (Solana)
- A flexible off-chain intelligence layer (API + worker)
- Optional web UI

The recommended deployment model is container-based with managed Postgres and a dedicated RPC provider.

---

## Deployment Targets

Nuttoo can be deployed in multiple modes:

- **Local**: laptop + localnet + local Postgres
- **Staging**: hosted Postgres + devnet + minimal services
- **Production**: hosted Postgres + mainnet + full services + monitoring

This doc focuses on staging/production.

---

## Required Services

A full Nuttoo deployment consists of:

### 1) Postgres Database

Used for:
- module metadata storage
- analysis outputs
- job queues / worker state
- API persistence

Recommended:
- Postgres 16+
- managed database provider
- automated backups + PITR

---

### 2) API Service

Responsibilities:
- serves Nuttoo HTTP API
- handles auth and rate limits
- writes state to Postgres
- dispatches jobs to worker queue

---

### 3) Worker Service

Responsibilities:
- code ingestion and analysis
- dependency graph construction
- module extraction
- scoring and learning loops
- calling chain adapters for registrations

Workers should be horizontally scalable.

---

### 4) Optional Web UI

Responsibilities:
- dashboard and status (optional)
- developer-facing views (optional)

Web UI should never be a hard dependency.

---

### 5) Solana RPC Provider

Required for:
- submitting transactions
- reading program state
- indexing on-chain module registry state

Production should use a paid RPC provider.

---

## Environments

Nuttoo supports multiple runtime environments:

- `development`
- `staging`
- `production`

These environments control:
- logging verbosity
- rate limits
- safety switches
- indexing parameters

Set via environment variables.

---

## Configuration

Nuttoo is configured via environment variables.

### Minimum Required Variables

- `NODE_ENV`
- `DATABASE_URL`
- `SOLANA_RPC_URL`
- `SOLANA_COMMITMENT`
- `NUTTOO_WALLET_KEYPAIR_PATH` or `NUTTOO_WALLET_KEYPAIR_JSON`
- `NUTTOO_BASE_URL`
- `NUTTOO_PUBLIC_URL`

Recommended additional variables:
- `LOG_LEVEL`
- `PORT`
- `WORKER_CONCURRENCY`
- `INDEXER_POLL_INTERVAL_MS`

---

## Secrets Handling

Do not store secrets in Git.

Recommended:
- Docker secrets
- Kubernetes secrets
- managed secret services

Secrets include:
- database credentials
- signing keypair
- private API tokens
- internal service keys

---

## Build Artifacts

Nuttoo is expected to be built into container images.

Recommended output:
- `nuttoo-api` image
- `nuttoo-worker` image
- `nuttoo-web` image (optional)

---

## Deployment Option A: Docker Compose

This option is best for staging or single-node production.

### Example `docker-compose.yml`

```yaml
version: "3.9"

services:
  postgres:
    image: postgres:16
    environment:
      POSTGRES_PASSWORD: nuttoo
      POSTGRES_DB: nuttoo
      POSTGRES_USER: nuttoo
    ports:
      - "5432:5432"
    volumes:
      - nuttoo_pg:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U nuttoo -d nuttoo"]
      interval: 5s
      timeout: 5s
      retries: 20

  api:
    image: nuttoo/api:latest
    depends_on:
      postgres:
        condition: service_healthy
    environment:
      NODE_ENV: production
      PORT: "8080"
      DATABASE_URL: postgresql://nuttoo:nuttoo@postgres:5432/nuttoo
      SOLANA_RPC_URL: ${SOLANA_RPC_URL}
      SOLANA_COMMITMENT: confirmed
      NUTTOO_BASE_URL: http://api:8080
      NUTTOO_PUBLIC_URL: https://your-domain.example
      LOG_LEVEL: info
      WORKER_QUEUE_ENABLED: "1"
    ports:
      - "8080:8080"

  worker:
    image: nuttoo/worker:latest
    depends_on:
      postgres:
        condition: service_healthy
    environment:
      NODE_ENV: production
      DATABASE_URL: postgresql://nuttoo:nuttoo@postgres:5432/nuttoo
      SOLANA_RPC_URL: ${SOLANA_RPC_URL}
      SOLANA_COMMITMENT: confirmed
      LOG_LEVEL: info
      WORKER_CONCURRENCY: "4"

volumes:
  nuttoo_pg:

Replace SOLANA_RPC_URL with your provider endpoint.
Inject keypair secrets securely.
