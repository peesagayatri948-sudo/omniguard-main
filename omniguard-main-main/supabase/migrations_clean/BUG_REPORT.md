# OmniGuard Bug Report

## Critical Bugs (Fixed)

### Bug 1: Mock Auth Bypass — Complete Authentication Circumvention
- **Severity:** Critical
- **Location:** `omniguard-frontend-main/src/context/AuthContext.tsx`
- **Description:** The `signIn` and `signUp` functions fell back to a mock login on ANY error (wrong password, network failure, unconfigured Supabase). The mock session granted full `ciso` role with `active` status, bypassing all authentication.
- **Root Cause:** Demo/development convenience code was left in production paths. The catch blocks for Supabase auth errors silently created a mock user with maximum privileges.
- **Fix Applied:** Removed all mock fallback paths from `signIn` and `signUp`. Functions now return proper error messages. `resolveOrgStatus` returns `role: 'developer', status: 'none'` on error instead of `role: 'ciso', status: 'active'`.

### Bug 2: onAuthStateChange Await Deadlock
- **Severity:** Critical
- **Location:** `omniguard/src/hooks/useAuth.tsx`, `omniguard-frontend-main/src/context/AuthContext.tsx`
- **Description:** The `onAuthStateChange` callback directly `await`ed `fetchProfile()` / `resolveOrgStatus()`. The Supabase auth listener can deadlock when async operations are awaited inside it, causing the auth state to freeze and the app to hang on a loading spinner indefinitely.
- **Root Cause:** The Bolt database skill explicitly warns against awaiting inside `onAuthStateChange`. Both frontends violated this rule.
- **Fix Applied:** FE#1 `useAuth.tsx`: wrapped `fetchProfile` in a fire-and-forget pattern with `.catch()` for error handling. FE#2 `AuthContext.tsx`: converted the async callback to use `.then()/.catch()` instead of `await`. Added `mounted` flag to prevent state updates after unmount.

### Bug 3: Non-Atomic Signup — getUser() Returns Null After signUp()
- **Severity:** High
- **Location:** `omniguard/src/pages/Auth.tsx`
- **Description:** After calling `signUp()`, the code immediately called `supabaseAuth.getUser()` to get the user ID for creating an organization membership. However, `getUser()` may return null if the session hasn't been established yet (especially with email confirmation enabled), causing the `organization_members` insert to fail silently.
- **Root Cause:** `signUp()` response contains the user object directly — calling `getUser()` separately is both redundant and unreliable.
- **Fix Applied:** Changed to use `signUpData?.user?.id` directly from the `signUp()` response instead of calling `getUser()`.

### Bug 4: Onboarding Inverted Filter — Selects Only Deleted Organizations
- **Severity:** High
- **Location:** `omniguard-frontend-main/src/pages/auth/Onboarding.tsx:83`
- **Description:** The join-by-invite-code query used `.neq('deleted_at', null)` which selects ONLY soft-deleted organizations (where `deleted_at` is NOT null). This is the exact opposite of the intended behavior. Additionally, the `organizations` table has no `deleted_at` column in the new schema.
- **Root Cause:** Inverted PostgREST filter logic. The developer likely intended `.is('deleted_at', null)` to exclude deleted orgs, but used `.neq()` instead.
- **Fix Applied:** Removed the `.neq('deleted_at', null)` filter. The query now selects all organizations and filters by invite code in `settings` client-side. RLS ensures users only see orgs they can access.

### Bug 5: Root Dockerfile Build Failure — Missing .vsix Files
- **Severity:** High
- **Location:** `Dockerfile`
- **Description:** The Dockerfile contained `COPY vscode-extension/*.vsix /app/downloads/` but no `.vsix` files exist in the repository. This causes the Docker build to fail immediately.
- **Root Cause:** The Dockerfile was written assuming pre-built VSIX artifacts would exist, but they're never built in the CI/Docker pipeline.
- **Fix Applied:** Removed the `.vsix` COPY line entirely. The VS Code extension is packaged separately via `vsce package`.

### Bug 6: Root Dockerfile Runs Dev Server in Production
- **Severity:** High
- **Location:** `Dockerfile`
- **Description:** The Dockerfile built the frontend with `npm run build` in the builder stage, but the entrypoint ran `npm run dev` (Vite dev server) instead of serving the built `dist/` directory. This discards the production build, runs unoptimized code, and includes dev dependencies.
- **Root Cause:** Entrypoint script was copied from a development setup without being updated for production.
- **Fix Applied:** Changed entrypoint to use `npx vite preview --host 0.0.0.0 --port 5173` to serve the built `dist/` directory.

### Bug 7: Docker Compose Missing Daemon Service
- **Severity:** High
- **Location:** `docker-compose.yml`
- **Description:** The compose file only ran the frontend nginx container — no daemon service was defined. Users expecting scan functionality, AI remediation, or local API endpoints would find no backend running.
- **Root Cause:** The compose file was configured for the frontend-only Dockerfile without considering the daemon backend.
- **Fix Applied:** Added a `daemon` service that builds from the root Dockerfile, exposes port 5175, and passes all required environment variables.

