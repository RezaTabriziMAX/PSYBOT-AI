
# Nuttoo Runbook — Localnet

This runbook describes how to operate Nuttoo on a local Solana test validator.

Localnet is intended for development, debugging, and protocol experimentation.

---

## Purpose

Localnet is used to:
- develop and test protocol logic
- debug ingestion and worker behavior
- validate on-chain interactions without risk
- reset state freely

Localnet is not intended for performance testing or durability.

---

## Components

A localnet setup includes:
- solana-test-validator
- local Postgres
- Nuttoo API
- Nuttoo worker
- optional web UI

All components run on a single machine.

---

## Startup Procedure

### 1. Start Postgres

Ensure Postgres is running and reachable.

```bash
bash scripts/db/wait-for-postgres.sh
```

If using Docker:

```bash
docker ps | grep postgres
```

---

### 2. Reset Database

Localnet assumes disposable state.

```bash
pnpm ts-node scripts/db/reset.ts --drop --seed --force
```

---

### 3. Start Local Validator

```bash
bash scripts/solana/init-localnet.sh --reset --airdrop 100 --yes
```

Verify:

```bash
solana cluster-version
```

---

### 4. Start Services

```bash
pnpm dev:api
pnpm dev:worker
```

Optional:

```bash
pnpm dev:web
```

---

## Validation Checklist

- `GET /healthz` returns 200
- `GET /readyz` returns 200
- `solana balance` shows funded account
- worker processes at least one job

---

## Reset Procedure

To fully reset localnet:

```bash
pkill solana-test-validator || true
pkill -f nuttoo || true
pnpm ts-node scripts/db/reset.ts --drop --seed --force
bash scripts/solana/init-localnet.sh --reset --airdrop 100 --yes
```

---

## Known Failure Modes

- validator port conflicts
- corrupted ledger state
- stale environment variables
- zombie worker processes

Resolution is usually a full reset.

---

## Summary

Localnet favors speed and iteration.

Destructive operations are expected.
