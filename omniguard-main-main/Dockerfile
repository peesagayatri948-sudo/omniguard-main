# Multi-Stage Docker Build for OmniGuard Enterprise
FROM node:20-alpine AS builder

WORKDIR /app

# Copy CLI
COPY cli /app/cli
WORKDIR /app/cli
RUN npm install && npm link

# Copy Frontend — pass build-time Vite env vars
COPY omniguard-frontend-main/omniguard-frontend-main /app/frontend
WORKDIR /app/frontend
RUN npm install

ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY
ENV VITE_SUPABASE_URL=${VITE_SUPABASE_URL}
ENV VITE_SUPABASE_ANON_KEY=${VITE_SUPABASE_ANON_KEY}

RUN npm run build

# Final Stage: Production Container
FROM node:20-alpine

WORKDIR /app

# Install git for hook scans and a static file server
RUN apk add --no-cache git

# Copy built artifacts and source packages
COPY --from=builder /usr/local/lib/node_modules /usr/local/lib/node_modules
COPY --from=builder /usr/local/bin /usr/local/bin
COPY --from=builder /app/cli /app/cli
COPY --from=builder /app/frontend/dist /app/frontend/dist
COPY --from=builder /app/frontend/package.json /app/frontend/package.json
COPY --from=builder /app/frontend/node_modules /app/frontend/node_modules

# Expose frontend port and daemon port
EXPOSE 5173
EXPOSE 5175

# Environment
ENV OMNIGUARD_DAEMON_PORT=5175

# Write startup entrypoint script — daemon in background, serve built frontend in foreground
RUN echo '#!/bin/sh' > /app/entrypoint.sh && \
    echo 'node /app/cli/src/daemon.js &' >> /app/entrypoint.sh && \
    echo 'cd /app/frontend && npx vite preview --host 0.0.0.0 --port 5173' >> /app/entrypoint.sh && \
    chmod +x /app/entrypoint.sh

ENTRYPOINT ["/app/entrypoint.sh"]
