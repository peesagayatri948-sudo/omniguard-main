# OmniGuard Enterprise Dashboard Architecture

This document serves as the blueprint for building the OmniGuard Web Application Dashboard. It acts as the central control plane that binds the CLI, VS Code Extension, AWS integration, and AI MCP Server into a single source of truth.

## 1. Authentication & RBAC (Role-Based Access Control)
Upon login, the dashboard resolves the user's role via Supabase Auth (or SSO) and conditionally renders features.
*   **Developers**: Can view their own PRs, local graph traces, and personal API keys.
*   **Security Managers / CISOs**: Can manage teams, view global AWS drift, issue organization-wide API tokens, and enforce auto-shutdown policies.

## 2. Core Dashboard Pages

### A. The Shared Attention Dashboard (Home)
A real-time overview tailored to the user's role.
*   **Live Threat Map**: Visual indicator of high-risk vulnerabilities introduced today across all repos.
*   **Graph Delta**: A live feed of changes to the Architecture Nexus (e.g., "API Gateway Route Added by @dev1").
*   **MCP Intercept Feed**: A live feed showing how many times the OmniGuard MCP Server intercepted and warned an AI (Claude/Antigravity) about a breaking change before it was committed.

### B. Architecture Nexus (Visual Graph Builder)
The visual representation of the Single Source of Truth.
*   **Topological View**: Renders the exact infrastructure (AWS VPCs, EC2s, databases) based on IaC and live cloud polling.
*   **Historical Audit Trail (CloudTrail-style)**: A timeline slider. You can drag the slider back to yesterday to see *who* made changes to the graph, *what* broke, and *how* OmniGuard auto-patched it.
*   **Drift Overlays**: Highlights nodes in red if the live AWS environment deviates from the Git-defined IaC graph.

### C. Cloud Drift & Auto-Shutdown Policies
The control center for the active AWS/Cloud Provider integrations.
*   **Provider Config**: Forms to connect AWS, GCP, or Azure via IAM roles.
*   **Active Drifts**: Lists unapproved changes (e.g., "Port 22 manually opened on DB-Server").
*   **Negligence Auto-Shutdown Rules**: Toggle switches allowing OmniGuard to automatically isolate or shut down services if explicitly dangerous drift is detected without CISO approval.

### D. Team & Organization Management (Manager View)
*   **Invite Portal**: Generate and manage the secure 32-digit HMAC invite codes for onboarding developers.
*   **Role Assignment**: Promote users to Managers or restrict them to Read-Only Devs.

### E. Developer API & Integrations
*   **API Key Generation**: Developers can generate personal or service-account `omniguard_sk_...` tokens.
*   **MCP Server Configuration**: Instructions and endpoints to hook the OmniGuard MCP server into Claude Desktop or Antigravity IDE for real-time, pre-commit AI guardrails.
*   **CI/CD Hooks**: Copy-paste snippets to embed OmniGuard into GitHub Actions or GitLab CI.

### F. SBOM & Compliance Reports
*   **Continuous SBOM Generation**: Instantly download Software Bill of Materials (CycloneDX/SPDX) based on the live graph.
*   **Compliance Matrix**: Real-time pass/fail matrix against SOC 2, ISO 27001, and HIPAA, mapped directly to graph nodes.

## 3. Real-Time Data Flow (The Extended Scope)
1.  **AI Editing Phase**: Developer uses Claude. Claude requests an edit. The `realtime-ai-guardrail` MCP tool intercepts the AST, queries the Graph, and blocks Claude if it breaks security policies (e.g., bypassing a WAF).
2.  **Commit Phase**: The CLI Extension double-checks the final code.
3.  **Deployment Phase**: GitHub Actions validates the graph integrity.
4.  **Runtime Phase**: The Dashboard polls AWS. If a developer manually edits AWS via the console (creating drift), the Cloud Drift Monitor catches it, alerts the Shared Attention Dashboard, and triggers an Auto-Shutdown hook if configured.
