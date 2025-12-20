#!/usr/bin/env bash
# Nuttoo Solana installer
#
# Purpose:
# - Install Solana CLI (and optionally Anchor prerequisites) in a safe, explicit way
# - Avoid surprises: prints detected versions and paths
#
# Usage:
#   bash scripts/solana/install-solana.sh
#
# Options:
#   --version <v>        Solana version tag to install (default: stable)
#   --channel <stable|edge|beta>  Convenience alias (default: stable)
#   --yes                Do not prompt
#   --with-anchor        Check and print Anchor prerequisites (Rust, cargo, avm)
#   --set-path           Append Solana path export to shell profile if missing
#
# Notes:
# - Solana installs to: ~/.local/share/solana/install/active_release/bin
# - This script uses the official installer: https://release.solana.com/<version>/install
#
# Exit codes:
#   0 success
#   1 failure

set -euo pipefail

# -----------------------------
# Helpers
# -----------------------------
log()  { printf "[install-solana] %s\n" "$*"; }
warn() { printf "[install-solana][warn] %s\n" "$*" >&2; }
die()  { printf "[install-solana][error] %s\n" "$*" >&2; exit 1; }

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
  local default="${2:-y}" # y|n
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

detect_profile() {
  # Choose the most likely shell profile file for PATH exports.
  # This does not guarantee the user's shell, but covers common cases.
  if [[ -n "${ZSH_VERSION:-}" ]]; then
    echo "$HOME/.zshrc"
    return
  fi
  if [[ -n "${BASH_VERSION:-}" ]]; then
    # macOS uses .bash_profile; Linux commonly uses .bashrc
    if [[ "$(uname -s)" == "Darwin" ]]; then
      echo "$HOME/.bash_profile"
    else
      echo "$HOME/.bashrc"
    fi
    return
  fi

  # Fallbacks
  if [[ -f "$HOME/.zshrc" ]]; then
    echo "$HOME/.zshrc"
  elif [[ -f "$HOME/.bashrc" ]]; then
    echo "$HOME/.bashrc"
  elif [[ -f "$HOME/.bash_profile" ]]; then
    echo "$HOME/.bash_profile"
  else
    echo "$HOME/.profile"
  fi
}

# -----------------------------
# Args
# -----------------------------
SOLANA_VERSION="stable"
CHANNEL="stable"
YES=0
WITH_ANCHOR=0
SET_PATH=0

while [[ $# -gt 0 ]]; do
  case "$1" in
    --version)
      SOLANA_VERSION="${2:-}"
      [[ -n "$SOLANA_VERSION" ]] || die "Missing value for --version"
      shift 2
      ;;
    --channel)
      CHANNEL="${2:-}"
      [[ -n "$CHANNEL" ]] || die "Missing value for --channel"
      shift 2
      ;;
    --yes)
      YES=1
      shift
      ;;
    --with-anchor)
      WITH_ANCHOR=1
      shift
      ;;
    --set-path)
      SET_PATH=1
      shift
      ;;
    -h|--help)
      cat <<'EOF'
Usage:
  bash scripts/solana/install-solana.sh [options]

Options:
  --version <v>         Solana version to install (default: stable)
  --channel <name>      stable|beta|edge (alias to a version string)
  --yes                 Do not prompt
  --with-anchor         Check Anchor prerequisites (Rust, cargo, avm)
  --set-path            Append Solana PATH export to shell profile if missing
EOF
      exit 0
      ;;
    *)
      die "Unknown argument: $1"
      ;;
  esac
done

case "$CHANNEL" in
  stable|beta|edge)
    # Use channel label if user did not explicitly set a version other than default
    if [[ "$SOLANA_VERSION" == "stable" ]]; then
      SOLANA_VERSION="$CHANNEL"
    fi
    ;;
  *)
    warn "Unknown channel: $CHANNEL (ignored)"
    ;;
esac

# -----------------------------
# Preflight
# -----------------------------
log "Target Solana version: $SOLANA_VERSION"

require_cmd "uname"
require_cmd "curl" "Install curl to download the Solana installer."
require_cmd "sh" "A POSIX shell is required."

# Optional but recommended
if ! has_cmd "tar"; then
  warn "tar not found (recommended)."
fi

# -----------------------------
# If already installed, show version
# -----------------------------
if has_cmd "solana"; then
  log "Existing Solana CLI detected:"
  solana --version || true
else
  log "Solana CLI not found in PATH."
fi

# -----------------------------
# Confirm install
# -----------------------------
if [[ "$YES" -ne 1 ]]; then
  if ! prompt_yes_no "Install/Update Solana CLI to '$SOLANA_VERSION'?" "y"; then
    log "Aborted by user."
    exit 0
  fi
