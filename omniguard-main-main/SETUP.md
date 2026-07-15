# OmniGuard Enterprise v2.2.5 — Complete Setup Guide

From `git clone` to working dashboard, CLI, VS Code extension, Docker, and AWS pro scanning.

---

## Prerequisites

| Requirement | Version | Notes |
|---|---|---|
| Node.js | >= 20 | https://nodejs.org |
| npm | >= 9 | bundled with Node |
| Git | any | for hooks + repo scanning |
| VS Code | >= 1.80 | for extension feature |
| Docker | >= 24 | for Docker deployment (optional) |
| AWS CLI | >= 2 | for AWS pro scanning (optional) |

---

## 1. Clone & Understand the Structure

```bash
git clone <your-repo-url> omniguard
cd omniguard
```

```
omniguard/
├── .env.example              ← master env template (copy this to .env)
├── Dockerfile.v225           ← multi-stage Docker build (dashboard + CLI + daemon)
├── aws-pro-scan-ecs.yaml     ← CloudFormation for AWS ECS pro scanning
├── publish-all-v225.sh       ← publishes CLI + extension + Docker images
├── publish-all-v225.ps1      ← same, for Windows
├── omniguard/                ← React dashboard (Vite + TS + Tailwind)
├── cli/                      ← CLI npm package (omniguard-enterprise-cli)
├── vscode-extension/         ← VS Code extension
├── supabase/
│   ├── functions/            ← Deno edge functions
│   └── migrations_clean/     ← 9 clean migrations (001-009)
└── omniguard-main/           ← scanner engine + docs
```

---

## 2. Environment Setup (REQUIRED FIRST)

### 2a. Copy the template

```bash
cp .env.example .env
```

### 2b. Fill in the required values

Open `.env` and set these **5 required** variables (everything else is optional):

```env
# ── Required: Supabase credentials (from Supabase dashboard → Settings → API) ──
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=eyJ...your-anon-key...
SUPABASE_SERVICE_ROLE_KEY=eyJ...your-service-role-key...

# ── Required: Vite build-time copies (must mirror the above two) ──
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...your-anon-key...
```

### 2c. Optional but recommended

```env
# For npm publishing (section 10)
NPM_TOKEN=npm_xxxxx

# For AI remediation + semantic scanning (at least one)
AI_PROVIDER=anthropic
ANTHROPIC_API_KEY=sk-ant-xxxxx

# For AWS pro scanning
AWS_ACCESS_KEY_ID=AKIAxxxxx
AWS_SECRET_ACCESS_KEY=xxxxx
AWS_REGION=us-east-1

# For Okta SSO (auto-detected in production)
OKTA_DOMAIN=yourco.okta.com
OKTA_CLIENT_ID=0oaxxxxx
OKTA_CLIENT_SECRET=xxxxx
```

The `.env.example` file has every variable the CLI, dashboard, edge functions, and Docker images reference, grouped by category with comments.

---

## 3. Supabase Setup

### 3a. Create a project (if you don't have one)

1. Go to https://supabase.com/dashboard
2. Click **New Project** — choose name, password, region
3. Wait ~2 minutes for provisioning

### 3b. Get credentials

From **Project Settings → API**:
- `Project URL` → `SUPABASE_URL` + `VITE_SUPABASE_URL`
- `anon public` key → `SUPABASE_ANON_KEY` + `VITE_SUPABASE_ANON_KEY`
- `service_role` key → `SUPABASE_SERVICE_ROLE_KEY`

### 3c. Apply database migrations

The 9 clean migrations in `supabase/migrations_clean/` create 28 tables, 85+ RLS policies, 8 RPCs, triggers, and storage. They are applied via the Supabase MCP `apply_migration` tool (already done if your project was set up by the agent). To verify:

```sql
-- Run in Supabase SQL Editor to check
SELECT count(*) FROM pg_tables WHERE schemaname = 'public';
-- Should return 28+
```

If setting up fresh, apply each migration file in order (001 through 009) via the Supabase MCP tool or paste them into the SQL Editor.

### 3d. Edge functions

Edge functions are deployed via the Supabase MCP `deploy_edge_function` tool. Already-deployed functions:

