#!/usr/bin/env bash
# =============================================================================
#  OmniGuard — Local End-to-End Test Suite Trigger (macOS/Linux Bash)
# =============================================================================

set -euo pipefail

# Colors
RED='\033[0;31m'; GREEN='\033[0;32m'; CYAN='\033[0;36m'; RESET='\033[0m'

echo -e "${CYAN}Starting OmniGuard End-to-End Test Suite...${RESET}"

# Check Node.js
command -v node >/dev/null 2>&1 || { echo -e "${RED}✗ Node.js is required to run E2E tests.${RESET}" >&2; exit 1; }

# Get script root
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Run E2E test runner
if ! node "$DIR/scripts/run-e2e-tests.js"; then
  echo -e "\n${RED}✗ E2E Tests Failed!${RESET}"
  exit 1
fi

echo -e "\n${GREEN}✓ E2E Tests Completed Successfully!${RESET}"
exit 0
