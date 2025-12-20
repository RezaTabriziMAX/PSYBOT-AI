# Nuttoo Troubleshooting

This document provides a comprehensive guide for diagnosing and resolving common issues when running Nuttoo in local development, Docker, or Kubernetes environments.

Always capture:
- The exact error message
- The command that triggered it
- The last ~200 lines of logs from both API and worker services

---

## Table of contents

- [Quick triage checklist](#quick-triage-checklist)
- [Environment and configuration](#environment-and-configuration)
  - [Missing or invalid environment variables](#missing-or-invalid-environment-variables)
  - [Node, pnpm, or workspace issues](#node-pnpm-or-workspace-issues)
- [Database and Prisma](#database-and-prisma)
  - [Prisma migration failures](#prisma-migration-failures)
  - [Database connection errors](#database-connection-errors)
  - [Migration history or schema drift](#migration-history-or-schema-drift)
- [Queue and worker](#queue-and-worker)
  - [Worker not processing jobs](#worker-not-processing-jobs)
  - [Queue backlog growth](#queue-backlog-growth)
- [Solana / on-chain](#solana--on-chain)
  - [RPC rate limits or timeouts](#rpc-rate-limits-or-timeouts)
  - [Keypair and signature errors](#keypair-and-signature-errors)
  - [Transaction simulation failures](#transaction-simulation-failures)
  - [Blockhash expired](#blockhash-expired)
  - [Insufficient funds](#insufficient-funds)
- [API issues](#api-issues)
  - [API starts but endpoints fail](#api-starts-but-endpoints-fail)
  - [CORS problems](#cors-problems)
  - [Webhook or auth verification issues](#webhook-or-auth-verification-issues)
- [Docker](#docker)
  - [Docker build failures](#docker-build-failures)
  - [Runtime environment missing in Docker](#runtime-environment-missing-in-docker)
- [Kubernetes](#kubernetes)
  - [CrashLoopBackOff](#crashloopbackoff)
  - [Readiness and liveness probes](#readiness-and-liveness-probes)
  - [Running migrations in Kubernetes](#running-migrations-in-kubernetes)
  - [Secrets and keypair handling](#secrets-and-keypair-handling)
  - [Scaling and HPA](#scaling-and-hpa)
- [Logging and diagnostics](#logging-and-diagnostics)
  - [Minimal diagnostic bundle](#minimal-diagnostic-bundle)
  - [Log hygiene](#log-hygiene)
- [When to open an issue](#when-to-open-an-issue)

---

## Quick triage checklist

Run these checks first:

1. **Confirm Node and pnpm versions**
   ```bash
   node -v
   pnpm -v
   ```

2. **Confirm required environment variables are loaded**
   ```bash
   env | sort | grep -E '^(NUTTOO_|DATABASE_URL|SOLANA_|REDIS_|QUEUE_|PORT=|NODE_ENV=)'
   ```

3. **Verify database connectivity**
   ```bash
   echo "$DATABASE_URL"
   ```

4. **Apply Prisma migrations**
   ```bash
   pnpm prisma migrate deploy --schema packages/db/prisma/schema.prisma
   ```

5. **Check API health**
   ```bash
   curl -i http://localhost:3000/healthz
   curl -i http://localhost:3000/readyz
   ```

6. **Check worker logs**
   ```bash
   # Example (adjust for your scripts)
   pnpm -C packages/worker start
   ```

7. **Check Solana RPC health**
   ```bash
   curl -s "$SOLANA_RPC_URL"      -H 'Content-Type: application/json'      -d '{"jsonrpc":"2.0","id":1,"method":"getHealth"}'
   ```

If any step fails, continue to the corresponding section below.

---

## Environment and configuration

### Missing or invalid environment variables

**Symptoms**
- Application exits during startup
- Errors referencing missing configuration or undefined values

**Resolutions**
- Ensure all required variables are defined at runtime
- Confirm `.env` files are loaded by your process manager (dotenv, pm2, systemd, etc.)
- In Docker or Kubernetes, verify injection via `ENV`, `env_file`, ConfigMaps, or Secrets

**Verification**
```bash
node -e "console.log({
  DATABASE_URL: !!process.env.DATABASE_URL,
  SOLANA_RPC_URL: !!process.env.SOLANA_RPC_URL,
  NODE_ENV: process.env.NODE_ENV
})"
```

**Common gotchas**
- `.env` exists but is not loaded in production
- Docker `ARG` (build-time) is confused with `ENV` (run-time)
- Kubernetes Secret is created but not referenced by the Deployment

---

### Node, pnpm, or workspace issues

**Symptoms**
- Module resolution failures
- pnpm workspace errors
- Inconsistent dependency state

**Resolutions**
```bash
rm -rf node_modules **/node_modules .turbo
pnpm store prune || true
pnpm install
pnpm -r build
```

---

## Database and Prisma

### Prisma migration failures

**Symptoms**
- Application fails with Prisma errors
- Tables missing or schema mismatch
- Typical error codes include P1001, P3009, or drift warnings

**Resolution**
```bash
pnpm prisma migrate deploy --schema packages/db/prisma/schema.prisma
```

**Destructive reset (development only)**
```bash
pnpm prisma migrate reset --schema packages/db/prisma/schema.prisma
```

**Status**
```bash
pnpm prisma migrate status --schema packages/db/prisma/schema.prisma
```

---

### Database connection errors

**Symptoms**
- Connection refused, timeout, DNS failures
- SSL handshake errors (common with managed Postgres)

**Resolutions**
- Verify credentials, host, and port
- If your provider requires SSL, ensure `DATABASE_URL` includes the required options (provider-specific)
- Ensure network access from containers or pods (security groups, firewall rules)

**Kubernetes connectivity test**
```bash
kubectl exec -it deploy/nuttoo-api -- sh -lc 'apk add --no-cache postgresql-client >/dev/null 2>&1 || true; psql "$DATABASE_URL" -c "select 1"'
```

---

### Migration history or schema drift

**Symptoms**
- Prisma reports drift
- Migration history mismatch between DB and repo

**Resolutions**
- Avoid resetting production databases
- Reconcile schema using additive migrations
- Validate on staging first

**Commands**
```bash
pnpm prisma migrate status --schema packages/db/prisma/schema.prisma
pnpm prisma db pull --schema packages/db/prisma/schema.prisma
```

---

## Queue and worker

### Worker not processing jobs

**Symptoms**
- API responds but background jobs never execute
- Queue backlog increases
- Worker logs show no activity

**Resolutions**
- Ensure the worker is running
- Confirm API and worker share the same DB and queue backend
  - `DATABASE_URL`
  - `REDIS_URL` (or other queue transport variables)
- Verify worker concurrency is not set to 0

**Kubernetes checks**
```bash
kubectl get pods -l app=nuttoo-worker
kubectl logs -l app=nuttoo-worker --tail=200
kubectl describe deploy nuttoo-worker
```

---

### Queue backlog growth

**Symptoms**
- Jobs stuck in waiting state
- Increasing latency
- Worker is running but cannot keep up

**Resolutions**
- Scale worker replicas
- Increase worker concurrency cautiously (CPU/RAM and RPC limits apply)
- Ensure DB and Solana RPC are not the bottlenecks

**Scale example**
```bash
kubectl scale deploy nuttoo-worker --replicas=3
```

---

## Solana / on-chain

### RPC rate limits or timeouts

**Symptoms**
- 429 responses (Too Many Requests)
- Timeout or gateway errors
- Intermittent transaction failures

**Resolutions**
- Use a paid RPC provider or increase plan limits
- Add retries with exponential backoff and jitter (if supported by your code)
- Increase request timeouts
- Reduce commitment level if appropriate (for non-critical reads)

**Quick RPC test**
```bash
curl -s "$SOLANA_RPC_URL" -H 'Content-Type: application/json'   -d '{"jsonrpc":"2.0","id":1,"method":"getLatestBlockhash"}' | head -c 800; echo
```

---

### Keypair and signature errors

**Symptoms**
- Invalid secret key
- Failed to deserialize keypair
- Signature verification failed

**Common causes**
- Keypair JSON is not a 64-byte array
- Base58 secret passed where JSON array is expected
- Wrong file path in Docker/Kubernetes
- Mounted secret not readable by the container user
- Newlines or quotes corrupt the env var

**Resolutions**
Use exactly one source of truth:
- `SOLANA_KEYPAIR_PATH` (mounted file) **preferred**
- `SOLANA_KEYPAIR_JSON` (env var containing a JSON array)

**Validation script**
```bash
node - << 'EOF'
const fs = require('fs');

function parseArray(s) {
  const a = JSON.parse(s);
  if (!Array.isArray(a)) throw new Error('Keypair must be a JSON array');
  if (a.length !== 64) throw new Error('Keypair array must be length 64');
  for (const n of a) {
    if (typeof n !== 'number' || n < 0 || n > 255) throw new Error('Keypair bytes must be 0..255');
  }
  return a;
}

const json = process.env.SOLANA_KEYPAIR_JSON;
const path = process.env.SOLANA_KEYPAIR_PATH;

if (json) {
  parseArray(json);
  console.log('SOLANA_KEYPAIR_JSON: OK');
} else if (path) {
  parseArray(fs.readFileSync(path, 'utf8'));
  console.log('SOLANA_KEYPAIR_PATH: OK');
} else {
  console.log('No keypair provided via SOLANA_KEYPAIR_JSON or SOLANA_KEYPAIR_PATH');
}
EOF
```

**Kubernetes mount verification**
```bash
kubectl exec -it deploy/nuttoo-worker -- sh -lc 'ls -la /secrets && head -c 120 /secrets/solana-keypair.json; echo'
```

---

### Transaction simulation failures

**Symptoms**
- Transaction simulation failed
- Custom program error codes
- Program failed to complete

**Resolutions**
- Verify program IDs and account addresses
- Confirm cluster (mainnet vs devnet) and RPC endpoint
- Ensure you use a recent blockhash
- Reproduce with a minimal simulate script

**Simulate example (serialized transaction required)**
```bash
TX_B64="..."
curl -s "$SOLANA_RPC_URL" -H 'Content-Type: application/json'   -d "{"jsonrpc":"2.0","id":1,"method":"simulateTransaction","params":["$TX_B64",{"sigVerify":false,"commitment":"processed"}]}"   | head -c 1800; echo
```

---

### Blockhash expired

**Symptoms**
- Blockhash not found
- Transaction too old

**Resolutions**
- Fetch a fresh blockhash immediately before signing
- Refresh blockhash regularly for high-throughput senders
- Ensure the system clock is accurate

---

### Insufficient funds

**Symptoms**
- Insufficient funds for fee
- Insufficient funds for rent

**Resolutions**
- Fund the signer wallet with SOL (target cluster)
- Confirm you are using the correct RPC endpoint for the cluster
- Confirm the intended fee payer

---

## API issues

### API starts but endpoints fail

**Symptoms**
- `/healthz` returns 200 but other endpoints return 500
- Errors in logs referencing DB, queue, or RPC

**Resolutions**
- Verify DB connectivity and migrations
- Confirm worker is running if endpoints enqueue background jobs
- Review logs for stack traces and request context

**Health verification**
```bash
curl -i http://localhost:3000/healthz
curl -i http://localhost:3000/readyz
```

---

### CORS problems

**Symptoms**
- Browser blocks requests
- Preflight failures

**Resolutions**
- Configure explicit allowed origins (avoid `*` with credentials)
- Ensure preflight `OPTIONS` routes are handled
- If using cookies, ensure credentials and same-site settings match your deployment

**Quick test**
```bash
curl -i http://localhost:3000/healthz -H 'Origin: http://localhost:5173'
```

---

### Webhook or auth verification issues

**Symptoms**
- 401/403 responses on inbound webhooks
- Signature mismatch or timestamp errors

**Resolutions**
- Ensure you verify against the raw request body (middleware may mutate bytes)
- Confirm shared secret values match the sender
- Confirm reverse proxies are not stripping required headers
- Avoid logging secrets; log header presence and lengths only

---

## Docker

### Docker build failures

**Symptoms**
- Dependency install errors in image build
- Workspace packages not found
- Native module build errors

**Resolutions**
- Ensure workspace files are copied before `pnpm install`
- Use a Node base image compatible with your repo
- Install build toolchain if you have native dependencies

**Debug build**
```bash
docker build --no-cache -t nuttoo:debug .
```

---

### Runtime environment missing in Docker

**Symptoms**
- Works locally but fails in container due to missing env vars
- `DATABASE_URL` is empty in the running container

**Resolutions**
```bash
docker run --rm -it --env-file .env nuttoo:latest
```

**Verify env inside container**
```bash
docker exec -it <container> sh -lc 'env | sort | grep -E "DATABASE_URL|SOLANA_RPC_URL|REDIS_URL|QUEUE_"'
```

---

## Kubernetes

### CrashLoopBackOff

**Symptoms**
- Pods restart repeatedly
- `kubectl get pods` shows CrashLoopBackOff

**Resolutions**
```bash
kubectl logs <pod> --previous --tail=200
kubectl describe pod <pod>
```

**Common causes**
- Missing Secret/ConfigMap keys
- DB unreachable from cluster network
- Migrations not applied before start
- Keypair secret not mounted or wrong path
- Incorrect command/entrypoint

---

### Readiness and liveness probes

**Recommendations**
- `/healthz`: process-alive only (no external dependencies)
- `/readyz`: can check DB + queue (and optionally RPC)

If pods fail readiness during warmup:
- Increase `initialDelaySeconds`
- Increase `timeoutSeconds`
- Reduce dependency checks in `/healthz`

---

### Running migrations in Kubernetes

**Goal**
Migrations should run before API and worker begin serving traffic.

**Recommended approaches**
1. InitContainer that runs migrations before starting API pods
2. A one-off Job per release, executed before rolling out API/worker

**Migration command**
```bash
pnpm prisma migrate deploy --schema packages/db/prisma/schema.prisma
```

**Rules**
- Run migrations with the same image and env as production
- Ensure only one migration runner executes at a time

---

### Secrets and keypair handling

**Best practice**
- Store Solana keypair JSON in a Kubernetes Secret
- Mount it as a file
- Set `SOLANA_KEYPAIR_PATH` to the mounted location

**Verify mount**
```bash
kubectl exec -it deploy/nuttoo-worker -- sh -lc 'ls -la /secrets && wc -c /secrets/solana-keypair.json'
```

---

### Scaling and HPA

**Symptoms**
- Worker throughput insufficient
- Queue backlog grows
- Increasing latency

**Resolutions**
- Scale worker replicas horizontally
- Configure HPA based on CPU and/or custom queue depth metrics
- Confirm DB and RPC capacity scale with load

**Manual scaling**
```bash
kubectl scale deploy nuttoo-worker --replicas=5
```

---

## Logging and diagnostics

### Minimal diagnostic bundle

Include this set when reporting issues:

- Git commit SHA or release tag
- Deployment mode (local / docker / kubernetes)
- Node version and pnpm version
- Sanitized environment variable list (do not include secrets)
- API logs (last ~200 lines)
- Worker logs (last ~200 lines)
- Prisma migration status output
- Solana RPC health output

**Commands**
```bash
node -v
pnpm -v

pnpm prisma migrate status --schema packages/db/prisma/schema.prisma || true

curl -s "$SOLANA_RPC_URL" -H 'Content-Type: application/json'   -d '{"jsonrpc":"2.0","id":1,"method":"getHealth"}' || true
```

---

### Log hygiene

- Never log private keys, seed phrases, or raw secrets
- If you must confirm a secret exists, log its length and parse validity only
- Avoid logging full request bodies for signed webhooks unless redacted

---

## When to open an issue

Open an issue only if:
- The problem is reproducible
- You validated DB connectivity, migrations, and Solana RPC health
- You included the minimal diagnostic bundle

Provide:
- Expected behavior
- Actual behavior
- Steps to reproduce
- Deployment topology (local, docker, k8s)
