import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

const commands = [
  {
    cmd: 'omniguard scan',
    desc: 'Run incredibly fast local scans for secrets, IaC misconfigurations, Docker vulnerabilities, and dependencies without uploading code.',
    syntax: 'omniguard scan <target> [flags]',
    flags: [
      { flag: 'repo', desc: 'Scan the current repository for secrets, SAST findings, and dependency vulnerabilities' },
      { flag: 'docker', desc: 'Scan a Docker image for vulnerabilities and misconfigurations' },
      { flag: 'terraform', desc: 'Scan Terraform HCL files for IaC misconfigurations' },
      { flag: '--format', desc: 'Output format: json, sarif, table, markdown (default: table)' },
      { flag: '--severity', desc: 'Minimum severity: critical, high, medium, low, info' },
      { flag: '--ci', desc: 'CI mode — exit 1 when findings exceed threshold' },
      { flag: '--output', desc: 'Write results to file path' },
    ],
    examples: [
      'omniguard scan repo',
      'omniguard scan docker my-image:latest',
      'omniguard scan terraform ./infra',
      'omniguard scan repo --severity high --ci --format sarif --output results.sarif',
    ],
  },
  {
    cmd: 'omniguard nexus graph',
    desc: 'Dump the deterministic truth model — the current Architecture Nexus state as a structured graph.',
    syntax: 'omniguard nexus graph [flags]',
    flags: [
      { flag: '--json', desc: 'Output the full graph as machine-readable JSON' },
      { flag: '--watch', desc: 'Watch mode: re-snapshot on file changes' },
      { flag: '--output', desc: 'Save graph to file (json, dot, svg)' },
    ],
    examples: [
      'omniguard nexus graph',
      'omniguard nexus graph --json',
      'omniguard nexus graph --output nexus.json',
    ],
  },
  {
    cmd: 'omniguard nexus check',
    desc: 'Query the Architecture Nexus for structural architecture flaws — missing controls, broken trust boundaries, and design gaps.',
    syntax: 'omniguard nexus check [flags]',
    flags: [
      { flag: '--query', desc: 'Natural language or structured query against the Architecture Nexus' },
      { flag: '--critical', desc: 'Report only critical-severity gaps' },
      { flag: '--diff', desc: 'Show only changes since last snapshot' },
      { flag: '--format', desc: 'Output format: json, table, markdown' },
    ],
    examples: [
      'omniguard nexus check',
      'omniguard nexus check --query "find databases missing encryption"',
      'omniguard nexus check --critical --format json',
      'omniguard nexus check --diff',
    ],
  },
  {
    cmd: 'omniguard nexus trace',
    desc: 'Trace a specific control back to its regulatory requirements, or trace an attack path between two components.',
    syntax: 'omniguard nexus trace <id> [flags]',
    flags: [
      { flag: '--all', desc: 'Show all paths, not just the shortest' },
      { flag: '--format', desc: 'Output format: json, table, ascii' },
    ],
    examples: [
      'omniguard nexus trace CTRL-042',
      'omniguard nexus trace api-gateway user-database --all',
    ],
  },
  {
    cmd: 'omniguard agent',
    desc: 'Manage background agents that snapshot, update, and report from the Architecture Nexus.',
    syntax: 'omniguard agent <subcommand> [flags]',
    flags: [
      { flag: 'map', desc: 'Discover and map architecture from repos, IaC, and cloud configs' },
      { flag: 'report', desc: 'Generate compliance reports from the current Architecture Nexus' },
      { flag: '--framework', desc: 'Compliance framework for report: pci-dss, hipaa, soc2, iso27001, nist, all' },
      { flag: '--format', desc: 'Report output format: pdf, html, json, markdown' },
      { flag: '--notify', desc: 'Send alert on drift: slack, teams, webhook' },
    ],
    examples: [
      'omniguard agent map',
      'omniguard agent map --include-cloud --include-iac',
      'omniguard agent report --framework soc2 --format pdf',
      'omniguard agent report --framework all --format json',
    ],
  },
  {
    cmd: 'omniguard provider',
    desc: 'Add and manage AI providers. Use BYOK to connect existing contracts — no data is sent to third-party AI trainers.',
    syntax: 'omniguard provider <subcommand> [flags]',
    flags: [
      { flag: 'add <name>', desc: 'Add an AI provider (anthropic, openai, gemini, bedrock, azure-openai, ollama)' },
      { flag: '--key', desc: 'API key for the provider' },
      { flag: 'list', desc: 'List all configured providers' },
      { flag: 'usage', desc: 'Show token consumption, cost, and latency per provider' },
      { flag: '--json', desc: 'Output usage as machine-readable JSON' },
    ],
    examples: [
      'omniguard provider add anthropic --key sk-ant-...',
      'omniguard provider add ollama --endpoint http://localhost:11434',
      'omniguard provider list',
      'omniguard provider usage --json',
    ],
  },
  {
    cmd: 'omniguard policy',
    desc: 'Install, validate, test, and diff security policies. Policies are written as YAML or compiled WebAssembly (Wasm) modules.',
    syntax: 'omniguard policy <subcommand> [flags]',
    flags: [
      { flag: 'install', desc: 'Install a policy bundle from a registry or local path' },
      { flag: 'validate', desc: 'Validate policy syntax and schema before deployment' },
      { flag: 'test', desc: 'Run a policy rule against the current Architecture Nexus' },
      { flag: 'diff', desc: 'Show changes between the active policy set and a new bundle' },
      { flag: '--rule', desc: 'Path to a single YAML rule file for targeted testing' },
    ],
    examples: [
      'omniguard policy install omniguard/pci-dss-bundle',
      'omniguard policy validate ./policies/',
      'omniguard policy test --rule my-custom-rule.yaml',
      'omniguard policy diff ./policies/v2 --format table',
    ],
  },
  {
    cmd: 'omniguard compliance',
    desc: 'Generate audit-ready compliance reports cross-referenced against the Architecture Nexus for 180+ supported frameworks.',
    syntax: 'omniguard compliance report [flags]',
    flags: [
      { flag: '--framework', desc: 'Target framework: pci-dss, hipaa, soc2, iso27001, nist, gdpr, all' },
      { flag: '--format', desc: 'Output format: pdf, html, json, csv' },
      { flag: '--output', desc: 'Write report to file path' },
      { flag: '--period', desc: 'Reporting period: last-30-days, last-quarter, last-year' },
    ],
    examples: [
      'omniguard compliance report --framework soc2 --format pdf',
      'omniguard compliance report --framework pci-dss --format pdf --output pci-audit.pdf',
      'omniguard compliance report --framework all --format json',
    ],
  },
  {
    cmd: 'omniguard org',
    desc: 'Manage your organization, invite team members, and assign RBAC roles.',
    syntax: 'omniguard org <subcommand> [flags]',
    flags: [
      { flag: 'invite <email>', desc: 'Invite a user to the organization' },
      { flag: '--role', desc: 'RBAC role: owner, admin, member, viewer' },
      { flag: 'members', desc: 'List all organization members and their roles' },
      { flag: 'settings', desc: 'View or update organization-level settings' },
    ],
    examples: [
      'omniguard org invite dev@company.com --role developer',
      'omniguard org invite ciso@company.com --role admin',
      'omniguard org members',
    ],
  },
  {
    cmd: 'omniguard project',
    desc: 'Create and manage projects (scoped workspaces) within your organization.',
    syntax: 'omniguard project <subcommand> [flags]',
    flags: [
      { flag: 'create <name>', desc: 'Create a new project workspace' },
      { flag: 'list', desc: 'List all projects in the organization' },
      { flag: 'switch <name>', desc: 'Switch CLI context to a different project' },
    ],
    examples: [
      'omniguard project create "Finance App"',
      'omniguard project create "Platform Infrastructure"',
      'omniguard project list',
      'omniguard project switch "Finance App"',
    ],
  },
  {
    cmd: 'omniguard mcp',
    desc: 'Start the Model Context Protocol server to connect OmniGuard to Claude Desktop or any MCP-compatible AI client.',
    syntax: 'omniguard mcp <subcommand>',
    flags: [
      { flag: 'start', desc: 'Start the local MCP server daemon' },
      { flag: 'stop', desc: 'Stop the MCP server daemon' },
      { flag: 'status', desc: 'Show whether the MCP server is running' },
    ],
    examples: [
      'omniguard mcp start',
      'omniguard mcp status',
      'omniguard mcp stop',
    ],
  },
  {
    cmd: 'omniguard findings',
    desc: 'List, filter, and manage security findings across the organization.',
    syntax: 'omniguard findings [flags]',
    flags: [
      { flag: '--severity', desc: 'Filter by severity level' },
      { flag: '--status', desc: 'Filter by status: open, acknowledged, resolved' },
      { flag: '--type', desc: 'Filter by type: vuln, secret, iac, design, policy' },
      { flag: '--format', desc: 'Output format: json, table, csv' },
    ],
    examples: [
      'omniguard findings',
      'omniguard findings --severity critical --status open',
      'omniguard findings --format json | jq ".findings[]"',
    ],
  },
  {
    cmd: 'omniguard fix',
    desc: 'Apply AI-assisted remediation for a specific finding.',
    syntax: 'omniguard fix <finding-id> [flags]',
    flags: [
      { flag: '--dry-run', desc: 'Show proposed fix without applying it' },
      { flag: '--auto', desc: 'Apply fix without interactive confirmation' },
    ],
    examples: [
      'omniguard fix OMNG-2847',
      'omniguard fix OMNG-2847 --dry-run',
    ],
  },
  {
    cmd: 'omniguard doctor',
    desc: 'Diagnose and verify your OmniGuard installation, authentication, and configuration.',
    syntax: 'omniguard doctor [flags]',
    flags: [
      { flag: '--verbose', desc: 'Show full diagnostic output' },
    ],
    examples: [
      'omniguard doctor',
      'omniguard doctor --verbose',
    ],
  },
];

