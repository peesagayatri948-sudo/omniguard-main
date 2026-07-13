# =============================================================================
#  OmniGuard — AWS Marketplace Bundle Publisher (PowerShell)
# =============================================================================

$ErrorActionPreference = "Stop"

Write-Host "Starting AWS Marketplace bundle preparation..." -ForegroundColor Cyan

# 1. Run Node validator
node "$PSScriptRoot\scripts\validate-marketplace-bundle.js"
if ($LASTEXITCODE -ne 0) {
    Write-Host "`n[FAIL] Bundle validation failed! Resolve issues before packaging." -ForegroundColor Red
    exit 1
}

# 2. Package Artifacts
Write-Host "`nCompressing marketplace files..." -ForegroundColor Gray
$outputPath = Join-Path $PSScriptRoot "omniguard-aws-marketplace-bundle.zip"
if (Test-Path $outputPath) {
    Remove-Item $outputPath
}

Compress-Archive -Path "$PSScriptRoot\aws-marketplace\*" -DestinationPath $outputPath -Force
Write-Host "[SUCCESS] Compressed bundle successfully generated at: $outputPath" -ForegroundColor Green

# 3. Pause before final submission
Write-Host "`n=======================================================" -ForegroundColor Yellow
Write-Host "         MARKETPLACE SUBMISSION PAUSED                  " -ForegroundColor Yellow
Write-Host "=======================================================" -ForegroundColor Yellow
Write-Host " The bundle has been successfully validated and packaged." -ForegroundColor Gray
Write-Host " Ready for upload to the AWS Partner Network (APN) Portal." -ForegroundColor Gray
Write-Host " Package location: $outputPath" -ForegroundColor Yellow
Write-Host " DO NOT publish automatically. Manual upload is required." -ForegroundColor Gray
Write-Host "=======================================================" -ForegroundColor Yellow

exit 0
