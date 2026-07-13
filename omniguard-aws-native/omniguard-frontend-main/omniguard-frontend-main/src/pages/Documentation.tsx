import { Link } from 'react-router-dom';
import { ArrowRight, ChevronRight, BookOpen, Terminal, Cpu, FileText, Network, GitBranch, Building } from 'lucide-react';

const docSections = [
  {
    icon: BookOpen,
    title: 'Getting Started',
    desc: 'Install via npm (npm install -g omniguard-enterprise-cli), authenticate with omniguard login, connect your first repository, and build your Architecture Nexus.',
    links: [
      { label: 'Quick Start Guide', href: '/docs/quickstart' },
      { label: 'Installation', href: '/docs/installation' },
      { label: 'omniguard login & repo add', href: '/docs/repositories' },
      { label: 'Build your Architecture Nexus', href: '/docs/first-graph' },
    ],
  },
  {
    icon: Terminal,
    title: 'CLI Reference',
    desc: 'The OmniGuard CLI is hardened for enterprise use with 230+ commands. Scans run entirely locally — no code is uploaded.',
    links: [
      { label: 'CLI Overview', href: '/cli' },
      { label: 'omniguard scan (repo / docker / terraform)', href: '/cli#scan' },
      { label: 'omniguard nexus (graph / check / trace)', href: '/cli#nexus' },
      { label: 'omniguard provider / policy / compliance', href: '/cli#provider' },
    ],
  },
  {
    icon: Cpu,
    title: 'VS Code Extension',
    desc: 'Brings the Architecture Nexus into VS Code. Local AST and Regex parsers scan as you type — no code uploaded. Quick Fix bulb applies AI patches instantly.',
    links: [
      { label: 'Extension Overview', href: '/vscode' },
      { label: 'Install "OmniGuard Security"', href: '/vscode#setup' },
      { label: 'Live Scanning (no upload)', href: '/vscode#scanning' },
      { label: 'Quick Fix Patches', href: '/vscode#fixes' },
    ],
  },
  {
    icon: Network,
    title: 'MCP Server',
    desc: 'Run omniguard mcp start to connect the Architecture Nexus to Claude Desktop or any MCP-compatible AI client. Tools: nexus-graph, nexus-trace, scan-code.',
    links: [
      { label: 'MCP Overview', href: '/mcp' },
      { label: 'omniguard mcp start', href: '/mcp#config' },
      { label: 'Available Tools', href: '/mcp#tools' },
      { label: 'Claude Desktop Setup', href: '/mcp#claude' },
    ],
  },
  {
    icon: GitBranch,
    title: 'Architecture Nexus',
    desc: 'The flagship differentiator. Maps Trust Boundaries, Components, and Data Flows into a continuously maintained graph. Query it to find what\'s missing.',
    links: [
      { label: 'Architecture Nexus Overview', href: '/platform/architecture-nexus' },
      { label: 'Graph Schema', href: '/docs/nexus-schema' },
      { label: 'Graph Queries', href: '/docs/nexus-queries' },
      { label: 'Drift Detection', href: '/docs/drift-detection' },
    ],
  },
  {
    icon: FileText,
    title: 'Compliance',
    desc: '180+ frameworks continuously cross-referenced against the Architecture Nexus. Generate reports with omniguard compliance report --framework soc2 --format pdf.',
    links: [
      { label: 'Compliance Overview', href: '/solutions/compliance' },
      { label: 'Supported Frameworks', href: '/docs/frameworks' },
      { label: 'Evidence Collection', href: '/docs/evidence' },
      { label: 'omniguard compliance report', href: '/cli#compliance' },
    ],
  },
  {
    icon: FileText,
    title: 'Policies',
    desc: 'Write policies as YAML or WebAssembly (Wasm). Test with omniguard policy test --rule, validate with omniguard policy validate, diff changes before deployment.',
    links: [
      { label: 'Policy Engine Overview', href: '/platform/policy-engine' },
      { label: 'YAML & Wasm Policies', href: '/docs/writing-policies' },
      { label: 'omniguard policy test', href: '/cli#policy' },
      { label: 'omniguard policy install / diff', href: '/cli#policy' },
    ],
  },
  {
    icon: Cpu,
    title: 'AI Providers',
    desc: 'BYOM and BYOK support. Zero data sent to third-party AI trainers. Add providers with omniguard provider add. Monitor usage with omniguard provider usage --json.',
    links: [
      { label: 'AI Platform Overview', href: '/platform/ai-platform' },
      { label: 'omniguard provider add', href: '/cli#provider' },
      { label: 'omniguard provider usage --json', href: '/cli#provider' },
      { label: 'Zero Data Leakage', href: '/platform/ai-platform' },
    ],
  },
  {
    icon: Building,
    title: 'Organizations',
    desc: 'Multi-tenant projects with RBAC (Owner, Admin, Member, Viewer). Create projects with omniguard project create, invite members with omniguard org invite.',
    links: [
      { label: 'Organizations Overview', href: '/enterprise' },
      { label: 'omniguard project create', href: '/cli#project' },
      { label: 'omniguard org invite --role', href: '/cli#org' },
      { label: 'RBAC Roles', href: '/enterprise' },
    ],
  },
];

