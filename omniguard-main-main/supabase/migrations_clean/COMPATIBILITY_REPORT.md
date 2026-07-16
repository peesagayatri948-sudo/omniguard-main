# OmniGuard Compatibility Report

## Code Paths Verified

### Frontend #1 — Dashboard (`omniguard/src/`)

| Code Path | Tables Accessed | Queries | Status |
|-----------|----------------|---------|--------|
| `useAuth.tsx` | user_profiles, organization_members | SELECT (profile), SELECT (memberships), UPSERT (profile) | FIXED: onAuthStateChange await deadlock, missing error handling |
| `useRepositories.ts` | repositories, scans, findings, notifications | SELECT, INSERT, UPDATE + Realtime channels | Verified |
| `Layout.tsx` | organizations | SELECT (resolve org names) | Verified |
| `Auth.tsx` | organizations, organization_members | INSERT (org), INSERT (member) | FIXED: non-atomic signup using signUpData instead of getUser() |
| `Dashboard.tsx` | findings, repositories, audit_logs | SELECT (count), SELECT (posture), SELECT (repos), SELECT (activity) | Verified |
| `Policies.tsx` | policies | SELECT, INSERT, UPDATE (approve/archive/delete) | Verified |
| `Compliance.tsx` | findings | SELECT (severity/status for scoring) | Verified |
| `Teams.tsx` | organization_members, user_profiles | SELECT (join) | Verified |
| `AuditLogs.tsx` | audit_logs | SELECT (count), SELECT (paginated) | Verified |
| `Notifications.tsx` | notifications | SELECT, UPDATE (mark all read) | Verified |
| `Settings.tsx` | integrations, organizations | SELECT, UPDATE (settings/ai_config) | Verified |
| `Organizations.tsx` | organization_members, organizations | SELECT, INSERT, UPDATE | Verified (cross-tenant SELECT relies on RLS) |
| `Reports.tsx` | scans, findings, audit_logs | SELECT | Verified |
| `ModulePage.tsx` | ai_provider_configs*, scans, repositories, integrations, notifications, policies | SELECT (generic) | MISMATCH: ai_provider_configs table not in schema — ModulePage for AICenter will fail |
| `SBOMInventory.tsx` | (none — hardcoded mock) | N/A | Verified (mock data only) |

### Frontend #2 — Marketing + Dashboard (`omniguard-frontend-main/src/`)

| Code Path | Tables Accessed | Queries | Status |
|-----------|----------------|---------|--------|
| `AuthContext.tsx` | organization_members | SELECT (maybeSingle) | FIXED: Removed mock auth bypass, removed await in onAuthStateChange, added error handling |
| `seeding.ts` | user_profiles, organization_members, organizations, repositories, scans, findings, audit_logs | SELECT (exists check), INSERT (demo data) | FIXED: Removed non-existent columns (preferences, description, is_active, owasp array, mitre) |
| `Onboarding.tsx` | organizations, organization_members | SELECT (find by invite code), INSERT (org), INSERT (member) | FIXED: Inverted .neq('deleted_at', null) filter |
| `Overview.tsx` | findings, audit_logs | SELECT (count), SELECT (list) | Verified (cross-tenant audit_logs relies on RLS) |
| `ArchitectureNexus.tsx` | audit_logs, graph_nodes, findings | SELECT | Verified |
| `AiRemediation.tsx` | organization_members, findings | SELECT | Verified |
| `CloudDrift.tsx` | organization_members, organizations, integrations, findings, audit_logs | SELECT, INSERT, UPDATE | Verified |
| `TeamManagement.tsx` | organization_members, user_profiles | SELECT (join), UPDATE (status) | Verified |
| `DeveloperApi.tsx` | api_keys, organizations, organization_integrations, findings, integrations | SELECT, INSERT, UPDATE, UPSERT, DELETE | Verified (organization_integrations table exists in schema) |
| `SbomCompliance.tsx` | findings, compliance_rules, policy_chunks | SELECT | Verified (compliance_rules table exists; policy_chunks fallback) |
| `AiProviderConfig.tsx` | organization_members, findings, audit_logs | SELECT (count) | Verified |
| `AuditLogs.tsx` | organization_members, audit_logs | SELECT | Verified |

### CLI (`cli/src/`)

| Code Path | Tables Accessed | Queries | Status |
|-----------|----------------|---------|--------|
| `api.js` | organization_members, organizations, api_keys | GET, POST (auth + CRUD) | Verified |
| `daemon.js` | graph_nodes, audit_logs, compliance_rules, repositories, scans, organizations, findings | GET, POST, PATCH, DELETE | Verified |
| `apiEngine.js` | findings, repositories, scans, audit_logs | GET | Verified |
| `bulk-policy-ingester.js` | organizations, compliance_rules | GET, POST (bulk) | Verified |
| `mcp-lambda.js` | repositories, findings | GET, PATCH | Verified |
| `orchestrator.js` | repositories | GET (clone_url) | Verified |
| `threat-drift.js` | integrations | GET (Teams webhook) | Verified |
| `aiEngine.js` | (none — env-based AI) | N/A | Verified |
| `agentEngine.js` | (none — Anthropic API) | N/A | Verified |
| `mcp-server.js` | (none — local file scanning) | N/A | Verified |
| `tui.js` | (via edge functions) | N/A | Verified |
| `eventBus.js` | (none — in-memory events) | N/A | Verified |
| `jobQueue.js` | (none — in-memory queue) | N/A | Verified |
| `watch.js` | (none — fs.watch) | N/A | Verified |
| `sbomEngine.js` | (none — file parsing) | N/A | Verified |
| All scanners (7) | (none — file scanning) | N/A | Verified |
| All integrations (10) | (none — external API calls) | N/A | Verified |

