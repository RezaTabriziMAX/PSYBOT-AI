
# Nuttoo Protocol — State Machine

This document defines the core state machine governing Nuttoo modules, forks, and lifecycle transitions.

Nuttoo models code as a living system. Every module and fork progresses through explicit, observable states.

---

## Design Goals

- Deterministic state transitions
- Observable lifecycle
- Recoverable failures
- Fork-safe evolution
- Minimal on-chain coupling

---

## Core Entities

- Module
- Fork
- Ingestion Job
- Registration Transaction

Each entity follows a defined state progression.

---

## Module State Machine

```
CREATED
  |
  v
INGESTED
  |
  v
ANALYZED
  |
  v
REGISTERED
  |
  v
ACTIVE
  |
  +--> DEPRECATED
```

### State Definitions

- CREATED  
  Module metadata exists off-chain only.

- INGESTED  
  Source code has been fetched and stored.

- ANALYZED  
  Dependency graph and runnable units identified.

- REGISTERED  
  Module reference committed on-chain.

- ACTIVE  
  Module is reusable and forkable.

- DEPRECATED  
  Module is no longer recommended but remains addressable.

---

## Fork State Machine

```
REQUESTED
  |
  v
CLONED
  |
  v
DIVERGED
  |
  v
REGISTERED
  |
  v
ACTIVE
```

Forks never merge back into parents.

---

## Failure States

Any state may transition to:

- FAILED_ANALYSIS
- FAILED_REGISTRATION
- INVALIDATED

Failures are terminal unless manually retried.

---

## Transition Rules

- No implicit transitions
- All transitions are logged
- On-chain transitions are append-only
- Off-chain retries are bounded

---

## Idempotency

All transitions must be idempotent.
Replaying a transition must not corrupt state.

---

## Summary

Nuttoo state machines ensure:
- predictable behavior
- debuggable failures
- infinite evolution without ambiguity
