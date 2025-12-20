
# Nuttoo (NUTTOO)

Nuttoo is an on-chain AI lifeform for the Solana ecosystem — a living system that modularizes code, learns from real-world repositories, and evolves through forks.

Nuttoo is designed as a **never-stopping** loop:
- observe real code → extract runnable modules → verify + attest → publish → run → learn → fork → improve

It is not a “tool that ends.”
It is a **system that keeps running**.

---

## What Nuttoo is

Nuttoo is a modularization and execution layer for Solana development:
- It helps developers break complex codebases into **minimal runnable units** (“modules”).
- It provides an **artifact pipeline** (pack → verify → attest → publish).
- It supports **fork lineage**, so users can branch, remix, and evolve modules.
- It anchors **registry + provenance** on-chain (Anchor program), while keeping execution off-chain in a sandbox.

Nuttoo targets two types of users:
- **Builders** who want reusable modules and faster iteration.
- **Operators** who want an auditable pipeline to publish and run modules safely.

---

## Token plan (Pump.fun test → 1:1 mapping)

Nuttoo will launch a **test token on Pump.fun** for early testing and distribution.
The final project token will be **distributed 1:1** to test-token holders via a mapping mechanism.

Important notes (high-level):
- Test token is for early distribution and public testing.
- Final token distribution is based on a **snapshot + mapping** process.
- Exact mechanics depend on your rollout plan (snapshot time, claim flow, contract details).

Nuttoo’s on-chain components focus on:
- registries (modules/forks/runs)
- attestations/provenance
- policy enforcement

Token mapping logic is documented under:
- `docs/api/protocol/token-mapping.md`

---

## Fallout Terminal web style

Nuttoo’s web experience is intentionally **terminal-first**, inspired by Fallout terminals:
- monospace UI
- scanlines/noise aesthetic
- command palette navigation
- status bars + log streams
- a “system console” vibe for registry, forks, and runs

Terminal style guidance:
- `docs/terminal-style-guide.md`

---

## Repository layout (high-level)

This repo is a monorepo with multiple services and packages:

- `apps/web` — Next.js terminal-styled web UI
- `api` — HTTP API for registry operations, auth, modules, forks, runs
- `indexer` — reads Solana events and persists state into Postgres
- `agent` — autonomous “Nuttoo mind” loop (observe/summarize/moduleize/fork-suggest)
- `worker` — background job processors (pack/verify/run/publish) + sandbox runtime
- `cli` — developer CLI (`nuttoo init`, `nuttoo module pack`, `nuttoo devnet start`, etc.)
- `programs/nuttoo_registry` — Anchor program (on-chain registry/provenance)
- `packages/*` — shared libraries (db, solana, module-kit, terminal-ui, sdk, config, logger, errors, crypto, queue)
- `modules/templates/*` — official module templates
- `infra/*` — docker/kubernetes/terraform/monitoring
- `docs/*` — architecture, quickstart, deployment, security, troubleshooting, API protocol docs
- `storage/*` — local dev storage folders
- `.github/*` — workflows and templates
- `tests/*` — e2e / load / security

---

## Core concepts

### Module
A **module** is the smallest runnable unit produced by Nuttoo:
- deterministic manifest (`module.json`)
- content-addressed artifact (sha256)
- clear runtime requirements (node/native/sandbox)
- inputs/outputs schema

Docs:
- `docs/api/protocol/module-spec.md`

### Artifact
An artifact is a packed, immutable bundle:
- produced by `worker` pack step
- verified (hash, manifest, signature policy)
- stored in `storage/` (local) or object storage (prod)

### Attestation
An attestation is a verifiable record that:
- an artifact was verified
- the hash matches the module record
- policy checks were satisfied

### Fork
A fork represents lineage branching:
- “same idea, new path”
- tracked with fork id + notes
- linked to parent module

Docs:
- `docs/api/protocol/fork-model.md`

### Run
A run is a recorded execution attempt:
- immutable run id
- linked to module + optional fork
- includes hashes of stdout/stderr outputs

---

## Architecture (mental model)

Nuttoo is intentionally modular:

### On-chain
- **Registry program**: provenance + lineage
- Records:
  - registry policy
  - module metadata + hashes
  - fork lineage
  - run records (hashes, status)

### Off-chain
- **API**: coordination layer
- **DB**: persistence + query layer
- **Worker**: jobs + sandbox execution
- **Agent**: continuous cognition/evolution loop
- **Indexer**: keeps DB aligned with chain

---

## Services

### API (`api/`)
Responsibilities:
- request validation, auth, rate limiting
- module/fork/run lifecycle endpoints
- storage service integration
- policy evaluation and orchestration
- OpenAPI generation

Health endpoints:
- `GET /healthz`
- `GET /readyz`

Docs:
- `docs/api/openapi.yml`
- `docs/api/runbooks/*`

### Indexer (`indexer/`)
Responsibilities:
- listen to Solana events (Geyser/WebSockets/Polling)
- parse events into normalized records
- backfill and checkpoint
- persist into DB
- expose metrics

### Worker (`worker/`)
Responsibilities:
- process queued jobs (BullMQ)
- pack module artifacts
- verify and attest artifacts
- run artifacts in sandbox
- publish modules / record runs

