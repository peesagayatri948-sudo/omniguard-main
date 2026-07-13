import { Link } from 'react-router-dom';
import { ArrowRight, Check } from 'lucide-react';

const agents = [
  {
    number: '01',
    name: 'System Mapping Agent',
    tagline: 'Automatically build your complete system model',
    cmd: 'omniguard agent map',
    color: 'blue',
    capabilities: [
      'Reads and parses all repositories in your organization',
      'Analyzes architecture diagrams (draw.io, Lucidchart, Miro exports)',
      'Ingests Infrastructure-as-Code (Terraform, CloudFormation, Pulumi)',
      'Processes API specifications (OpenAPI, AsyncAPI, GraphQL)',
      'Reads cloud provider configurations (AWS, Azure, GCP)',
      'Parses existing documentation and runbooks',
      'Maps service dependencies and data flows',
      'Identifies trust boundaries from network configurations',
    ],
    output: [
      'Complete service inventory',
      'Dependency graph',
      'Data flow diagram',
      'Trust boundary map',
      'API surface catalog',
    ],
  },
  {
    number: '02',
    name: 'Graph Agent',
    tagline: 'Continuously update the Architecture Nexus',
    cmd: 'omniguard agent graph',
    color: 'green',
    capabilities: [
      'Continuously watches for configuration changes',
      'Detects architecture drift from the secure baseline',
      'Identifies new services not in the design graph',
      'Discovers missing security controls for new infrastructure',
      'Updates threat model as architecture evolves',
      'Triggers policy evaluations on changes',
      'Calculates risk score delta for each change',
      'Notifies relevant teams of security-impacting changes',
    ],
    output: [
      'Drift detection alerts',
      'Missing controls report',
      'Updated attack path analysis',
      'Risk score changes',
      'Policy violation notifications',
    ],
  },
  {
    number: '03',
    name: 'Reporting Agent',
    tagline: 'Generate enterprise compliance reports automatically',
    cmd: 'omniguard agent report',
    color: 'purple',
    capabilities: [
      'Generates audit-ready compliance reports on demand',
      'Supports 180+ frameworks including PCI DSS, HIPAA, SOC 2',
      'Produces executive security posture dashboards',
      'Creates evidence packages for auditor review',
      'Generates architecture review documents',
      'Produces risk assessment reports with remediation priorities',
      'Tracks compliance posture over time with trend analysis',
      'Exports to PDF, CSV, JSON, and SARIF formats',
    ],
    output: [
      'PCI DSS audit package',
      'SOC 2 evidence collection',
      'Executive risk dashboard',
      'Remediation roadmap',
      'Trend analysis report',
    ],
  },
];

export default function PlatformArchitecture() {
  return (
    <>
      <section className="py-20 bg-white border-b border-gray-100">
        <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mb-16">
            <div className="section-label mb-4">Platform Architecture</div>
            <h1 className="text-5xl font-bold text-gray-900 leading-tight mb-6">
              Three autonomous agents. One unified security graph.
            </h1>
            <p className="text-xl text-gray-500 leading-relaxed mb-8">
              OmniGuard Nexus operates through three intelligent, autonomous agents that work in concert to continuously map your architecture, maintain the Architecture Nexus, and generate enterprise compliance reports.
            </p>
            <div className="flex gap-3">
              <Link to="/book-demo" className="btn-primary">Book a Demo <ArrowRight size={15} /></Link>
              <Link to="/docs/agents" className="btn-secondary">Agent Documentation</Link>
            </div>
          </div>
        </div>
      </section>

      {agents.map((agent, i) => (
        <section key={agent.name} className={`py-20 border-b border-gray-100 ${i % 2 === 0 ? 'bg-gray-50' : 'bg-white'}`}>
          <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-16 items-start">
              <div className={i % 2 !== 0 ? 'order-2' : ''}>
                <div className="text-5xl font-bold text-gray-100 mb-4">{agent.number}</div>
                <div className="section-label mb-3">{agent.name}</div>
                <h2 className="text-3xl font-bold text-gray-900 mb-4">{agent.tagline}</h2>
                <div className="inline-block bg-gray-950 rounded px-3 py-2 mb-6">
                  <code className="text-sm font-mono text-green-400">{agent.cmd}</code>
                </div>
                <ul className="space-y-2.5">
                  {agent.capabilities.map((cap) => (
                    <li key={cap} className="flex items-start gap-3 text-sm text-gray-600">
                      <Check size={14} className="text-blue-600 flex-shrink-0 mt-0.5" />
                      {cap}
                    </li>
                  ))}
                </ul>
              </div>
              <div className={i % 2 !== 0 ? 'order-1' : ''}>
                <div className="bg-white border border-gray-200 rounded-xl p-6">
                  <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Agent Output</div>
                  <div className="space-y-3">
                    {agent.output.map((item, j) => (
                      <div key={item} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <div className="w-6 h-6 rounded bg-blue-600 flex items-center justify-center flex-shrink-0">
                          <span className="text-xs font-bold text-white">{j + 1}</span>
                        </div>
                        <span className="text-sm text-gray-700">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      ))}

      <section className="py-20 bg-gray-950">
        <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-white mb-4">See the agents in action</h2>
          <p className="text-gray-400 mb-8 max-w-lg mx-auto">
            OmniGuard Nexus builds a complete Architecture Nexus for your environment in minutes.
          </p>
          <Link to="/book-demo" className="btn-primary text-sm px-7 py-3">
            Book a Demo <ArrowRight size={16} />
          </Link>
        </div>
      </section>
    </>
  );
}
