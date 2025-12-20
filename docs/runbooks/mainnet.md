
# Nuttoo Runbook — Mainnet

This runbook describes operational procedures for Nuttoo on Solana mainnet.

Mainnet is the production environment.

---

## Purpose

Mainnet operations prioritize:
- safety
- availability
- correctness
- auditability

All actions are irreversible.

---

## Components

- managed Postgres with backups
- Nuttoo API
- Nuttoo workers
- Solana mainnet RPC
- monitoring and alerting

---

## Preflight Checklist

Before deployment:
- migrations reviewed and approved
- signing keys secured
- RPC provider validated
- monitoring enabled
- rollback plan documented

---

## Deployment Procedure

1. Apply migrations

```bash
pnpm prisma migrate deploy --schema packages/db/prisma/schema.prisma
```

2. Deploy API

3. Deploy workers

4. Run smoke tests

---

## Operational Rules

- no destructive database operations
- no manual data edits
- no unreviewed hotfixes
- no local keypair usage

---

## Incident Sensitivity

Any anomaly must be treated as an incident:
- transaction failures
- registry inconsistencies
- unexpected forks
- data corruption

---

## Summary

Mainnet favors correctness over speed.

Proceed slowly and deliberately.
