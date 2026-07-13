# Windows PowerShell script to publish the OmniGuard CLI to npm.

Write-Host "Starting OmniGuard CLI publishing process..." -ForegroundColor Cyan

# 1. Load env variables if .env exists
if (Test-Path "../.env") {
    Write-Host "Loading environment variables from ../.env..." -ForegroundColor Gray
    Get-Content "../.env" | ForEach-Object {
        if ($_ -match "^\s*([^#=\s]+)\s*=\s*(.*)\s*$") {
            $key = $Matches[1].Trim()
            $value = $Matches[2].Trim().Trim('"').Trim("'")
            [System.Environment]::SetEnvironmentVariable($key, $value, "Process")
        }
    }
}

# 2. Check NPM token
$npmToken = [System.Environment]::GetEnvironmentVariable("NPM_TOKEN")
if ($null -eq $npmToken) {
    Write-Host "[WARNING] NPM_TOKEN not found in environment. Ensure you are already logged in to npm registry." -ForegroundColor Yellow
} else {
    Write-Host "Configuring registry authentication with NPM_TOKEN..." -ForegroundColor Gray
    Set-Content -Path ".npmrc" -Value "//registry.npmjs.org/:_authToken=$npmToken"
}

# 3. Run validation tests
Write-Host "Running platform E2E and Compliance audits before publishing..." -ForegroundColor Gray
try {
    node src/index.js version
    if ($LASTEXITCODE -ne 0) { throw "CLI version sanity check failed" }
    Write-Host "✓ Version test passed." -ForegroundColor Green

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

# 4. Bump version or verify package configuration
$pkg = Get-Content "package.json" | ConvertFrom-Json
Write-Host "Publishing version $($pkg.version) of @omniguard/cli..." -ForegroundColor Cyan

# 5. Execute dry-run to verify package structure
Write-Host "Testing package packaging..." -ForegroundColor Gray
npm pack --dry-run
if ($LASTEXITCODE -ne 0) {
    Write-Error "npm pack dry-run failed."
    exit 1
}

# 6. Publish to npm
Write-Host "Publishing to npm registry..." -ForegroundColor Cyan
# Uncomment next line in live production environment.
npm publish --access public

if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Successfully published OmniGuard CLI version $($pkg.version)!" -ForegroundColor Green
} else {
    Write-Error "NPM publish failed."
    exit 1
}
