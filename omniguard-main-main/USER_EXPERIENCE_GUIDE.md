# OmniGuard — Complete User Experience & Setup Guide

This document describes how the dashboard, CLI, and VS Code extension work together, how auth/API keys/orgs sync across them, and how to pull everything onto your machine and demo it.

---

## 1. The Three Surfaces and How They Connect

```
┌─────────────────────────────────────────────────────────┐
│                    SUPABASE (backend)                     │
│  auth.users · organizations · organization_members       │
│  repositories · scans · findings · api_keys              │
│  ai_config · integrations · audit_logs · etc.            │
│  Edge Functions: api-v1-findings, scan-worker, etc.      │
└───────────┬──────────────┬──────────────┬───────────────┘
            │              │              │
     JWT token      og_live_ API key   shells out to CLI
            │              │              │
   ┌────────▼─────┐  ┌─────▼──────┐  ┌───▼──────────────┐
   │  Dashboard   │  │    CLI     │  │  VS Code Ext     │
   │ (browser)    │  │ (terminal) │  │  (editor)        │
   │              │  │            │  │                  │
   │ signup       │  │ omniguard  │  │ scan-on-save     │
   │ login        │  │   login    │  │ diagnostics      │
   │ manage keys  │  │ omniguard  │  │ hover info       │
   │ manage AI    │  │   scan     │  │ tree view        │
   │ trigger scan │  │ omniguard  │  │                  │
   │ view findings│  │   watch    │  │ (uses CLI binary │
   │ suppress FP  │  │ omniguard  │  │  under the hood) │
   │              │  │   explain  │  │                  │
   └──────────────┘  └────────────┘  └──────────────────┘
```

**The key insight**: the dashboard and CLI both talk to Supabase directly. The VS Code extension does NOT talk to Supabase — it shells out to the CLI binary, which handles all backend communication.

---

## 2. Authentication Flow — How Login Works on Each Surface

### Dashboard (browser)

The dashboard uses **Supabase Auth** (email/password, magic link, or OAuth). The JWT session token is stored in the browser.

**Signup flow** (`Auth.tsx`):
1. User enters email, password, first name, last name
2. `supabaseAuth.signUp()` creates the auth user
3. The database trigger `handle_new_user()` auto-creates a `user_profiles` row
4. The code inserts an `organizations` row (slug = email prefix + timestamp)
5. The code inserts an `organization_members` row (role: 'owner', status: 'active')
6. Calls `signIn()` to establish the session
7. `onAuthStateChange` fires → `fetchProfile()` loads profile + memberships
8. `loading` becomes `false` → redirect to `/app`

**Login flow**:
1. `supabaseAuth.signInWithPassword()` → gets JWT session
2. `onAuthStateChange` fires → `fetchProfile(userId)` runs
3. `fetchProfile` queries `user_profiles` + `organization_members` in parallel
4. Sets `currentOrganizationId` from the first membership
5. `loading = false` → dashboard renders

**Critical safety**: the `onAuthStateChange` callback uses fire-and-forget `.then()/.catch()` (not `await`) to prevent the deadlock that previously caused infinite loading screens. A `mounted` flag prevents state updates after unmount.

### CLI (terminal)

The CLI has its own login flow that bridges Supabase Auth to a local API key.

**`omniguard login` flow** (`cli/src/index.js:266`):
1. Prompts for email + password (or accepts `--email`/`--password` flags)
2. Calls Supabase Auth REST API: `POST /auth/v1/token?grant_type=password`
3. Gets back a JWT `access_token` and `user.id`
4. Fetches user's orgs: `GET /rest/v1/organization_members?select=organization_id,role,organizations(name,slug)&user_id=eq.{userId}`
5. If no org exists, creates one: `POST /rest/v1/organizations` + `POST /rest/v1/organization_members`
6. Generates a CLI API key: creates `og_live_` + 24 random hex bytes, SHA-256 hashes it, stores the hash in `api_keys` table (prefix visible, full key returned once)
7. Saves profile to `~/.omniguard/config.json` with the API key encrypted (AES-256-CBC using machine ID as key)
8. Verifies connection by calling `api-v1-status` edge function

