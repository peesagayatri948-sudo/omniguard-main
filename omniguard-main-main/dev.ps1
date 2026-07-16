# =============================================================================
#  OmniGuard — Local Dev Setup & Verification Script (Windows PowerShell)
# =============================================================================

$ErrorActionPreference = "Stop"

Write-Host "`n╔══════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║          OmniGuard — Local Dev Environment Setup     ║" -ForegroundColor Cyan
Write-Host "╚══════════════════════════════════════════════════════╝`n" -ForegroundColor Cyan

# ── Phase 1: Verification Checks ──────────────────────────────────────────────

Write-Host "--- Preflight Checks ---" -ForegroundColor Cyan

# 1. NodeJS
try {
    $nodeVer = node --version
    Write-Host "✓ Node.js is installed ($nodeVer)" -ForegroundColor Green
} catch {
    Write-Host "✗ Node.js is missing!" -ForegroundColor Red
    Write-Host "  -> Resolution: Download and install Node.js (v18+) from https://nodejs.org/" -ForegroundColor Yellow
    exit 1
}

# 2. NPM
try {
    $npmVer = npm --version
    Write-Host "✓ npm is installed ($npmVer)" -ForegroundColor Green
} catch {
    Write-Host "✗ npm is missing!" -ForegroundColor Red
    Write-Host "  -> Resolution: npm comes bundled with Node.js. Reinstall Node.js or run 'npm install -g npm'." -ForegroundColor Yellow
    exit 1
}

# 3. Git
try {
    $gitVer = git --version
    Write-Host "✓ Git is installed ($gitVer)" -ForegroundColor Green
} catch {
    Write-Host "✗ Git is missing!" -ForegroundColor Red
    Write-Host "  -> Resolution: Install Git from https://git-scm.com/downloads" -ForegroundColor Yellow
    exit 1
}

# 4. Supabase CLI
try {
    $supaCli = supabase --version
    Write-Host "✓ Supabase CLI is installed ($supaCli)" -ForegroundColor Green
} catch {
    Write-Host "✗ Supabase CLI is missing!" -ForegroundColor Red
    Write-Host "  -> Resolution: Install it via npm: 'npm install -g supabase', or scoop: 'scoop install supabase'" -ForegroundColor Yellow
    exit 1
}

# 5. Docker
try {
    $dockerVer = docker --version
    Write-Host "✓ Docker is installed ($dockerVer)" -ForegroundColor Green
} catch {
    Write-Host "! Docker is missing or not running" -ForegroundColor Yellow
    Write-Host "  -> Resolution: Install Docker Desktop from https://www.docker.com/ if using local DB container hosting." -ForegroundColor Yellow
}

# 6. VS Code CLI
try {
    $codeVer = code --version
    Write-Host "✓ VS Code CLI ('code') is installed" -ForegroundColor Green
} catch {
    Write-Host "! VS Code CLI ('code') not found in PATH" -ForegroundColor Yellow
    Write-Host "  -> Resolution: Open VS Code, press Ctrl+Shift+P, and run: 'Shell Command: Install 'code' command in PATH'." -ForegroundColor Yellow
}

# 7. Environment Variables & Credentials
$envFile = "./omniguard/.env"
if (!(Test-Path $envFile)) {
    if (Test-Path "./.env") {
        Copy-Item "./.env" $envFile
        Write-Host "✓ Copied root .env to omniguard/.env" -ForegroundColor Green
    } else {
        Write-Host "✗ Environment File (.env) is missing!" -ForegroundColor Red
        Write-Host "  -> Resolution: Create omniguard/.env with VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY variables." -ForegroundColor Yellow
        exit 1
    }
}

