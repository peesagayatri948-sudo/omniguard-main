import { Link } from 'react-router-dom';
import { ArrowRight, Network, AlertTriangle, Eye, Cpu, FileText, GitBranch, ChevronRight } from 'lucide-react';

const platforms = [
  {
    icon: Network,
    title: 'Architecture Nexus',
    desc: 'The continuously updated source of truth for your entire security architecture — applications, infrastructure, trust boundaries, threats, controls, and compliance.',
    href: '/platform/architecture-nexus',
  },
  {
    icon: AlertTriangle,
    title: 'Continuous Threat Modeling',
    desc: 'Automated attack path discovery, trust boundary analysis, and threat enumeration — updated continuously as your architecture evolves.',
    href: '/platform/threat-modeling',
  },
  {
    icon: Eye,
    title: 'Security Engine',
    desc: 'AI-powered SAST, secret scanning, IaC analysis, dependency scanning, container scanning, and SBOM generation with AI-assisted remediation.',
    href: '/platform/security-engine',
  },
  {
    icon: Cpu,
    title: 'AI Platform',
    desc: 'Governed multi-model AI orchestration with full auditability. Bring your own model (BYOM), your own API keys, and route between providers.',
    href: '/platform/ai-platform',
  },
  {
    icon: FileText,
    title: 'Policy Engine',
    desc: 'Natural language policy parsing, automatic generation, continuous enforcement, and compliance mapping across 180+ security frameworks.',
    href: '/platform/policy-engine',
  },
  {
    icon: GitBranch,
    title: 'Platform Architecture',
    desc: 'Three autonomous agents — System Mapping, Graph, and Reporting — working in concert to map, analyze, and report on your security posture.',
    href: '/platform/architecture',
  },
];

export default function PlatformOverview() {
  return (
    <>
      <section className="py-20 bg-white border-b border-gray-100">
        <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mb-16">
            <div className="section-label mb-4">Platform</div>
            <h1 className="text-5xl font-bold text-gray-900 leading-tight mb-6">
              The Adaptable Agentic SDLC Monitoring & Remediation Platform
            </h1>
            <p className="text-xl text-gray-500 leading-relaxed mb-8">
              OmniGuard Nexus provides a continuously updated Architecture Nexus that becomes your organization’s single source of truth for architecture, threats, controls, compliance, and security posture.
            </p>
            <div className="flex gap-3">
              <Link to="/book-demo" className="btn-primary">Book a Demo <ArrowRight size={15} /></Link>
              <Link to="/platform/architecture-nexus" className="btn-secondary">Documentation</Link>
            </div>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {platforms.map((p) => (
              <Link key={p.title} to={p.href} className="card group">
                <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center mb-4 group-hover:bg-blue-100 transition-colors">
                  <p.icon size={20} className="text-blue-600" />
                </div>
                <h3 className="text-base font-semibold text-gray-900 mb-2">{p.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed mb-4">{p.desc}</p>
                <span className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 group-hover:gap-2 transition-all">
                  Learn more <ChevronRight size={13} />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 bg-gray-50">
        <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="section-label mb-4">What Makes OmniGuard Different</div>
          <h2 className="section-title mb-6 max-w-2xl mx-auto">
            Most security tools scan code that already exists. OmniGuard finds what's missing.
          </h2>
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto mt-12">
            {[
              { label: 'Traditional AppSec', items: ['Scans existing code', 'Reports known CVEs', 'Reactive findings', 'Point-in-time results'], highlight: false },
              { label: 'OmniGuard Nexus', items: ['Discovers missing controls', 'Identifies design flaws', 'Proactive architecture analysis', 'Continuously updated graph'], highlight: true },
              { label: 'Without OmniGuard', items: ['Broken trust boundaries', 'Insecure architecture', 'Missing compliance mappings', 'Design flaws in production'], highlight: false },
            ].map((col) => (
              <div key={col.label} className={`rounded-xl p-6 ${col.highlight ? 'bg-blue-600 text-white' : 'bg-white border border-gray-200'}`}>
                <div className={`text-sm font-semibold mb-4 ${col.highlight ? 'text-blue-100' : 'text-gray-500'}`}>{col.label}</div>
                <ul className="space-y-2">
                  {col.items.map((item) => (
                    <li key={item} className={`text-sm ${col.highlight ? 'text-white' : 'text-gray-600'}`}>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