| Function | Purpose |
|---|---|
| `secrets-proxy` | AI key vault storage (encrypted) |
| `scan-quick` | Fast file scan (no DB required) |
| `scan-worker` | Full async scan worker |
| `api-v1-findings` | Findings CRUD + AI remediation |
| `api-v1-scans` | Scan management |
| `api-v1-status` | Health check |
| `api-v1-api-keys` | API key generation + revocation |
| `api-v1-members` | Org member management |
| `policy-ingest` | Document to policy ingestion |
| `github-webhook` | GitHub push/PR webhook receiver |
| `enterprise-integrations` | Okta, Jira, Slack, Teams, ServiceNow |
| `notify-deliver` | Notification delivery |
| `okta-sso` | Okta SSO flow (initiate, callback, status) |
| `api-gateway` | Unified API gateway |

---

## 4. Dashboard — Local Development

```bash
cd omniguard/

# Install dependencies
npm install

# Start dev server (http://localhost:5173)
npm run dev
```

### Build for production

```bash
npm run build       # outputs to omniguard/dist/
npm run preview     # serves the production build locally
```

### What you get

- Sign up / sign in (email + password)
- Organization management (create, invite, switch)
- Dashboard with risk score, finding trends, scan history
- Repositories (connect GitHub repos)
- Scans (trigger, view results, real-time status)
- Findings (filter, suppress, AI remediation)
- Compliance (OWASP ASVS, PCI DSS, NIST, ISO 27001, CIS, SOC 2)
- Architecture Graph (force-directed canvas, per-user snapshots, diff view)
- Audit Clauses (deterministic compliance clause mapping, 7 frameworks)
- AI Center (provider routing, token usage charts, cache stats)
- Audit Logs (realtime, export, detail drawer)
- Reports (JSON, CSV, Markdown, SARIF, HTML export)
- Advanced Settings (Okta SSO, AWS pro scan, performance tuning)

---

## 5. CLI — Local Development

### 5a. Install from source

```bash
cd cli/

# Install CLI dependencies
npm install

# Link globally so `omniguard` command works everywhere
npm link

# Verify
omniguard version
# Should print: omniguard-enterprise-cli/2.2.5

omniguard doctor
# Runs full diagnostics
```

### 5b. Authenticate

```bash
# Interactive login (prompts for URL + API key)
omniguard login

# Or set env vars:
export OMNIGUARD_API_URL="https://your-project.supabase.co/functions/v1"
export OMNIGUARD_API_KEY="og_live_xxxxx"   # from dashboard → Settings → API Keys
```

### 5c. Scan commands

```bash
# Standard scan
omniguard scan .

# Pro scan (semantic + graph + audit clauses)
omniguard scan --pro

# AWS pro scan (ECR + Lambda + IAM)
omniguard scan --aws-scan

# Combined pro + AWS
omniguard scan --pro --aws-scan --semantic --audit

# Semantic-only scan (taint analysis)
omniguard semantic .

# Architecture graph (JSON/DOT/Mermaid output)
omniguard graph . --format json

# Audit clause report (7 compliance frameworks)
omniguard audit .

# Watch for changes
omniguard watch

# Install git hooks
omniguard install-hooks
```

### 5d. Offline mode

The CLI works without any Supabase connection — local secret scanner, semantic engine, graph engine, and audit clause mapper all run offline:

```bash
omniguard scan .          # works offline
omniguard semantic .      # works offline
omniguard graph .         # works offline
omniguard audit .         # works offline
```

---

## 6. VS Code Extension

### 6a. Build from source

```bash
cd vscode-extension/

# Install dependencies (after CLI is published to npm, or use npm link)
npm install

# Compile TypeScript
npm run compile

# Package as .vsix
npm run package
# Produces omniguard-2.2.5.vsix
```

### 6b. Install

```bash
# Command line
code --install-extension omniguard-2.2.5.vsix

# Or VS Code UI: Extensions panel → ... → Install from VSIX
```

### 6c. Configure

Open Command Palette (`Ctrl+Shift+P` / `Cmd+Shift+P`):
1. Run **OmniGuard: Configure**
2. Enter your Supabase Functions URL
3. Enter your API key

Or edit VS Code settings:

```json
{
  "omniguard.supabaseUrl": "https://your-project.supabase.co/functions/v1",
  "omniguard.apiKey": "og_live_xxxxx",
  "omniguard.enableOnSave": true,
  "omniguard.enableOnType": true,
  "omniguard.scanDelay": 500,
  "omniguard.semanticScan": true,
  "omniguard.cliPath": ""
}
```