$supabaseUrl = ""
$supabaseAnonKey = ""
Get-Content $envFile | ForEach-Object {
    if ($_ -match "^\s*VITE_SUPABASE_URL\s*=\s*(.*)\s*$") { $supabaseUrl = $Matches[1].Trim().Trim('"').Trim("'") }
    if ($_ -match "^\s*VITE_SUPABASE_ANON_KEY\s*=\s*(.*)\s*$") { $supabaseAnonKey = $Matches[1].Trim().Trim('"').Trim("'") }
}

if (!$supabaseUrl -or $supabaseUrl -like "*YOUR_PROJECT_ID*") {
    Write-Host "✗ VITE_SUPABASE_URL is not set correctly in $envFile!" -ForegroundColor Red
    Write-Host "  -> Resolution: Open $envFile and set your Supabase API Endpoint URL." -ForegroundColor Yellow
    exit 1
}
Write-Host "✓ Supabase URL configured: $supabaseUrl" -ForegroundColor Green

# 8. Supabase Project Reachable & DB Verification
Write-Host "Verifying Supabase connectivity and schema..." -ForegroundColor Gray
node ./scripts/verify-supabase-env.js
if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ Supabase DB/Schema verification failed!" -ForegroundColor Red
    exit 1
}
Write-Host "✓ Supabase project, DB schema, RLS, buckets, and edge functions verified." -ForegroundColor Green

# ── Phase 2: Dependency installation & CLI / Extension Compilation ────────────

Write-Host "`n--- Installing Dependencies and Linking CLI ---" -ForegroundColor Cyan

# Install Dashboard dependencies
Write-Host "Installing dashboard packages..." -ForegroundColor Gray
Set-Location "./omniguard"
npm install --silent
Set-Location ".."

# Build & link CLI
Write-Host "Configuring CLI package..." -ForegroundColor Gray
Set-Location "./cli"
npm install --silent
npm link --silent
Set-Location ".."

# Verify CLI command
# Automatically detect and append npm global bin prefix to PATH if not present
try {
    $npmPrefix = (npm config get prefix).Trim()
    if ($env:PATH -notlike "*$npmPrefix*") {
        $env:PATH += ";$npmPrefix"
        Write-Host "✓ Temporarily added npm global bin path ($npmPrefix) to PATH" -ForegroundColor Green
    }
} catch {
    Write-Host "! Failed to retrieve npm global prefix automatically." -ForegroundColor Yellow
}

try {
    $cliVer = omniguard version
    Write-Host "✓ CLI installed globally: $cliVer" -ForegroundColor Green
} catch {
    Write-Host "! CLI command check warning: Could not run 'omniguard' command immediately." -ForegroundColor Yellow
    Write-Host "  -> Ensure npm global bin path is in your PATH environment variable." -ForegroundColor Yellow
}

# Compile VS Code Extension
Write-Host "Compiling VS Code Extension..." -ForegroundColor Gray
Set-Location "./vscode-extension"
npm install --silent
npm run compile

# Package and Install VS Code extension
try {
    Write-Host "Packaging VSIX..." -ForegroundColor Gray
    npx vsce package --no-yarn --allow-missing-repository -o omniguard-1.0.0.vsix
    if (Test-Path "omniguard-1.0.0.vsix") {
        Write-Host "Installing extension into VS Code..." -ForegroundColor Gray
        code --install-extension omniguard-1.0.0.vsix --force
        Write-Host "✓ VS Code Extension installed successfully" -ForegroundColor Green
    }
} catch {
    Write-Host "! Could not package/install VS Code extension automatically." -ForegroundColor Yellow
    Write-Host "  -> Make sure 'code' CLI is available and vsce package requirements are met." -ForegroundColor Yellow
}
Set-Location ".."

# ── Phase 3: Launch Servers & Open Browser ───────────────────────────────────

Write-Host "`n--- Launching Dashboard & Backend ---" -ForegroundColor Cyan
Write-Host "Dashboard URL: http://localhost:5173" -ForegroundColor Green

# Open browser automatically
Start-Process "http://localhost:5173"

# Run Vite development server
Set-Location "./omniguard"
npm run dev
