# =============================================================================
#  OmniGuard Master Script 3: Standalone Docker Container Compiler & Runner
# =============================================================================

$ErrorActionPreference = "Stop"

Write-Host '------------------------------------------------------' -ForegroundColor Cyan
Write-Host '       OmniGuard - Standalone Docker Container        ' -ForegroundColor Cyan
Write-Host '------------------------------------------------------' -ForegroundColor Cyan

# 1. Verify Docker is available
if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
    Write-Host '✗ Docker is not running or not found in system PATH.' -ForegroundColor Red
    exit 1
}

# 2. Collect Connection Parameters
Write-Host 'Resolving database connection secrets...' -ForegroundColor Cyan
$supabaseUrl = ""
$supabaseAnonKey = ""

$envFile = Join-Path $PSScriptRoot ".env"
if (Test-Path $envFile) {
    $lines = Get-Content $envFile
    foreach ($line in $lines) {
        if ($line -match "^\s*VITE_SUPABASE_URL\s*=\s*(.*)\s*$") { $supabaseUrl = $Matches[1].Trim().Trim("'").Trim('"') }
        if ($line -match "^\s*VITE_SUPABASE_ANON_KEY\s*=\s*(.*)\s*$") { $supabaseAnonKey = $Matches[1].Trim().Trim("'").Trim('"') }
    }
}

if ($supabaseUrl -eq "" -or $supabaseAnonKey -eq "") {
    Write-Host 'No env file values found. Please input connection values:' -ForegroundColor Yellow
    $supabaseUrl = Read-Host 'Enter Supabase functions API URL'
    $supabaseAnonKey = Read-Host 'Enter Supabase Anon Key'
}

if ($supabaseUrl -eq "" -or $supabaseAnonKey -eq "") {
    Write-Error 'Supabase URL and Anon Key are required to build the container dashboard.'
    exit 1
}

# 3. Compile Container Image
Write-Host 'Running Docker Build...' -ForegroundColor Cyan
$dockerfilePath = Join-Path $PSScriptRoot "omniguard"

try {
    Push-Location $dockerfilePath
    docker build -t omniguard-dashboard --build-arg VITE_SUPABASE_URL=$supabaseUrl --build-arg VITE_SUPABASE_ANON_KEY=$supabaseAnonKey .
    Write-Host '✓ Container successfully compiled.' -ForegroundColor Green
} catch {
    Write-Error "Docker build failed: $_"
} finally {
    Pop-Location
}

# 4. Spin up container
Write-Host 'Starting background container...' -ForegroundColor Cyan
$containerName = "omniguard-dashboard-run"
$running = docker ps -a -q --filter "name=$containerName"
if ($running) {
    Write-Host 'Removing existing container instance...' -ForegroundColor Gray
    docker rm -f $containerName | Out-Null
}

docker run -d -p 3000:80 --name $containerName omniguard-dashboard

# 5. Check Health status
Write-Host 'Verifying container health...' -ForegroundColor Cyan
Start-Sleep -Seconds 3
$containerStatus = docker ps --filter "name=$containerName" --format "{{.Status}}"
if ($containerStatus -match "Up") {
    Write-Host '=======================================================' -ForegroundColor Green
    Write-Host '✓ OMNIGUARD CONTAINER WORKLOAD RUNNING SUCCESSFULLY!    ' -ForegroundColor Green
    Write-Host '  Access URL: http://localhost:3000                    ' -ForegroundColor Green
    Write-Host "  Status: $containerStatus                             " -ForegroundColor Green
    Write-Host '=======================================================' -ForegroundColor Green
} else {
    Write-Host "✗ Container failed to start cleanly. Check logs: 'docker logs $containerName'" -ForegroundColor Red
}

exit 0
