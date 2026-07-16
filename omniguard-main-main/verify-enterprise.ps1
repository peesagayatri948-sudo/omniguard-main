# =============================================================================
#  OmniGuard — Enterprise Verification Script (Windows PowerShell)
# =============================================================================

$ErrorActionPreference = "Stop"

Write-Host "Running OmniGuard Enterprise Compliance & Security Audits..." -ForegroundColor Cyan

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "X Node.js is required to execute security checks." -ForegroundColor Red
    exit 1
}

node "$PSScriptRoot\scripts\verify-enterprise.js"
if ($LASTEXITCODE -ne 0) {
    Write-Host "`n[FAIL] Security validation failed! Resolve policy errors." -ForegroundColor Red
    exit 1
}

Write-Host "`n[PASS] Enterprise Compliance & Security Verification SUCCESSFUL!" -ForegroundColor Green
exit 0
