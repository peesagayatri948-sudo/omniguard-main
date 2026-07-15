# OmniGuard — Clean Migration Chain Report

**Scope:** Full explanation of every database object created by the 7-file clean migration chain in `supabase/migrations_clean/`.

**Chain summary**

| # | File | Tables | Enums | Functions | Triggers | Policies (RLS) | Storage | Indexes |
|---|------|-------|-------|-----------|----------|-----------------|---------|---------|
| 001 | `001_extensions_and_core_tables.sql` | 4 | 14 | 1 (`set_updated_at`) | 3 | RLS enabled (4 tables; policies defined in 006) | — | 8 |
| 002 | `002_repositories_scans_findings.sql` | 3 | 0 | 0 | 2 | RLS enabled (3 tables) | — | 14 |
| 003 | `003_policies_integrations_notifications_audit.sql` | 7 | 0 | 0 | 2 | RLS enabled (7 tables) | — | 18 |
| 004 | `004_graph_workers_ai_rate_limiting.sql` | 10 | 0 | 0 | 0 | RLS enabled (9 tables; `rate_limit_counters` exempt) | — | 21 |
| 005 | `005_extensions_and_rpc_functions.sql` | 0 (+1 column) | 0 | 5 | 0 | 0 | — | 0 |
| 006 | `006_rls_policies.sql` | 0 | 0 | 2 helpers | 0 | 81 | — | 0 |
| 007 | `007_triggers_and_storage.sql` | 0 | 0 | 1 (`handle_new_user`) | 1 | 4 (storage) | 1 bucket | 0 |
| **Total** | | **24 tables** | **14 enums** | **9 functions** | **8 triggers** | **85 policies** | **1 bucket** | **61 indexes** |

All tables use UUID primary keys (`uuid` type, `DEFAULT gen_random_uuid()` from `pgcrypto`), enabling the multi-tenant, organization-scoped model that every OmniGuard code path relies on.

---

## Migration 001 — `001_extensions_and_core_tables.sql`

### Extensions

| Extension | Purpose | Why it exists (code path) |
|-----------|---------|---------------------------|
| `pgcrypto` | Provides `gen_random_uuid()` used as the default PK on every table. | FE#1 `useAuth.tsx` reads rows by `id`; FE#2 `seeding.ts` inserts orgs/repos/scans that get auto-generated UUIDs; CLI `api.js` `generateApiKey` inserts into `api_keys` relying on the server default. |
| `pg_trgm` | Trigram text similarity for `ILIKE`/`~` accelerated search. | FE#1 `Findings.tsx`, `AuditLogs.tsx` perform free-text filtering on titles/evidence; daemon `daemon.js` queries `repositories` by `name`. The index class is available even though the concrete GIN indexes are not declared in these migrations. |
| `uuid-ossp` | Legacy UUID generation (`uuid_generate_v4()`). Kept for compatibility with any external tooling that expects it. | CLI `daemon.js` builds node IDs with `crypto.createHash('md5')`; the extension is present as a safety net for Supabase SQL editor users and external scripts. |

### Enums (14)

These enums enforce closed value sets so the strongly-typed frontend type maps in `omniguard/src/lib/supabase.ts` and the edge-function row validators never receive an unexpected string.