**API key mode**: `omniguard login --api-key og_live_xxxx` skips all Supabase Auth and just stores the key directly. This is how you'd use the CLI in CI/CD.

**Config file** (`~/.omniguard/config.json`):
```json
{
  "activeProfile": "default",
  "profiles": {
    "default": {
      "backendUrl": "https://yourproject.supabase.co",
      "apiKey": "encrypted:iv:hex...",
      "orgId": "uuid-here",
      "supabaseAnonKey": "eyJ..."
    }
  }
}
```

### VS Code Extension

The extension does **not** authenticate directly. It shells out to the CLI:
- `omniguard scan --json <file>` — runs a scan
- `omniguard explain <id>` — opens a terminal for AI explanation
- `omniguard login` — prompts user to configure via terminal

The extension finds the CLI by checking: `omniguard.cliPath` setting → `omniguard` on PATH → `cli/src/index.js` in workspace → `npx @omniguard/cli`.

---

## 3. API Key Sync — How Keys Created in the Dashboard Reach the CLI

### Creating an API key in the dashboard

1. Go to **Settings → API Keys** tab
2. Enter a name (e.g., "GitHub Actions"), select scopes, optionally set expiry
3. Click **Generate**
4. The dashboard calls the `api-v1-api-keys` edge function with the JWT session token
5. The edge function creates a row in `api_keys` with:
   - `key_prefix`: first 12 chars (visible in dashboard table)
   - `key_hash`: SHA-256 hash (for verification)
   - `scopes`: JSON array like `["scans:read", "findings:write"]`
6. The **full plaintext key** (`og_live_xxxx...`) is shown once in a green box
7. The dashboard displays: `export OMNIGUARD_API_KEY="og_live_xxxx..."` as a copy hint

### Using the API key in the CLI

Two paths:

**Path A — Direct API key login**:
```bash
omniguard login --api-key og_live_xxxx...
```
This stores the key in `~/.omniguard/config.json` (encrypted) and uses it for all subsequent CLI commands. The CLI sends it as `Authorization: Bearer og_live_xxxx...` to edge functions.

**Path B — Interactive login** (generates its own key):
```bash
omniguard login
# enter email + password
# CLI generates a new "CLI Key" in the api_keys table automatically
```

### How edge functions verify the key

Every edge function has a `verifyAuth()` function that accepts either:

1. **JWT token** (has 2 dots like `xxx.yyy.zzz`): calls `supa.auth.getUser(token)` → looks up `organization_members` → returns `orgId` + `userId`
2. **API key** (starts with `og_`): SHA-256 hashes it → queries `api_keys` table by `key_hash` → checks `is_active` + `expires_at` → updates `last_used_at` → returns `orgId`

This dual-auth means the dashboard (JWT) and CLI (API key) can both access the same data, scoped to the same organization.

---

## 4. AI Key Sync — How AI Provider Keys Flow from Dashboard to Edge Functions

### Storing AI keys in the dashboard

1. Go to **Settings → AI Provider** tab
2. Select a primary provider (Anthropic, OpenAI, Bedrock, Azure, Gemini, OpenRouter, Ollama)
3. Enter the API key for that provider
4. Optionally select a fallback provider, set max tokens, disable deep tier
5. Click **Save AI Configuration**

The dashboard calls the `secrets-proxy/ai-config` edge function with the JWT. The edge function:
- Stores non-secret config (provider, fallback, limits) in `organizations.ai_config` JSONB
- Stores secret keys (API keys) in Supabase Vault, recording the vault ID in `organizations.ai_keys_vault_id`
- Returns a `keys_configured` map showing which keys are set (without revealing values)

### How edge functions retrieve AI keys

When the `scan-worker` or `api-v1-findings` edge function needs AI:
1. Calls `resolveAIConfigFromOrg(orgId)` from `_shared/ai.ts`
2. Reads `organizations.ai_config` for provider/model settings
3. If `ai_keys_vault_id` is set, calls `vault_read_secret` RPC to get the actual API key
4. Falls back to base64-encoded `_keys_encoded` in `ai_config` if vault is not configured
5. Falls back to environment variables (`ANTHROPIC_API_KEY`, etc.) as last resort

