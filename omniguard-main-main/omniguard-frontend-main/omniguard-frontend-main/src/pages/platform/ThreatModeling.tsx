import { Link } from 'react-router-dom';
import { ArrowRight, Check, AlertTriangle, Network, Shield, Eye } from 'lucide-react';

const threatCategories = [
  { label: 'Spoofing', count: 8, color: 'bg-red-500', desc: 'Identity and authentication threats' },
  { label: 'Tampering', count: 5, color: 'bg-orange-500', desc: 'Data integrity threats' },
  { label: 'Repudiation', count: 3, color: 'bg-yellow-500', desc: 'Non-repudiation gaps' },
  { label: 'Information Disclosure', count: 11, color: 'bg-blue-500', desc: 'Confidentiality threats' },
  { label: 'Denial of Service', count: 6, color: 'bg-gray-500', desc: 'Availability threats' },
  { label: 'Elevation of Privilege', count: 4, color: 'bg-purple-500', desc: 'Authorization threats' },
];

export default function ThreatModeling() {
  return (
    <>
      <section className="py-20 bg-white border-b border-gray-100">
        <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mb-16">
            <div className="section-label mb-4">Continuous Threat Modeling</div>
            <h1 className="text-5xl font-bold text-gray-900 leading-tight mb-6">
              Threat modeling that runs continuously, not once a quarter
            </h1>
            <p className="text-xl text-gray-500 leading-relaxed mb-8">
              Traditional threat modeling is a manual, point-in-time exercise. OmniGuard Nexus makes threat modeling continuous — automatically updating as your architecture, infrastructure, and data flows change.
            </p>
            <div className="flex gap-3">
              <Link to="/book-demo" className="btn-primary">Book a Demo <ArrowRight size={15} /></Link>
              <Link to="/docs/threat-modeling" className="btn-secondary">Documentation</Link>
            </div>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: Network, title: 'Automatic Architecture Discovery', desc: 'OmniGuard reads your repositories, IaC, cloud configs, and documentation to automatically build the architecture model required for threat modeling.' },
              { icon: AlertTriangle, title: 'Attack Path Discovery', desc: 'Graph-based attack path analysis identifies end-to-end exploit routes that chain individual weaknesses into critical threats.' },
              { icon: Shield, title: 'Trust Boundary Analysis', desc: 'Automatically identify and validate trust boundaries. Detect when services cross boundaries without appropriate controls.' },
              { icon: Eye, title: 'Threat Enumeration', desc: 'STRIDE-based threat enumeration enriched with MITRE ATT&CK mappings and your organization\'s specific risk context.' },
              { icon: Check, title: 'Mitigation Mapping', desc: 'Every identified threat is mapped to applicable mitigations, security controls, and remediation guidance from the Architecture Nexus.' },
              { icon: AlertTriangle, title: 'Continuous Updates', desc: 'As architecture evolves, the threat model updates automatically. New services, data flows, and infrastructure changes are reflected in minutes, not months.' },
            ].map((cap) => (
              <div key={cap.title} className="card">
                <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center mb-4">
                  <cap.icon size={20} className="text-blue-600" />
                </div>
                <h3 className="text-base font-semibold text-gray-900 mb-2">{cap.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{cap.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 bg-gray-50 border-b border-gray-100">
        <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-start">
            <div>
              <div className="section-label mb-4">STRIDE Analysis</div>
              <h2 className="section-title mb-6">Comprehensive threat coverage across every category</h2>
              <p className="section-subtitle mb-8">
                OmniGuard Nexus applies STRIDE threat analysis automatically across every component, trust boundary, and data flow in your Architecture Nexus.
              </p>
              <div className="space-y-3">
                {threatCategories.map((tc) => (
                  <div key={tc.label} className="flex items-center gap-4">
                    <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${tc.color}`} />
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-gray-900">{tc.label}</span>
                        <span className="text-xs text-gray-500">{tc.count} threats</span>
                      </div>
                      <div className="text-xs text-gray-400">{tc.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <div className="section-label mb-4">Architecture Validation</div>
              <h2 className="section-title mb-6">Review designs before code is written</h2>
              <p className="section-subtitle mb-6">
                OmniGuard Nexus enables security architects and developers to validate architecture decisions against threat models before implementation begins — shifting security truly to the left.
              </p>
              <ul className="space-y-3">
                {[
                  'Validate proposed architecture changes against existing threat model',
                  'Identify new attack paths introduced by proposed designs',
                  'Check compliance implications of architecture decisions',
                  'Generate security requirements for new features automatically',
                  'Produce architecture review documentation from the graph',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm text-gray-700">
                    <Check size={14} className="text-blue-600 flex-shrink-0 mt-0.5" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-gray-950">
        <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-white mb-4">Make threat modeling a continuous process, not a project</h2>
          <p className="text-gray-400 mb-8 max-w-lg mx-auto">
            See how OmniGuard Nexus keeps your threat model in sync with your evolving architecture.
          </p>
          <Link to="/book-demo" className="btn-primary text-sm px-7 py-3">
            Book a Demo <ArrowRight size={16} />
          </Link>
        </div>
      </section>
    </>
  );
}