The extension uses `omniguard-enterprise-cli` for scanning. It resolves the CLI binary from:
1. `omniguard.cliPath` setting (if set)
2. Local `node_modules/omniguard-enterprise-cli` (bundled dependency)
3. Global npm install (`npm install -g omniguard-enterprise-cli`)
4. `npx omniguard-enterprise-cli` (fallback)

### 6d. Features

| Feature | Description |
|---|---|
| On-save scanning | Auto-scan every file on save |
| On-type scanning | Debounced real-time scan while typing (500ms default) |
| Semantic scan | Taint analysis with source-to-sink data flow |
| Hover explanations | Taint flow, compliance clauses, AI remediation on hover |
| Findings panel | Activity bar tree view of all findings |
| Semantic panel | Tree view of semantic findings with clause details |
| Graph panel | Architecture graph nodes sorted by risk |
| Audit report | Webview HTML report with 7 compliance frameworks |
| Inline diagnostics | Red/yellow underlines on vulnerable lines |
| Quick fixes | Suppress rule or apply AI fix via lightbulb |

---

## 7. AI Provider Setup

AI keys are stored securely in Supabase Vault (encrypted at rest) via the `secrets-proxy` edge function.

### Via dashboard

1. Dashboard → **Settings → AI Configuration**
2. Select provider (Anthropic, OpenAI, Gemini, OpenRouter, Ollama)
3. Enter API key
4. Click **Save**

### Via .env (for CLI / edge functions)

```env
AI_PROVIDER=anthropic
ANTHROPIC_API_KEY=sk-ant-xxxxx
# or
OPENAI_API_KEY=sk-xxxxx
# or
GEMINI_API_KEY=xxxxx
```

| Provider | Env Var | Notes |
|---|---|---|
| Anthropic | `ANTHROPIC_API_KEY` | Claude 3.5 Haiku / Sonnet |
| OpenAI | `OPENAI_API_KEY` | GPT-4o / GPT-4o mini |
| Gemini | `GEMINI_API_KEY` | Gemini 1.5 Flash / Pro |
| OpenRouter | `OPENROUTER_API_KEY` | Multi-provider routing |
| Ollama | `OLLAMA_BASE_URL` | Self-hosted, no key needed |
| LiteLLM | `LITELLM_BASE_URL` | Proxy to multiple providers |

---

## 8. Okta SSO Setup

### Development

1. Set in `.env`:
```env
OKTA_DOMAIN=yourco.okta.com
OKTA_CLIENT_ID=0oaxxxxx
OKTA_CLIENT_SECRET=xxxxx
OKTA_ISSUER=https://yourco.okta.com/oauth2/default
OKTA_REDIRECT_URI=http://localhost:5173/auth/okta/callback
```

2. Configure in dashboard → **Advanced Settings → Okta SSO** (stores config in org table, secret in vault)

3. The `okta-sso` edge function handles:
   - `GET /okta-sso/initiate?org_id=xxx` — returns Okta authorize URL
   - `POST /okta-sso/callback` — exchanges code, provisions user, creates org membership
   - `GET /okta-sso/status` — checks if Okta is auto-detected from env vars

### Production

In production (`NODE_ENV=production`), Okta SSO is **always available** if `OKTA_DOMAIN` and `OKTA_CLIENT_ID` env vars are set on the server — no per-org configuration needed. The `/okta-sso/status` endpoint reports `auto_enabled: true`.

---

## 9. AWS Pro Scanning

### 9a. Configure AWS credentials

In `.env`:
```env
AWS_ACCESS_KEY_ID=AKIAxxxxx
AWS_SECRET_ACCESS_KEY=xxxxx
AWS_REGION=us-east-1
AWS_SCAN_ENABLED=true
```

Or via dashboard → **Advanced Settings → AWS Pro Scan**.

### 9b. Run AWS pro scan via CLI

```bash
# Scan local files + AWS resources
omniguard scan --pro --aws-scan

# AWS-only scan (no local files)
omniguard scan --aws-scan
```

This scans:
- **ECR** — all repositories, checks for missing resource policies
- **Lambda** — all functions, detects deprecated runtimes
- **IAM** — custom policies flagged for least-privilege review

Each finding includes mapped compliance clauses (CIS, OWASP ASVS, NIST 800-53).

### 9c. Run via Docker