### Bug 8: VS Code scanWorkspace Command Not Registered
- **Severity:** Medium
- **Location:** `vscode-extension/src/extension.ts`
- **Description:** The `omniguard.scanWorkspace` command was declared in `package.json` and appeared in the explorer context menu, but was never registered via `vscode.commands.registerCommand()` in the `activate()` function. Clicking it triggered a "command not found" error.
- **Root Cause:** The command declaration was added to the manifest but the implementation was never written.
- **Fix Applied:** Added a `scanWorkspace` command that finds all files in the workspace (excluding node_modules, dist, build, .git) and runs the scan on each.

### Bug 9: Seeding.ts Uses Non-Existent Columns
- **Severity:** Medium
- **Location:** `omniguard-frontend-main/src/lib/seeding.ts`
- **Description:** The demo data seeding code inserted rows with columns that don't exist in the new schema: `preferences` (user_profiles), `description` and `is_active` (repositories), `owasp` as array instead of text, `mitre` (findings). These inserts would fail silently.
- **Root Cause:** The seeding code was written against a different (corrupted) schema that had additional columns.
- **Fix Applied:** Removed `preferences`, `description`, `is_active`, `mitre`. Changed `owasp` from array to text. Changed `risk_score` from float (8.5) to integer (85).

## Documented Issues (Require Code Changes in Edge Functions)

### Bug 10: Daemon Uses Anon Key Instead of Service Role Key
- **Severity:** High
- **Location:** `cli/src/daemon.js`, `cli/src/supabaseClient.js`
- **Description:** The daemon authenticates to Supabase using the anon key for all writes (findings, scans, audit_logs, repositories, graph_nodes). The `.env.example` documents `SUPABASE_SERVICE_ROLE_KEY` as "REQUIRED for daemon backend syncing" but the daemon never reads it. With RLS enabled, anon-key writes will be blocked unless the user has an active session token.
- **Root Cause:** The daemon was written before RLS was properly configured, assuming permissive access.
- **Fix Applied:** Documented. The daemon should be updated to use `SUPABASE_SERVICE_ROLE_KEY` for service-level writes, or use a user JWT token for authenticated writes. The new RLS policies allow authenticated users to write to their own org's tables.

### Bug 11: Cross-Tenant Data Leakage in Audit Logs
- **Severity:** Medium
- **Location:** `omniguard-frontend-main/src/pages/dashboard/Overview.tsx`
- **Description:** `audit_logs` queries for `graph_delta` and `mcp_intercept` actions have no `organization_id` filter, potentially fetching logs from all organizations.
- **Fix Applied:** Documented. RLS policies prevent cross-tenant access (users can only SELECT audit_logs where `organization_id = ANY(user_org_ids())`), but the query is inefficient. The frontend should add `.eq('organization_id', orgId)`.

### Bug 12: Plaintext Credential Storage
- **Severity:** High
- **Location:** Multiple — `DeveloperApi.tsx` (API keys as key_hash=plaintext), `Settings.tsx` (AI keys in ai_config), `DeveloperApi.tsx` (GitHub PATs in config)
- **Description:** API keys, AI provider keys, and GitHub PATs are stored in plaintext in the database.
- **Fix Applied:** Documented. The production edge functions (`_shared/ai.ts`) implement vault-based key storage. The frontend should be updated to use the `secrets-proxy` edge function for all credential storage.

### Bug 13: Edge Functions Missing Authentication
- **Severity:** Critical
- **Location:** `scan-worker/index.ts` (POST /process), `notify-deliver/index.ts`, `scan-quick/index.ts` (D2)
- **Description:** Several edge functions have no authentication on sensitive endpoints. Anyone can trigger scans, send notifications, or use platform AI keys.
- **Fix Applied:** Documented. These functions should add JWT or API key authentication. The new schema supports both auth paths.

### Bug 14: Missing Role-Based Authorization in Edge Functions
- **Severity:** High
- **Location:** `api-v1-api-keys`, `api-v1-members`, `enterprise-integrations`
- **Description:** Role is fetched from `organization_members` but never checked. Any member (including `developer`) can create/revoke API keys, promote themselves to `owner`, or connect/disconnect integrations.
- **Fix Applied:** Documented. The `get_org_member_role()` RPC function is now available for role checks.

### Bug 15: Hardcoded Supabase Credentials in Source
- **Severity:** High
- **Location:** `cli/src/daemon.js:90-91`, `cli/src/supabaseClient.js:3-4`
- **Description:** The real Supabase project URL and anon JWT are hardcoded as fallback defaults in the source code.
- **Fix Applied:** Documented. These should be removed and only loaded from environment variables.