export default function Documentation() {
  return (
    <>
      <section className="py-20 bg-white border-b border-gray-100">
        <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mb-16">
            <div className="section-label mb-4">Documentation</div>
            <h1 className="text-5xl font-bold text-gray-900 leading-tight mb-6">
              OmniGuard Nexus Documentation
            </h1>
            <p className="text-xl text-gray-500 leading-relaxed mb-8">
              Everything you need to install, configure, and get the most from OmniGuard Nexus — from quick start guides to advanced deployment configurations.
            </p>
            <div className="flex gap-3">
              <Link to="/docs/quickstart" className="btn-primary">Quick Start <ArrowRight size={15} /></Link>
              <Link to="/cli" className="btn-secondary">CLI Reference</Link>
            </div>
          </div>

          {/* Quick links */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-16">
            {[
              { label: 'Quick Start', href: '/docs/quickstart', icon: BookOpen },
              { label: 'CLI Reference', href: '/cli', icon: Terminal },
              { label: 'VS Code', href: '/vscode', icon: Cpu },
              { label: 'Architecture Nexus', href: '/platform/architecture-nexus', icon: Network },
            ].map((link) => (
              <Link
                key={link.label}
                to={link.href}
                className="flex items-center gap-3 p-4 bg-gray-50 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-all group"
              >
                <link.icon size={18} className="text-blue-600 flex-shrink-0" />
                <span className="text-sm font-medium text-gray-800 group-hover:text-blue-700">{link.label}</span>
                <ChevronRight size={13} className="text-gray-400 ml-auto" />
              </Link>
            ))}
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {docSections.map((section) => (
              <div key={section.title} className="card">
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-9 h-9 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
                    <section.icon size={18} className="text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900">{section.title}</h3>
                    <p className="text-xs text-gray-500 mt-1 leading-snug">{section.desc}</p>
                  </div>
                </div>
                <ul className="space-y-1.5">
                  {section.links.map((link) => (
                    <li key={link.label}>
                      <Link
                        to={link.href}
                        className="flex items-center gap-2 text-xs text-gray-600 hover:text-blue-600 transition-colors py-1"
                      >
                        <ChevronRight size={11} className="text-gray-300 flex-shrink-0" />
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 bg-gray-50">
        <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Need help?</h2>
          <p className="text-gray-500 mb-6">
            Our support team and community are here to help.
          </p>
          <div className="flex justify-center gap-4">
            <Link to="/support" className="btn-secondary text-sm">Support Center</Link>
            <Link to="/contact" className="btn-primary text-sm">Contact Sales <ArrowRight size={15} /></Link>
          </div>
        </div>
      </section>
    </>
  );
}
