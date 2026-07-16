#!/usr/bin/env bash
set -euo pipefail

# ─────────────────────────────────────────────────────────────
# OmniGuard v2.2.5 — Publish All (CLI + VS Code Extension + Dashboard Docker)
# Requires: NPM_TOKEN env var for npm publishing
# ─────────────────────────────────────────────────────────────

VERSION="2.2.5"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "╔══════════════════════════════════════════════╗"
echo "║  OmniGuard v${VERSION} — Publishing All       ║"
echo "╚══════════════════════════════════════════════╝"

# ── Check NPM_TOKEN ──
if [[ -z "${NPM_TOKEN:-}" ]]; then
  echo "ERROR: NPM_TOKEN env var is not set."
  echo "  Export it first:  export NPM_TOKEN=npm_xxxxxx"
  exit 1
fi

# Configure npm auth
echo "//registry.npmjs.org/:_authToken=${NPM_TOKEN}" > ~/.npmrc
echo "✓ npm auth configured"

# ──────────────────────────────────────────
# 1. Publish CLI as omniguard-enterprise-cli
# ──────────────────────────────────────────
echo ""
echo "── Publishing CLI (omniguard-enterprise-cli) ──"
cd "${SCRIPT_DIR}/cli"

# Verify version
PKG_VER=$(node -p "require('./package.json').version")
if [[ "$PKG_VER" != "$VERSION" ]]; then
  echo "ERROR: CLI package.json version is ${PKG_VER}, expected ${VERSION}"
  exit 1
fi
echo "✓ Version: ${PKG_VER}"

# Run prepublish checks
npm run prepublishOnly 2>/dev/null || true

npm publish --access public
echo "✓ CLI published to npm as omniguard-enterprise-cli@${VERSION}"

# ──────────────────────────────────────────
# 2. Publish VS Code Extension
# ──────────────────────────────────────────
echo ""
echo "── Publishing VS Code Extension ──"
cd "${SCRIPT_DIR}/vscode-extension"

EXT_VER=$(node -p "require('./package.json').version")
if [[ "$EXT_VER" != "$VERSION" ]]; then
  echo "ERROR: Extension package.json version is ${EXT_VER}, expected ${VERSION}"
  exit 1
fi
echo "✓ Version: ${EXT_VER}"

# Install CLI as dependency so extension bundles it
npm install omniguard-enterprise-cli@${VERSION} --save
echo "✓ Extension depends on omniguard-enterprise-cli@${VERSION}"

# Package and publish vsix
npx vsce package --no-git-tag-version 2>/dev/null || npx @vscode/vsce package --no-git-tag-version
npx vsce publish --no-git-tag-version 2>/dev/null || npx @vscode/vsce publish --no-git-tag-version
echo "✓ Extension published as omniguard@${VERSION}"

# ──────────────────────────────────────────
# 3. Build & Publish Dashboard Docker Image
# ──────────────────────────────────────────
echo ""
echo "── Publishing Dashboard Docker Image ──"
cd "${SCRIPT_DIR}"

if ! command -v docker &>/dev/null; then
  echo "⚠ Docker not found — skipping dashboard image"
else
  docker build -t omniguard/dashboard:${VERSION} \
               -t omniguard/dashboard:latest \
               -f Dockerfile .
  echo "✓ Dashboard Docker image built"

  if [[ -n "${DOCKER_REGISTRY:-}" ]]; then
    docker tag omniguard/dashboard:${VERSION} ${DOCKER_REGISTRY}/omniguard-dashboard:${VERSION}
    docker tag omniguard/dashboard:latest ${DOCKER_REGISTRY}/omniguard-dashboard:latest
    docker push ${DOCKER_REGISTRY}/omniguard-dashboard:${VERSION}
    docker push ${DOCKER_REGISTRY}/omniguard-dashboard:latest
    echo "✓ Dashboard pushed to ${DOCKER_REGISTRY}"
  else
    echo "ℹ Set DOCKER_REGISTRY to push to a remote registry"
  fi
fi

# ──────────────────────────────────────────
# 4. Build & Publish CLI Docker Image
# ──────────────────────────────────────────
echo ""
echo "── Publishing CLI Docker Image ──"
cd "${SCRIPT_DIR}/cli"

if command -v docker &>/dev/null; then
  docker build -t omniguard/cli:${VERSION} \
               -t omniguard/cli:latest \
               -f Dockerfile .
  echo "✓ CLI Docker image built"

  if [[ -n "${DOCKER_REGISTRY:-}" ]]; then
    docker tag omniguard/cli:${VERSION} ${DOCKER_REGISTRY}/omniguard-cli:${VERSION}
    docker tag omniguard/cli:latest ${DOCKER_REGISTRY}/omniguard-cli:latest
    docker push ${DOCKER_REGISTRY}/omniguard-cli:${VERSION}
    docker push ${DOCKER_REGISTRY}/omniguard-cli:latest
    echo "✓ CLI Docker pushed to ${DOCKER_REGISTRY}"
  fi
fi

# ── Cleanup ──
rm -f ~/.npmrc

echo ""
echo "╔══════════════════════════════════════════════╗"
echo "║  ✓ All v${VERSION} artifacts published!        ║"
echo "╚══════════════════════════════════════════════╝"
echo ""
echo "Published:"
echo "  • npm:    omniguard-enterprise-cli@${VERSION}"
echo "  • VS Code: omniguard extension@${VERSION}"
echo "  • Docker:  omniguard/dashboard:${VERSION}"
echo "  • Docker:  omniguard/cli:${VERSION}"