### Without AI keys

If no AI provider is configured (`provider: "none"`):
- Scans still run with all 7 regex-based scanners (secrets, SAST, IaC, dependencies, containers, policies, compliance)
- Findings are still generated and stored
- AI remediation, AI triage, and AI executive summary are skipped
- The `ai_remediation` field on findings will be null
- The edge function returns `{ ai_remediation: null, remediation: finding.remediation }` (regex-based remediation only)

---

## 5. Organization Sync — How Orgs Work Across Surfaces

### Creation
- **Dashboard signup**: auto-creates org + membership in the signup flow
- **CLI login**: if user has no org, creates "Default Org" + adds user as owner
- **Dashboard Organizations page**: can create additional orgs (with invite codes)

### Resolution
- **Dashboard**: `fetchProfile()` loads all `organization_members` rows for the user, picks the first one as `currentOrganizationId`. The Organizations page lets you switch.
- **CLI**: `fetchUserOrgs()` queries `organization_members` joined with `organizations`, picks the first org. Stored in config as `orgId`.
- **Edge functions**: `verifyAuth()` resolves the org from either the JWT (via `organization_members` lookup) or the API key (via `api_keys.organization_id`).

### Data isolation
Every query in every edge function includes `.eq("organization_id", orgId)`. RLS policies also enforce this at the database level — users can only see/modify data for orgs where they have an active membership.

---

## 6. How to Pull Onto Your Computer and Run

### Prerequisites
- Node.js 18+ (20+ recommended)
- npm
- Git
- VS Code (for the extension)

### Step 1: Clone the repo

```bash
git clone <your-repo-url> omniguard
cd omniguard
```

### Step 2: Configure environment

```bash
cp .env.example .env
# Edit .env and fill in:
#   VITE_SUPABASE_URL=https://yourproject.supabase.co
#   VITE_SUPABASE_ANON_KEY=eyJ...
#   SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

The Supabase project is already provisioned. The database schema has already been applied (24 tables, RLS, triggers, RPCs). You just need the URL and keys from Supabase Dashboard → Settings → API.

### Step 3: Run the dashboard

```bash
cd omniguard
npm install
npm run dev
```

Open http://localhost:5173 in your browser. You should see the marketing site. Click "Sign in" or "Create account".

### Step 4: Install the CLI

```bash
cd cli
npm install
npm link    # makes 'omniguard' available globally
```

Verify:
```bash
omniguard version
```

### Step 5: Login from the CLI

```bash
omniguard login
# Enter the same email/password you used for dashboard signup
# CLI will authenticate, find your org, and generate an API key
```

Or use a dashboard-generated API key:
```bash
omniguard login --api-key og_live_xxxx...
```

### Step 6: Run a scan

```bash
omniguard scan ./my-project
# Outputs findings to terminal

omniguard scan --json ./my-project
# Outputs JSON with findings array

