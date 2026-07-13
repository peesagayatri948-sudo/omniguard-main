#!/bin/bash
# Shell script to publish the OmniGuard CLI to npm.

set -e

echo -e "\033[36mStarting OmniGuard CLI publishing process...\033[0m"

# 1. Load env variables if .env exists
if [ -f "../.env" ]; then
    echo "Loading environment variables from ../.env..."
    export $(grep -v '^#' ../.env | xargs)
fi

# 2. Check NPM token
if [ -z "$NPM_TOKEN" ]; then
    echo -e "\033[33m[WARNING] NPM_TOKEN not found in environment. Ensure you are already logged in to npm registry.\033[0m"
else
    echo "Configuring registry authentication with NPM_TOKEN..."
    echo "//registry.npmjs.org/:_authToken=$NPM_TOKEN" > .npmrc
fi

# 3. Run validation tests
echo "Running platform E2E and Compliance audits before publishing..."
node src/index.js version
echo -e "\033[32m✓ Version test passed.\033[0m"

echo "Running platform E2E Suite..."
if ! node ../scripts/run-e2e-tests.js; then
    echo -e "\033[31m✗ Platform E2E verification suite failed.\033[0m"
    exit 1
fi
echo -e "\033[32m✓ E2E Verification Suite passed.\033[0m"

echo "Running Enterprise Compliance Auditor..."
if ! node ../scripts/verify-enterprise.js; then
    echo -e "\033[31m✗ Enterprise compliance & security checks failed.\033[0m"
    exit 1
fi
echo -e "\033[32m✓ Enterprise compliance & security checks passed.\033[0m"

# 4. Bump version or verify package configuration
VERSION=$(node -p "require('./package.json').version")
echo -e "\033[36mPublishing version $VERSION of @omniguard/cli...\033[0m"

# 5. Execute dry-run to verify package structure
echo "Testing package packaging..."
npm pack --dry-run

# 6. Publish to npm
echo -e "\033[36mPublishing to npm registry...\033[0m"
npm publish --access public

echo -e "\033[32m✓ Successfully published OmniGuard CLI version $VERSION!\033[0m"
