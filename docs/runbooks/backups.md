
# Nuttoo Runbook — Backups

This runbook defines backup and restore procedures.

---

## Backup Scope

Critical data includes:
- Postgres database
- environment configuration
- deployment manifests

On-chain data does not require backup.

---

## Database Backups

Recommendations:
- automated daily backups
- point-in-time recovery
- encrypted storage

Test restores regularly.

---

## Manual Backup

Example:

```bash
pg_dump "$DATABASE_URL" > nuttoo-backup.sql
```

Store backups securely.

---

## Restore Procedure

1. provision clean database
2. restore backup
3. apply migrations if required
4. restart services
5. validate integrity

---

## Retention Policy

- short-term: daily backups
- long-term: weekly or monthly snapshots

---

## Summary

Backups protect off-chain intelligence.

On-chain state is immutable and recoverable.
