# Runbook: Incident Response

## Goals

- contain impact quickly
- preserve evidence (logs, traces)
- restore service safely
- produce a clear postmortem

## Severity levels

- SEV0: chain corruption risk, key compromise, widespread outage
- SEV1: major outage or data loss risk
- SEV2: partial outage, elevated errors, degraded performance
- SEV3: minor issue, localized failures

## Immediate actions

1. Assign incident lead.
2. Start an incident channel and logging doc.
3. Freeze risky deployments.
4. Gather context:
   - API error rate
   - worker job failure rate
   - queue depth
   - indexer lag
   - DB health

## Common scenarios

### API elevated errors

- check `GET /readyz` to isolate DB/Redis/RPC issues
- inspect recent deploys and config changes
- validate DB connections, pool saturation
- enable temporary rate limits if needed

### Worker job failures

- inspect job payloads for input validation failures
- check sandbox resource constraints
- confirm storage access
- isolate expensive job types into separate queues

### Indexer lag

- verify RPC availability and rate limits
- switch stream mode (geyser/websocket/polling) if configured
- confirm checkpoints and backfill progress

### Key compromise suspicion

- rotate signing keys immediately
- invalidate tokens / sessions
- audit on-chain transactions
- publish a public incident notice when appropriate

## Recovery

- deploy a known-good version (immutable tags)
- ensure migrations are compatible with rollback
- run smoke tests
- monitor until stable for at least 30 minutes

## Postmortem requirements

- timeline (UTC)
- impact summary
- root cause
- contributing factors
- corrective actions with owners and dates
