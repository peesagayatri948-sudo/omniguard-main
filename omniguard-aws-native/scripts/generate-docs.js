const fs = require('fs');
const path = require('path');

const docsDir = path.join(__dirname, '..', 'docs');
if (!fs.existsSync(docsDir)) {
  fs.mkdirSync(docsDir, { recursive: true });
}

const docs = {
  'getting-started.md': `# Getting Started

Install OmniGuard Nexus, connect your first repository, and build your first Architecture Nexus.

## Quick Start Guide

### Installation
You can install the OmniGuard Enterprise CLI via npm:
\`\`\`bash
npm install -g omniguard-enterprise-cli
\`\`\`

### Connect a Repository
Once installed, authenticate and connect your repository:
\`\`\`bash
omniguard login
omniguard repo add my-org/my-repo
\`\`\`

### Your First Architecture Nexus
OmniGuard Nexus analyzes your infrastructure as code, application code, and configurations to build a comprehensive map of your security posture.
\`\`\`bash
omniguard nexus graph --json
\`\`\`
This command generates the deterministic truth model of your architecture.
`,
  'cli-reference.md': `# CLI Reference

Complete reference for all OmniGuard CLI commands with examples, parameters, and output specifications.

## CLI Overview
The OmniGuard CLI is hardened for enterprise use, featuring over 230 commands protected by strict RBAC, rate limiting, and session anomaly detection.

### \`omniguard scan\`
Run incredibly fast local scans for Secrets, IaC Misconfigurations, Docker vulnerabilities, and Dependencies without uploading code.
- \`omniguard scan repo\`
- \`omniguard scan docker\`
- \`omniguard scan terraform\`

### \`omniguard nexus\`
Interact with the Architecture Nexus graph engine.
- \`omniguard nexus graph\` - Dump the deterministic truth model.
- \`omniguard nexus trace <id>\` - Trace a specific control back to regulatory requirements.

### \`omniguard agent\`
Manage background agents that snapshot the Architecture Nexus.
- \`omniguard agent map\`
- \`omniguard agent report\`
`,
  'vscode-extension.md': `# VS Code Extension

Live scanning, inline fixes, hover explanations, and policy enforcement inside Visual Studio Code.

## Extension Overview
The OmniGuard VS Code extension shifts security left by bringing the power of the Architecture Nexus directly into your IDE.

## Installation & Setup
1. Open VS Code.
2. Search for "OmniGuard Security" in the Extensions marketplace.
3. Click **Install**.
4. Run the \`OmniGuard: Login\` command from the command palette.

## Live Scanning
As you type, the extension runs local AST and Regex parsers to highlight vulnerabilities in real-time without uploading your code.

## Inline Fixes
Click the Quick Fix (bulb) icon next to a vulnerability to have OmniGuard's AI instantly generate and apply a drop-in patch that fixes the issue.
`,
  'mcp-server.md': `# MCP Server

Use OmniGuard Nexus as a Model Context Protocol server for AI-assisted security workflows.

## MCP Overview
OmniGuard provides a Model Context Protocol (MCP) server, allowing you to seamlessly integrate the Architecture Nexus into Claude Desktop or other MCP-compatible AI clients.

## Configuration
To start the MCP server:
\`\`\`bash
omniguard mcp start
\`\`\`

## Available Tools
The MCP server exposes several tools to the AI:
- \`nexus-graph\`: Retrieve the current Architecture Nexus state.
- \`nexus-trace\`: Trace security controls and data flows.
- \`scan-code\`: Request a vulnerability scan on a specific path.

## Claude Desktop Setup
Add the following to your \`claude_desktop_config.json\`:
\`\`\`json
{
  "mcpServers": {
    "omniguard": {
      "command": "omniguard",
      "args": ["mcp", "start"]
    }
  }
}
\`\`\`
`,
  'architecture-nexus.md': `# Architecture Nexus

Understand how the Architecture Nexus is built, queried, and maintained.

## Graph Overview
The flagship differentiator of OmniGuard is the Architecture Nexus. While traditional tools scan isolated lines of code, OmniGuard understands the relationships between components.

## Graph Schema
The graph maps:
- **Trust Boundaries**: Public Internet, Corporate VPC, Edge Devices.
- **Components**: Databases, APIs, S3 buckets, Identity Providers.
- **Data Flows**: Protocol pathways (HTTPS, TLS) and their authentication state.

## Graph Queries
Query the graph to find structural architecture flaws (the "missing" controls).
\`\`\`bash
omniguard nexus check --query "find databases missing encryption"
\`\`\`

## Drift Detection
Run continuous agents that snapshot the Architecture Nexus weekly. If a developer accidentally exposes a new untrusted data flow, an immediate alert is triggered.
`,
  'compliance.md': `# Compliance

Map controls to 180+ frameworks, generate audit evidence, and automate compliance reporting.

## Compliance Overview
OmniGuard automates compliance mapping by cross-referencing your Architecture Nexus with global regulatory frameworks.

## Supported Frameworks
OmniGuard supports over 180 frameworks, including:
- SOC 2 Type I/II
- ISO 27001
- PCI-DSS
- HIPAA
- NIST CSF

## Evidence Collection
Evidence is automatically collected from the Architecture Nexus and your cloud environments.

## Generating Reports
Generate CISO-ready reports in PDF or Markdown:
\`\`\`bash
omniguard compliance report --framework soc2 --format pdf
\`\`\`
`,
  'policies.md': `# Policies

Write, test, and enforce security policies across your environment.

## Policy Engine Overview
The OmniGuard Policy Engine allows you to define custom rules using WebAssembly (Wasm) or YAML to enforce organizational security standards.

## Writing Policies
Policies can be written to evaluate the state of the Architecture Nexus or individual file scans.

## Policy Testing
Test policies locally before deploying them:
\`\`\`bash
omniguard policy test --rule my-custom-rule.yaml
\`\`\`

## Policy Reference
- \`omniguard policy install\`
- \`omniguard policy validate\`
- \`omniguard policy diff\`
`,
  'ai-providers.md': `# AI Providers

Configure AI providers, set up BYOM/BYOK, and manage AI usage policies.

## AI Platform Overview
OmniGuard allows enterprises to bring their own AI models (BYOM) and keys (BYOK), ensuring zero data leakage to third-party AI trainers.

## Configure Providers
Connect your preferred providers:
\`\`\`bash
omniguard provider add anthropic --key sk-ant-...
\`\`\`

## BYOM Setup
You can connect local models (like Ollama) or enterprise gateways (AWS Bedrock, Azure OpenAI) to power the OmniGuard AI remediation engine.

## Provider Usage Analytics
Track token usage and costs across your organization:
\`\`\`bash
omniguard provider usage --json
\`\`\`
`,
  'organizations.md': `# Organizations

Manage organizations, workspaces, teams, and multi-tenant deployments.

## Organizations Overview
OmniGuard Enterprise provides robust multi-tenant capabilities, allowing you to segment your deployment across different business units.

## Creating Workspaces
\`\`\`bash
omniguard project create "Finance App"
\`\`\`

## Team Management
Invite members using secure, HMAC-signed, time-limited tokens:
\`\`\`bash
omniguard org invite dev@company.com --role developer
\`\`\`

## RBAC Reference
OmniGuard enforces strict Role-Based Access Control (RBAC). 
Roles include:
- **Owner**: Full access, billing, and org deletion.
- **Admin**: Policy management, team management.
- **Member**: Can run scans and view the Architecture Nexus.
- **Viewer**: Read-only access to reports.
`
};

for (const [filename, content] of Object.entries(docs)) {
  fs.writeFileSync(path.join(docsDir, filename), content, 'utf8');
  console.log(`Generated docs/${filename}`);
}
