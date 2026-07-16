#!/bin/bash

FRONTEND_DIR="E:/omniguard-enterprise/omniguard-main-main/omniguard-frontend-main/omniguard-frontend-main"
DAEMON_DIR="E:/omniguard-enterprise/omniguard-main-main"

echo "Starting OmniGuard Enterprise Services..."

# Start Frontend
echo "Starting Frontend (Vite) on port 5173..."
cd "$FRONTEND_DIR" && npm run dev -- --force &

# Start Daemon
echo "Starting Backend Daemon (Node) on port 5175..."
cd "$DAEMON_DIR" && node cli/src/daemon.js &

echo "All services running in background."
wait
