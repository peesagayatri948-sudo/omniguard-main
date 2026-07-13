import { Link } from 'react-router-dom';
import {
  ArrowRight,
  GitBranch,
  Eye,
  Cpu,
  FileText,
  Check,
  ChevronRight,
  Network,
  AlertTriangle,
  Layers,
  Terminal,
} from 'lucide-react';

const capabilities = [
  {
    icon: Network,
    title: 'Architecture Nexus',
    desc: 'A continuously updated graph of your entire architecture — applications, infrastructure, trust boundaries, threats, controls, and compliance — all queryable, all connected.',
    href: '/platform/architecture-nexus',
  },
  {
    icon: AlertTriangle,
    title: 'Continuous Threat Modeling',
    desc: 'Automated attack path discovery, trust boundary analysis, and threat enumeration running continuously as your architecture evolves.',
    href: '/platform/threat-modeling',
  },
  {
    icon: Eye,
    title: 'Architecture Drift Detection',
    desc: 'Detect when deployed infrastructure diverges from your secure design. Know the moment a new service, configuration, or data flow introduces risk.',
    href: '/platform/security-engine',
  },
  {
    icon: Cpu,
    title: 'Governed AI Security',
    desc: 'Multi-model AI orchestration with full auditability. Every AI decision traces back to a threat, control, and compliance rule.',
    href: '/platform/ai-platform',
  },
  {
    icon: FileText,
    title: 'Policy-as-Code Engine',
    desc: 'Natural language policy parsing, automatic generation, continuous enforcement, and compliance mapping across 180+ frameworks.',
    href: '/platform/policy-engine',
  },
  {
    icon: GitBranch,
    title: 'Shift-Left Developer Integration',
    desc: 'Architectural security feedback delivered directly to the CLI, VS Code, and MCP server — before code ever reaches production.',
    href: '/cli',
  },
];

const howItWorks = [
  {
    step: '01',
    title: 'Discover Your Architecture',
    desc: 'The System Mapping Agent automatically reads repositories, IaC, architecture diagrams, cloud layouts, and documentation to build a complete system model.',
    cmd: 'omniguard agent map',
  },
  {
    step: '02',
    title: 'Build the Architecture Nexus',
    desc: 'The Graph Agent continuously updates the Architecture Nexus, detecting configuration drift, missing controls, new infrastructure, and architecture changes.',
    cmd: 'omniguard agent graph',
  },
  {
    step: '03',
    title: 'Enforce & Report',
    desc: 'The Reporting Agent generates enterprise compliance reports for PCI DSS, HIPAA, SOC 2, ISO 27001, NIST, GDPR, CIS, and 180+ additional frameworks.',
    cmd: 'omniguard agent report',
  },
];

const whatsMissing = [
  'Missing encryption on data at rest',
  'Broken trust boundary between services',
  'Undocumented API exposing PII',
  'Missing authentication on internal route',
  'IaC drift from secure baseline',
  'Attack path through misconfigured IAM',
  'Missing segmentation between workloads',
  'Unmonitored admin access point',
];

const integrations = [
  'GitHub', 'GitLab', 'Azure DevOps', 'Bitbucket',
  'AWS', 'Azure', 'Google Cloud', 'Terraform',
  'Kubernetes', 'Docker', 'Jira', 'Slack',
  'Okta', 'HashiCorp Vault', 'OpenAI', 'Anthropic',
];

const testimonials = [
  {
    quote: "OmniGuard Nexus transformed how our security team thinks about architecture risk. Instead of chasing individual CVEs, we now see the complete attack surface continuously.",
    author: "VP of Engineering",
    company: "Series D Fintech Platform",
  },
  {
    quote: "The Architecture Nexus became our single source of truth for security architecture. Our compliance reviews went from weeks to days.",
    author: "CISO",
    company: "Enterprise Healthcare SaaS",
  },
  {
    quote: "For the first time, our developers get meaningful security feedback before merging — not after a breach. The VS Code integration and CLI are exceptional.",
    author: "Head of AppSec",
    company: "Global Technology Company",
  },
];

const enterpriseStats = [
  { value: '180+', label: 'Compliance Frameworks' },
  { value: '3', label: 'Autonomous Agents' },
  { value: '99.9%', label: 'Platform Uptime' },
  { value: '< 5 min', label: 'Time to First Nexus' },
];

