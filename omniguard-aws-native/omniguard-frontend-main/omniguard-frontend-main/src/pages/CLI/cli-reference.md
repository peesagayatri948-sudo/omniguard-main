# CLI Reference

Complete reference for all OmniGuard CLI commands with examples, parameters, and output specifications.

## CLI Overview
The OmniGuard CLI is hardened for enterprise use, featuring over 230 commands protected by strict RBAC, rate limiting, and session anomaly detection.

### `omniguard scan`
Run incredibly fast local scans for Secrets, IaC Misconfigurations, Docker vulnerabilities, and Dependencies without uploading code.
- `omniguard scan repo`
- `omniguard scan docker`
- `omniguard scan terraform`

### `omniguard nexus`
Interact with the Architecture Nexus graph engine.
- `omniguard nexus graph` - Dump the deterministic truth model.
- `omniguard nexus trace <id>` - Trace a specific control back to regulatory requirements.

### `omniguard agent`
Manage background agents that snapshot the Architecture Nexus.
- `omniguard agent map`
- `omniguard agent report`
