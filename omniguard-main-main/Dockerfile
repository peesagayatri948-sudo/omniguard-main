# ─── Multi-Stage Docker Build for OmniGuard Enterprise ─────────────────────────
FROM node:18-alpine AS builder

WORKDIR /app

# Copy CLI
COPY cli /app/cli
WORKDIR /app/cli
RUN npm install && npm link

# Copy Frontend
COPY omniguard-frontend-main/omniguard-frontend-main /app/frontend
WORKDIR /app/frontend
RUN npm install
RUN npm run build

# Final Stage: Production Container
FROM node:18-alpine

WORKDIR /app

# Install git for hook scans
RUN apk add --no-cache git

# Copy built artifacts and source packages
COPY --from=builder /usr/local/lib/node_modules /usr/local/lib/node_modules
COPY --from=builder /usr/local/bin /usr/local/bin
COPY --from=builder /app/cli /app/cli
COPY --from=builder /app/frontend /app/frontend

# Copy VS Code extension
COPY vscode-extension/*.vsix /app/downloads/

# Expose Vite dev/production port and background scanning webhook daemon port
EXPOSE 5173
EXPOSE 5175

# Write startup entrypoint script
RUN echo '#!/bin/sh' > /app/entrypoint.sh && \
    echo 'node /app/cli/src/daemon.js &' >> /app/entrypoint.sh && \
    echo 'cd /app/frontend && npm run dev -- --host 0.0.0.0' >> /app/entrypoint.sh && \
    chmod +x /app/entrypoint.sh

ENTRYPOINT ["/app/entrypoint.sh"]