export default function Home() {
  return (
    <>
      {/* Hero */}
      <section className="bg-white border-b border-gray-100 py-24 md:py-32 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(37,99,235,0.04),_transparent_60%)]" />
        <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="max-w-4xl">
            <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-100 rounded-full px-4 py-1.5 mb-8">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
              <span className="text-xs font-semibold text-blue-700 tracking-wide">
                Adaptable Agentic SDLC Monitoring & Remediation Platform
              </span>
            </div>

            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-gray-900 leading-[1.08] tracking-tight mb-6">
              AI finds what's there.
              <br />
              <span className="text-blue-600">OmniGuard Nexus</span>
              <br />
              finds what's missing.
            </h1>

            <p className="text-xl text-gray-500 leading-relaxed max-w-2xl mb-10">
              OmniGuard Nexus connects to your repositories, cloud infrastructure, and developer tools to continuously monitor your entire SDLC — automatically detecting missing security controls, architecture drift, and compliance gaps, then remediating them before they reach production.
            </p>

            <div className="flex flex-wrap gap-3 mb-16">
              <Link to="/book-demo" className="btn-primary text-sm px-6 py-3">
                Book a Demo <ArrowRight size={16} />
              </Link>
              <Link to="/contact" className="btn-secondary text-sm px-6 py-3">
                Contact Sales
              </Link>

            </div>

            {/* Terminal preview */}
            <div className="bg-gray-950 rounded-xl border border-gray-800 overflow-hidden max-w-2xl shadow-2xl">
              <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-800">
                <span className="w-3 h-3 rounded-full bg-red-500/60" />
                <span className="w-3 h-3 rounded-full bg-yellow-500/60" />
                <span className="w-3 h-3 rounded-full bg-green-500/60" />
                <span className="ml-2 text-xs text-gray-500 font-mono">omniguard nexus</span>
              </div>
              <div className="p-5 font-mono text-sm space-y-2">
                <div><span className="text-blue-400">$</span> <span className="text-white">omniguard agent map --repo .</span></div>
                <div className="text-gray-400 ml-4">Discovering architecture...</div>
                <div className="text-green-400 ml-4">✓ 47 services mapped</div>
                <div className="text-green-400 ml-4">✓ 12 trust boundaries identified</div>
                <div className="text-yellow-400 ml-4">⚠ 8 missing controls detected</div>
                <div className="text-red-400 ml-4">✗ 3 broken trust boundaries</div>
                <div className="mt-2"><span className="text-blue-400">$</span> <span className="text-white">omniguard scan .</span></div>
                <div className="text-gray-400 ml-4">Scanning repository...</div>
                <div className="text-green-400 ml-4">✓ Graph updated. 6 attack paths found.</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-gray-50 border-b border-gray-100 py-10">
        <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {enterpriseStats.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-3xl font-bold text-gray-900">{stat.value}</div>
                <div className="text-sm text-gray-500 mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* What's Missing section */}
      <section className="py-24 bg-white border-b border-gray-100">
        <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <div className="section-label mb-4">The Missing Controls Problem</div>
              <h2 className="section-title mb-6">
                Traditional scanners report vulnerabilities in code that exists.
                <span className="text-blue-600"> OmniGuard Nexus finds what's missing.</span>
              </h2>
              <p className="section-subtitle mb-8">
                Most security tools are reactive — they analyze what's there. OmniGuard Nexus is fundamentally different. It identifies absent security controls, insecure architecture, broken trust boundaries, and design flaws before they become production incidents.
              </p>
              <Link to="/platform/architecture-nexus" className="btn-primary text-sm">
                Explore Architecture Nexus <ArrowRight size={15} />
              </Link>
            </div>
            <div className="space-y-2">
              {whatsMissing.map((item, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 p-3.5 bg-gray-50 border border-gray-100 rounded-lg"
                >
                  <div className="w-6 h-6 rounded bg-red-50 border border-red-100 flex items-center justify-center flex-shrink-0">
                    <AlertTriangle size={12} className="text-red-500" />
                  </div>
                  <span className="text-sm text-gray-700">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Core Capabilities */}
      <section className="py-24 bg-gray-50 border-b border-gray-100">
        <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mb-16">
            <div className="section-label mb-4">Core Capabilities</div>
            <h2 className="section-title mb-4">
              A unified platform for secure design at enterprise scale
            </h2>
            <p className="section-subtitle">
              From continuous threat modeling to policy enforcement, OmniGuard Nexus covers the complete security lifecycle.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {capabilities.map((cap) => (
              <Link key={cap.title} to={cap.href} className="card group">
                <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center mb-4 group-hover:bg-blue-100 transition-colors">
                  <cap.icon size={20} className="text-blue-600" />
                </div>
                <h3 className="text-base font-semibold text-gray-900 mb-2">{cap.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed mb-4">{cap.desc}</p>
                <span className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 group-hover:gap-2 transition-all">
                  Learn more <ChevronRight size={13} />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24 bg-white border-b border-gray-100">
        <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mb-16">
            <div className="section-label mb-4">Platform Architecture</div>
            <h2 className="section-title mb-4">Three autonomous agents. One unified security graph.</h2>
            <p className="section-subtitle">
              OmniGuard Nexus operates through three intelligent agents that continuously map, analyze, and report on your security posture.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {howItWorks.map((step) => (
              <div key={step.step} className="relative">
                <div className="text-5xl font-bold text-gray-100 mb-4">{step.step}</div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">{step.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed mb-4">{step.desc}</p>
                <div className="bg-gray-950 rounded px-3 py-2 inline-block">
                  <code className="text-xs font-mono text-green-400">{step.cmd}</code>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-12 text-center">
            <Link to="/platform/architecture" className="btn-secondary text-sm">
              View Full Platform Architecture <ArrowRight size={15} />
            </Link>
          </div>
        </div>
      </section>

      {/* Architecture Nexus visual */}
      <section className="py-24 bg-gray-950 border-b border-gray-800">
        <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <div className="text-xs font-semibold tracking-widest uppercase text-blue-400 mb-4">
                Architecture Nexus
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold text-white leading-tight mb-6">
                Your entire security architecture, continuously connected
              </h2>
              <p className="text-gray-400 leading-relaxed mb-8">
                The Architecture Nexus maps every application, infrastructure component, service, API, trust boundary, data flow, control, threat, and compliance requirement into a single queryable graph — updated continuously as your environment evolves.
              </p>
              <ul className="space-y-3 mb-8">
                {[
                  'Applications and microservices',
                  'Infrastructure and cloud resources',
                  'Trust boundaries and data flows',
                  'Threats and attack paths',
                  'Controls and mitigations',
                  'Compliance evidence and mappings',
                ].map((item) => (
                  <li key={item} className="flex items-center gap-3 text-sm text-gray-300">
                    <Check size={15} className="text-blue-400 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
              <Link to="/platform/architecture-nexus" className="btn-primary text-sm">
                Explore Architecture Nexus <ArrowRight size={15} />
              </Link>
            </div>

            {/* Graph visualization */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-8">
              <div className="text-xs text-gray-500 font-mono mb-6 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                omniguard nexus graph — Architecture Nexus live
              </div>
              <div className="space-y-3">
                {[
                  { label: 'Applications', count: 12, color: 'bg-blue-600' },
                  { label: 'Infrastructure', count: 38, color: 'bg-gray-600' },
                  { label: 'Trust Boundaries', count: 7, color: 'bg-yellow-600' },
                  { label: 'Threats', count: 23, color: 'bg-red-600' },
                  { label: 'Controls', count: 89, color: 'bg-green-600' },
                  { label: 'Compliance Rules', count: 214, color: 'bg-purple-600' },
                  { label: 'Missing Controls', count: 6, color: 'bg-orange-600' },
                ].map((row) => (
                  <div key={row.label} className="flex items-center gap-3">
                    <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${row.color}`} />
                    <span className="text-sm text-gray-400 flex-1">{row.label}</span>
                    <span className="text-sm font-mono text-gray-300">{row.count}</span>
                  </div>
                ))}
              </div>
              <div className="mt-6 pt-4 border-t border-gray-800">
                <div className="text-xs text-gray-500 mb-2">Attack paths identified</div>
                <div className="space-y-2">
                  {[
                    { path: 'API Gateway → Auth Service → DB (unauthenticated)', severity: 'CRITICAL' },
                    { path: 'Worker → S3 Bucket (misconfigured IAM)', severity: 'HIGH' },
                    { path: 'Internal route bypasses WAF', severity: 'HIGH' },
                  ].map((ap) => (
                    <div key={ap.path} className="flex items-start gap-2 p-2.5 bg-gray-800/50 rounded text-xs">
                      <span className={`tag mt-0.5 flex-shrink-0 ${
                        ap.severity === 'CRITICAL' ? 'bg-red-900/50 text-red-400' : 'bg-orange-900/50 text-orange-400'
                      }`}>
                        {ap.severity}
                      </span>
                      <span className="text-gray-400 font-mono leading-snug">{ap.path}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Developer Experience */}
      <section className="py-24 bg-white border-b border-gray-100">
        <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="order-2 lg:order-1 space-y-4">
              <div className="bg-gray-950 rounded-xl border border-gray-800 overflow-hidden">
                <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-800">
                  <Terminal size={14} className="text-gray-500" />
                  <span className="text-xs text-gray-500 font-mono">omniguard cli</span>
                </div>
                <div className="p-5 font-mono text-sm space-y-1.5">
                  <div><span className="text-blue-400">$</span> <span className="text-white">omniguard scan --format sarif</span></div>
                  <div className="text-gray-500">Scanning repository...</div>
                  <div className="text-green-400">✓ SAST: 0 critical, 2 high</div>
                  <div className="text-yellow-400">⚠ IaC: S3 bucket public read enabled</div>
                  <div className="text-red-400">✗ Secret: AWS key in config.json:47</div>
                  <div className="text-blue-400 mt-2">$ omniguard nexus check</div>
                  <div className="text-gray-500">Querying Architecture Nexus...</div>
                  <div className="text-red-400">✗ Missing: auth middleware on /admin/*</div>
                  <div className="text-red-400">✗ Missing: rate limiting on /api/auth</div>
                  <div className="text-yellow-400">⚠ Trust boundary drift detected</div>
                </div>
              </div>
            </div>
            <div className="order-1 lg:order-2">
              <div className="section-label mb-4">Developer-First Security</div>
              <h2 className="section-title mb-6">
                Security feedback where developers already work
              </h2>
              <p className="section-subtitle mb-8">
                OmniGuard Nexus delivers architectural security analysis directly into the CLI, VS Code extension, and MCP server — giving developers actionable feedback before code reaches production, not after a security review.
              </p>
              <div className="space-y-4 mb-8">
                {[
                  { icon: Terminal, label: 'CLI', desc: 'Full-featured command-line interface for CI/CD, offline scanning, and automation' },
                  { icon: Layers, label: 'VS Code Extension', desc: 'Live scanning, inline fixes, hover explanations, and policy enforcement in your editor' },
                  { icon: Cpu, label: 'MCP Server', desc: 'Native Model Context Protocol server for AI-assisted security workflows' },
                ].map((tool) => (
                  <div key={tool.label} className="flex items-start gap-4">
                    <div className="w-9 h-9 bg-gray-100 rounded flex items-center justify-center flex-shrink-0">
                      <tool.icon size={17} className="text-gray-700" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-gray-900">{tool.label}</div>
                      <div className="text-sm text-gray-500">{tool.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex gap-3">
                <Link to="/cli" className="btn-primary text-sm">
                  Explore CLI <ArrowRight size={15} />
                </Link>
                <Link to="/vscode" className="btn-secondary text-sm">
                  VS Code Extension
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Enterprise */}
      <section className="py-24 bg-gray-50 border-b border-gray-100">
        <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <div className="section-label mb-4">Enterprise Grade</div>
              <h2 className="section-title mb-6">
                Built for the security and compliance requirements of large organizations
              </h2>
              <p className="section-subtitle mb-8">
                Every AI recommendation traces back to a threat, framework, control, and compliance rule. Nothing appears as an unexplained suggestion. Full audit trails, RBAC, SSO, and enterprise governance are included.
              </p>
              <div className="grid sm:grid-cols-2 gap-4 mb-8">
                {[
                  'Role-Based Access Control',
                  'SSO / Okta Integration',
                  'Full Audit Logs',
                  'Organizations & Workspaces',
                  'Evidence Collection',
                  'Custom Compliance Policies',
                  'AI Provider Choice (BYOM)',
                  'Self-Hosted Deployment',
                ].map((feature) => (
                  <div key={feature} className="flex items-center gap-2.5 text-sm text-gray-700">
                    <Check size={14} className="text-blue-600 flex-shrink-0" />
                    {feature}
                  </div>
                ))}
              </div>
              <Link to="/enterprise" className="btn-primary text-sm">
                Enterprise Overview <ArrowRight size={15} />
              </Link>
            </div>
            <div className="space-y-4">
              {[
                { framework: 'PCI DSS 4.0', coverage: 96 },
                { framework: 'HIPAA', coverage: 94 },
                { framework: 'SOC 2 Type II', coverage: 98 },
                { framework: 'ISO 27001', coverage: 92 },
                { framework: 'NIST CSF 2.0', coverage: 97 },
                { framework: 'GDPR', coverage: 89 },
              ].map((fw) => (
                <div key={fw.framework} className="bg-white border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-900">{fw.framework}</span>
                    <span className="text-xs font-semibold text-blue-600">{fw.coverage}% mapped</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-1.5">
                    <div
                      className="bg-blue-600 h-1.5 rounded-full"
                      style={{ width: `${fw.coverage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Integrations */}
      <section className="py-24 bg-white border-b border-gray-100">
        <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mx-auto text-center mb-12">
            <div className="section-label mb-4">Integrations</div>
            <h2 className="section-title mb-4">Connects to your entire stack</h2>
            <p className="section-subtitle">
              Native integrations with source control, cloud providers, AI models, identity, ticketing, and communication platforms.
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-3 mb-10">
            {integrations.map((name) => (
              <div
                key={name}
                className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-full text-sm font-medium text-gray-700 hover:border-gray-300 hover:bg-gray-100 transition-colors"
              >
                {name}
              </div>
            ))}
          </div>
          <div className="text-center">
            <Link to="/integrations" className="btn-secondary text-sm">
              View All Integrations <ArrowRight size={15} />
            </Link>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 bg-gray-50 border-b border-gray-100">
        <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mb-12">
            <div className="section-label mb-4">Customer Stories</div>
            <h2 className="section-title">
              Trusted by security-conscious engineering organizations
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((t, i) => (
              <div key={i} className="card">
                <div className="text-blue-600 text-3xl font-serif leading-none mb-4">&ldquo;</div>
                <p className="text-gray-700 text-sm leading-relaxed mb-6">{t.quote}</p>
                <div>
                  <div className="text-sm font-semibold text-gray-900">{t.author}</div>
                  <div className="text-xs text-gray-400 mt-0.5">{t.company}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing preview */}
      <section className="py-24 bg-white border-b border-gray-100">
        <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mx-auto text-center mb-12">
            <div className="section-label mb-4">Pricing</div>
            <h2 className="section-title mb-4">Transparent pricing for every stage</h2>
            <p className="section-subtitle">
              Start free, scale to enterprise. Every plan includes the Architecture Nexus and continuous threat modeling.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {[
              {
                name: 'Starter',
                price: 'Free',
                desc: 'For individual developers and small teams',
                features: ['1 repository', 'Architecture Nexus', 'CLI & VS Code', '5 compliance frameworks', 'Community support'],
                cta: 'Start Free',
                href: '/pricing',
                highlight: false,
              },
              {
                name: 'Team',
                price: '$299/mo',
                desc: 'For growing engineering teams',
                features: ['Up to 25 repos', 'Full Architecture Nexus', 'All three agents', '50 compliance frameworks', 'Priority support'],
                cta: 'Start Trial',
                href: '/pricing',
                highlight: true,
              },
              {
                name: 'Enterprise',
                price: 'Custom',
                desc: 'For large-scale enterprise deployments',
                features: ['Unlimited repos', 'RBAC & SSO', 'Self-hosted option', '180+ frameworks', 'Dedicated support'],
                cta: 'Contact Sales',
                href: '/contact',
                highlight: false,
              },
            ].map((plan) => (
              <div
                key={plan.name}
                className={`rounded-xl border p-8 ${
                  plan.highlight
                    ? 'border-blue-600 bg-blue-600 text-white shadow-lg'
                    : 'border-gray-200 bg-white'
                }`}
              >
                <div className={`text-xs font-semibold uppercase tracking-wider mb-1 ${plan.highlight ? 'text-blue-200' : 'text-gray-400'}`}>
                  {plan.name}
                </div>
                <div className={`text-3xl font-bold mb-1 ${plan.highlight ? 'text-white' : 'text-gray-900'}`}>
                  {plan.price}
                </div>
                <p className={`text-sm mb-6 ${plan.highlight ? 'text-blue-100' : 'text-gray-500'}`}>{plan.desc}</p>
                <ul className="space-y-2.5 mb-8">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2.5 text-sm">
                      <Check size={14} className={plan.highlight ? 'text-blue-200' : 'text-blue-600'} />
                      <span className={plan.highlight ? 'text-blue-50' : 'text-gray-700'}>{f}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  to={plan.href}
                  className={`block text-center py-2.5 text-sm font-semibold rounded transition-colors ${
                    plan.highlight
                      ? 'bg-white text-blue-600 hover:bg-blue-50'
                      : 'border border-gray-300 text-gray-800 hover:bg-gray-50'
                  }`}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 bg-gray-950">
        <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Start finding what's missing today
          </h2>
          <p className="text-lg text-gray-400 max-w-xl mx-auto mb-10">
            Schedule a discovery call with our team and see the Architecture Nexus built for your environment in under five minutes.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link to="/book-demo" className="btn-primary text-sm px-7 py-3">
              Book a Demo <ArrowRight size={16} />
            </Link>
            <Link to="/contact" className="inline-flex items-center gap-2 px-7 py-3 text-sm font-semibold text-white border border-gray-700 rounded hover:border-gray-500 transition-colors">
              Contact Sales
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
