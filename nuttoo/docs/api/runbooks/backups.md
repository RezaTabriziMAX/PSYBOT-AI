# Runbook: Backups

This runbook describes backup and restore procedures for Nuttoo.

## Scope

- Postgres backups are mandatory.
- Redis persistence is optional (queues are typically recoverable, but may cause job loss on restart).
- Object storage backups depend on your artifact retention policy.

## Postgres

### Recommended backup method

Use managed snapshots if available (RDS, Cloud SQL, etc.).
Additionally, run logical backups for portability:

```bash
pg_dump "$DATABASE_URL" --format=custom --file nuttoo.pg.dump
```

Store backups in a separate bucket with retention rules.

### Restore

```bash
pg_restore --clean --if-exists --dbname "$DATABASE_URL" nuttoo.pg.dump
```

After restore:

- run migrations to align schema:
  ```bash
  pnpm prisma migrate deploy --schema packages/db/prisma/schema.prisma
  ```
- restart API/Worker/Indexer
- verify health endpoints

## Redis

If Redis is used only as a queue backend, you can treat it as ephemeral.
If you enable persistence, ensure you understand RDB/AOF tradeoffs.

## Object storage

Artifacts are immutable and content-addressed. Backups are recommended if:
- you require long-term provenance retention
- you do not want to re-pack modules

Store in versioned buckets and prevent public write access.

## Verification checklist

- latest Postgres backup timestamp is within SLA
- restore test completed within the last 30 days
- access to backup storage is audited and limited
