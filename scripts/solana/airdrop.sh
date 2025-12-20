#!/usr/bin/env bash
# Nuttoo SOL airdrop helper
#
# Purpose:
# - Airdrop SOL on devnet or localnet to a target address/keypair
# - Provide consistent output and basic validation
#
# Usage:
#   bash scripts/solana/airdrop.sh --amount 2
#   bash scripts/solana/airdrop.sh --amount 5 --to <PUBKEY>
#   bash scripts/solana/airdrop.sh --amount 10 --keypair ./storage/local/solana-keys/id.json
#   bash scripts/solana/airdrop.sh --amount 50 --url http://127.0.0.1:8899
#
# Options:
#   --amount <n>        SOL amount (default: 2)
#   --to <pubkey>       Target pubkey (default: current solana address)
#   --keypair <path>    Keypair for signer/address (default: solana config keypair)
#   --url <rpc>         RPC url override (default: solana config url)
#   --commitment <c>    processed|confirmed|finalized (default: confirmed)
#   --retries <n>       Retry attempts if airdrop fails (default: 5)
#   --sleep <sec>       Sleep between retries (default: 2)
#   --yes               Do not prompt
#
# Exit codes:
#   0 success
#   1 failure

set -euo pipefail

# -----------------------------
# Helpers
# -----------------------------
log()  { printf "[airdrop] %s\n" "$*"; }
warn() { printf "[airdrop][warn] %s\n" "$*" >&2; }
die()  { printf "[airdrop][error] %s\n" "$*" >&2; exit 1; }

has_cmd() { command -v "$1" >/dev/null 2>&1; }

require_cmd() {
  local cmd="$1"
  local hint="${2:-}"
  if ! has_cmd "$cmd"; then
    if [[ -n "$hint" ]]; then
      die "Missing required command: $cmd. $hint"
    fi
    die "Missing required command: $cmd."
  fi
}

prompt_yes_no() {
  local msg="$1"
  local default="${2:-y}"
  local yn=""
  while true; do
    if [[ "$default" == "y" ]]; then
      read -r -p "$msg [Y/n]: " yn || true
      yn="${yn:-Y}"
    else
      read -r -p "$msg [y/N]: " yn || true
      yn="${yn:-N}"
    fi
    case "$yn" in
      [Yy]*) return 0 ;;
      [Nn]*) return 1 ;;
      *) echo "Please answer y or n." ;;
    esac
  done
}

is_number() {
  local v="$1"
  [[ "$v" =~ ^[0-9]+([.][0-9]+)?$ ]]
}

looks_like_pubkey() {
  # Very lightweight check: base58-ish and reasonable length
  local v="$1"
  [[ "${#v}" -ge 32 && "${#v}" -le 50 ]] && [[ "$v" =~ ^[1-9A-HJ-NP-Za-km-z]+$ ]]
}

# -----------------------------
# Defaults
# -----------------------------
AMOUNT="2"
TO=""
KEYPAIR=""
URL=""
COMMITMENT="confirmed"
RETRIES="5"
SLEEP_SEC="2"
YES=0

# -----------------------------
# Args
# -----------------------------
while [[ $# -gt 0 ]]; do
  case "$1" in
    --amount)
      AMOUNT="${2:-}"; [[ -n "$AMOUNT" ]] || die "Missing value for --amount"
      shift 2
      ;;
    --to)
      TO="${2:-}"; [[ -n "$TO" ]] || die "Missing value for --to"
      shift 2
      ;;
    --keypair)
      KEYPAIR="${2:-}"; [[ -n "$KEYPAIR" ]] || die "Missing value for --keypair"
      shift 2
      ;;
    --url)
      URL="${2:-}"; [[ -n "$URL" ]] || die "Missing value for --url"
      shift 2
      ;;
    --commitment)
      COMMITMENT="${2:-}"; [[ -n "$COMMITMENT" ]] || die "Missing value for --commitment"
      shift 2
      ;;
    --retries)
      RETRIES="${2:-}"; [[ -n "$RETRIES" ]] || die "Missing value for --retries"
      shift 2
      ;;
    --sleep)
      SLEEP_SEC="${2:-}"; [[ -n "$SLEEP_SEC" ]] || die "Missing value for --sleep"
      shift 2
      ;;
    --yes)
      YES=1
      shift
      ;;
    -h|--help)
      cat <<'EOF'
Usage:
  bash scripts/solana/airdrop.sh [options]

Options:
  --amount <n>        SOL amount (default: 2)
  --to <pubkey>       Target pubkey (default: current solana address)
  --keypair <path>    Keypair (default: solana config)
  --url <rpc>         RPC url override (default: solana config)
  --commitment <c>    processed|confirmed|finalized (default: confirmed)
  --retries <n>       Retry count (default: 5)
  --sleep <sec>       Sleep between retries (default: 2)
  --yes               Do not prompt
EOF
      exit 0
      ;;
    *)
      die "Unknown argument: $1"
      ;;
  esac
done

# -----------------------------
# Preflight
# -----------------------------
require_cmd "solana" "Install Solana CLI first."

if ! is_number "$AMOUNT"; then
  die "Invalid amount: $AMOUNT"
fi

# Build common solana flags
SOLANA_FLAGS=()
if [[ -n "$KEYPAIR" ]]; then
  [[ -f "$KEYPAIR" ]] || die "Keypair not found: $KEYPAIR"
  SOLANA_FLAGS+=(--keypair "$KEYPAIR")
fi
if [[ -n "$URL" ]]; then
  SOLANA_FLAGS+=(--url "$URL")
fi

# Determine target pubkey
if [[ -z "$TO" ]]; then
  TO="$(solana "${SOLANA_FLAGS[@]}" address)"
fi

if ! looks_like_pubkey "$TO"; then
  die "Target does not look like a valid pubkey: $TO"
fi

# Print context
CFG_URL="$(solana "${SOLANA_FLAGS[@]}" config get 2>/dev/null | awk -F': ' '/RPC URL/ {print $2}' || true)"
[[ -n "$CFG_URL" ]] || CFG_URL="(unknown)"

log "rpc=${CFG_URL}"
log "commitment=${COMMITMENT}"
log "amount=${AMOUNT}"
log "to=${TO}"

if [[ "$YES" -ne 1 ]]; then
  if ! prompt_yes_no "Proceed with airdrop?" "y"; then
    log "Aborted by user."
    exit 0
  fi
fi

# -----------------------------
# Attempt airdrop with retries
# -----------------------------
attempt=1
while true; do
  log "attempt ${attempt}/${RETRIES}"
  set +e
  OUT="$(solana "${SOLANA_FLAGS[@]}" airdrop "$AMOUNT" "$TO" --commitment "$COMMITMENT" 2>&1)"
  CODE=$?
  set -e

  if [[ "$CODE" -eq 0 ]]; then
    log "airdrop succeeded"
    log "$OUT"
    break
  fi

  warn "airdrop failed (exit=${CODE})"
  warn "$OUT"

  if [[ "$attempt" -ge "$RETRIES" ]]; then
    die "airdrop failed after ${RETRIES} attempts"
  fi

  attempt=$((attempt + 1))
  sleep "$SLEEP_SEC"
done

# -----------------------------
# Balance
# -----------------------------
set +e
BAL="$(solana "${SOLANA_FLAGS[@]}" balance "$TO" --commitment "$COMMITMENT" 2>/dev/null)"
set -e
log "balance=${BAL:-unknown}"

log "done"
