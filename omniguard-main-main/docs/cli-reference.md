# OmniGuard Enterprise CLI Reference (v1.9.9)

Complete reference for all OmniGuard CLI namespaces, subcommands, usage parameters, and interactive tools.

## General Usage
```bash
omniguard <namespace> <subcommand> [options]
```
*Note: Run just `omniguard` (or `omniguard tui`) to launch the interactive full-screen terminal dashboard.*

---

## 1. Scan Namespace (`omniguard scan`)
Run local scans for vulnerabilities, secrets, IaC misconfigurations, and licenses.
*   `omniguard scan .` - Scan the current directory
*   `omniguard scan file <path>` - Scan a specific file
*   `omniguard scan folder <path>` - Scan a specific folder
*   `omniguard scan repo <name>` - Scan a specific repository
*   `omniguard scan docker` / `image` - Scan Dockerfiles and container configurations
*   `omniguard scan terraform` / `k8s` / `cloudformation` / `helm` - Scan IaC manifests
*   `omniguard scan secrets` - Scan for credentials and high-entropy leaks
*   `omniguard scan licenses` - Audit package dependency licenses
*   `omniguard scan dependencies` - Scan package compositions for CVEs
*   `omniguard scan sbom` - Audit CycloneDX SBOM inventories
*   `omniguard scan ai` - Run AI semantic code vulnerability audit
*   `omniguard scan diff` / `commit` / `staged` / `changed` - Scan local Git changesets
*   `omniguard scan watch` / `monitor` - Start active file monitoring mode

---

## 2. Fix Namespace (`omniguard fix`)
Autonomous and interactive AI remediation utilities.
*   `omniguard fix file <path>` - Suggest and apply fixes to a specific file
*   `omniguard fix repo <name>` - Remediate the entire repository
*   `omniguard fix explain <id>` - Request structural logic reasons for a finding
*   `omniguard fix preview <id>` - View code diff prior to applying
*   `omniguard fix apply <id>` - Commit AI patch changes
*   `omniguard fix rollback <id>` - Rollback applied fixes
*   `omniguard fix interactive` - Run interactive terminal fix wizard
*   `omniguard fix pr` - Push fixes as a pull request to Git origin
*   `omniguard fix commit` - Auto-commit fixes to the local branch
*   `omniguard fix diff` - Inspect modifications

---

## 3. Architecture Nexus (`omniguard nexus`)
Interact with the deterministic single source of truth architecture graph engine.
*   `omniguard nexus graph [--json]` - Output mapped systems, flows, and trust boundaries
*   `omniguard nexus trace <threat_id>` - Trace control defense evidence back to compliance clauses
*   `omniguard nexus check` - Audit the architecture graph for missing control mitigations
*   `omniguard nexus mcp` - Spawn the long-running Model Context Protocol (MCP) server daemon

---

## 4. Integration Namespace (`omniguard integrations`)
Manage enterprise SSO, cloud, and notification hooks.
*   `omniguard integrations list` - List connected and available integrations
*   `omniguard integrations connect <provider>` - Link GitHub, ServiceNow, Vault, Jira, Okta, Splunk, etc.
*   `omniguard integrations disconnect <provider>` - Revoke integrations
*   `omniguard integrations test <provider>` - Validate credentials connectivity

---

## 5. Additional Namespaces
### User Management (`omniguard user`)
*   `list`, `info`, `invite`, `remove`, `role`, `sessions`, `revoke`, `reset`

### Repository Management (`omniguard repo`)
*   `add`, `create`, `remove`, `clone`, `list`, `sync`, `enable`, `disable`, `settings`, `webhooks`, `branches`, `status`

### Project Configuration (`omniguard project`)
*   `create`, `delete`, `list`, `use`, `info`, `settings`

### AI Provider Management (`omniguard provider`)
*   `add`, `remove`, `list`, `verify`, `default`, `test`, `usage`, `cost`, `models`, `benchmark`

### API Keys Management (`omniguard api-key`)
*   `create`, `revoke`, `rotate`, `list`, `show`, `usage`, `permissions`, `expire`, `verify`

### Policy Enforcement (`omniguard policy`)
*   `install`, `remove`, `list`, `parse`, `validate`, `enable`, `disable`, `sync`, `export`, `import`, `test`, `diff`

### Compliance Standards (`omniguard compliance`)
*   `soc2`, `iso27001`, `gdpr`, `hipaa`, `pci`, `nist`, `cis`, `export`, `report`

### Software Bill of Materials (`omniguard sbom`)
*   `generate`, `validate`, `export`, `upload`, `compare`, `diff`, `sign`

### Security Audits (`omniguard audit`)
*   `audit`, `logs`, `export`, `search`, `replay`, `verify` (integrity verification of audit chain), `tail`

### System Utilities
*   `omniguard version` - Print CLI and Node runtime release versions
*   `omniguard doctor` - Execute self-diagnostics checks on credentials, files, and server daemon connectivity
*   `omniguard cache clear` - Clean local prompt and scan caches

