#!/usr/bin/env bash
# =============================================================================
#  OmniGuard — VS Code Extension Publisher Script (macOS/Linux Bash)
# =============================================================================

set -euo pipefail

# Colors
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; CYAN='\033[0;36m'; RESET='\033[0m'

echo -e "${CYAN}╔══════════════════════════════════════════════════════╗${RESET}"
echo -e "${CYAN}║          OmniGuard — Extension Publisher             ║${RESET}"
echo -e "${CYAN}╚══════════════════════════════════════════════════════╝${RESET}"

# 1. Preflight platform verification
echo -e "\n${CYAN}[Extension Publish] 1. Running platform E2E and Compliance audits...${RESET}"
echo "Running platform E2E Suite..."
if ! node ../scripts/run-e2e-tests.js; then
    echo -e "${RED}✗ Platform E2E verification suite failed.${RESET}"
    exit 1
fi
echo -e "${GREEN}✓ E2E Verification Suite passed.${RESET}"

echo "Running Enterprise Compliance Auditor..."
if ! node ../scripts/verify-enterprise.js; then
    echo -e "${RED}✗ Enterprise compliance & security checks failed.${RESET}"
    exit 1
fi
echo -e "${GREEN}✓ Enterprise compliance & security checks passed.${RESET}"

# 2. Compile TypeScript
echo -e "\n${CYAN}[Extension Publish] 2. Compiling TypeScript source...${RESET}"
npm run compile
echo -e "${GREEN}✓ Extension compiled successfully.${RESET}"

# 3. Package Extension into VSIX
echo -e "\n${CYAN}[Extension Publish] 3. Packaging extension...${RESET}"
rm -f omniguard-1.0.0.vsix
npx vsce package --no-yarn --allow-missing-repository -o omniguard-1.0.0.vsix
if [[ ! -f "omniguard-1.0.0.vsix" ]]; then
    echo -e "${RED}✗ vsce packaging failed.${RESET}"
    exit 1
fi
echo -e "${GREEN}✓ VSIX package generated: omniguard-1.0.0.vsix${RESET}"

# 4. Publish Extension
echo -e "\n${CYAN}[Extension Publish] 4. Publishing extension to marketplace...${RESET}"
if [[ -z "${VSCE_PAT:-}" ]]; then
    echo -e "${YELLOW}[WARNING] VSCE_PAT environment variable not set.${RESET}"
    echo "  -> To publish automatically, configure your Personal Access Token in VSCE_PAT."
    echo "  -> Manual upload: upload omniguard-1.0.0.vsix directly to the VS Code Marketplace Publisher Portal."
else
    echo "Publishing to VS Code Marketplace..."
    npx vsce publish --no-yarn -p "$VSCE_PAT"
    echo -e "${GREEN}✓ Extension successfully published!${RESET}"
fi

exit 0
