#!/usr/bin/env bash
# Nuttoo Postgres readiness helper
#
# Purpose:
# - Wait for a Postgres server to be reachable and ready
# - Works with DATABASE_URL or discrete PG* environment variables
# - Designed for local dev and docker-compose workflows
#
# Usage:
#   bash scripts/db/wait-for-postgres.sh
#
# Environment variables:
#   DATABASE_URL             e.g. postgresql://user:pass@host:5432/dbname
#   PGHOST                   default: localhost
#   PGPORT                   default: 5432
#   PGUSER                   default: postgres
#   PGPASSWORD               optional
#   PGDATABASE               default: postgres
#
#   TIMEOUT_SECONDS          default: 60
#   SLEEP_SECONDS            default: 2
#   REQUIRE_MIGRATIONS=1     if set, verify prisma migrations applied (optional; requires prisma schema path)
#   PRISMA_SCHEMA            default: packages/db/prisma/schema.prisma
#
# Exit codes:
#   0 ready
#   1 timeout or error

set -euo pipefail

# -----------------------------
# Helpers
# -----------------------------
log()  { printf "[wait-for-postgres] %s\n" "$*"; }
warn() { printf "[wait-for-postgres][warn] %s\n" "$*" >&2; }
die()  { printf "[wait-for-postgres][error] %s\n" "$*" >&2; exit 1; }

has_cmd() { command -v "$1" >/dev/null 2>&1; }

# Parse DATABASE_URL in the form:
#   postgresql://user:pass@host:port/dbname?params
# Minimal parsing; handles common cases.
parse_database_url() {
  local url="$1"

  # strip scheme
  local rest="${url#*://}"

  # split creds and host part
  local creds_and_host="$rest"
  local creds=""
  local hostpart=""

  if [[ "$creds_and_host" == *"@"* ]]; then
    creds="${creds_and_host%%@*}"
    hostpart="${creds_and_host#*@}"
  else
    hostpart="$creds_and_host"
  fi

  # creds -> user:pass
  if [[ -n "$creds" ]]; then
    if [[ "$creds" == *":"* ]]; then
      PGUSER_PARSED="${creds%%:*}"
      PGPASSWORD_PARSED="${creds#*:}"
    else
      PGUSER_PARSED="$creds"
      PGPASSWORD_PARSED=""
    fi
  fi

  # hostpart -> host:port/db?query
  # cut query
  local hostpath="${hostpart%%\?*}"

  # split host:port and path
  local hostport="${hostpath%%/*}"
  local dbname="${hostpath#*/}"

  # hostport -> host:port
  if [[ "$hostport" == *":"* ]]; then
    PGHOST_PARSED="${hostport%%:*}"
    PGPORT_PARSED="${hostport#*:}"
  else
    PGHOST_PARSED="$hostport"
    PGPORT_PARSED=""
  fi

  # dbname might still contain extra segments; accept first
  if [[ -n "$dbname" ]]; then
    PGDATABASE_PARSED="${dbname%%/*}"
  fi
}

# Try to connect using pg_isready if available, otherwise psql
check_ready() {
  local host="$1"
  local port="$2"
  local user="$3"
  local db="$4"

  if has_cmd "pg_isready"; then
    if pg_isready -h "$host" -p "$port" -U "$user" -d "$db" >/dev/null 2>&1; then
      return 0
    fi
    return 1
  fi

  if has_cmd "psql"; then
    # Use a short connect timeout if psql is used
    if PGPASSWORD="${PGPASSWORD:-}" psql "host=${host} port=${port} user=${user} dbname=${db} connect_timeout=2" -c "SELECT 1;" >/dev/null 2>&1; then
      return 0
    fi
    return 1
  fi

  die "Neither pg_isready nor psql found. Install postgres client tools."
}

# Optional: ensure migrations are applied (best-effort)
check_migrations() {
  local schema_path="$1"
  if [[ ! -f "$schema_path" ]]; then
    warn "Prisma schema not found: ${schema_path} (skipping migration check)"
    return 0
  fi

  if ! has_cmd "pnpm"; then
    warn "pnpm not found (skipping migration check)"
    return 0
  fi

  # Attempt a non-destructive status check
  # This assumes a Prisma package exists in the repo and `pnpm prisma` works.
  if pnpm -s prisma migrate status --schema "$schema_path" >/dev/null 2>&1; then
    return 0
  fi

  warn "Prisma migration status check failed (this may be expected if prisma is not configured yet)"
  return 0
}

# -----------------------------
# Defaults
# -----------------------------
TIMEOUT_SECONDS="${TIMEOUT_SECONDS:-60}"
SLEEP_SECONDS="${SLEEP_SECONDS:-2}"
REQUIRE_MIGRATIONS="${REQUIRE_MIGRATIONS:-0}"
PRISMA_SCHEMA="${PRISMA_SCHEMA:-packages/db/prisma/schema.prisma}"

PGHOST_PARSED=""
PGPORT_PARSED=""
PGUSER_PARSED=""
PGPASSWORD_PARSED=""
PGDATABASE_PARSED=""

# -----------------------------
# Resolve connection params
# -----------------------------
if [[ -n "${DATABASE_URL:-}" ]]; then
  parse_database_url "$DATABASE_URL"
fi

PGHOST="${PGHOST:-${PGHOST_PARSED:-localhost}}"
PGPORT="${PGPORT:-${PGPORT_PARSED:-5432}}"
PGUSER="${PGUSER:-${PGUSER_PARSED:-postgres}}"
PGDATABASE="${PGDATABASE:-${PGDATABASE_PARSED:-postgres}}"

# Only set password if not already set in env
if [[ -z "${PGPASSWORD:-}" && -n "${PGPASSWORD_PARSED:-}" ]]; then
  export PGPASSWORD="$PGPASSWORD_PARSED"
fi

log "host=${PGHOST} port=${PGPORT} user=${PGUSER} db=${PGDATABASE}"
log "timeout=${TIMEOUT_SECONDS}s sleep=${SLEEP_SECONDS}s"

# -----------------------------
# Wait loop
# -----------------------------
start_ts="$(date +%s)"
deadline_ts=$((start_ts + TIMEOUT_SECONDS))

attempt=1
while true; do
  if check_ready "$PGHOST" "$PGPORT" "$PGUSER" "$PGDATABASE"; then
    log "postgres is ready"
    break
  fi

  now_ts="$(date +%s)"
  if [[ "$now_ts" -ge "$deadline_ts" ]]; then
    die "timeout waiting for postgres"
  fi

  log "waiting... attempt=${attempt}"
  attempt=$((attempt + 1))
  sleep "$SLEEP_SECONDS"
done

# -----------------------------
# Optional migrations check
# -----------------------------
if [[ "$REQUIRE_MIGRATIONS" == "1" ]]; then
  log "checking migrations (best-effort)"
  check_migrations "$PRISMA_SCHEMA"
fi

log "done"
