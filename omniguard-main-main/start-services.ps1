$frontendDir = "E:\omniguard-enterprise\omniguard-main-main\omniguard-frontend-main\omniguard-frontend-main"
$daemonDir = "E:\omniguard-enterprise\omniguard-main-main"

Write-Host "Starting OmniGuard Enterprise Services..." -ForegroundColor Cyan

# Start Frontend in a new window
Write-Host "Starting Frontend (Vite) on port 5173..." -ForegroundColor Green
Start-Process powershell.exe -ArgumentList "-NoExit", "-Command", "cd '$frontendDir'; npm run dev -- --force" -WindowStyle Normal

# Start Daemon in a new window
Write-Host "Starting Backend Daemon (Node) on port 5175..." -ForegroundColor Green
Start-Process powershell.exe -ArgumentList "-NoExit", "-Command", "cd '$daemonDir'; node cli/src/daemon.js" -WindowStyle Normal

Write-Host "All services started successfully in new windows." -ForegroundColor Cyan
