
# Nuttoo Protocol — Module Specification

This document defines the canonical structure and semantics of a Nuttoo module.

Modules are the smallest runnable and forkable units in the Nuttoo ecosystem.

---

## Module Definition

A module represents:
- a runnable unit
- explicit dependencies
- versioned behavior
- forkable lineage

---

## Required Fields

- moduleId
- name
- version
- owner
- createdAt

---

## Optional Fields

- parentModuleId
- description
- tags
- metadataUri

---

## Versioning

Modules use semantic versioning:

```
MAJOR.MINOR.PATCH
```

Rules:
- PATCH: internal changes
- MINOR: backward-compatible additions
- MAJOR: breaking changes

---

## Dependency Model

Dependencies must be explicit.

Each dependency includes:
- moduleId
- version constraint
- optionality flag

Implicit dependencies are forbidden.

---

## Immutability

Once registered on-chain:
- moduleId is immutable
- version is immutable
- parent linkage is immutable

Metadata may evolve off-chain.

---

## Execution Guarantees

A module must be:
- self-contained
- deterministic given inputs
- reproducible

---

## Summary

Modules are:
- atomic
- composable
- immutable on-chain
- living off-chain