| Enum | Values | Why it exists (code path) |
|------|--------|---------------------------|
| `org_plan` | `free`, `starter`, `pro`, `enterprise` | FE#2 `seeding.ts` inserts `plan: 'enterprise'`; FE#1 `Organizations.tsx` renders plan badges; FE#2 `Pricing.tsx` markets these tiers. |
| `member_role` | `owner`, `admin`, `manager`, `developer`, `viewer` | FE#1 `useAuth.tsx` `canManageOrg = ['owner','admin'].includes(currentRole)`; FE#2 `AuthContext.tsx` `resolveOrgStatus` maps `owner→ciso`, `admin/manager→manager`; CLI `api.js` `createMember` inserts role from signup. |
| `member_status` | `active`, `pending`, `declined`, `invited` | FE#1 `useAuth.fetchProfile` filters `status=eq.active`; FE#2 `Onboarding.tsx` inserts `status:'pending'` for joiners and `status:'active'` for creators; `AuthContext` maps `pending/invited→pending`. |
| `finding_severity` | `critical`, `high`, `medium`, `low`, `info` | Daemon `daemon.js` layers 1–8 emit findings with these severities; edge `scan-worker/index.ts` `SEV_TO_RISK` maps them; FE#1 `Findings.tsx` and `useDashboardStats` group by them; VS Code `extension.ts` `SEVERITY_ORDER` mirrors them. |
| `finding_status` | `open`, `resolved`, `suppressed`, `false_positive`, `in_progress` | Daemon `/ai-fix` and `/mass-remediate` PATCH findings to `resolved`; FE#1 `useFindings.resolveFinding`; FE#1 `useRepositories.suppressFinding` posts to `/api-v1-findings/:id/suppress`. |
| `scan_status` | `queued`, `running`, `completed`, `failed`, `cancelled` | Daemon inserts `status:'running'` then PATCHes to `failed`/`passed` (note: the code writes `'passed'` which is **not** in the enum — see Bug Report #11); `claim_next_scan()` in 005 selects `WHERE status='queued'`. |
| `scan_trigger` | `manual`, `webhook`, `scheduled`, `api`, `watch`, `ci` | Daemon `/scan-repo` inserts `trigger:'manual'`; `/webhook` handler inserts scans from push events; `cli/src/watch.js` uses `watch`; CLI `orchestrator.js` uses `ci`/`scheduled`. |
| `integration_status` | `active`, `disconnected`, `error`, `pending` | FE#1 `IntegrationsPage.tsx` renders status chips; edge `enterprise-integrations/index.ts` and `github-webhook/index.ts` read/write this column. |
| `policy_status` | `draft`, `approved`, `archived`, `active` | FE#1 `Policies.tsx` and FE#2 `platform/PolicyEngine.tsx` render the policy lifecycle; `bulk-policy-ingester.js` inserts `draft` then the UI approves. |
| `policy_severity` | `critical`, `high`, `medium`, `low`, `info` | FE#1 `Policies.tsx` severity selector; `policy-ingest/index.ts` stores severity on upload. |
| `notification_type` | `finding`, `scan`, `system`, `integration`, `policy`, `drift`, `security` | Edge `notify-deliver/index.ts` writes notifications; FE#1 `Notifications.tsx` and `useNotifications` filter by type. |
| `integration_provider` | `github`, `gitlab`, `bitbucket`, `azuredevops`, `slack`, `teams`, `jira`, `servicenow`, `pagerduty`, `linear`, `confluence`, `okta`, `vault`, `webhook`, `custom` | CLI `integrations/` folder has one file per provider (`github.js`, `jira.js`, `slack.js`, …); FE#1 `IntegrationsPage` & `WebhooksPage` enumerate providers; VS Code `extension.ts` commands call `integrations jira`/`servicenow`. |
| `repository_visibility` | `public`, `private`, `internal` | FE#2 `seeding.ts` inserts `visibility:'private'`; FE#1 `Repositories.tsx` renders the badge; daemon creates repos with `visibility:'private'`. |
| `repository_provider` | `github`, `gitlab`, `bitbucket`, `azuredevops`, `local` | FE#1 `Repositories.tsx` provider icons; daemon inserts `provider:'local'`; CLI integrations map provider→API. |

### Table: `organizations`

| Column | Type | Default / Constraint | Why |
|--------|------|----------------------|-----|
| `id` | uuid PK | `gen_random_uuid()` | Tenant root key — referenced by every other table's `organization_id` FK. |
| `name` | text NOT NULL | — | Display name; FE#1 `Organizations.tsx`, FE#2 `Onboarding.tsx` insert. |
| `slug` | text NOT NULL UNIQUE | — | URL-safe identifier; FE#2 `Onboarding`/`seeding.ts` generate `slug-${random}`; FE#1 `Organizations.tsx` displays it. |
| `plan` | `org_plan` NOT NULL | `'free'` | Billing tier; `Pricing.tsx`, `seeding.ts` (`enterprise`). |
| `settings` | jsonb NOT NULL | `'{}'` | Arbitrary org config incl. `invite_code` (FE#2 `Onboarding` join flow) and `policies` flags (`seeding.ts`). |
| `ai_config` | jsonb NOT NULL | `'{}'` | BYOK AI provider config (`provider`, `apiKey`, model overrides). Read by daemon before every AI call (`supabaseCall('GET','organizations')`), by edge `scan-worker` via `resolveAIConfigFromOrg`, and by `secrets-proxy`. |
| `rate_limits` | jsonb NOT NULL | `'{}'` | Per-org rate-limit overrides consumed by `check_rate_limit()` (005). |
| `ai_keys_vault_id` | uuid | nullable | Pointer to a Supabase Vault secret id when the org stores its AI key encrypted server-side instead of in `ai_config`. Referenced by `secrets-proxy/index.ts` and `_shared/ai.ts` production path. |
| `created_by` | uuid | nullable, no FK (deliberate) | The creating user; left unFK'd so deleting a user doesn't cascade-delete the org. Set by FE#2 `Onboarding` and `seeding.ts`. |
| `created_at` / `updated_at` | timestamptz NOT NULL | `now()` | Audit timestamps; `updated_at` maintained by trigger. |

**Indexes:** `idx_organizations_slug` (slug lookups during join-by-invite), `idx_organizations_created_by` (list orgs by owner).

### Table: `user_profiles`

| Column | Type | Default / Constraint | Why |
|--------|------|----------------------|-----|
| `id` | uuid PK | `REFERENCES auth.users(id) ON DELETE CASCADE` | 1:1 with Supabase Auth user. `handle_new_user()` trigger (007) auto-inserts a row on signup. |
| `email` | text NOT NULL | — | Denormalized from `auth.users.email`; FE#1 `useAuth.signUp` upserts it, FE#2 `seeding.ts` inserts it, daemon never writes here. |
| `first_name` | text | nullable | Set from `raw_user_meta_data->>'first_name'` by the trigger; FE#1 `signUp` passes `first_name`. |
| `last_name` | text | nullable | Same as above. |
| `avatar_url` | text | nullable | Gravatar/upload URL; FE#1 `Settings.tsx` edits it. |
| `role` | text NOT NULL | `'user'` | Global app role (distinct from per-org `member_role`). `'user'` default; CISO escalation is per-org via `organization_members.role`. |
| `created_at` / `updated_at` | timestamptz NOT NULL | `now()` | `updated_at` via trigger. |

**Index:** `idx_user_profiles_email` (search-by-email in `Teams.tsx`, `Organizations.tsx`).

### Table: `organization_members`

| Column | Type | Default / Constraint | Why |
|--------|------|----------------------|-----|
| `id` | uuid PK | `gen_random_uuid()` | — |
| `organization_id` | uuid NOT NULL | `REFERENCES organizations(id) ON DELETE CASCADE` | Tenant FK. |
| `user_id` | uuid NOT NULL | `REFERENCES auth.users(id) ON DELETE CASCADE` | Membership subject. |
| `role` | `member_role` NOT NULL | `'developer'` | Drives `canManageOrg` in FE#1 and role mapping in FE#2. |
| `status` | `member_status` NOT NULL | `'pending'` | Joiners start `pending`; creator self-insert is `active`. |
| `invited_by` | uuid | `REFERENCES auth.users(id)` | Who invited the user; FE#1 `Teams.tsx` shows it. |
| `created_at` / `updated_at` | timestamptz NOT NULL | `now()` | — |
| | | `UNIQUE(organization_id, user_id)` | Prevents duplicate memberships. FE#2 `Onboarding` relies on this to avoid double-insert on retry. |

**Indexes:** `idx_org_members_org_id` (list members of org — `Teams.tsx`, `api-v1-members`), `idx_org_members_user_id` (resolve orgs for a user — every `user_org_ids()` call), `idx_org_members_status` (filter active-only).

### Table: `api_keys`

| Column | Type | Default / Constraint | Why |
|--------|------|----------------------|-----|
| `id` | uuid PK | `gen_random_uuid()` | — |
| `organization_id` | uuid NOT NULL | FK → organizations CASCADE | Tenant. |
| `created_by` | uuid | FK → auth.users | Who generated the key. |
| `name` | text NOT NULL | — | Human label; FE#1 `Settings.tsx` & FE#2 `DeveloperApi.tsx` render it; CLI sets `'CLI Key'`. |
| `key_prefix` | text NOT NULL | — | First ~16 chars shown in UI for identification; CLI `api.js validateApiKey` filters `key_prefix=eq.`. |
| `key_hash` | text NOT NULL | — UNIQUE (idx) | SHA-256 of the full plaintext key; edge functions look up by `key_hash=eq.<sha256>`. |
| `scopes` | jsonb NOT NULL | `'[]'` | OAuth-style scope array; `api-gateway` enforces. |
| `is_active` | boolean NOT NULL | `true` | Soft-disable; `validateApiKey` filters `is_active=eq.true`. |
| `expires_at` | timestamptz | nullable | TTL; edge `api-v1-api-keys` checks it. |
| `last_used_at` | timestamptz | nullable | Updated by `api-v1-findings`/`api-v1-scans` on each authenticated call. |
| `created_at` | timestamptz NOT NULL | `now()` | — |

**Indexes:** `idx_api_keys_org_id`, `idx_api_keys_key_prefix`, `idx_api_keys_is_active`, `idx_api_keys_key_hash` (UNIQUE).

### Function: `set_updated_at()` (plpgsql, trigger)

```sql
NEW.updated_at = now(); RETURN NEW;
```
**Why:** Called by 8 `BEFORE UPDATE` triggers (organizations, user_profiles, organization_members, repositories, scans, policies, integrations, organization_suppression_rules). Every FE update path (e.g. `useRepositories.remove` sets `deleted_at`, `useFindings.resolveFinding`) relies on `updated_at` being bumped automatically.

### Triggers (3 in this file)
- `trg_organizations_updated_at`
- `trg_user_profiles_updated_at`
- `trg_org_members_updated_at`

### RLS enabled
`organizations`, `user_profiles`, `organization_members`, `api_keys` — RLS turned on here; the actual policies come in 006.

---

## Migration 002 — `002_repositories_scans_findings.sql`

### Table: `repositories`

| Column | Type | Default / Constraint | Why |
|--------|------|----------------------|-----|
| `id` | uuid PK | `gen_random_uuid()` | FK target for `scans.repository_id`, `findings.repository_id`, `project_risk_history.repository_id`. |
| `organization_id` | uuid NOT NULL | FK → organizations CASCADE | Tenant isolation. |
| `provider` | `repository_provider` NOT NULL | `'github'` | Source VCS. |
| `owner` | text | nullable | Repo owner (e.g. `experian`). |
| `name` | text NOT NULL | — | Repo name; daemon filters `name=eq.<encoded>`. |
| `full_name` | text | nullable | `owner/name`; FE#1 `Repositories.tsx` displays it. |
| `provider_id` | text | nullable | External ID from the VCS. |
| `clone_url` | text | nullable | Used by daemon to `git clone`. |
| `default_branch` | text | `'main'` | FE#2 `seeding.ts` sets `main`. |
| `language` | text | nullable | Primary language; `seeding.ts` sets `Python`. |
| `visibility` | `repository_visibility` NOT NULL | `'private'` | — |
| `risk_score` | integer | `0` | 0–100 posture; `useDashboardStats` averages it; daemon can update. |
| `last_scan_at` | timestamptz | nullable | Updated after a scan completes. |
| `last_sync_at` | timestamptz | nullable | Last graph sync. |
| `webhook_secret` | text | nullable | HMAC secret for validating incoming GitHub webhooks (`github-webhook/index.ts`). |
| `created_by` | uuid | FK → auth.users | — |
| `deleted_at` | timestamptz | nullable | Soft-delete; FE#1 `useRepositories.remove` sets it and `fetch_` filters `.is('deleted_at', null)`. |
| `created_at` / `updated_at` | timestamptz NOT NULL | `now()` | — |

**Indexes:** `idx_repositories_org_id`, `idx_repositories_full_name`, `idx_repositories_deleted_at`, and **`idx_repositories_org_name` UNIQUE `(organization_id, name) WHERE deleted_at IS NULL`** — prevents duplicate active repos per org while allowing soft-deleted duplicates.

### Table: `scans`

| Column | Type | Default / Constraint | Why |
|--------|------|----------------------|-----|
| `id` | uuid PK | `gen_random_uuid()` | — |
| `organization_id` | uuid NOT NULL | FK → organizations CASCADE | Tenant. |
| `repository_id` | uuid NOT NULL | FK → repositories CASCADE | What was scanned. |
| `status` | `scan_status` NOT NULL | `'queued'` | `claim_next_scan()` (005) transitions `queued→running`; daemon PATCHes to `failed`/`completed`. |
| `scan_type` | text | `'full'` | `full`, `quick`, `incremental`; `scan-quick` edge fn uses `quick`. |
| `trigger` | `scan_trigger` NOT NULL | `'manual'` | — |
| `branch` | text | nullable | — |
| `commit_sha` | text | nullable | FE#2 `seeding.ts` sets a demo SHA. |
| `commit_message` | text | nullable | Daemon `/scan-repo` sets `'Manual scan…'`. |
| `commit_author` | text | nullable | — |
| `summary` | jsonb NOT NULL | `'{}'` | `{files_scanned, critical, high, medium}`; `seeding.ts` and daemon populate it. |
| `metadata` | jsonb NOT NULL | `'{}'` | Extra run metadata. |
| `duration_seconds` | integer | nullable | Set on completion. |
| `findings_count` | integer | `0` | Daemon PATCHes it post-scan. |
| `worker_id` | text | nullable | Set by `claim_next_scan(p_worker_id)`. |
| `error_message` | text | nullable | — |
| `created_by` | uuid | FK → auth.users | — |
| `started_at` / `completed_at` | timestamptz | nullable | Set by worker. |
| `created_at` / `updated_at` | timestamptz NOT NULL | `now()` | — |

**Indexes:** `idx_scans_org_id`, `idx_scans_repo_id`, `idx_scans_status` (claim_next_scan filters `status='queued'`), `idx_scans_created_at` DESC (recent-first feeds).

### Table: `findings`

The widest table — 38 columns — because every scanner (CLI layers 1–8, edge `scan-worker`, VS Code) writes a row here and the UI renders most of them.

| Column | Type | Default / Constraint | Why |
|--------|------|----------------------|-----|
| `id` | uuid PK | `gen_random_uuid()` | — |
| `organization_id` | uuid NOT NULL | FK → organizations CASCADE | Tenant. |
| `scan_id` | uuid | FK → scans CASCADE (nullable) | Nullable so daemon can insert findings even when the scan row insert failed (it falls back to a local id and drops `scan_id`). |
| `repository_id` | uuid | FK → repositories SET NULL | SET NULL so deleting a repo keeps historical findings. |
| `title` | text NOT NULL | — | — |
| `description` | text | nullable | — |
| `severity` | `finding_severity` NOT NULL | `'medium'` | — |
| `status` | `finding_status` NOT NULL | `'open'` | — |
| `risk_score` | integer | `0` | 0–100; edge `scan-worker` `sevToRisk()` computes it. |
| `confidence_score` | numeric(3,2) | `0.00` | 0–1; `scan-worker` `scoreConfidence()`. |
| `false_positive_likelihood` | numeric(3,2) | `0.00` | AI-estimated FP probability. |
| `scanner` | text NOT NULL | — | `secret`, `dependency`, `sast`, `iac`, `container`, `license`, `policy`, `compliance`, `ai` (daemon enforces this whitelist before insert). |
| `rule_id` | text | nullable | e.g. `SAST-DESER-001`; FE groups by it. |
| `rule_name` | text | nullable | — |
| `category` | text | nullable | `sast`, `secrets`, `architecture`, `supply-chain`, `semantic`, `infrastructure`, `drift`, `custom`. |
| `clause_reference` | text | nullable | e.g. `PCI DSS 6.2.4`. **Note:** daemon moves this into `metadata` before insert because the REST schema validator doesn't always see it — see Bug #11. |
| `owasp` | text | nullable | e.g. `A08:2021-…`. `seeding.ts` stores a string here. (FE#1 type map incorrectly types it as `string[]` — see Bug Report.) |
| `cwe` | text | nullable | e.g. `CWE-502`. |
| `cvss_score` | numeric(3,1) | nullable | — |
| `cve_id` | text | nullable | — |
| `package_name` / `package_version` | text | nullable | SCA findings (`sbomEngine.js`). |
| `file_path` | text | nullable | — |
| `line_start` / `line_end` | integer | nullable | VS Code `findingToDiagnostic` uses `line_start`. |
| `evidence` | text | nullable | Matched code snippet. |
| `remediation` | text | nullable | Static remediation text. |
| `ai_summary` | text | nullable | LLM summary. |
| `ai_remediation` | text | nullable | LLM code fix; daemon `/ai-fix` & `/mass-remediate` set it. |
| `ai_provider` / `ai_model` | text | nullable | Provenance; `_shared/ai.ts` sets them. |
| `policy_violations` | jsonb NOT NULL | `'[]'` | Linked policy ids. |
| `business_impact` | text | nullable | — |
| `suggested_commit` | text | nullable | — |
| `"references"` | jsonb NOT NULL | `'[]'` | Quoted because `references` is a reserved word. |
| `fingerprint` | text | nullable | Dedup hash; `scan-worker` computes SHA-256. |
| `metadata` | jsonb NOT NULL | `'{}'` | Catch-all; daemon stuffs `clause_reference` here. |
| `resolution_note` | text | nullable | Set by `useFindings.resolveFinding`. |
| `suppress_reason` / `suppression_note` | text | nullable | Set via `/api-v1-findings/:id/suppress`. |
| `assigned_to` | uuid | FK → auth.users | — |
| `resolved_by` | uuid | FK → auth.users | Set by `resolveFinding`. |
| `suppressed_by` | uuid | FK → auth.users | — |
| `resolved_at` / `suppressed_at` / `read_at` | timestamptz | nullable | — |
| `created_at` | timestamptz NOT NULL | `now()` | — |

**Indexes (9):** `idx_findings_org_id`, `idx_findings_scan_id`, `idx_findings_repo_id`, `idx_findings_severity`, `idx_findings_status`, `idx_findings_rule_id`, `idx_findings_category`, `idx_findings_created_at` DESC, `idx_findings_fingerprint`, and composite `idx_findings_severity_status` (the dashboard's most common filter).

### Triggers
`trg_repositories_updated_at`, `trg_scans_updated_at` (findings has no `updated_at` so no trigger).

### RLS enabled
`repositories`, `scans`, `findings`.

---

## Migration 003 — `003_policies_integrations_notifications_audit.sql`

### Table: `policies`

| Column | Type | Default / Constraint | Why |
|--------|------|----------------------|-----|
| `id` | uuid PK | — | — |
| `organization_id` | uuid NOT NULL | FK CASCADE | Tenant. |
| `created_by` | uuid | FK → auth.users | — |
| `title` | text NOT NULL | — | FE#1 `Policies.tsx`, FE#2 `PolicyEngine.tsx`. |
| `name` | text | nullable | Machine name. |
| `description` | text | nullable | — |
| `content` | text | nullable | Raw policy text (pre-chunking). |
| `category` | text | nullable | e.g. `access-control`, `crypto`. |
| `severity` | `policy_severity` NOT NULL | `'medium'` | — |
| `status` | `policy_status` NOT NULL | `'draft'` | Lifecycle. |
| `source_type` | text | `'manual'` | `manual`, `upload`, `marketplace`, `ai-generated`. |
| `policy_type` | text | nullable | — |
| `source_document_type` | text | nullable | — |
| `structured_rules` | jsonb NOT NULL | `'[]'` | Array of concrete regex rules extracted by the AI parser (`policy-ingest/index.ts`, daemon `/upload-policies`). |
| `enabled` | boolean NOT NULL | `true` | Toggle. |
| `enforcement_mode` | text | `'advisory'` | `advisory`, `blocking`. |
| `tags` | jsonb NOT NULL | `'[]'` | — |
| `compliance_mappings` | jsonb NOT NULL | `'{}'` | `{pci: [...], iso: [...]}`. |
| `approved_by` | uuid | FK → auth.users | — |
| `approved_at` | timestamptz | nullable | — |
| `deleted_at` | timestamptz | nullable | Soft delete. |
| `created_at` / `updated_at` | timestamptz NOT NULL | `now()` | — |

**Indexes:** `idx_policies_org_id`, `idx_policies_status`, `idx_policies_category`, `idx_policies_deleted_at`, `idx_policies_severity`.

### Table: `policy_chunks`

Stores text chunks of policies for RAG (retrieval-augmented generation). Migration 005 adds the `embedding vector(1536)` column.

| Column | Type | Default / Constraint | Why |
|--------|------|----------------------|-----|
| `id` | uuid PK | — | — |
| `organization_id` | uuid NOT NULL | FK CASCADE | Tenant. |
| `policy_id` | uuid | FK → policies CASCADE (nullable) | Parent policy. |
| `chunk_index` | integer NOT NULL | `0` | Ordering; daemon `/upload-policies` fallback uses `-999`. |
| `content` | text NOT NULL | — | The chunk text. |
| `metadata` | jsonb NOT NULL | `'{}'` | — |
| `created_at` | timestamptz NOT NULL | `now()` | — |
| `embedding` | vector(1536) | nullable (added in 005) | OpenAI `text-embedding-3-small` dimension; `match_policy_chunks()` (005) does cosine similarity. |

**Indexes:** `idx_policy_chunks_org_id`, `idx_policy_chunks_policy_id`, `idx_policy_chunks_chunk_index`.

### Table: `compliance_rules`

Per-org custom scanning rules (distinct from the built-in `COMPLIANCE_RULES` constant in `cli/src/complianceRules.js`).

| Column | Type | Default / Constraint | Why |
|--------|------|----------------------|-----|
| `id` | uuid PK | — | — |
| `organization_id` | uuid NOT NULL | FK CASCADE | Tenant. |
| `rule_id` | text NOT NULL | — | e.g. `SAST-CUSTOM-001`. |
| `category` | text NOT NULL | — | — |
| `title` | text NOT NULL | — | — |
| `description` | text | nullable | — |
| `severity` | `finding_severity` NOT NULL | `'medium'` | — |
| `pattern` | text | nullable | Regex source string. |
| `clause_reference` | text | nullable | — |
| `created_at` | timestamptz NOT NULL | `now()` | — |

**Why:** Daemon `loadOrgCustomPolicies(orgId)` does `GET compliance_rules?organization_id=eq.<orgId>` and converts each row into a `{rule_id, pattern, …}` object that the 8-layer scanner matches against file content. `bulk-policy-ingester.js` and `policy-ingest/index.ts` insert rows here.

**Indexes:** `idx_compliance_rules_org_id`, `idx_compliance_rules_rule_id`, `idx_compliance_rules_category`.

### Table: `integrations`

| Column | Type | Default / Constraint | Why |
|--------|------|----------------------|-----|
| `id` | uuid PK | — | — |
| `organization_id` | uuid NOT NULL | FK CASCADE | Tenant. |
| `provider` | text NOT NULL | — | Matches `integration_provider` values (stored as text for flexibility). |
| `name` | text NOT NULL | — | Instance label. |
| `config` | jsonb NOT NULL | `'{}'` | Provider-specific config (webhook URL, PAT, project key). **Stored in plaintext — see Bug #12.** |
| `status` | `integration_status` NOT NULL | `'pending'` | — |
| `metadata` | jsonb NOT NULL | `'{}'` | — |
| `created_by` | uuid | FK → auth.users | — |
| `last_sync_at` | timestamptz | nullable | — |
| `error_message` | text | nullable | — |
| `created_at` / `updated_at` | timestamptz NOT NULL | `now()` | — |

**Indexes:** `idx_integrations_org_id`, `idx_integrations_provider`, `idx_integrations_status`. Trigger `trg_integrations_updated_at`.

### Table: `integration_events`

| Column | Type | Default / Constraint | Why |
|--------|------|----------------------|-----|
| `id` | uuid PK | — | — |
| `organization_id` | uuid NOT NULL | FK CASCADE | Tenant. |
| `integration_id` | uuid | FK → integrations CASCADE | — |
| `provider` | text NOT NULL | — | — |
| `event_type` | text NOT NULL | — | e.g. `ticket_created`, `message_sent`. |
| `payload` | jsonb NOT NULL | `'{}'` | — |
| `status` | text | `'pending'` | — |
| `error` | text | nullable | — |
| `created_at` | timestamptz NOT NULL | `now()` | — |

**Indexes:** `idx_integration_events_org_id`, `idx_integration_events_integration_id`.

### Table: `notifications`

| Column | Type | Default / Constraint | Why |
|--------|------|----------------------|-----|
| `id` | uuid PK | — | — |
| `organization_id` | uuid NOT NULL | FK CASCADE | Tenant. |
| `user_id` | uuid | FK → auth.users CASCADE (nullable) | `NULL` = broadcast to org. |
| `title` | text NOT NULL | — | — |
| `body` | text | nullable | — |
| `type` | `notification_type` NOT NULL | `'system'` | — |
| `data` | jsonb NOT NULL | `'{}'` | — |
| `read_at` | timestamptz | nullable | `useNotifications.markAllRead` sets it. |
| `created_at` | timestamptz NOT NULL | `now()` | — |

**Indexes:** `idx_notifications_org_id`, `idx_notifications_user_id`, `idx_notifications_read_at`, `idx_notifications_created_at` DESC.

### Table: `audit_logs`

| Column | Type | Default / Constraint | Why |
|--------|------|----------------------|-----|
| `id` | uuid PK | — | — |
| `organization_id` | uuid NOT NULL | FK CASCADE | Tenant. |
| `user_id` | uuid | FK → auth.users (nullable) | Nullable so system/AI actors can log. |
| `actor` | text | nullable | e.g. `OmniGuard AI`. |
| `action` | text NOT NULL | — | `graph_delta`, `vulnerability_detected`, `ai_fix_applied`, `drift_auto_fix`, `mcp_intercept`. |
| `resource_type` | text | nullable | e.g. `nexus_graph`, `ai_guardrail`. |
| `resource_name` | text | nullable | — |
| `resource_id` | text | nullable | — |
| `target_id` | text | nullable | — |
| `entity_type` / `entity_id` | text | nullable | — |
| `details` | jsonb NOT NULL | `'{}'` | Daemon `/ai-fix` writes `{rule_id, file, resolved}` here. |
| `new_values` | jsonb NOT NULL | `'{}'` | Daemon `updateSecureDesignGraph` writes the delta. |
| `metadata` | jsonb NOT NULL | `'{}'` | — |
| `created_at` | timestamptz NOT NULL | `now()` | — |

**Why:** FE#1 `AuditLogs.tsx` and FE#2 `AuditLogs.tsx` render this; daemon writes `graph_delta` and `vulnerability_detected` events; `seeding.ts` inserts demo `graph_delta`/`mcp_intercept` rows.

**Indexes:** `idx_audit_logs_org_id`, `idx_audit_logs_action`, `idx_audit_logs_resource_type`, `idx_audit_logs_created_at` DESC.

### Triggers
`trg_policies_updated_at`, `trg_integrations_updated_at`.

### RLS enabled
`policies`, `policy_chunks`, `compliance_rules`, `integrations`, `integration_events`, `notifications`, `audit_logs`.

---

## Migration 004 — `004_graph_workers_ai_rate_limiting.sql`

### Table: `graph_nodes`

| Column | Type | Default / Constraint | Why |
|--------|------|----------------------|-----|
| `id` | uuid PK | — | — |
| `organization_id` | uuid NOT NULL | FK CASCADE | Tenant. |
| `repository_name` | text NOT NULL | — | Daemon `updateSecureDesignGraph` DELETEs by `organization_id=eq.&repository_name=eq.` then INSERTs. |
| `node_id` | text NOT NULL | — | `node-<md5(repo:path)>` generated by daemon. |
| `node_type` | text NOT NULL | — | `sublevel` / `leaf` (daemon) — **column is named `node_type` but daemon inserts `type`, see Bug Report.** |
| `node_data` | jsonb NOT NULL | `'{}'` | — |
| `imports` | jsonb NOT NULL | `'[]'` | Daemon stringifies the import array. |
| `depth` | integer | `0` | Walk depth (≤5). |
| `created_at` | timestamptz NOT NULL | `now()` | — |

**Indexes:** `idx_graph_nodes_org_id`, `idx_graph_nodes_repo_name`, `idx_graph_nodes_node_id`, `idx_graph_nodes_depth`.

### Table: `worker_heartbeats`

| Column | Type | Default / Constraint | Why |
|--------|------|----------------------|-----|
| `id` | uuid PK | — | — |
| `worker_id` | text NOT NULL | — | `worker-<uuid8>` in `scan-worker/index.ts`. |
| `worker_type` | text NOT NULL | `'scan'` | — |
| `status` | text NOT NULL | `'idle'` | `idle`, `scanning`, `error`. |
| `current_scan_id` | uuid | FK → scans SET NULL | — |
| `last_heartbeat` | timestamptz NOT NULL | `now()` | — |
| `created_at` | timestamptz NOT NULL | `now()` | — |

**Why:** `scan-worker` loop calls `claim_next_scan()` then writes a heartbeat; FE#1 `Scans.tsx` and the status endpoint show worker liveness. RLS is intentionally permissive (`USING (true)`) so any authenticated user can see worker health.

**Indexes:** `idx_worker_heartbeats_worker_id`, `idx_worker_heartbeats_status`.

### Table: `ai_cache`

| Column | Type | Default / Constraint | Why |
|--------|------|----------------------|-----|
| `id` | uuid PK | — | — |
| `cache_key` | text NOT NULL UNIQUE | — | SHA-256 of the prompt. |
| `organization_id` | uuid NOT NULL | FK CASCADE | Tenant. |
| `provider` | text NOT NULL | — | — |
| `model` | text NOT NULL | — | — |
| `prompt_hash` | text NOT NULL | — | — |
| `response_text` | text NOT NULL | — | Cached LLM output. |
| `tokens_used` | integer | `0` | — |
| `expires_at` | timestamptz NOT NULL | — | 7-day TTL per `_shared/ai.ts`. |
| `hit_count` | integer | `0` | — |
| `created_at` | timestamptz NOT NULL | `now()` | — |

**Why:** `_shared/ai.ts` production path checks the cache before calling any provider, slashing cost on repeat scans.

**Indexes:** `idx_ai_cache_org_id`, `idx_ai_cache_cache_key`, `idx_ai_cache_expires_at`.

### Table: `ai_usage`

| Column | Type | Default / Constraint | Why |
|--------|------|----------------------|-----|
| `id` | uuid PK | — | — |
| `organization_id` | uuid NOT NULL | FK CASCADE | Tenant. |
| `scan_id` | uuid | FK → scans SET NULL | — |
| `provider` | text NOT NULL | — | — |
| `model` | text NOT NULL | — | — |
| `tier` | text NOT NULL | `'medium'` | `fast` / `medium` / `deep`. |
| `prompt_tokens` / `completion_tokens` / `total_tokens` | integer | `0` | — |
| `cache_hit` | boolean | `false` | — |
| `latency_ms` | integer | `0` | — |
| `created_at` | timestamptz NOT NULL | `now()` | — |

**Why:** `_shared/ai.ts` inserts a row after every call for metering & billing; FE#2 `AiProviderConfig.tsx` and FE#1 `AICenter.tsx` render usage charts.

**Indexes:** `idx_ai_usage_org_id`, `idx_ai_usage_scan_id`, `idx_ai_usage_created_at` DESC.

### Table: `organization_suppression_rules`

| Column | Type | Default / Constraint | Why |
|--------|------|----------------------|-----|
| `id` | uuid PK | — | — |
| `organization_id` | uuid NOT NULL | FK CASCADE | Tenant. |
| `scanner` | text NOT NULL | — | — |
| `rule_id` | text | nullable | — |
| `file_pattern` | text | nullable | Glob. |
| `false_positive_likelihood` | numeric(3,2) | `0.90` | — |
| `dismiss_count` | integer | `0` | — |
| `active` | boolean NOT NULL | `true` | — |
| `generated_from_finding_id` | uuid | FK → findings SET NULL | — |
| `last_dismissed_at` | timestamptz | nullable | — |
| `created_at` / `updated_at` | timestamptz NOT NULL | `now()` | — |

**Why:** FE#1 `Findings.tsx` "suppress" action and edge `/api-v1-findings/:id/suppress` create rules; scanner layers check `active` rules to skip known FPs.

**Indexes:** `idx_suppression_rules_org_id`, `idx_suppression_rules_scanner_rule` (scanner, rule_id), `idx_suppression_rules_active`.

### Table: `scan_artifacts`

| Column | Type | Default / Constraint | Why |
|--------|------|----------------------|-----|
| `id` | uuid PK | — | — |
| `scan_id` | uuid NOT NULL | FK → scans CASCADE | — |
| `organization_id` | uuid NOT NULL | FK CASCADE | Tenant. |
| `artifact_type` | text NOT NULL | — | `sarif`, `sbom`, `report`, `graph`. |
| `filename` | text NOT NULL | — | — |
| `storage_path` | text | nullable | Path in the `scan-artifacts` storage bucket (created in 007). |
| `size_bytes` | bigint | `0` | — |
| `mime_type` | text | nullable | — |
| `metadata` | jsonb NOT NULL | `'{}'` | — |
| `created_at` | timestamptz NOT NULL | `now()` | — |

**Why:** FE#1 `Reports.tsx` & `SBOMGeneration.tsx` list/download artifacts; `scan-worker` writes SBOM/SARIF here and uploads to storage.

**Indexes:** `idx_scan_artifacts_scan_id`, `idx_scan_artifacts_org_id`.

### Table: `project_risk_history`

| Column | Type | Default / Constraint | Why |
|--------|------|----------------------|-----|
| `id` | uuid PK | — | — |
| `organization_id` | uuid NOT NULL | FK CASCADE | Tenant. |
| `repository_id` | uuid NOT NULL | FK → repositories CASCADE | — |
| `scan_id` | uuid | FK → scans SET NULL | — |
| `score` | integer NOT NULL | `0` | 0–100 risk. |
| `factors` | jsonb NOT NULL | `'{}'` | Breakdown `{critical: n, high: n, …}`. |
| `created_at` | timestamptz NOT NULL | `now()` | — |

**Why:** FE#1 `Projects.tsx` & `Reports.tsx` trend charts; daemon records a row per scan.

**Indexes:** `idx_risk_history_org_id`, `idx_risk_history_repo_id`.

### Table: `api_key_usage`

| Column | Type | Default / Constraint | Why |
|--------|------|----------------------|-----|
| `id` | uuid PK | — | — |
| `key_id` | uuid NOT NULL | FK → api_keys CASCADE | — |
| `organization_id` | uuid NOT NULL | FK CASCADE | Tenant. |
| `endpoint` | text | nullable | — |
| `method` | text | nullable | — |
| `status_code` | integer | nullable | — |
| `response_ms` | integer | nullable | — |
| `ip_address` | text | nullable | — |
| `user_agent` | text | nullable | — |
| `created_at` | timestamptz NOT NULL | `now()` | — |

**Why:** `api-gateway/index.ts` logs every API call; FE#2 `DeveloperApi.tsx` renders usage stats.

**Indexes:** `idx_api_key_usage_key_id`, `idx_api_key_usage_org_id`, `idx_api_key_usage_created_at` DESC.

### Table: `rate_limit_counters`

| Column | Type | Default / Constraint | Why |
|--------|------|----------------------|-----|
| `key` | text PK | — | Composite key e.g. `ai:<orgId>:<provider>`. |
| `window_start` | timestamptz NOT NULL | `now()` | — |
| `count` | integer NOT NULL | `0` | — |

**Why:** `check_rate_limit()` (005) does atomic `INSERT … ON CONFLICT DO UPDATE` here. RLS is **not** enabled — the function is `SECURITY DEFINER` and increments counters server-side.

### Table: `organization_integrations`

| Column | Type | Default / Constraint | Why |
|--------|------|----------------------|-----|
| `id` | uuid PK | — | — |
| `organization_id` | uuid NOT NULL | FK CASCADE | Tenant. |
| `provider` | text NOT NULL | — | — |
| `status` | text NOT NULL | `'active'` | — |
| `credentials` | jsonb NOT NULL | `'{}'` | Encrypted credential blob. **Plaintext storage — see Bug #12.** |
| `created_at` / `updated_at` | timestamptz NOT NULL | `now()` | — |
| | | `UNIQUE(organization_id, provider)` | One config per provider per org. |

**Why:** `enterprise-integrations/index.ts` and `secrets-proxy/index.ts` read credentials from here; FE#2 `AiProviderConfig.tsx` writes AI provider creds.

**Indexes:** `idx_org_integrations_org_id`, `idx_org_integrations_provider`.

### RLS enabled
All tables in this migration except `rate_limit_counters` (intentionally exempt — managed by the SECURITY DEFINER function).

---

## Migration 005 — `005_extensions_and_rpc_functions.sql`

### Extension: `vector`
Supabase's `pgvector` — required for the `embedding vector(1536)` column.

### Column: `policy_chunks.embedding` `vector(1536)` (added via `ALTER TABLE … ADD COLUMN IF NOT EXISTS`)
1536 = OpenAI `text-embedding-3-small` / `text-embedding-3-large` output dimension. `policy-ingest/index.ts` computes embeddings and stores them; `match_policy_chunks()` retrieves.

### Function: `check_rate_limit(p_key text, p_window_seconds integer DEFAULT 60, p_max_count integer DEFAULT 100) RETURNS boolean`
**SECURITY DEFINER.** Atomic counter: counts rows in `rate_limit_counters` within the window; if under the cap, `INSERT … ON CONFLICT (key) DO UPDATE SET count = count + 1` (resetting `window_start` when the window rolls over). Returns `true` if the request is allowed.
**Why:** `api-gateway/index.ts` calls this per request to enforce per-org API limits; `_shared/ai.ts` calls it before AI calls to cap token spend.

### Function: `claim_next_scan(p_worker_id text) RETURNS TABLE(...)`
**SECURITY DEFINER.** `UPDATE scans SET status='running', worker_id=p_worker_id, started_at=now() WHERE id = (SELECT id FROM scans WHERE status='queued' ORDER BY created_at ASC LIMIT 1 FOR UPDATE SKIP LOCKED) RETURNING *`. The `FOR UPDATE SKIP LOCKED` makes it concurrency-safe for multiple workers.
**Why:** `scan-worker/index.ts` calls `supabase.rpc('claim_next_scan', { p_worker_id: WORKER_ID })` in its poll loop.

### Function: `match_policy_chunks(p_org_id uuid, p_query_embedding vector(1536), p_match_count integer DEFAULT 5) RETURNS TABLE(...)`
**SECURITY DEFINER.** Cosine-distance RAG: `1 - (embedding <=> query)` as `similarity`, ordered ascending by distance, filtered to the org.
**Why:** `policy-ingest/index.ts` and the AI remediation flow retrieve the most relevant policy chunks to include in the LLM context.

### Function: `get_user_organizations(p_user_id uuid) RETURNS TABLE(organization_id uuid, name text, slug text, plan org_plan, role member_role, status member_status)`
**SECURITY DEFINER.** Joins `organization_members` + `organizations` for active memberships.
**Why:** CLI `api.js` `fetchUserOrgs` and the FE onboarding flow use this to populate the org switcher.

### Function: `get_org_member_role(p_org_id uuid, p_user_id uuid) RETURNS member_role`
**SECURITY DEFINER.** Returns the active role for a user in an org (or NULL).
**Why:** Edge functions (`api-v1-api-keys`, `api-v1-members`) call this to enforce admin-only mutations.

---

## Migration 006 — `006_rls_policies.sql`

### Helper function: `user_org_ids() RETURNS uuid[]`
**SECURITY DEFINER, `SET search_path = public`.** Returns `ARRAY(SELECT organization_id FROM organization_members WHERE user_id = auth.uid() AND status = 'active')`.
**Why:** The non-recursive tenant filter. Every org-scoped policy uses `organization_id = ANY(user_org_ids())` instead of a sub-select, so Postgres can cache the array once per statement. This avoids the recursion problems that arise when a policy on `organization_members` itself needs to query `organization_members`.

### Helper function: `is_org_member(p_org_id uuid) RETURNS boolean`
**SECURITY DEFINER.** `EXISTS(SELECT 1 FROM organization_members WHERE organization_id = p_org_id AND user_id = auth.uid() AND status = 'active')`.
**Why:** Used by edge functions and ad-hoc checks for single-org authorization.

### Policies (81 total)

The pattern across all org-scoped tables is identical:

| Operation | Pattern |
|-----------|---------|
| SELECT | `USING (organization_id = ANY(user_org_ids()))` |
| INSERT | `WITH CHECK (organization_id = ANY(user_org_ids()))` |
| UPDATE | `USING (…) WITH CHECK (…)` |
| DELETE | `USING (…)` |

**Tables with full CRUD policies (select/insert/update/delete):** organizations (select/insert/update only — no delete policy, so deletes are denied), user_profiles (select/insert/update — self-scoped by `auth.uid()`), organization_members, api_keys, repositories, scans, findings, policies, policy_chunks, compliance_rules, integrations, integration_events, notifications, ai_cache, organization_suppression_rules, organization_integrations.

**Tables with SELECT + INSERT only (audit append-only):** audit_logs, ai_usage, project_risk_history, api_key_usage.

**Tables with SELECT + INSERT + DELETE (no update — immutable-on-create):** graph_nodes, scan_artifacts.

**Tables with permissive policies (`USING (true)`):** worker_heartbeats (select/insert/update) — any authenticated user can see and report worker status.

**Special-case policies:**
- `organizations` INSERT: `WITH CHECK (true)` — any authenticated user can create an org (they become owner via a separate `organization_members` insert). FE#2 `Onboarding.tsx` relies on this.
- `organization_members` INSERT: `WITH CHECK (true)` — allows the join-by-invite flow (FE#2 `Onboarding.handleJoinOrg`) where the user isn't yet a member when they insert their pending membership.
- `notifications` SELECT/UPDATE: additionally scoped to `user_id = auth.uid() OR user_id IS NULL` so users see their personal notifications plus org-wide broadcasts.
- `user_profiles`: all three operations scoped to `id = auth.uid()` — a user can only touch their own profile.

**Why non-recursive?** If `user_org_ids()` were inlined as a sub-select against `organization_members`, and `organization_members` had a SELECT policy that itself called `user_org_ids()`, Postgres would hit recursive policy evaluation. By lifting the array into a `SECURITY DEFINER` function (which runs with the owner's privileges and bypasses RLS), the policies on `organization_members` can safely reference `user_org_ids()` without recursion.

---

## Migration 007 — `007_triggers_and_storage.sql`

### Function: `handle_new_user() RETURNS trigger`
**SECURITY DEFINER, `SET search_path = public`.** On `AFTER INSERT ON auth.users`, inserts a `user_profiles` row with `id = NEW.id`, `email = NEW.email`, `first_name`/`last_name` from `raw_user_meta_data`. `ON CONFLICT (id) DO NOTHING` makes it idempotent.
**Why:** Before this trigger existed, FE#1 `useAuth.signUp` had to manually `upsert` the profile row after `signUp` — but `getUser()` immediately after `signUp` can return null (email confirmation pending), causing the upsert to fail (Bug #3). The trigger guarantees the profile row exists regardless of which client created the user.

### Trigger: `on_auth_user_created`
`AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION handle_new_user()`.
**Why:** Fires on every signup path — FE#1 `signUp`, FE#2 `AuthContext.signUp`, CLI `api.js signupUser`.

### Storage bucket: `scan-artifacts`
`INSERT INTO storage.buckets (id, name, public) VALUES ('scan-artifacts', 'scan-artifacts', false)`.
Private bucket (not publicly readable) for SARIF/SBOM/report files.
**Why:** `scan-worker/index.ts` uploads generated artifacts; FE#1 `Reports.tsx` & `SBOMGeneration.tsx` generate download URLs.

### Storage policies (4)
- `select_scan_artifacts_storage` — SELECT on `storage.objects` where `bucket_id = 'scan-artifacts'`.
- `insert_scan_artifacts_storage` — INSERT with `WITH CHECK (bucket_id = 'scan-artifacts')`.
- `update_scan_artifacts_storage` — UPDATE.
- `delete_scan_artifacts_storage` — DELETE.

**Note:** These policies are bucket-scoped but **not org-scoped** — any authenticated user can read/write any artifact in the bucket. This is a documented limitation (Bug #13 category): artifact-level access control should be enforced at the application layer by checking `scan_artifacts.organization_id` before generating a signed URL.

---

## Cross-cutting design notes

1. **Tenant isolation is enforced at two layers:** the `organization_id` FK on every row, and the RLS policy that filters by `user_org_ids()`. The daemon and edge functions use the service-role key (bypassing RLS), so they must manually filter by `organization_id` — several bugs in the report stem from missing org filters in those paths.

2. **Soft deletes** are used for `repositories` and `policies` (`deleted_at` column + partial unique index `WHERE deleted_at IS NULL`). Hard deletes cascade from `organizations` down through every tenant table.

3. **The `clause_reference` column on `findings`** exists in the schema but the daemon moves it into `metadata` before insert to satisfy the PostgREST schema validator. This is a workaround documented in Bug #11.

4. **The `vector` extension** is created in 005 (not 001) because `policy_chunks` must exist first before `ALTER TABLE … ADD COLUMN embedding` can run. Migration ordering matters: 001 → 002 → 003 → 004 → 005 → 006 → 007.

5. **`SECURITY DEFINER` functions** (`user_org_ids`, `is_org_member`, `check_rate_limit`, `claim_next_scan`, `match_policy_chunks`, `get_user_organizations`, `get_org_member_role`, `handle_new_user`) all run with the table owner's privileges, bypassing RLS. This is intentional — they are the trusted boundary between unauthenticated-ish client calls and tenant data. Each one re-scopes by `auth.uid()` or an explicit `p_org_id` parameter so they cannot be used to exfiltrate cross-tenant data.
