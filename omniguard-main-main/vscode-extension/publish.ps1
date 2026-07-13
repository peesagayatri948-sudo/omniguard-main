# =============================================================================
#  OmniGuard — VS Code Extension Publisher Script (Windows PowerShell)
# =============================================================================

$ErrorActionPreference = "Stop"

Write-Host "╔══════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║          OmniGuard — Extension Publisher             ║" -ForegroundColor Cyan
Write-Host "╚══════════════════════════════════════════════════════╝" -ForegroundColor Cyan

# 1. Preflight platform verification
Write-Host "`n[Extension Publish] 1. Running platform E2E and Compliance audits..." -ForegroundColor Cyan
try {
    Write-Host "Running platform E2E Suite..." -ForegroundColor Gray
    node ../scripts/run-e2e-tests.js
    if ($LASTEXITCODE -ne 0) { throw "Platform E2E verification suite failed." }
    Write-Host "✓ E2E Verification Suite passed." -ForegroundColor Green

    Write-Host "Running Enterprise Compliance Auditor..." -ForegroundColor Gray
    node ../scripts/verify-enterprise.js
    if ($LASTEXITCODE -ne 0) { throw "Enterprise compliance & security checks failed." }
    Write-Host "✓ Enterprise compliance & security checks passed." -ForegroundColor Green
} catch {
    Write-Error "Verification tests failed: $_"
    exit 1
}

# 2. Compile TypeScript
Write-Host "`n[Extension Publish] 2. Compiling TypeScript source..." -ForegroundColor Cyan
npm run compile
if ($LASTEXITCODE -ne 0) {
    Write-Error "TypeScript compilation failed."
    exit 1
}
Write-Host "✓ Extension compiled successfully." -ForegroundColor Green

# 3. Package Extension into VSIX
Write-Host "`n[Extension Publish] 3. Packaging extension..." -ForegroundColor Cyan
if (Test-Path "omniguard-1.0.0.vsix") {
    Remove-Item "omniguard-1.0.0.vsix"
}
npx vsce package --no-yarn --allow-missing-repository -o omniguard-1.0.0.vsix
if (!(Test-Path "omniguard-1.0.0.vsix")) {
    Write-Error "vsce packaging failed."
    exit 1
}
Write-Host "✓ VSIX package generated: omniguard-1.0.0.vsix" -ForegroundColor Green

# 4. Publish Extension
Write-Host "`n[Extension Publish] 4. Publishing extension to marketplace..." -ForegroundColor Cyan
$vscePat = $env:VSCE_PAT
if ($null -eq $vscePat -or $vscePat -eq "") {
    Write-Host "VSCE_PAT is not set. Please provide credentials." -ForegroundColor Yellow
    $vscePat = Read-Host -Prompt "Enter your VS Code Marketplace Personal Access Token (PAT)"
}

if ($null -eq $vscePat -or $vscePat -eq "") {
    Write-Host "No token provided. Packaging complete, skipping publication." -ForegroundColor Yellow
    Write-Host "-> Manual upload: upload omniguard-1.0.0.vsix directly to the VS Code Marketplace Publisher Portal." -ForegroundColor Yellow
} else {
    Write-Host "Publishing to VS Code Marketplace..." -ForegroundColor Gray
    npx vsce publish --no-yarn -p $vscePat
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ Extension successfully published!" -ForegroundColor Green
    } else {
        Write-Error "VS Marketplace publication failed."
        exit 1
    }
}

exit 0
