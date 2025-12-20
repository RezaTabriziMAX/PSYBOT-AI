```bash
#!/usr/bin/env bash
# Nuttoo doctor script
# Purpose:
#   Diagnose local environment and repository health for Nuttoo.
#   This script performs read-only checks and prints actionable results.
#
# Usage:
#   bash scripts/doctor.sh
#
# Exit codes:
#   0  -> all critical checks passed
#   1  -> non-critical warnings present
#   2  -> critical failures detected
#
# Environment variables:
#   STRICT=1        -> treat warnings as failures
#   NO_COLOR=1      -> disable ANSI colors
#   CHECK_DOCKER=0  -> skip docker checks
#   CHECK_NETWORK=0 -> skip network checks
#   CHECK_PORTS=0   -> skip port availability checks

set -euo pipefail

# -----------------------------
# Globals
# -----------------------------
EXIT_WARN=1
EXIT_FAIL=2
WARNINGS=0
FAILURES=0

# -----------------------------
# Colors
# -----------------------------
if [[ "${NO_COLOR:-0}" == "1" ]] || [[ ! -t 1 ]]; then
  C_RESET=""
  C_RED=""
  C_GREEN=""
  C_YELLOW=""
  C_BLUE=""
else
  C_RESET="\033[0m"
  C_RED="\033[31m"
  C_GREEN="\033[32m"
  C_YELLOW="\033[33m"
  C_BLUE="\033[34m"
fi

# -----------------------------
# Helpers
# -----------------------------
ok()    { printf "%b[ok]%b %s\n"    "$C_GREEN" "$C_RESET" "$*"; }
info()  { printf "%b[i]%b  %s\n"    "$C_BLUE"  "$C_RESET" "$*"; }
warn()  { printf "%b[!]%b  %s\n"    "$C_YELLOW""$C_RESET" "$*"; WARNINGS=$((WARNINGS+1)); }
fail()  { printf "%b[x]%b  %s\n"    "$C_RED"   "$C_RESET" "$*"; FAILURES=$((FAILURES+1)); }

has_cmd() { command -v "$1" >/dev/null 2>&1; }

version_ge() {
  # Compare semantic-ish versions: version_ge current required
  # Example: version_ge "v20.11.1" "20.0.0"
  local cur="${1#v}"
  local req="$2"
  IFS='.' read -r -a c <<< "$cur"
  IFS='.' read -r -a r <<< "$req"
  for i in 0 1 2; do
    local cv="${c[i]:-0}"
    local rv="${r[i]:-0}"
    if (( cv > rv )); then return 0; fi
    if (( cv < rv )); then return 1; fi
  done
  return 0
}

is_repo_root() {
  [[ -f "pnpm-workspace.yaml" ]] && [[ -f "package.json" ]] && [[ -d "apps" ]] && [[ -d "packages" ]]
}

check_port_free() {
  local port="$1"
  if has_cmd "lsof"; then
    if lsof -iTCP:"$port" -sTCP:LISTEN -Pn >/dev/null 2>&1; then
      return 1
    fi
  elif has_cmd "ss"; then
    if ss -lnt | awk '{print $4}' | grep -E "[:.]$port$" >/dev/null 2>&1; then
      return 1
    fi
  elif has_cmd "netstat"; then
    if netstat -an | grep -E "[:.]$port .*LISTEN" >/dev/null 2>&1; then
      return 1
    fi
  fi
  return 0
}

# -----------------------------
# Start
# -----------------------------
info "Nuttoo doctor starting"

# -----------------------------
# Repo checks
# -----------------------------
if is_repo_root; then
  ok "repository root detected"
else
  fail "not running from repository root"
fi

# -----------------------------
# OS / Arch
# -----------------------------
OS_NAME="$(uname -s | tr '[:upper:]' '[:lower:]' || true)"
ARCH_NAME="$(uname -m | tr '[:upper:]' '[:lower:]' || true)"
info "os=${OS_NAME} arch=${ARCH_NAME}"

# -----------------------------
# Node.js
# -----------------------------
if has_cmd "node"; then
  NODE_V="$(node -v)"
  info "node=${NODE_V}"
  if version_ge "$NODE_V" "20.0.0"; then
    ok "node version is supported (>=20)"
  else
    fail "node version is too old (>=20 required)"
  fi
else
  fail "node is not installed"
fi

# -----------------------------
# pnpm
# -----------------------------
if has_cmd "pnpm"; then
  PNPM_V="$(pnpm -v)"
  info "pnpm=${PNPM_V}"
  ok "pnpm is installed"
else
  fail "pnpm is not installed"
fi

# -----------------------------
# Docker (optional)
# -----------------------------
if [[ "${CHECK_DOCKER:-1}" == "1" ]]; then
  if has_cmd "docker"; then
    info "docker=$(docker --version | head -n 1 || true)"
    if docker info >/dev/null 2>&1; then
      ok "docker daemon is running"
    else
      warn "docker is installed but daemon is not running"
    fi
  else
    warn "docker not installed (optional)"
  fi
fi

# -----------------------------
# Environment files
# -----------------------------
if [[ -f ".env" ]]; then
  ok ".env exists"
else
  warn ".env is missing"
fi

if [[ -f ".env.example" ]]; then
  ok ".env.example exists"
else
  warn ".env.example is missing"
fi

# -----------------------------
# Workspace integrity
# -----------------------------
if [[ -f "pnpm-workspace.yaml" ]]; then
  ok "pnpm workspace file exists"
else
  fail "pnpm-workspace.yaml missing"
fi

if [[ -d "apps" ]] && [[ -d "packages" ]]; then
  ok "apps/ and packages/ directories exist"
else
  fail "apps/ or packages/ directory missing"
fi

# -----------------------------
# Install state
# -----------------------------
if [[ -d "node_modules" ]]; then
  ok "root node_modules exists"
else
  warn "node_modules not found (run pnpm i)"
fi

# -----------------------------
# TypeScript configs
# -----------------------------
if [[ -f "tsconfig.base.json" ]]; then
  ok "tsconfig.base.json exists"
else
  warn "tsconfig.base.json missing"
fi

# -----------------------------
# API checks
# -----------------------------
if [[ -d "apps/api" ]]; then
  ok "apps/api exists"
  if [[ -f "apps/api/src/main.ts" ]]; then
    ok "api entrypoint found"
  else
    fail "api entrypoint missing (apps/api/src/main.ts)"
  fi
else
  fail "apps/api missing"
fi

# -----------------------------
# Web checks
# -----------------------------
if [[ -d "apps/web" ]]; then
  ok "apps/web exists"
  if [[ -f "apps/web/index.html" ]]; then
    ok "web index.html found"
  else
    warn "web index.html missing"
  fi
else
  fail "apps/web missing"
fi

# -----------------------------
# Ports
# -----------------------------
if [[ "${CHECK_PORTS:-1}" == "1" ]]; then
  API_PORT="${NUTTOO_API_PORT:-8787}"
  WEB_PORT="${NUTTOO_WEB_PORT:-5173}"

  if check_port_free "$API_PORT"; then
    ok "api port ${API_PORT} is available"
  else
    warn "api port ${API_PORT} is in use"
  fi

  if check_port_free "$WEB_PORT"; then
    ok "web port ${WEB_PORT} is available"
  else
    warn "web port ${WEB_PORT} is in use"
  fi
fi

# -----------------------------
# Network (optional)
# -----------------------------
if [[ "${CHECK_NETWORK:-1}" == "1" ]]; then
  if has_cmd "curl"; then
    if curl -fsS https://registry.npmjs.org >/dev/null 2>&1; then
      ok "network access to npm registry"
    else
      warn "cannot reach npm registry"
    fi
  else
    warn "curl not installed, skipping network check"
  fi
fi

# -----------------------------
# Summary
# -----------------------------
echo ""
info "summary"
printf "  warnings: %d\n" "$WARNINGS"
printf "  failures: %d\n" "$FAILURES"

if [[ "$FAILURES" -gt 0 ]]; then
  printf "%b[x]%b critical issues detected\n" "$C_RED" "$C_RESET"
  exit "$EXIT_FAIL"
fi

if [[ "$WARNINGS" -gt 0 ]]; then
  if [[ "${STRICT:-0}" == "1" ]]; then
    printf "%b[x]%b warnings treated as failures (STRICT=1)\n" "$C_RED" "$C_RESET"
    exit "$EXIT_FAIL"
  fi
  printf "%b[!]%b warnings present\n" "$C_YELLOW" "$C_RESET"
  exit "$EXIT_WARN"
fi

printf "%b[ok]%b system is healthy\n" "$C_GREEN" "$C_RESET"
exit 0
```
