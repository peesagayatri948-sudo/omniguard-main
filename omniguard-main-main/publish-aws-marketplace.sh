#!/usr/bin/env bash
# =============================================================================
#  OmniGuard — AWS Marketplace Bundle Publisher (Bash)
# =============================================================================

set -euo pipefail

# Colors
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; CYAN='\033[0;36m'; RESET='\033[0m'

echo -e "${CYAN}Starting AWS Marketplace bundle preparation...${RESET}"

# 1. Run Node validator
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
if ! node "$DIR/scripts/validate-marketplace-bundle.js"; then
  echo -e "\n${RED}✗ Bundle validation failed! Resolve issues before packaging.${RESET}"
  exit 1
fi

# 2. Package Artifacts
echo -e "\nCompressing marketplace files..."
OUTPUT_PATH="$DIR/omniguard-aws-marketplace-bundle.zip"
rm -f "$OUTPUT_PATH"

if command -v zip >/dev/null 2>&1; then
  (cd "$DIR/aws-marketplace" && zip -r "$OUTPUT_PATH" .) >/dev/null
  echo -e "${GREEN}✓ Compressed bundle successfully generated at: $OUTPUT_PATH${RESET}"
else
  # Fallback to tar.gz if zip is not installed
  OUTPUT_PATH="$DIR/omniguard-aws-marketplace-bundle.tar.gz"
  rm -f "$OUTPUT_PATH"
  tar -czf "$OUTPUT_PATH" -C "$DIR/aws-marketplace" .
  echo -e "${GREEN}✓ Compressed bundle successfully generated at: $OUTPUT_PATH${RESET}"
fi

# 3. Pause before final submission
echo -e "\n${YELLOW}=======================================================${RESET}"
echo -e "${YELLOW}         MARKETPLACE SUBMISSION PAUSED                  ${RESET}"
echo -e "${YELLOW}=======================================================${RESET}"
echo -e " The bundle has been successfully validated and packaged."
echo -e " Ready for upload to the AWS Partner Network (APN) Portal."
echo -e " Package location: ${OUTPUT_PATH}"
echo -e " ${RED}DO NOT publish automatically. Manual upload is required.${RESET}"
echo -e "${YELLOW}=======================================================${RESET}"

exit 0