export default function CLI() {
  return (
    <>
      <section className="py-20 bg-white border-b border-gray-100">
        <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mb-16">
            <div className="section-label mb-4">CLI</div>
            <h1 className="text-5xl font-bold text-gray-900 leading-tight mb-6">
              OmniGuard Nexus CLI
            </h1>
            <p className="text-xl text-gray-500 leading-relaxed mb-4">
              The OmniGuard CLI is hardened for enterprise use, featuring over 230 commands protected by strict RBAC, rate limiting, and session anomaly detection.
            </p>
            <p className="text-base text-gray-500 leading-relaxed mb-8">
              Scans run entirely locally — no code is uploaded. The CLI communicates only with the Architecture Nexus graph engine and your configured AI providers over encrypted channels.
            </p>
            <div className="flex gap-3 flex-wrap">
              <Link to="/book-demo" className="btn-primary">Get Access <ArrowRight size={15} /></Link>
              <Link to="/docs" className="btn-secondary">Full Documentation</Link>
            </div>
          </div>

          {/* Install */}
          <div className="mb-16">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Installation</h2>
            <div className="grid md:grid-cols-3 gap-4">
              {[
                { os: 'npm (all platforms)', cmd: 'npm install -g omniguard-enterprise-cli' },
                { os: 'macOS (Homebrew)', cmd: 'brew install omniguard/tap/omniguard' },
                { os: 'Linux', cmd: 'curl -fsSL https://install.omniguard.io | sh' },
              ].map((inst) => (
                <div key={inst.os} className="bg-gray-950 rounded-xl border border-gray-800 overflow-hidden">
                  <div className="px-4 py-2.5 border-b border-gray-800 text-xs text-gray-500 font-mono">{inst.os}</div>
                  <div className="p-4">
                    <code className="text-sm font-mono text-green-400">{inst.cmd}</code>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick start */}
          <div className="mb-16">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Start</h2>
            <div className="bg-gray-950 rounded-xl border border-gray-800 p-6">
              <div className="font-mono text-sm space-y-2">
                <div><span className="text-blue-400">$</span> <span className="text-white">omniguard login</span> <span className="text-gray-500"># Authenticate with your org</span></div>
                <div><span className="text-blue-400">$</span> <span className="text-white">omniguard repo add my-org/my-repo</span> <span className="text-gray-500"># Connect a repository</span></div>
                <div><span className="text-blue-400">$</span> <span className="text-white">omniguard install-hooks</span> <span className="text-gray-500"># Install pre-commit hooks</span></div>
                <div><span className="text-blue-400">$</span> <span className="text-white">omniguard agent map</span> <span className="text-gray-500"># Discover architecture</span></div>
                <div><span className="text-blue-400">$</span> <span className="text-white">omniguard nexus graph --json</span> <span className="text-gray-500"># Build Architecture Nexus</span></div>
                <div><span className="text-blue-400">$</span> <span className="text-white">omniguard nexus check</span> <span className="text-gray-500"># Find missing controls</span></div>
                <div><span className="text-blue-400">$</span> <span className="text-white">omniguard scan repo</span> <span className="text-gray-500"># Run full local security scan</span></div>
                <div><span className="text-blue-400">$</span> <span className="text-white">omniguard compliance report --framework soc2 --format pdf</span></div>
              </div>
            </div>
          </div>

          {/* Commands */}
          <div className="space-y-10">
            {commands.map((cmd) => (
              <div key={cmd.cmd} id={cmd.cmd.replace('omniguard ', '')} className="border border-gray-200 rounded-xl overflow-hidden">
                <div className="bg-gray-50 border-b border-gray-200 px-6 py-4">
                  <div className="flex items-center gap-3 flex-wrap">
                    <code className="text-sm font-mono font-semibold text-blue-600">{cmd.cmd}</code>
                    <span className="text-sm text-gray-500">{cmd.desc}</span>
                  </div>
                </div>
                <div className="p-6 space-y-6">
                  <div>
                    <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Syntax</div>
                    <div className="bg-gray-950 rounded-lg px-4 py-3">
                      <code className="text-sm font-mono text-green-400">{cmd.syntax}</code>
                    </div>
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Subcommands & Flags</div>
                    <div className="space-y-2">
                      {cmd.flags.map((flag) => (
                        <div key={flag.flag} className="flex gap-4 text-sm">
                          <code className="font-mono text-blue-600 flex-shrink-0 w-48">{flag.flag}</code>
                          <span className="text-gray-600">{flag.desc}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Examples</div>
                    <div className="bg-gray-950 rounded-lg p-4 space-y-1.5">
                      {cmd.examples.map((ex) => (
                        <div key={ex} className="font-mono text-sm">
                          <span className="text-blue-400">$ </span>
                          <span className="text-white">{ex}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 bg-gray-950">
        <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Integrate OmniGuard into your pipeline</h2>
          <p className="text-gray-400 mb-8 max-w-lg mx-auto">
            All 230+ CLI commands are designed for CI/CD automation with machine-readable output and strict exit codes.
          </p>
          <Link to="/docs" className="btn-primary text-sm px-7 py-3">
            Integration Guides <ArrowRight size={16} />
          </Link>
        </div>
      </section>
    </>
  );
}
