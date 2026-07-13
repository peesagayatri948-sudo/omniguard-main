# =============================================================================
#  OmniGuard Master Script 2: Cloud VPC Provisioning, RDS Migrations & Publish
# =============================================================================

$ErrorActionPreference = "Stop"

Write-Host "╔══════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║       OmniGuard — Cloud Deploy & Publication Flow    ║" -ForegroundColor Cyan
Write-Host "╚══════════════════════════════════════════════════════╝" -ForegroundColor Cyan

# 1. Collect Cloud Credentials
Write-Host "`n[Cloud Deploy] 1. Collecting configuration credentials..." -ForegroundColor Cyan
$awsAccountId = Read-Host "Enter AWS Account ID (12-digit)"
$awsRegion = Read-Host "Enter target AWS Region [us-east-1]"
if ($awsRegion -eq "") { $awsRegion = "us-east-1" }

$rdsHost = Read-Host "Enter Amazon RDS PostgreSQL Hostname"
$rdsPassword = Read-Host "Enter Amazon RDS Database Password"

$vscePat = Read-Host "Enter VS Code Marketplace Publisher PAT (leave empty to skip publish)"

if ($awsAccountId -eq "" -or $rdsHost -eq "" -or $rdsPassword -eq "") {
    Write-Error "AWS Account ID, RDS Host, and RDS Password are required to run cloud stack deploy."
    exit 1
}

# Inject credentials to environment scope
$env:AWS_ACCOUNT_ID = $awsAccountId
$env:AWS_DEFAULT_REGION = $awsRegion
$env:RDS_HOST = $rdsHost
$env:RDS_PASSWORD = $rdsPassword
$env:VSCE_PAT = $vscePat

# Fetch Supabase environment variables from local .env to propagate to AWS Tasks
$envFile = Join-Path $PSScriptRoot ".env"
if (Test-Path $envFile) {
    $lines = Get-Content $envFile
    foreach ($line in $lines) {
        if ($line -match "^\s*VITE_SUPABASE_URL\s*=\s*(.*)\s*$") { $env:VITE_SUPABASE_URL = $Matches[1].Trim().Trim("'").Trim('"') }
        if ($line -match "^\s*VITE_SUPABASE_ANON_KEY\s*=\s*(.*)\s*$") { $env:VITE_SUPABASE_ANON_KEY = $Matches[1].Trim().Trim("'").Trim('"') }
        if ($line -match "^\s*SUPABASE_SERVICE_ROLE_KEY\s*=\s*(.*)\s*$") { $env:SUPABASE_SERVICE_ROLE_KEY = $Matches[1].Trim().Trim("'").Trim('"') }
    }
}

# 2. Database Migration on Amazon RDS
Write-Host "`n[Cloud Deploy] 2. Running migrations on AWS RDS PostgreSQL..." -ForegroundColor Cyan
node scripts/migrate-db-to-rds.js
if ($LASTEXITCODE -ne 0) { throw "AWS RDS database schema migration failed." }

# 3. Provision AWS VPC & ECS Services
Write-Host "`n[Cloud Deploy] 3. Provisioning AWS VPC Networking & ECS Fargate container workloads..." -ForegroundColor Cyan
.\deploy-aws.ps1
if ($LASTEXITCODE -ne 0) { throw "AWS infrastructure provisioning failed." }

# 4. Package AWS Marketplace Zip
Write-Host "`n[Cloud Deploy] 4. Creating AWS Marketplace Bundle Zip..." -ForegroundColor Cyan
.\publish-aws-marketplace.ps1
if ($LASTEXITCODE -ne 0) { throw "AWS Marketplace bundle compilation failed." }

# 5. Build and Publish VS Code Extension
Write-Host "`n[Cloud Deploy] 5. Packaging and publishing VS Code Extension..." -ForegroundColor Cyan
cd vscode-extension
.\publish.ps1
cd ..

Write-Host "`n✓ Cloud Deployment and Publication flow successfully completed." -ForegroundColor Green
exit 0