### VS Code Extension

| Code Path | Tables Accessed | Status |
|-----------|----------------|--------|
| `extension.ts` activate | (none — shells to CLI) | FIXED: scanWorkspace command registered |
| Scan-on-save | (via CLI spawn) | Verified |
| Hover provider | (uses cached findings) | Verified |
| Tree provider | (uses cached findings) | Verified |

### Edge Functions (D1 — Production)

| Function | Tables Accessed | Key Features | Status |
|----------|----------------|--------------|--------|
| `api-gateway` | api_keys, rate_limit_counters, api_key_usage | Rate limiting, API key auth | Verified |
| `api-v1-api-keys` | organization_members, api_keys, audit_logs | JWT auth, key CRUD | Verified (missing role check — documented) |
| `api-v1-findings` | organization_members, api_keys, findings, organization_suppression_rules, audit_logs | Dual auth, CRUD, AI remediation, suppression | Verified |
| `api-v1-members` | organization_members, user_profiles, audit_logs | JWT auth, member CRUD | Verified (missing role check — documented) |
| `api-v1-scans` | organization_members, api_keys, repositories, scans, audit_logs | Dual auth, scan trigger | Verified |
| `api-v1-status` | organizations | Health check, no auth | Verified |
| `scan-worker` | scans, worker_heartbeats, repositories, organizations, integrations, policies, policy_chunks, findings, scan_artifacts, project_risk_history, organization_members, notifications, audit_logs | 8 scanners, 3-layer AI, RAG | Verified |
| `enterprise-integrations` | organization_members, api_keys, organizations, integrations, integration_events, audit_logs | Dual auth, 10 integrations | Verified |
| `github-webhook` | integrations, repositories, scans, organizations, audit_logs | Webhook signature verification | Verified |
| `notify-deliver` | organizations, scans, findings | Slack + email | Verified (no auth — documented) |
| `policy-ingest` | organization_members, organizations, policies, policy_chunks | JWT auth, AI extraction + embeddings | Verified |
| `scan-quick` | organization_members, api_keys | Dual auth, stateless scan | Verified |
| `secrets-proxy` | organization_members, organizations | JWT auth, vault CRUD | Verified |
| `_shared/ai.ts` | organizations, ai_cache, ai_usage | 7 providers, vault, cache, metering | Verified |

### AI Providers

| Module | Providers | Key Storage | Status |
|--------|-----------|-------------|--------|
| `cli/aiEngine.js` | Anthropic, OpenAI, Gemini, Ollama, OpenRouter, LiteLLM | Env vars | Verified |
| `supabase _shared/ai.ts` (prod) | Anthropic, OpenAI, Bedrock, Azure, Gemini, OpenRouter, Ollama | Vault + base64 fallback + env | Verified |
| `omniguard _shared/ai.ts` (basic) | Same 7 | Plaintext ai_config + env | Verified |
| `scanner/provider.ts` | Claude, OpenAI | Env vars | Verified |

### Docker / Infrastructure

| Component | Status |
|-----------|--------|
| Root Dockerfile | FIXED: Removed .vsix COPY, uses vite preview instead of dev |
| omniguard/Dockerfile | Verified (nginx, correct build args) |
| cli/Dockerfile | Verified (minimal MCP server) |
| docker-compose.yml | FIXED: Added daemon service, env vars from .env |
| k8s deployment | Verified (probes match daemon /healthz and /readyz) |
| k8s service | Verified (ports match) |

### Tables with Schema Verified Against Code

| Table | Frontend #1 | Frontend #2 | CLI | Edge Functions | Schema Match |
|-------|------------|------------|-----|----------------|--------------|
| organizations | Yes | Yes | Yes | Yes | MATCH |
| user_profiles | Yes | Yes | No | Yes | MATCH |
| organization_members | Yes | Yes | Yes | Yes | MATCH |
| api_keys | Yes | Yes | Yes | Yes | MATCH |
| repositories | Yes | Yes | Yes | Yes | MATCH |
| scans | Yes | Yes | Yes | Yes | MATCH |
| findings | Yes | Yes | Yes | Yes | MATCH |
| policies | Yes | No | No | Yes | MATCH |
| policy_chunks | No | Yes | Yes | Yes | MATCH |
| compliance_rules | No | Yes | Yes | No | MATCH |
| integrations | Yes | Yes | Yes | Yes | MATCH |
| integration_events | No | No | No | Yes | MATCH |
| notifications | Yes | No | No | Yes | MATCH |
| audit_logs | Yes | Yes | Yes | Yes | MATCH |
| graph_nodes | No | Yes | Yes | No | MATCH |
| worker_heartbeats | No | No | No | Yes | MATCH |
| ai_cache | No | No | No | Yes | MATCH |
| ai_usage | No | No | No | Yes | MATCH |
| organization_suppression_rules | No | No | No | Yes | MATCH |
| scan_artifacts | No | No | No | Yes | MATCH |
| project_risk_history | No | No | No | Yes | MATCH |
| api_key_usage | No | No | No | Yes | MATCH |
| rate_limit_counters | No | No | No | Yes | MATCH |
| organization_integrations | No | Yes | No | No | MATCH |