Sandbox:
- container/firejail based defense-in-depth (depending on deployment option)

### Agent (`agent/`)
Responsibilities:
- “cognition loop” that never stops
- observe GitHub/NPM/on-chain signals
- summarize and propose moduleization
- suggest forks and improvements
- publish module proposals through API/worker pipeline

### Web (`apps/web/`)
Responsibilities:
- terminal-styled UI
- registry explorer
- fork explorer
- run history
- docs pages
- wallet connect hooks (optional)

### CLI (`cli/`)
Responsibilities:
- developer ergonomics
- bootstrap localnet/devnet
- validate environment (doctor)
- create/pack/publish/run modules
- manage forks
- quick commands for iteration

---

## Quickstart (local dev)

> The canonical steps and environment requirements live in `docs/quickstart.md`.
> This is a concise summary.

### 1) Prerequisites
- Node.js 20+
- pnpm 9+
- Solana CLI
- Docker (recommended)
- Postgres (or dockerized)
- (Optional) Redis for queue

### 2) Install
```bash
pnpm install
```

### 3) Generate env
```bash
pnpm ts-node scripts/env/gen-dev-env.ts
```

### 4) Start localnet
```bash
bash scripts/solana/init-localnet.sh
bash scripts/solana/airdrop.sh
```

### 5) Start Postgres
```bash
bash scripts/db/wait-for-postgres.sh
pnpm prisma migrate dev --schema packages/db/prisma/schema.prisma
pnpm ts-node scripts/db/seed.ts
```

### 6) Run services
In separate terminals:
```bash
pnpm --filter @nuttoo/api dev
pnpm --filter @nuttoo/indexer dev
pnpm --filter @nuttoo/worker dev
pnpm --filter @nuttoo/agent dev
pnpm --filter @nuttoo/web dev
```

---

## Documentation map

### Start here
- `docs/overview.md`
- `docs/architecture.md`
- `docs/quickstart.md`
- `docs/deployment.md`
- `docs/troubleshooting.md`
- `docs/security.md`
- `docs/terminal-style-guide.md`

### API
- `docs/api/openapi.yml`
- `docs/api/postman_collection.json`

### Protocol docs
- `docs/api/protocol/state-machine.md`
- `docs/api/protocol/module-spec.md`
- `docs/api/protocol/fork-model.md`
- `docs/api/protocol/token-mapping.md`

### Runbooks
- `docs/api/runbooks/localnet.md`
- `docs/api/runbooks/devnet.md`
- `docs/api/runbooks/mainnet.md`
- `docs/api/runbooks/backups.md`
- `docs/api/runbooks/incident-response.md`

---

## Module templates

Nuttoo ships official scaffolds:
- `modules/templates/solana-anchor-program`
- `modules/templates/solana-ts-client`
- `modules/templates/indexer-parser`
- `modules/templates/terminal-widget`

These are designed to be:
- packable by `module-kit`
- verifiable by worker pipeline
- publishable to registry

---

## On-chain program: nuttoo_registry

The Anchor program lives at:
- `programs/nuttoo_registry`

It manages:
- registry policy
- module records (hashes, metadata, verification status)
- fork records (lineage)
- run records (status + output hashes)

It does **not**:
- run untrusted code (off-chain only)
- store large artifacts (hash + URI only)

---

## Security model (summary)

Nuttoo assumes adversarial inputs.

Key principles:
- treat all user-submitted modules as untrusted
- verify manifests + hashes before any execution
- sandbox execution with strict limits
- redact secrets in logs
- keep signing keys out of runtime logs and code
- enforce API rate limiting and validation

More detail:
- `docs/security.md`
- `tests/security/threat-model.md`
- `tests/security/sandbox-escape.test.ts`

---

## Observability

Recommended baseline:
- JSON logs
- OpenTelemetry tracing for API
- Prometheus metrics
- dashboards for:
  - API latency
  - indexer health
  - worker throughput
  - queue backlog
  - agent heartbeat

Infra examples:
- `infra/monitoring/*`

---

## CI / Release

GitHub workflows:
- `ci.yml` — typecheck + tests + build
- `security-scan.yml` — CodeQL + dependency review
- `release.yml` — tagged releases + release notes
- `docker.yml` — build/push images
- `docs.yml` — docs checks

---

## Tests

- `tests/e2e/*` — end-to-end health and devnet sanity tests
- `tests/load/*` — k6 scripts for basic load testing
- `tests/security/*` — threat model + sandbox contract expectations

---

## Contributing

See templates under:
- `.github/ISSUE_TEMPLATE/*`
- `.github/PULL_REQUEST_TEMPLATE.md`

Guidelines:
- keep artifacts deterministic
- prefer pure functions and typed boundaries in shared packages
- never commit secrets
- add tests for new protocol behavior

---

## License

Choose a license and add a `LICENSE` file at the repo root.
Common choices: Apache-2.0 or MIT.

---

## Disclaimer

Nuttoo is experimental software.
It is built for public testing, iteration, and research-grade modularization workflows.

Nothing in this repository is financial advice.
