# OmniGuard Startup Guide

This guide walks you through setting up a fresh OmniGuard deployment from scratch.

## 1. Fresh Supabase Project

The database schema has already been applied to the provisioned Supabase project. The migration chain lives in `supabase/migrations_clean/` and consists of 7 files:

```
001_extensions_and_core_tables.sql      — extensions, enums, orgs, profiles, members, api_keys
002_repositories_scans_findings.sql     — repos, scans, findings (35+ columns)
003_policies_integrations_notifications_audit.sql — policies, integrations, notifications, audit logs
004_graph_workers_ai_rate_limiting.sql  — graph nodes, workers, AI cache/usage, rate limiting
005_extensions_and_rpc_functions.sql    — pgvector, 5 RPC functions
006_rls_policies.sql                    — 79 non-recursive RLS policies
007_triggers_and_storage.sql            — auto-profile trigger, storage bucket
```

### To apply to a NEW Supabase project:

1. Create a new Supabase project at https://supabase.com/dashboard
2. Get the project URL, anon key, and service role key from Settings > API
3. Apply each migration in order using the Supabase SQL Editor or MCP `apply_migration` tool
4. Verify with: `SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public';` (should return 24)

## 2. Environment Configuration

Copy `.env.example` to `.env` and fill in:

```bash
cp .env.example .env
```

**Required values:**
- `SUPABASE_URL` — your Supabase project URL
- `SUPABASE_ANON_KEY` — your Supabase anon key
- `SUPABASE_SERVICE_ROLE_KEY` — your Supabase service role key
- `VITE_SUPABASE_URL` — same as SUPABASE_URL (needed at Vite build time)
- `VITE_SUPABASE_ANON_KEY` — same as SUPABASE_ANON_KEY

**For AI features (at least one):**
- `ANTHROPIC_API_KEY` — for Claude (recommended default)
- `OPENAI_API_KEY` — for GPT models
- `GEMINI_API_KEY` — for Gemini models

## 3. Local Development

### Frontend Dashboard (omniguard/)

```bash
cd omniguard
npm install
npm run dev
```

The dashboard runs at http://localhost:5173. It reads `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` from `.env`.

### Frontend Marketing + Dashboard (omniguard-frontend-main/)

```bash
cd omniguard-frontend-main/omniguard-frontend-main
npm install
npm run dev
```

### CLI

```bash
cd cli
npm install
npm link    # makes 'omniguard' available globally
omniguard login
omniguard scan ./my-project
```

### Daemon (local scan backend)

```bash
cd cli
node src/daemon.js
```

The daemon runs at http://localhost:5175 with endpoints:
- `GET /healthz` — liveness check
- `GET /readyz` — readiness check
- `POST /api/manual-scan` — trigger scan
- `GET /orchestrator/vulnerabilities?repoName=...` — get findings
- `GET /orchestrator/context?repoName=...` — get graph nodes

### VS Code Extension

```bash
cd vscode-extension
npm install
npm run compile
# Press F5 in VS Code to launch Extension Development Host
```

Or package and install:
```bash
npx vsce package
# Install the .vsix in VS Code: Extensions > ... > Install from VSIX
```

Configure in VS Code Settings:
- `omniguard.cliPath` — path to the CLI (if not on PATH)
- `omniguard.enableOnSave` — scan on file save (default: true)
- `omniguard.failOnSeverity` — severity threshold (default: high)

## 4. Edge Function Deployment

Deploy each edge function using the Supabase MCP `deploy_edge_function` tool or the Supabase Dashboard:

```bash
# Functions to deploy (from supabase/functions/):
# - api-gateway          (rate limiting gateway)
# - api-v1-api-keys      (API key CRUD)
# - api-v1-findings      (findings CRUD + AI remediation)
# - api-v1-members       (member management)
# - api-v1-scans         (scan trigger + listing)
# - api-v1-status        (health check)
# - scan-worker          (scan processing engine)
# - enterprise-integrations (10 integration providers)
# - github-webhook       (GitHub/GitLab/Bitbucket webhooks)
# - notify-deliver       (Slack + email notifications)
# - policy-ingest        (policy document ingestion + embeddings)
# - scan-quick           (stateless inline scan)
# - secrets-proxy        (AI key vault management)
```

