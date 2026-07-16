# OmniGuard CLI

AI-Native Application Security Platform Command Line Interface.

Manage organizations, repositories, findings, policy evaluations, and AI-powered fix workflows directly from your terminal.

## Installation

```bash
npm install -g @omniguard/cli
```

Or run directly using `npx`:

```bash
npx @omniguard/cli --help
```

## Commands

- `omniguard login` - Authenticate using browser OAuth or api-key
- `omniguard logout` - Clears session credentials
- `omniguard status` - Check backend platform status
- `omniguard scan` - Scan current directory or specific files
- `omniguard scan --watch` - Run security scanner in watch mode
- `omniguard explain <finding-id>` - Get AI-driven explanation for a finding
- `omniguard fix <finding-id>` - Suggest AI-powered code remediation
- `omniguard api-keys` - Manage platform API keys
- `omniguard integrations` - Connect Jira, ServiceNow, Okta, HashiCorp Vault, and Confluence
- `omniguard policy <subcommand>` - Manage custom security policies:
  - `install <framework>` - Installs baseline `.omniguard.yml` (e.g. `soc2`, `standard`)
  - `remove` - Deletes repository-level policy file
  - `validate` - Verifies policy syntax, schema validation, and duplicate IDs
  - `parse` - Compiles and displays JSON representation of policy patterns
  - `enable` / `disable` - Toggles policy scanning on/off for current profile

## Policy Engine Configuration

Define a `.omniguard.yml` (or `.omniguard.yaml`) in your repository root to configure custom matching rules and enforcement behaviors:

```yaml
enforcement:
  mode: block
  minimum_severity: high

rules:
  - id: NO-EVAL
    severity: critical
    language:
      - javascript
      - typescript
    pattern:
      regex: \beval\(
    remediation: Replace eval() with JSON.parse() or safe equivalents.
    metadata:
      category: security
```

## Interactive TUI

Launch a full terminal dashboard interface:

```bash
omniguard
```

## License

MIT License. See LICENSE for details.
