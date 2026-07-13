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

## Interactive TUI

Launch a full terminal dashboard interface:

```bash
omniguard
```

## License

MIT License. See LICENSE for details.