```bash
# Build the CLI Docker image
cd cli/
docker build -f Dockerfile.v225 -t omniguard/cli:2.2.5 .

# Run a pro scan
docker run --rm \
  -e SUPABASE_URL=$SUPABASE_URL \
  -e SUPABASE_ANON_KEY=$SUPABASE_ANON_KEY \
  -e SUPABASE_SERVICE_ROLE_KEY=$SUPABASE_SERVICE_ROLE_KEY \
  -e AWS_ACCESS_KEY_ID=$AWS_ACCESS_KEY_ID \
  -e AWS_SECRET_ACCESS_KEY=$AWS_SECRET_ACCESS_KEY \
  -e AWS_REGION=$AWS_REGION \
  -e OMNIGUARD_SCAN_TIER=pro \
  -v /path/to/project:/scan \
  omniguard/cli:2.2.5 scan /scan --pro --aws-scan --json
```

### 9d. Deploy to AWS ECS (scheduled pro scans)

```bash
# Deploy the CloudFormation stack
aws cloudformation create-stack \
  --stack-name omniguard-pro-scan \
  --template-body file://aws-pro-scan-ecs.yaml \
  --parameters \
    ParameterKey=DockerImage,ParameterValue=omniguard/cli:2.2.5 \
    ParameterKey=SubnetId,ParameterValue=subnet-xxxxx \
    ParameterKey=SecurityGroupId,ParameterValue=sg-xxxxx \
    ParameterKey=SupabaseUrl,ParameterValue=https://your-project.supabase.co \
    ParameterKey=SupabaseAnonKey,ParameterValue=eyJ... \
    ParameterKey=SupabaseServiceKey,ParameterValue=eyJ... \
    ParameterKey=AwsScanAccessKeyId,ParameterValue=AKIAxxxxx \
    ParameterKey=AwsScanSecretAccessKey,ParameterValue=xxxxx \
  --capabilities CAPABILITY_IAM
```

This creates:
- ECS Fargate cluster (`omniguard-pro-scan`)
- Task definition with 2 vCPU / 4 GB memory
- IAM role with ECR/Lambda/IAM/S3 read permissions
- Secrets in AWS Secrets Manager
- EventBridge schedule running pro scans every 12 hours
- CloudWatch log group (30-day retention)

To trigger a manual scan:
```bash
aws ecs run-task \
  --cluster omniguard-pro-scan \
  --task-definition omniguard-pro-scan \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[subnet-xxxxx],securityGroups=[sg-xxxxx]}"
```

---

## 10. Docker Deployment (Full Stack)

### 10a. Build the dashboard + CLI + daemon image

```bash
# From repo root
docker build \
  -f Dockerfile.v225 \
  -t omniguard/dashboard:2.2.5 \
  -t omniguard/dashboard:latest \
  --build-arg VITE_SUPABASE_URL=$SUPABASE_URL \
  --build-arg VITE_SUPABASE_ANON_KEY=$SUPABASE_ANON_KEY \
  .
```

### 10b. Run

```bash
docker run -d \
  --name omniguard \
  -p 5173:5173 \
  -p 5175:5175 \
  -e SUPABASE_URL=$SUPABASE_URL \
  -e SUPABASE_ANON_KEY=$SUPABASE_ANON_KEY \
  -e SUPABASE_SERVICE_ROLE_KEY=$SUPABASE_SERVICE_ROLE_KEY \
  -e AI_PROVIDER=$AI_PROVIDER \
  -e ANTHROPIC_API_KEY=$ANTHROPIC_API_KEY \
  omniguard/dashboard:2.2.5
```

- Port 5173: Dashboard (Vite preview)
- Port 5175: CLI daemon (background)

### 10c. Docker Compose

```bash
# From repo root
docker-compose up -d
```

---

## 11. Publishing v2.2.5 (CLI + Extension + Docker)

### Prerequisites

- npm account with publish access to `omniguard-enterprise-cli`
- VS Code Marketplace publisher account
- `NPM_TOKEN` env var set

### 11a. Set your NPM_TOKEN

```bash
# Linux/macOS
export NPM_TOKEN=npm_xxxxxxxxxxxxx

# Windows PowerShell
$env:NPM_TOKEN = "npm_xxxxxxxxxxxxx"
```

### 11b. Run the publish script

```bash
# Linux/macOS
./publish-all-v225.sh

# Windows PowerShell
.\publish-all-v225.ps1
```

This script:

1. **Publishes CLI** to npm as `omniguard-enterprise-cli@2.2.5`
2. **Publishes VS Code extension** to Marketplace as `omniguard@2.2.5` (installs CLI as npm dependency)
3. **Builds dashboard Docker image** `omniguard/dashboard:2.2.5`
4. **Builds CLI Docker image** `omniguard/cli:2.2.5`
5. Pushes to `DOCKER_REGISTRY` if set