omniguard scan --json ./my-project > results.json
# Save results to file
```

### Step 7: Install the VS Code extension

```bash
cd vscode-extension
npm install
npm run compile
# Press F5 in VS Code to launch Extension Development Host
```

Or package and install:
```bash
npx vsce package --no-yarn
# Install the .vsix: VS Code → Extensions → ... → Install from VSIX
```

Configure in VS Code Settings:
- `omniguard.enableOnSave`: true (scan on every save)
- `omniguard.failOnSeverity`: "high" (severity threshold for error diagnostics)

### Step 8 (optional): Run the daemon

```bash
cd cli
node src/daemon.js
# Runs on http://localhost:5175
# Endpoints: /healthz, /readyz, /api/manual-scan, /orchestrator/vulnerabilities
```

### Step 9 (optional): Docker

```bash
# Build and run both dashboard + daemon
docker-compose up -d
# Dashboard: http://localhost:3000
# Daemon: http://localhost:5175
```

---

## 7. How to Demo This

### Demo A: Without any AI API key (regex-only scanning)

This shows the core security scanning without needing any AI provider setup.

1. **Sign up** on the dashboard (http://localhost:5173 → Create account)
2. **Dashboard loads** showing empty state (no repos, no scans, no findings)
3. **Add a repository** — go to Repositories, click Add, enter a local path or GitHub URL
4. **From the CLI**, scan a project:
   ```bash
   omniguard scan ./test-project
   ```
   Output shows findings like:
   ```
   🔴 CRITICAL: Hardcoded AWS Access Key (secret-scanner)
       file: config.js:12
       evidence: AKIA...
   🟠 HIGH: SQL Injection via string concatenation (sast-scanner)
       file: db.js:45
       evidence: db.query("SELECT * FROM users WHERE id=" + req.body.id)
   ```
5. **Findings appear in the dashboard** — go to Findings page, see the list with severity, file, line number
6. **Open VS Code** with the project — save a file → diagnostics appear inline
7. **Suppress a false positive** — in the dashboard, click "Suppress" on a finding, enter a reason
8. **View audit logs** — go to Audit Logs page, see all actions logged

What works without AI: secret detection, SAST, IaC misconfiguration, dependency vulnerabilities, container scanning, policy evaluation. What doesn't: AI remediation suggestions, AI false-positive triage, AI executive summaries.

### Demo B: With an Anthropic API key (full AI features)

1. **Sign up + login** (same as Demo A)
2. **Configure AI** — go to Settings → AI Provider tab:
   - Select "Anthropic (Claude)" as primary provider
   - Paste your `sk-ant-api03-...` key
   - Click Save
3. **Run a scan** from CLI or dashboard:
   ```bash
   omniguard scan ./test-project
   ```
4. **AI triage runs automatically** during the scan (via edge functions):
   - Layer 1 (Haiku): classifies each finding as true-positive vs false-positive
   - Layer 2 (Sonnet): generates specific code fixes for top 12 critical/high findings
   - Layer 3 (Opus): generates a CISO executive summary (optional, can be disabled)
5. **View AI remediation** in the dashboard:
   - Go to Findings → click a finding
   - See "AI Remediation" section with specific code fix, explanation, and verification steps
6. **Request on-demand AI explanation**:
   ```bash
   omniguard explain <finding-id>
   ```
   Or in VS Code: hover over a finding → click "Explain" → opens terminal with AI response
7. **View AI usage metrics** — the `ai_usage` table tracks tokens, cost, and latency per scan

### Demo C: VS Code extension workflow

1. Install the extension (Step 7 above)
2. Open any project in VS Code
3. **Save a file** with a security issue (e.g., add `password = "admin123"` to a file)
4. **Diagnostics appear** immediately in the Problems panel
5. **Hover** over the diagnostic → shows severity, rule, evidence
6. **Click "Explain"** in the hover → opens terminal with `omniguard explain <id>`
7. **Tree view** in the sidebar shows all findings sorted by severity
8. **Run "Scan Workspace"** from the explorer context menu → scans all files

### Demo D: CI/CD integration (API key only, no dashboard login)

1. Generate an API key in the dashboard (Settings → API Keys)
2. In your CI pipeline:
   ```yaml
   - name: OmniGuard Security Scan
     env:
       OMNIGUARD_API_KEY: ${{ secrets.OMNIGUARD_API_KEY }}
       OMNIGUARD_URL: https://yourproject.supabase.co
     run: |
       npm install -g @omniguard/cli
       omniguard scan ./src --fail-on high --json > omniguard-report.json
   ```
3. Findings are pushed to the dashboard automatically
4. The scan exits with code 1 if any finding meets the `--fail-on` threshold

---

## 8. What Happens at Each Step — Detailed Trace

### When you click "Create account" on the dashboard

```
Browser                    Supabase Auth              Database
  │                            │                        │
  ├─ signUp(email, pw) ──────►│                        │
  │                            ├─ create user ────────►│ auth.users INSERT
  │                            │                        ├─ TRIGGER fires:
  │                            │                        │   handle_new_user()
  │                            │                        │   → user_profiles INSERT
  │                            │◄─ return user ─────────┤
  │◄─ return session ─────────┤                        │
  │                            │                        │
  ├─ INSERT organizations ───────────────────────────►│ organizations INSERT
  │   (name, slug, plan)       │                        │
  ├─ INSERT organization_members ─────────────────────►│ organization_members INSERT
  │   (org_id, user_id, owner, active)                  │
  ├─ signIn(email, pw) ──────►│                        │
  │◄─ return JWT ─────────────┤                        │
  │                            │                        │
  ├─ onAuthStateChange fires  │                        │
  ├─ fetchProfile(userId) ───────────────────────────►│ user_profiles SELECT
  │                            │                        │ organization_members SELECT
  │◄─ profile + memberships ──────────────────────────┤
  ├─ set currentOrganizationId                         │
  ├─ loading = false                                  │
  └─ navigate('/app') → Dashboard renders              │
