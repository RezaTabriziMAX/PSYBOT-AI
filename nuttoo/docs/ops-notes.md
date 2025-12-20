# Ops Notes

This file captures practical operational decisions that should not live in code.

## Default queues

- `modules:pack`
- `modules:verify`
- `modules:run`
- `modules:publish`

## Default sandbox posture

- network: none
- filesystem: readonly
- tmpfs: enabled
- caps: dropped
- no-new-privileges: enabled

If your module requires network, enable it explicitly via policy and isolate the queue.

## Deployment ordering

1. DB + Redis
2. migrations
3. API
4. Worker
5. Indexer
6. Agent
7. Web

Start Indexer after API and DB are stable to reduce checkpoint churn.
