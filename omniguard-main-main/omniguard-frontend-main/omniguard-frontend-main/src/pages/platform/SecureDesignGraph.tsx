import { Link } from 'react-router-dom';
import { ArrowRight, Check, Network, GitMerge, Layers, Database, Cloud, Shield } from 'lucide-react';

const graphNodes = [
  { label: 'Applications', count: 12, color: 'bg-blue-600', desc: 'Microservices, APIs, frontends' },
  { label: 'Infrastructure', count: 38, color: 'bg-gray-700', desc: 'Compute, storage, networking' },
  { label: 'Trust Boundaries', count: 7, color: 'bg-yellow-500', desc: 'Public Internet, Corporate VPC, Edge Devices' },
  { label: 'Threats', count: 23, color: 'bg-red-500', desc: 'STRIDE categories, MITRE ATT&CK' },
  { label: 'Controls', count: 89, color: 'bg-green-600', desc: 'Mitigations & countermeasures' },
  { label: 'Compliance Rules', count: 214, color: 'bg-purple-600', desc: 'Mapped to 180+ frameworks' },
  { label: 'Missing Controls', count: 6, color: 'bg-orange-500', desc: 'Gaps identified by OmniGuard' },
  { label: 'Attack Paths', count: 4, color: 'bg-rose-600', desc: 'End-to-end exploit routes' },
];

