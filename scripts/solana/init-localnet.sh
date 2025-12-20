```bash
#!/usr/bin/env bash
# Nuttoo local Solana validator bootstrap
#
# Purpose:
# - Initialize and run a local Solana validator for Nuttoo development
# - Create and manage local keypairs
# - Configure Solana CLI to use localnet
# - Optionally airdrop SOL
#
# Usage:
#   bash scripts/solana/init-localnet.sh
#
# Options:
#   --ledger <path>        Ledger directory (default: ./storage/local/solana-ledger)
#   --keys <path>          Keypair directory (default: ./storage/local/solana-keys)
#   --rpc-port <port>      RPC port (default: 8899)
#   --ws-port <port>       WebSocket port (default: 8900)
#   --airdrop <amount>     SOL to airdrop to default key (default: 100)
#   --reset                Delete existing ledger before starting
#   --no-airdrop           Skip airdrop
#   --background           Run validator in background
#   --yes                  Do not prompt
#
# Exit codes:
#   0 success
#   1 failure

set -euo pipefail

# -----------------------------
# Helpers
# -----------------------------
log()  { printf "[init-localnet] %s\n" "$*"; }
warn() { printf "[init-localnet][warn] %s\n" "$*" >&2; }
die()  { printf "[init-localnet][error] %s\n" "$*" >&2; exit 1; }

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

# -----------------------------
# Defaults
# -----------------------------
LEDGER_DIR="./storage/local/solana-ledger"
KEYS_DIR="./storage/local/solana-keys"
RPC_PORT="8899"
WS_PORT="8900"
AIRDROP_AMOUNT="100"
RESET=0
NO_AIRDROP=0
BACKGROUND=0
YES=0

# -----------------------------
# Args
# -----------------------------
while [[ $# -gt 0 ]]; do
  case "$1" in
    --ledger)
      LEDGER_DIR="${2:-}"; [[ -n "$LEDGER_DIR" ]] || die "Missing value for --ledger"
      shift 2
      ;;
    --keys)
      KEYS_DIR="${2:-}"; [[ -n "$KEYS_DIR" ]] || die "Missing value for --keys"
      shift 2
      ;;
    --rpc-port)
      RPC_PORT="${2:-}"; [[ -n "$RPC_PORT" ]] || die "Missing value for --rpc-port"
      shift 2
      ;;
    --ws-port)
      WS_PORT="${2:-}"; [[ -n "$WS_PORT" ]] || die "Missing value for --ws-port"
      shift 2
      ;;
    --airdrop)
      AIRDROP_AMOUNT="${2:-}"; [[ -n "$AIRDROP_AMOUNT" ]] || die "Missing value for --airdrop"
      shift 2
      ;;
    --reset)
      RESET=1
      shift
      ;;
    --no-airdrop)
      NO_AIRDROP=1
      shift
      ;;
    --background)
      BACKGROUND=1
      shift
      ;;
    --yes)
      YES=1
      shift
      ;;
    -h|--help)
      cat <<'EOF'
Usage:
  bash scripts/solana/init-localnet.sh [options]

Options:
  --ledger <path>       Ledger directory
  --keys <path>         Keypair directory
  --rpc-port <port>     RPC port (default 8899)
  --ws-port <port>      WS port (default 8900)
  --airdrop <amount>    SOL to airdrop (default 100)
  --reset               Delete existing ledger
  --no-airdrop          Skip airdrop
  --background          Run validator in background
  --yes                 Do not prompt
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
require_cmd "solana-test-validator" "Solana CLI install is incomplete."
require_cmd "solana-keygen"

log "ledger=${LEDGER_DIR}"
log "keys=${KEYS_DIR}"
log "rpc_port=${RPC_PORT}"
log "ws_port=${WS_PORT}"

# -----------------------------
# Reset ledger
# -----------------------------
if [[ "$RESET" -eq 1 && -d "$LEDGER_DIR" ]]; then
  if [[ "$YES" -eq 1 ]] || prompt_yes_no "Delete existing ledger at ${LEDGER_DIR}?" "n"; then
    rm -rf "$LEDGER_DIR"
    log "ledger removed"
  else
    die "ledger reset aborted"
  fi
fi

# -----------------------------
# Prepare directories
# -----------------------------
mkdir -p "$LEDGER_DIR"
mkdir -p "$KEYS_DIR"

IDENTITY_KEY="${KEYS_DIR}/validator.json"
USER_KEY="${KEYS_DIR}/id.json"

# -----------------------------
# Generate keys
# -----------------------------
if [[ ! -f "$IDENTITY_KEY" ]]; then
  log "Generating validator identity keypair"
  solana-keygen new --no-bip39-passphrase --outfile "$IDENTITY_KEY"
else
  log "Validator identity key exists"
fi

if [[ ! -f "$USER_KEY" ]]; then
  log "Generating default user keypair"
  solana-keygen new --no-bip39-passphrase --outfile "$USER_KEY"
else
  log "User key exists"
fi

# -----------------------------
# Configure Solana CLI
# -----------------------------
solana config set --url "http://127.0.0.1:${RPC_PORT}"
solana config set --keypair "$USER_KEY"

log "Solana CLI configured for localnet"

# -----------------------------
# Start validator
# -----------------------------
CMD=(
  solana-test-validator
  --ledger "$LEDGER_DIR"
  --identity "$IDENTITY_KEY"
  --rpc-port "$RPC_PORT"
  --rpc-bind-address 0.0.0.0
  --ws-port "$WS_PORT"
  --limit-ledger-size
)

log "Starting solana-test-validator"

if [[ "$BACKGROUND" -eq 1 ]]; then
  "${CMD[@]}" > "${LEDGER_DIR}/validator.log" 2>&1 &
  VALIDATOR_PID=$!
  echo "$VALIDATOR_PID" > "${LEDGER_DIR}/validator.pid"
  log "Validator started in background (pid=${VALIDATOR_PID})"
else
  "${CMD[@]}" &
  VALIDATOR_PID=$!
  log "Validator started (pid=${VALIDATOR_PID})"
fi

# -----------------------------
# Wait for readiness
# -----------------------------
log "Waiting for validator to be ready..."
for i in $(seq 1 30); do
  if solana cluster-version >/dev/null 2>&1; then
    log "Validator is ready"
    break
  fi
  sleep 1
done

# -----------------------------
# Airdrop
# -----------------------------
if [[ "$NO_AIRDROP" -eq 0 ]]; then
  log "Requesting airdrop: ${AIRDROP_AMOUNT} SOL"
  solana airdrop "$AIRDROP_AMOUNT" || warn "Airdrop failed"
else
  log "Airdrop skipped"
fi

# -----------------------------
# Summary
# -----------------------------
PUBKEY="$(solana address)"
BALANCE="$(solana balance || true)"

log "Localnet ready"
log "RPC: http://127.0.0.1:${RPC_PORT}"
log "WS: ws://127.0.0.1:${WS_PORT}"
log "Default pubkey: ${PUBKEY}"
log "Balance: ${BALANCE}"

log "Done."
```
