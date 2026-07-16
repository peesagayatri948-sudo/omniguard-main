# =============================================================================
#  OmniGuard Master Script 1: Local Setup, Compile, Provider Config & Scan
# =============================================================================

$ErrorActionPreference = "Stop"

Write-Host '------------------------------------------------------' -ForegroundColor Cyan
Write-Host '        OmniGuard - Local Setup and Testing Flow      ' -ForegroundColor Cyan
Write-Host '------------------------------------------------------' -ForegroundColor Cyan

# 1. Dependency Installation & Compile
Write-Host 'Installing dependencies and compiling extension...' -ForegroundColor Cyan
npm install
cd vscode-extension
npm install
npm run compile
cd ..

# 2. Link CLI Globally
Write-Host 'Linking CLI globally in PATH...' -ForegroundColor Cyan
cd cli
npm install
npm link
cd ..

$env:PATH = $env:PATH + ";C:\Users\ADMIN\AppData\Roaming\npm"

# 3. Interactive AI Provider Configuration
Write-Host 'Configuring AI Provider...' -ForegroundColor Cyan
Write-Host 'Please select your preferred AI provider:' -ForegroundColor Gray
Write-Host '  [1] Anthropic (Claude Sonnet)' -ForegroundColor Gray
Write-Host '  [2] AWS Bedrock' -ForegroundColor Gray
$providerChoice = Read-Host 'Select [1 or 2]'

if ($providerChoice -eq "1") {
    $apiKey = Read-Host 'Enter your Anthropic API Key'
    if ($apiKey -ne "") {
        Write-Host 'Registering Anthropic key in CLI configuration profile...' -ForegroundColor Gray
        omniguard provider add anthropic key=$apiKey
        omniguard provider default anthropic
    }
} elseif ($providerChoice -eq "2") {
    $accessKey = Read-Host 'Enter AWS Access Key ID'
    $secretKey = Read-Host 'Enter AWS Secret Access Key'
    $region = Read-Host 'Enter AWS Region [us-east-1]'
    if ($region -eq "") { $region = "us-east-1" }
    
    if ($accessKey -ne "" -and $secretKey -ne "") {
        Write-Host 'Registering AWS Bedrock credentials in CLI configuration profile...' -ForegroundColor Gray
        omniguard provider add bedrock key=$accessKey secret=$secretKey region=$region
        omniguard provider default bedrock
    }
} else {
    Write-Host 'Invalid choice. Skipping AI key configuration.' -ForegroundColor Yellow
}

# 4. Interactive Scan Execution
Write-Host 'Triggering directory scan...' -ForegroundColor Cyan
$scanDir = Read-Host 'Enter the absolute directory path to scan'
if ($scanDir -eq "") { $scanDir = "." }

if (Test-Path $scanDir) {
    Write-Host 'Running local scanner...' -ForegroundColor Gray
    omniguard scan $scanDir
    
    # Generate CISO security report
    Write-Host 'Generating CISO Security and Compliance Report...' -ForegroundColor Gray
    omniguard reports $scanDir
} else {
    Write-Host 'Directory not found. Skipping scan.' -ForegroundColor Red
}

Write-Host 'Local Setup and Verification flow successfully completed.' -ForegroundColor Green
exit 0
