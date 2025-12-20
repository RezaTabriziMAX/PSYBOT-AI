#!/usr/bin/env bash
# Nuttoo bootstrap script
# Purpose: one-command local setup for the Nuttoo monorepo
# - Validates required tools
# - Ensures a local .env exists
# - Installs dependencies (pnpm)
# - Builds all packages/apps
# - Prints next-step commands
#
# Usage:
#   bash scripts/bootstrap.sh
#
# Optional env:
#   SKIP_INSTALL=1   -> skip pnpm install
#   SKIP_BUILD=1     -> skip pnpm build
#   NO_ENV_WRITE=1   -> do not create .env if missing
#   USE_DOCKER=1     -> print docker compose instructions as default path

set -euo pipefail

# -----------------------------
# Helpers
# -----------------------------
log()  { printf "[bootstrap] %s\n" "$*"; }
warn() { printf "[bootstrap][warn] %s\n" "$*" >&2; }
die()  { printf "[bootstrap][error] %s\n" "$*" >&2; exit 1; }

has_cmd() { command -v "$1" >/dev/null 2>&1; }

require_cmd() {
  local cmd="$1"
  local hint="${2:-}"
  if ! has_cmd "$cmd"; then
    if [[ -n "$hint" ]]; then
      die "Missing required command: $cmd. ${hint}"
    fi
    die "Missing required command: $cmd."
  fi
}

is_repo_root() {
  [[ -f "pnpm-workspace.yaml" ]] && [[ -f "package.json" ]] && [[ -d "apps" ]] && [[ -d "packages" ]]
}

# -----------------------------
# Environment detection
# -----------------------------
OS_NAME="$(uname -s | tr '[:upper:]' '[:lower:]' || true)"
ARCH_NAME="$(uname -m | tr '[:upper:]' '[:lower:]' || true)"

# -----------------------------
# Validate repo context
# -----------------------------
if ! is_repo_root; then
  die "Run this script from the repository root (where pnpm-workspace.yaml exists)."
fi

log "Repo root detected."
log "OS=${OS_NAME} ARCH=${ARCH_NAME}"

# -----------------------------
# Validate required tools
# -----------------------------
require_cmd "node" "Install Node.js 20+."
require_cmd "pnpm" "Install pnpm (https://pnpm.io/installation)."

NODE_VERSION_RAW="$(node -v || true)"
log "node=${NODE_VERSION_RAW}"
log "pnpm=$(pnpm -v || true)"

# Docker is optional but recommended for local infra
if has_cmd "docker"; then
  log "docker=$(docker --version | head -n 1 || true)"
else
  warn "docker not found (optional). You can still run with pnpm, but Postgres/Redis will be external."
fi

# -----------------------------
# Create .env if missing
# -----------------------------
ENV_FILE=".env"
ENV_EXAMPLE=".env.example"

if [[ ! -f "$ENV_FILE" ]]; then
  if [[ "${NO_ENV_WRITE:-0}" == "1" ]]; then
    warn ".env is missing and NO_ENV_WRITE=1, skipping .env creation."
  else
    if [[ -f "$ENV_EXAMPLE" ]]; then
      log "Creating .env from .env.example"
      cp "$ENV_EXAMPLE" "$ENV_FILE"
    else
      warn ".env.example not found. Creating a minimal .env"
      cat > "$ENV_FILE" <<'EOF'
NODE_ENV=development
NUTTOO_API_PORT=8787
NUTTOO_WEB_PORT=5173
DATABASE_URL=postgresql://nuttoo:nuttoo@localhost:5432/nuttoo
REDIS_URL=redis://localhost:6379
CORS_ORIGIN=http://localhost:5173
EOF
    fi
  fi
else
  log ".env found."
fi

# -----------------------------
# Install deps
# -----------------------------
if [[ "${SKIP_INSTALL:-0}" == "1" ]]; then
  log "SKIP_INSTALL=1, skipping dependency installation."
else
  log "Installing dependencies with pnpm..."
  pnpm i
fi

# -----------------------------
# Typecheck/build
# -----------------------------
if [[ "${SKIP_BUILD:-0}" == "1" ]]; then
  log "SKIP_BUILD=1, skipping build."
else
  log "Building workspace (all packages/apps)..."
  pnpm -r build
fi

# -----------------------------
# Final instructions
# -----------------------------
log "Bootstrap complete."

if [[ "${USE_DOCKER:-0}" == "1" ]]; then
  cat <<'EOF'

Next steps (recommended):
  docker compose up --build

Endpoints:
  Web: http://localhost:5173
  API: http://localhost:8787/health

EOF
else
  cat <<'EOF'

Next steps:
  Option A (Docker, recommended for Postgres/Redis):
    docker compose up --build

  Option B (pnpm dev, if infra is already running):
    pnpm dev

Endpoints:
  Web: http://localhost:5173
  API: http://localhost:8787/health

Troubleshooting:
  - If ports are in use, change NUTTOO_API_PORT / NUTTOO_WEB_PORT in .env
  - If docker is not installed, run Postgres/Redis separately and update DATABASE_URL / REDIS_URL

EOF
fi
