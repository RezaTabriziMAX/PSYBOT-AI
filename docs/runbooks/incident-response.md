
# Nuttoo Runbook — Incident Response

This runbook defines how to respond to production incidents.

---

## Incident Definition

An incident is any event that threatens:
- system availability
- data integrity
- security
- user trust

---

## Incident Severity

- SEV-1: active data loss or key compromise
- SEV-2: major outage or chain interaction failure
- SEV-3: partial degradation

---

## Immediate Actions

1. stop the blast radius
2. disable affected components
3. preserve logs and evidence
4. notify stakeholders

---

## Investigation

- identify timeline
- determine root cause
- assess on-chain impact
- verify data integrity

---

## Remediation

- rotate secrets if needed
- patch vulnerable components
- deploy fixes via controlled rollout
- monitor closely

---

## Communication

- provide clear status updates
- avoid speculation
- publish postmortem when resolved

---

## Post-Incident Review

- document root cause
- define preventive actions
- update runbooks
- improve monitoring

---

## Summary

Fast containment matters more than speed.

Every incident is a learning signal.