export default function SecureDesignGraph() {
  return (
    <>
      <section className="py-20 bg-white border-b border-gray-100">
        <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mb-12">
            <div className="section-label mb-4">Architecture Nexus</div>
            <h1 className="text-5xl font-bold text-gray-900 leading-tight mb-6">
              A living model of your architecture — threats, controls, and compliance in one graph
            </h1>
            <p className="text-xl text-gray-500 leading-relaxed mb-4">
              The Architecture Nexus is OmniGuard's flagship differentiator. While traditional tools scan isolated lines of code, OmniGuard understands the relationships between components — building a continuously maintained graph of your entire security landscape.
            </p>
            <p className="text-base text-gray-500 leading-relaxed mb-8">
              It connects every application, service, infrastructure component, trust boundary, data flow, control, threat, and compliance requirement into a single queryable structure — automatically built from your existing code and infrastructure, and updated in real time as your systems evolve.
            </p>
            <div className="flex gap-3">
              <Link to="/book-demo" className="btn-primary">See It Live <ArrowRight size={15} /></Link>
              <Link to="/docs" className="btn-secondary">Documentation</Link>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-100 rounded-xl p-6 max-w-3xl mb-4">
            <p className="text-sm text-blue-800 leading-relaxed">
              <span className="font-semibold">Why it matters:</span> Traditional security tools scan what exists. The Architecture Nexus finds what's missing — the absent controls, the unguarded trust boundaries, the architectural decisions that create exploitable gaps. It doesn't just report; it reasons about your design.
            </p>
          </div>
        </div>
      </section>

      {/* Graph Schema */}
      <section className="py-20 bg-gray-50 border-b border-gray-100">
        <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-start">
            <div>
              <div className="section-label mb-3">Graph Schema</div>
              <h2 className="section-title mb-4">Three entity categories, fully connected</h2>
              <p className="section-subtitle mb-8">
                The Architecture Nexus models your environment as three interconnected entity types — Trust Boundaries, Components, and Data Flows — with typed relationships that enable structural security reasoning.
              </p>

              <div className="space-y-4">
                {[
                  {
                    label: 'Trust Boundaries',
                    color: 'bg-yellow-500',
                    items: ['Public Internet', 'Corporate VPC', 'Edge Devices', 'DMZ / Bastion', 'Internal Subnet'],
                    desc: 'Security perimeters that services cross. Each crossing is evaluated for the presence of authentication, encryption, and access controls.',
                  },
                  {
                    label: 'Components',
                    color: 'bg-blue-600',
                    items: ['Databases', 'APIs', 'S3 Buckets', 'Identity Providers', 'Workers / Queues'],
                    desc: 'Every service, datastore, and infrastructure asset in your environment, with their configuration state and compliance status.',
                  },
                  {
                    label: 'Data Flows',
                    color: 'bg-green-600',
                    items: ['HTTPS / TLS pathways', 'Authentication state', 'PII data routes', 'Service-to-service calls'],
                    desc: 'Protocol pathways between components and their authentication state — the substrate of attack path analysis.',
                  },
                ].map((entity) => (
                  <div key={entity.label} className="bg-white border border-gray-200 rounded-lg p-5">
                    <div className="flex items-center gap-3 mb-3">
                      <div className={`w-3 h-3 rounded-full ${entity.color}`} />
                      <span className="text-sm font-semibold text-gray-900">{entity.label}</span>
                    </div>
                    <p className="text-xs text-gray-500 mb-3 leading-relaxed">{entity.desc}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {entity.items.map((item) => (
                        <span key={item} className="px-2 py-1 bg-gray-50 border border-gray-200 rounded text-xs text-gray-600">{item}</span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <div className="section-label mb-3">Graph Queries</div>
              <h2 className="section-title mb-4">Find structural flaws with targeted queries</h2>
              <p className="section-subtitle mb-6">
                Query the Architecture Nexus to surface the "missing" controls — structural architecture flaws that code-level scanners can't detect.
              </p>

              <div className="space-y-4 mb-8">
                {[
                  {
                    query: 'omniguard nexus check --query "find databases missing encryption"',
                    desc: 'Identify all database components reachable via unencrypted data flows',
                  },
                  {
                    query: 'omniguard nexus check --query "find services crossing trust boundaries without auth"',
                    desc: 'Surface missing authentication controls at trust boundary crossings',
                  },
                  {
                    query: 'omniguard nexus trace api-gateway user-database --all',
                    desc: 'Trace all possible attack paths between two components',
                  },
                  {
                    query: 'omniguard nexus check --critical --diff',
                    desc: 'Show only new critical gaps since last Architecture Nexus snapshot',
                  },
                ].map((q, i) => (
                  <div key={i} className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                    <div className="bg-gray-950 p-3">
                      <code className="text-xs font-mono text-green-400 leading-relaxed">{q.query}</code>
                    </div>
                    <div className="p-3">
                      <p className="text-xs text-gray-500">{q.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Drift Detection */}
      <section className="py-20 bg-white border-b border-gray-100">
        <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <div className="section-label mb-4">Drift Detection</div>
              <h2 className="section-title mb-6">Continuous snapshots. Immediate alerts.</h2>
              <p className="section-subtitle mb-6">
                The Graph Agent runs continuous snapshots of the Architecture Nexus. If a developer accidentally exposes a new untrusted data flow, introduces a misconfigured resource, or changes a trust boundary without updating controls, an immediate alert is triggered.
              </p>
              <ul className="space-y-3 mb-8">
                {[
                  'New services detected and added to the graph automatically',
                  'Configuration drift flagged with severity scoring',
                  'Trust boundary changes trigger immediate policy re-evaluation',
                  'New attack paths surfaced when architecture changes',
                  'Compliance impact assessed for every change',
                  'Slack, Teams, or webhook notifications on security-impacting drift',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm text-gray-700">
                    <Check size={14} className="text-blue-600 flex-shrink-0 mt-0.5" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-gray-950 border border-gray-800 rounded-xl p-6">
              <div className="text-xs text-gray-500 font-mono mb-4 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                omniguard agent graph — Architecture Nexus live
              </div>
              <div className="space-y-3">
                {graphNodes.map((row) => (
                  <div key={row.label} className="flex items-center gap-3">
                    <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${row.color}`} />
                    <span className="text-sm text-gray-400 flex-1">{row.label}</span>
                    <span className="text-sm font-mono text-gray-300">{row.count}</span>
                  </div>
                ))}
              </div>
              <div className="mt-5 pt-4 border-t border-gray-800">
                <div className="text-xs text-gray-500 mb-2">Recent drift alerts</div>
                <div className="space-y-2 text-xs font-mono">
                  <div className="text-red-400">✗ New untrusted data flow: worker → payments-db</div>
                  <div className="text-yellow-400">⚠ IAM role scope expanded: s3:* on prod bucket</div>
                  <div className="text-green-400">✓ Drift resolved: TLS 1.2 → 1.3 on auth-service</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Architecture flow */}
      <section className="py-20 bg-gray-50 border-b border-gray-100">
        <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mx-auto text-center mb-12">
            <div className="section-label mb-3">How the Graph Connects</div>
            <h2 className="section-title mb-4">From application to compliance report — in one connected graph</h2>
          </div>
          <div className="max-w-sm mx-auto">
            {[
              { icon: Layers, label: 'Applications', desc: 'Microservices, APIs, frontends, workers' },
              { icon: Cloud, label: 'Infrastructure', desc: 'Compute, storage, networking, IAM' },
              { icon: Shield, label: 'Trust Boundaries', desc: 'Security zones, network perimeters, auth domains' },
              { icon: Network, label: 'Threats', desc: 'STRIDE threats, MITRE ATT&CK tactics, risk scores' },
              { icon: Check, label: 'Controls', desc: 'Mitigations, countermeasures, security gates' },
              { icon: Database, label: 'Compliance', desc: 'Framework mappings, control objectives' },
              { icon: GitMerge, label: 'Evidence', desc: 'Scan results, audit logs, test reports' },
              { icon: Layers, label: 'Reports', desc: 'PCI, HIPAA, SOC 2, ISO 27001, NIST & 180+ more' },
            ].map((item, i, arr) => (
              <div key={item.label} className="flex items-center gap-4">
                <div className="flex flex-col items-center">
                  <div className="w-10 h-10 bg-blue-50 border border-blue-100 rounded-lg flex items-center justify-center">
                    <item.icon size={18} className="text-blue-600" />
                  </div>
                  {i < arr.length - 1 && <div className="w-px h-8 bg-gray-200 mt-1" />}
                </div>
                <div className="mb-8">
                  <div className="text-sm font-semibold text-gray-900">{item.label}</div>
                  <div className="text-xs text-gray-400 mt-0.5">{item.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 bg-gray-950">
        <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-white mb-4">Ready to see your Architecture Nexus?</h2>
          <p className="text-gray-400 mb-8 max-w-lg mx-auto">
            OmniGuard Nexus builds a complete Architecture Nexus for your environment in minutes. No manual configuration required.
          </p>
          <Link to="/book-demo" className="btn-primary text-sm px-7 py-3">
            Book a Demo <ArrowRight size={16} />
          </Link>
        </div>
      </section>
    </>
  );
}