Set these secrets in Supabase Dashboard > Edge Functions > Secrets:
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_ANON_KEY`
- `ANTHROPIC_API_KEY` (if using Anthropic)
- `OPENAI_API_KEY` (if using OpenAI for embeddings)
- `GITHUB_TOKEN` (if using GitHub webhooks)
- `RESEND_API_KEY` (if using email notifications)

## 5. Docker Deployment

### Build and run with Docker Com:

```bash
# Copy .env.example to .env and fill in values
cp .env.example .env

# Build and start both services
docker-compose up -d

# Dashboard: http://localhost:3000
# Daemon: http://localhost:5175
```

### Build individual images:

```bash
# Frontend-only (nginx, production)
cd omniguard
docker build -t omniguard-frontend --build-arg VITE_SUPABASE_URL=... --build-arg VITE_SUPABASE_ANON_KEY=... .
docker run -p 3000:80 omniguard-frontend

# Full stack (daemon + frontend)
docker build -t omniguard-full --build-arg VITE_SUPABASE_URL=... --build-arg VITE_SUPABASE_ANON_KEY=... .
docker run -p 5173:5173 -p 5175:5175 omniguard-full
```

## 6. Kubernetes Deployment

```bash
kubectl apply -f kubernetes/deployment.yaml
kubectl apply -f kubernetes/service.yaml
```

Note: You need to add Supabase and AI keys as Kubernetes secrets:
```bash
kubectl create secret generic omniguard-secrets \
  --from-literal=VITE_SUPABASE_URL=... \
  --from-literal=VITE_SUPABASE_ANON_KEY=... \
  --from-literal=SUPABASE_SERVICE_ROLE_KEY=... \
  --from-literal=ANTHROPIC_API_KEY=...
```

Then patch the deployment to reference the secret.

## 7. Verification Checklist

After setup, verify each subsystem:

- [ ] **Signup**: Create account at dashboard → user_profiles row auto-created by trigger
- [ ] **Login**: Sign in → organization_members query resolves → dashboard loads
- [ ] **Organization creation**: Create org → organizations + organization_members rows created
- [ ] **Repository creation**: Add repo → repositories row created
- [ ] **Scan**: Trigger scan → scans row created → findings inserted → scan status updated
- [ ] **AI explanation**: Request AI remediation → edge function calls AI provider → ai_remediation populated
- [ ] **Watch mode**: `omniguard watch ./project` → file changes trigger scans
- [ ] **Daemon startup**: `node src/daemon.js` → /healthz returns 200
- [ ] **VS Code**: Install extension → open file → save → diagnostics appear
- [ ] **MCP**: `node cli/src/mcp-server.js` → JSON-RPC tools/list returns 5 tools
- [ ] **Docker**: `docker-compose up` → both services healthy

## 8. Troubleshooting

**Login stuck on loading screen:**
- Check browser console for Supabase errors
- Verify `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are set
- Check that RLS policies are applied: `SELECT count(*) FROM pg_policies WHERE schemaname = 'public';`

**Edge function returns 401:**
- Verify `SUPABASE_SERVICE_ROLE_KEY` is set as a function secret
- Check that the function is deployed

**Daemon can't write to database:**
- The daemon uses the anon key by default. With RLS enabled, writes require authentication.
- Set `SUPABASE_URL` and `SUPABASE_ANON_KEY` (or `VITE_SUPABASE_URL`/`VITE_SUPABASE_ANON_KEY`) in the daemon's environment
- For service-level access (bypassing RLS), update `daemon.js` to use the service role key

**Docker build fails:**
- Ensure `.env` file exists with required variables
- The root Dockerfile no longer requires `.vsix` files (that bug was fixed)
