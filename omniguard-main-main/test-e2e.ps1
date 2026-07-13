# =============================================================================
#  OmniGuard — Local End-to-End Test Suite Trigger (Windows PowerShell)
# =============================================================================

$ErrorActionPreference = "Stop"

Write-Host "Starting OmniGuard End-to-End Test Suite..." -ForegroundColor Cyan

# Check Node.js
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "X Node.js is required to run E2E tests." -ForegroundColor Red
    exit 1
}

# Run the test runner
node "$PSScriptRoot\scripts\run-e2e-tests.js"
if ($LASTEXITCODE -ne 0) {
    Write-Host "`n[FAIL] E2E Tests Failed!" -ForegroundColor Red
    exit 1
}

Write-Host "`n[PASS] E2E Tests Completed Successfully!" -ForegroundColor Green
exit 0