```

### When you run `omniguard scan ./project`

```
CLI                        Edge Functions              Database
  │                            │                        │
  ├─ read ~/.omniguard/config.json                     │
  │   (get apiKey, orgId, backendUrl)                  │
  │                            │                        │
  ├─ run 7 scanners locally:  │                        │
  │   secrets, sast, iac,     │                        │
  │   deps, container,        │                        │
  │   policy, compliance      │                        │
  │                            │                        │
  ├─ collect findings[]        │                        │
  │                            │                        │
  ├─ POST /api-v1-scans ─────►│                        │
  │   (Bearer og_live_...)     ├─ verifyAuth(key)      │
  │                            │   SHA-256 hash → ────►│ api_keys SELECT
  │                            │   get orgId ◄────────┤
  │                            ├─ INSERT scan ────────►│ scans INSERT
  │◄─ return scan_id ─────────┤                        │
  │                            │                        │
  ├─ POST findings (batch) ──►│                        │
  │   (Bearer og_live_...)     ├─ verifyAuth(key)      │
  │                            ├─ INSERT findings ────►│ findings INSERT (N rows)
  │◄─ return success ─────────┤                        │
  │                            │                        │
  ├─ print findings to terminal│                        │
  └─ exit 0 or 1 (based on --fail-on)                  │
```

### When you save a file in VS Code

```
VS Code                    CLI binary                  Edge Functions
  │                            │                        │
  ├─ onDidSaveTextDocument     │                        │
  ├─ spawnSync('omniguard',    │                        │
  │   ['scan', '--json',       │                        │
  │    filePath]) ────────────►│                        │
  │                            ├─ run scanners locally  │
  │                            ├─ (may POST to edge ──►│ if logged in
  │                            │   functions for AI)    │
  │◄─ stdout: {findings:[...]} ┤                        │
  ├─ parse JSON                │                        │
  ├─ create Diagnostics        │                        │
  │   (severity, range, msg)   │                        │
  ├─ update TreeView           │                        │
  ├─ update StatusBar          │                        │
  │   "OmniGuard (2 Critical)" │                        │
  └─ done                      │                        │
```

Note: the VS Code extension uses `spawnSync` (synchronous), so the editor blocks until the scan completes. For large files this can cause a brief UI freeze.

---

## 9. Key Files to Know

| Purpose | File |
|---------|------|
| Dashboard auth | `omniguard/src/hooks/useAuth.tsx` |
| Dashboard signup | `omniguard/src/pages/Auth.tsx` |
| Dashboard settings/keys | `omniguard/src/pages/Settings.tsx` |
| FE#2 auth (marketing) | `omniguard-frontend-main/src/context/AuthContext.tsx` |
| CLI auth + API | `cli/src/api.js` |
| CLI login command | `cli/src/index.js` (cmdLogin, line 266) |
| CLI scan command | `cli/src/index.js` (cmdScan) |
| CLI daemon | `cli/src/daemon.js` |
| VS Code extension | `vscode-extension/src/extension.ts` |
| Edge function auth | `supabase/functions/api-v1-findings/index.ts` (verifyAuth) |
| AI provider routing | `supabase/functions/_shared/ai.ts` |
| Database schema | `supabase/migrations_clean/001-007_*.sql` |
