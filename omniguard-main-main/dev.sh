#!/usr/bin/env bash
# =============================================================================
#  OmniGuard — Local Dev Setup & Run Script (macOS/Linux Bash)
# =============================================================================

set -euo pipefail

# Colours
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
BLUE='\033[0;34m'; CYAN='\033[0;36m'; BOLD='\033[1m'; RESET='\033[0m'

ok()   { echo -e "${GREEN}  ✓${RESET}  $*"; }
info() { echo -e "${BLUE}  →${RESET}  $*"; }
warn() { echo -e "${YELLOW}  ⚠${RESET}  $*"; }
fail() { echo -e "${RED}  ✗  $*${RESET}"; exit 1; }
hdr()  { echo -e "\n${BOLD}${CYAN}$*${RESET}"; }

echo -e "\n${BOLD}${CYAN}╔══════════════════════════════════════════════════════╗${RESET}"
echo -e "${BOLD}${CYAN}║          OmniGuard — Local Dev Setup & Check         ║${RESET}"
echo -e "${BOLD}${CYAN}╚══════════════════════════════════════════════════════╝${RESET}"

# ── Preflight checks ───────────────────────────────────────────────────────────
hdr "Preflight Checks"

command -v node >/dev/null 2>&1 || fail "Node.js not found. Install from https://nodejs.org (v18+)"
NODE_VER=$(node --version | sed 's/v//')
NODE_MAJ=$(echo "$NODE_VER" | cut -d. -f1)
[[ "$NODE_MAJ" -ge 18 ]] || fail "Node.js v18+ required (found v$NODE_VER)"
ok "Node.js v$NODE_VER"

command -v npm >/dev/null 2>&1 || fail "npm not found"
ok "npm $(npm --version)"

command -v git >/dev/null 2>&1 || fail "Git not found. Install from https://git-scm.com/"
ok "Git: $(git --version)"

if command -v supabase >/dev/null 2>&1; then
  ok "Supabase CLI: $(supabase --version)"
else
  warn "Supabase CLI not found."
  info "Resolution: Install using 'npm install -g supabase' or 'brew install supabase/tap/supabase'"
fi

if command -v docker >/dev/null 2>&1; then
  ok "Docker: $(docker --version)"
else
  warn "Docker is missing or not running. Install from https://www.docker.com/"
fi

if command -v code >/dev/null 2>&1; then
  ok "VS Code CLI ('code') available"
else
  warn "VS Code CLI ('code') not found in PATH"
  info "Resolution: Open VS Code, press Cmd+Shift+P, and select 'Shell Command: Install 'code' command in PATH'"
fi

# ── Environment variables ──────────────────────────────────────────────────────
ENV_FILE="./omniguard/.env"
if [[ ! -f "$ENV_FILE" ]]; then
  if [[ -f "./.env" ]]; then
    cp "./.env" "$ENV_FILE"
    ok "Copied root .env to omniguard/.env"
  else
    fail "Environment File (.env) missing. Create omniguard/.env with VITE_SUPABASE_URL."
  fi
fi

SUPA_URL=$(grep "^VITE_SUPABASE_URL=" "$ENV_FILE" | cut -d= -f2- | tr -d '"' | tr -d "'" || true)
if [[ -z "$SUPA_URL" || "$SUPA_URL" == *"YOUR_PROJECT_ID"* ]]; then
  fail "VITE_SUPABASE_URL not configured correctly in $ENV_FILE"
fi
ok "Supabase URL: $SUPA_URL"

# ── Supabase Connectivity & Schema ─────────────────────────────────────────────
hdr "Connectivity & Schema Check"
if ! node ./scripts/verify-supabase-env.js; then
  fail "Supabase environment or database verification failed!"
fi
ok "Supabase project, DB schema, RLS, buckets, and edge functions verified."

# ── Install and Compile ────────────────────────────────────────────────────────
hdr "Installing Packages & Linking CLI"

info "Installing dashboard packages..."
cd omniguard && npm install --silent && cd ..

info "Installing CLI packages and creating link..."
cd cli && npm install --silent && npm link --silent && cd ..

# Verify CLI command
# Automatically detect and append npm global bin prefix to PATH if not present
NPM_PREFIX=$(npm config get prefix 2>/dev/null || true)
if [[ -n "$NPM_PREFIX" ]]; then
  if [[ -d "$NPM_PREFIX/bin" ]]; then
    export PATH="$NPM_PREFIX/bin:$PATH"
  else
    export PATH="$NPM_PREFIX:$PATH"
  fi
fi

if command -v omniguard >/dev/null 2>&1; then
  ok "CLI check: $(omniguard version)"
else
  warn "CLI linked but 'omniguard' command not immediately in path. Ensure global npm bin directory is in your shell PATH."
fi

info "Compiling VS Code Extension..."
cd vscode-extension && npm install --silent && npm run compile

# Package extension
info "Packaging VSIX..."
npx vsce package --no-yarn --allow-missing-repository -o omniguard-1.0.0.vsix
if [[ -f "omniguard-1.0.0.vsix" ]]; then
  if command -v code >/dev/null 2>&1; then
    code --install-extension omniguard-1.0.0.vsix --force
    ok "VS Code extension installed successfully."
  else
    warn "Could not install VS Code extension: 'code' CLI missing"
  fi
fi
cd ..

# ── Launch ─────────────────────────────────────────────────────────────────────
hdr "Starting Dev Server"
info "Dashboard URL: http://localhost:5173"

# Open browser automatically
if command -v open >/dev/null 2>&1; then
  open "http://localhost:5173"
elif command -v xdg-open >/dev/null 2>&1; then
  xdg-open "http://localhost:5173"
fi

cd omniguard
npm run dev
