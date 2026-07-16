# =============================================================================
#  OmniGuard — NPM CLI Publisher Script (Windows PowerShell)
# =============================================================================

$ErrorActionPreference = "Stop"

Write-Host '------------------------------------------------------' -ForegroundColor Cyan
Write-Host '              OmniGuard - CLI Publisher               ' -ForegroundColor Cyan
Write-Host '------------------------------------------------------' -ForegroundColor Cyan

# 1. Resolve NPM_TOKEN from root .env
Write-Host 'Extracting NPM_TOKEN from .env...' -ForegroundColor Cyan
$envFile = Join-Path $PSScriptRoot ".env"

if (!(Test-Path $envFile)) {
    Write-Error 'Root .env file not found.'
    exit 1
}

$npmToken = $null
$lines = Get-Content $envFile
foreach ($line in $lines) {
    if ($line -match "^\s*NPM_TOKEN\s*=\s*(.*)\s*$") {
        $npmToken = $Matches[1].Trim().Trim("'").Trim('"')
        break
    }
}

if ($null -eq $npmToken -or $npmToken -eq "") {
    Write-Error 'NPM_TOKEN is missing or empty in .env file.'
    exit 1
}

Write-Host '✓ Successfully resolved NPM_TOKEN from .env.' -ForegroundColor Green

# 2. Configure NPM auth token in .npmrc
Write-Host 'Configuring npm registry auth token...' -ForegroundColor Cyan
$npmrcFile = Join-Path $PSScriptRoot "cli\.npmrc"
if (Test-Path $npmrcFile) {
    Remove-Item $npmrcFile
}
# Write token definition directly into .npmrc in target cli directory
"//registry.npmjs.org/:_authToken=$npmToken" | Out-File -FilePath $npmrcFile -Encoding ascii -NoNewline
Write-Host '✓ Auth credentials set in cli/.npmrc.' -ForegroundColor Green

# 3. Publish package
Write-Host 'Running npm publish...' -ForegroundColor Cyan
try {
    Push-Location (Join-Path $PSScriptRoot "cli")
    npm publish --access public
    Write-Host '✓ CLI successfully published to NPM!' -ForegroundColor Green
} catch {
    Write-Error 'NPM publication failed.'
} finally {
    Pop-Location
    # Clean up local .npmrc so token is not stored permanently in workspace
    if (Test-Path $npmrcFile) {
        Remove-Item $npmrcFile
        Write-Host '✓ Cleaned up temporary credentials files.' -ForegroundColor Gray
    }
}

exit 0