The script verifies versions match `2.2.5` before publishing and cleans up `.npmrc` after.

### 11c. Manual individual publishes

```bash
# CLI only
cd cli/
npm publish --access public

# Extension only
cd vscode-extension/
npm install omniguard-enterprise-cli@2.2.5 --save
npx vsce package
npx vsce publish

# Docker only
docker build -f Dockerfile.v225 -t omniguard/dashboard:2.2.5 .
docker build -f cli/Dockerfile.v225 -t omniguard/cli:2.2.5 .
```

---

## 12. Cloud Deployment Options

### Option A: Static hosting (dashboard only)

Deploy `omniguard/dist/` to any static host. Backend is entirely Supabase (managed).

```bash
# Vercel
cd omniguard && npx vercel --prod

# Netlify
cd omniguard && npx netlify deploy --prod --dir=dist

# S3 + CloudFront
aws s3 sync omniguard/dist/ s3://your-bucket/
```

### Option B: Docker (full stack)

See section 10.

### Option C: Render / Railway

1. Connect GitHub repository
2. Root directory: `omniguard/`
3. Build: `npm install && npm run build`
4. Publish: `dist`
5. Env vars: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`

### Option D: AWS ECS (pro scanning)

See section 9d.

---

## 13. API Key Generation

API keys are needed for CLI and VS Code extension authentication.

1. Sign in to dashboard
2. Go to **Settings → API Keys**
3. Click **Generate New Key**
4. Copy the key (shown once, format: `og_live_xxxxx`)
5. Use as `OMNIGUARD_API_KEY` in CLI or VS Code extension

Keys are SHA-256 hashed before storage — raw keys are never stored in the database.

---

## 14. Quick Start (TL;DR)

```bash
# 1. Clone
git clone <repo-url> omniguard && cd omniguard

# 2. Environment
cp .env.example .env
# Edit .env — set SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY,
#             VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY

# 3. Dashboard
cd omniguard && npm install && npm run dev
# → http://localhost:5173

# 4. CLI (new terminal)
cd ../cli && npm install && npm link
omniguard login     # or set OMNIGUARD_API_URL + OMNIGUARD_API_KEY in .env
omniguard doctor
omniguard scan --pro

# 5. VS Code extension
cd ../vscode-extension && npm install && npm run compile && npm run package
code --install-extension omniguard-2.2.5.vsix

# 6. Docker (optional)
cd ..
docker build -f Dockerfile.v225 -t omniguard/dashboard:2.2.5 \
  --build-arg VITE_SUPABASE_URL=$VITE_SUPABASE_URL \
  --build-arg VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY .
docker run -d -p 5173:5173 omniguard/dashboard:2.2.5

# 7. Publish v2.2.5 (optional)
export NPM_TOKEN=npm_xxxxx
./publish-all-v225.sh
```

---

## 15. Troubleshooting

### "No findings" when expecting results

- The scanner skips test/example lines
- Check `OMNIGUARD_FAIL_ON` severity threshold
- Run `omniguard scan --json` to see raw output

### CLI connection failed

```bash
omniguard doctor    # full diagnostics
omniguard status    # test Supabase connection
```

Check:
- `OMNIGUARD_API_URL` ends with `/functions/v1` (no trailing slash)
- API key starts with `og_live_` or is a Supabase JWT
- Edge functions are deployed

### VS Code extension not scanning

- Check Output panel → OmniGuard channel
- Run **OmniGuard: Configure** to re-enter credentials
- Ensure `omniguard-enterprise-cli` is installed (`npm install -g omniguard-enterprise-cli`)
- Run **OmniGuard: Scan Current File** manually

### AI not working

- Dashboard → Settings → AI Configuration → verify provider + key
- Check `ANTHROPIC_API_KEY` / `OPENAI_API_KEY` is set in `.env`
- For Ollama: ensure `ollama serve` is running

### Docker build fails

- Ensure `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are passed as build args
- Node 20 required (`FROM node:20-alpine`)

### AWS pro scan returns no findings

- Verify `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` are set
- Check IAM permissions include ECR/Lambda/IAM read access
- Run `aws sts get-caller-identity` to verify credentials

### Database errors

- Check all 9 migrations are applied
- Run health check: `GET /functions/v1/api-v1-status`
- Check Supabase dashboard → Logs for edge function errors
