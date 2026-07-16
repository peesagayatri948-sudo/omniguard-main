# OmniGuard v2.2.5 — Publish All (Windows PowerShell)
# Requires: $env:NPM_TOKEN

$Version = "2.2.5"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path

Write-Host "╔══════════════════════════════════════════════╗"
Write-Host "║  OmniGuard v$Version — Publishing All          ║"
Write-Host "╚══════════════════════════════════════════════╝"

# ── Check NPM_TOKEN ──
if (-not $env:NPM_TOKEN) {
    Write-Host "ERROR: NPM_TOKEN env var is not set." -ForegroundColor Red
    Write-Host "  Set it first:  `$env:NPM_TOKEN = 'npm_xxxxxx'"
    exit 1
}

# Configure npm auth
"_authToken=$($env:NPM_TOKEN)" | Out-File -FilePath "$env:USERPROFILE\.npmrc" -Encoding ascii
Write-Host "✓ npm auth configured"

# ── 1. Publish CLI ──
Write-Host "`n── Publishing CLI (omniguard-enterprise-cli) ──" -ForegroundColor Cyan
Push-Location "$ScriptDir\cli"

$pkg = Get-Content "package.json" | ConvertFrom-Json
if ($pkg.version -ne $Version) {
    Write-Host "ERROR: CLI version is $($pkg.version), expected $Version" -ForegroundColor Red
    exit 1
}
Write-Host "✓ Version: $($pkg.version)"

npm run prepublishOnly 2>$null
npm publish --access public
Write-Host "✓ CLI published to npm"
Pop-Location

# ── 2. Publish VS Code Extension ──
Write-Host "`n── Publishing VS Code Extension ──" -ForegroundColor Cyan
Push-Location "$ScriptDir\vscode-extension"

$extPkg = Get-Content "package.json" | ConvertFrom-Json
if ($extPkg.version -ne $Version) {
    Write-Host "ERROR: Extension version is $($extPkg.version), expected $Version" -ForegroundColor Red
    exit 1
}
Write-Host "✓ Version: $($extPkg.version)"

npm install "omniguard-enterprise-cli@$Version" --save
npx vsce package --no-git-tag-version 2>$null
npx vsce publish --no-git-tag-version 2>$null
Write-Host "✓ Extension published"
Pop-Location

# ── 3. Dashboard Docker Image ──
Write-Host "`n── Publishing Dashboard Docker Image ──" -ForegroundColor Cyan
Push-Location $ScriptDir

if (Get-Command docker -ErrorAction SilentlyContinue) {
    docker build -t "omniguard/dashboard:$Version" -t "omniguard/dashboard:latest" -f Dockerfile .
    Write-Host "✓ Dashboard Docker image built"

    if ($env:DOCKER_REGISTRY) {
        docker tag "omniguard/dashboard:$Version" "$($env:DOCKER_REGISTRY)/omniguard-dashboard:$Version"
        docker tag "omniguard/dashboard:latest" "$($env:DOCKER_REGISTRY)/omniguard-dashboard:latest"
        docker push "$($env:DOCKER_REGISTRY)/omniguard-dashboard:$Version"
        docker push "$($env:DOCKER_REGISTRY)/omniguard-dashboard:latest"
        Write-Host "✓ Dashboard pushed to $($env:DOCKER_REGISTRY)"
    }
} else {
    Write-Host "⚠ Docker not found — skipping" -ForegroundColor Yellow
}
Pop-Location

# ── 4. CLI Docker Image ──
Write-Host "`n── Publishing CLI Docker Image ──" -ForegroundColor Cyan
Push-Location "$ScriptDir\cli"

if (Get-Command docker -ErrorAction SilentlyContinue) {
    docker build -t "omniguard/cli:$Version" -t "omniguard/cli:latest" -f Dockerfile .
    Write-Host "✓ CLI Docker image built"

    if ($env:DOCKER_REGISTRY) {
        docker tag "omniguard/cli:$Version" "$($env:DOCKER_REGISTRY)/omniguard-cli:$Version"
        docker tag "omniguard/cli:latest" "$($env:DOCKER_REGISTRY)/omniguard-cli:latest"
        docker push "$($env:DOCKER_REGISTRY)/omniguard-cli:$Version"
        docker push "$($env:DOCKER_REGISTRY)/omniguard-cli:latest"
        Write-Host "✓ CLI Docker pushed"
    }
}
Pop-Location

# Cleanup
Remove-Item "$env:USERPROFILE\.npmrc" -ErrorAction SilentlyContinue

Write-Host "`n╔══════════════════════════════════════════════╗"
Write-Host "║  ✓ All v$Version artifacts published!          ║"
Write-Host "╚══════════════════════════════════════════════╝"