fi

# -----------------------------
# Install
# -----------------------------
INSTALL_URL="https://release.solana.com/${SOLANA_VERSION}/install"
log "Downloading installer: $INSTALL_URL"

# Shellcheck note:
# - Solana installer is intended to be piped to sh. We keep it explicit here.
curl -fsSL "$INSTALL_URL" -o /tmp/solana-install.sh
chmod +x /tmp/solana-install.sh

log "Running installer..."
sh /tmp/solana-install.sh

# Installed path is typically this:
SOLANA_BIN_DIR="$HOME/.local/share/solana/install/active_release/bin"

if [[ -d "$SOLANA_BIN_DIR" ]]; then
  log "Solana bin directory: $SOLANA_BIN_DIR"
else
  warn "Expected Solana bin directory not found: $SOLANA_BIN_DIR"
fi

# Try to use the installed solana binary directly
if [[ -x "$SOLANA_BIN_DIR/solana" ]]; then
  "$SOLANA_BIN_DIR/solana" --version || true
fi

# -----------------------------
# Ensure PATH (optional)
# -----------------------------
if [[ "$SET_PATH" -eq 1 ]]; then
  PROFILE_FILE="$(detect_profile)"
  log "Profile file: $PROFILE_FILE"

  mkdir -p "$(dirname "$PROFILE_FILE")"
  touch "$PROFILE_FILE"

  # Check if profile already contains the solana path
  if grep -F "$SOLANA_BIN_DIR" "$PROFILE_FILE" >/dev/null 2>&1; then
    log "PATH export for Solana already present in profile."
  else
    if [[ "$YES" -ne 1 ]]; then
      if ! prompt_yes_no "Append Solana PATH export to $PROFILE_FILE?" "y"; then
        warn "Skipped PATH update. You may need to add Solana to PATH manually."
      else
        echo "" >> "$PROFILE_FILE"
        echo "# Added by Nuttoo scripts/solana/install-solana.sh" >> "$PROFILE_FILE"
        echo "export PATH=\"${SOLANA_BIN_DIR}:\$PATH\"" >> "$PROFILE_FILE"
        log "Appended PATH export to profile."
      fi
    else
      echo "" >> "$PROFILE_FILE"
      echo "# Added by Nuttoo scripts/solana/install-solana.sh" >> "$PROFILE_FILE"
      echo "export PATH=\"${SOLANA_BIN_DIR}:\$PATH\"" >> "$PROFILE_FILE"
      log "Appended PATH export to profile."
    fi
  fi
else
  log "PATH update skipped (use --set-path to enable)."
fi

# -----------------------------
# Post-install verification
# -----------------------------
# Update PATH for current session if needed
export PATH="${SOLANA_BIN_DIR}:$PATH"

if has_cmd "solana"; then
  ok_ver="$(solana --version 2>/dev/null || true)"
  log "solana: ${ok_ver:-unknown}"
else
  failmsg="Solana CLI still not found in PATH."
  if [[ -d "$SOLANA_BIN_DIR" ]]; then
    failmsg="${failmsg} Try: export PATH=\"${SOLANA_BIN_DIR}:\$PATH\""
  fi
  die "$failmsg"
fi

if has_cmd "solana-keygen"; then
  log "solana-keygen available"
else
  warn "solana-keygen not found (unexpected)"
fi

# -----------------------------
# Anchor prerequisites (optional)
# -----------------------------
if [[ "$WITH_ANCHOR" -eq 1 ]]; then
  log "Checking Anchor prerequisites..."

  if has_cmd "rustc"; then
    log "rustc: $(rustc --version || true)"
  else
    warn "rustc not found. Install Rust via rustup: https://rustup.rs"
  fi

  if has_cmd "cargo"; then
    log "cargo: $(cargo --version || true)"
  else
    warn "cargo not found. Install Rust via rustup: https://rustup.rs"
  fi

  # Anchor Version Manager (avm) is the recommended way
  if has_cmd "avm"; then
    log "avm: $(avm --version || true)"
    if has_cmd "anchor"; then
      log "anchor: $(anchor --version || true)"
    else
      warn "anchor not found in PATH. Use: avm install latest && avm use latest"
    fi
  else
    warn "avm not found. Install Anchor via AVM (recommended): https://www.anchor-lang.com/docs/installation"
  fi
fi

# -----------------------------
# Solana config hints
# -----------------------------
log "Recommended config for local development:"
log "  solana config set --url https://api.devnet.solana.com"
log "  solana-keygen new --outfile ~/.config/solana/id.json"
log "  solana airdrop 2"

log "Done."
