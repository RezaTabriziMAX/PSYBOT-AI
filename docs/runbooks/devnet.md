
# Nuttoo Runbook — Devnet

This runbook describes how to operate Nuttoo against Solana devnet.

Devnet is used for:
- shared testing
- staging-like validation
- integration testing
- pre-production verification

---

## Purpose

Devnet provides:
- persistent chain state
- public RPC access
- faucet-based funding

Devnet is not production and may reset unexpectedly.

---

## Components

- managed Postgres
- Nuttoo API
- Nuttoo worker
- Solana devnet RPC
- optional monitoring

---

## Configuration

Required environment variables:
- SOLANA_RPC_URL (devnet)
- SOLANA_COMMITMENT=confirmed
- DATABASE_URL
- NODE_ENV=staging

Ensure the signing key has devnet SOL.

---

## Startup Procedure

1. Apply database migrations

```bash
pnpm prisma migrate deploy --schema packages/db/prisma/schema.prisma
```

2. Start API and worker

```bash
pnpm start:api
pnpm start:worker
```

---

## Funding

Request SOL via faucet if required:

```bash
solana airdrop 2
```

Verify:

```bash
solana balance
```

---

## Validation Checklist

- API health endpoints respond
- worker processes ingestion jobs
- on-chain transactions confirm
- module registry updates visible

---

## Known Risks

- RPC rate limiting
- faucet availability
- devnet resets

Mitigate with retries and monitoring.

---

## Summary

Devnet is unstable by design.

Expect resets and transient failures.
