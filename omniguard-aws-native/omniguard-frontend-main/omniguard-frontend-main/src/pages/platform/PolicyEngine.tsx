import { Link } from 'react-router-dom';
import { ArrowRight, Check, FileText, Cpu, GitBranch, Lock, Code } from 'lucide-react';

const frameworks = [
  'PCI DSS 4.0', 'HIPAA', 'SOC 2 Type II', 'ISO 27001:2022', 'NIST CSF 2.0',
  'NIST SP 800-53', 'GDPR', 'CIS Controls v8', 'FedRAMP', 'FISMA',
  'CCPA', 'DORA', 'NIS2', 'SWIFT CSCF', 'OWASP ASVS', 'MITRE ATT&CK',
  'OWASP Top 10', 'Cloud Security Alliance CCM', 'HITRUST', 'FedRAMP High',
];

export default function PolicyEngine() {
  return (
    <>
      <section className="py-20 bg-white border-b border-gray-100">
        <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mb-16">
            <div className="section-label mb-4">Policy Engine</div>
            <h1 className="text-5xl font-bold text-gray-900 leading-tight mb-6">
              Security policies as code — enforced continuously
            </h1>
            <p className="text-xl text-gray-500 leading-relaxed mb-4">
              OmniGuard's Policy Engine transforms security requirements into continuously enforced rules. Write policies in YAML or compile them as WebAssembly (Wasm) modules for maximum portability and performance.
            </p>
            <p className="text-base text-gray-500 leading-relaxed mb-8">
              Ingest existing compliance documents, auto-generate policies from natural language, test them against the Architecture Nexus before deployment, and enforce them across your entire environment — from PR checks to production monitoring.
            </p>
            <div className="flex gap-3">
              <Link to="/book-demo" className="btn-primary">Book a Demo <ArrowRight size={15} /></Link>
              <Link to="/docs" className="btn-secondary">Documentation</Link>
            </div>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: Code, title: 'YAML & Wasm Policies', desc: 'Write policies as human-readable YAML rules or compile them to WebAssembly for zero-overhead enforcement across any environment.' },
              { icon: FileText, title: 'Natural Language Parsing', desc: 'Describe a security requirement in plain English. OmniGuard parses the intent, converts it to a structured rule, and maps it to applicable compliance frameworks.' },
              { icon: Cpu, title: 'Document Ingestion', desc: 'Upload existing security standards, internal policies, vendor requirements, or audit reports. OmniGuard extracts enforceable rules automatically.' },
              { icon: Check, title: 'Test Before You Enforce', desc: 'Run policies against the Architecture Nexus in simulation before activating them. See exactly what would be flagged — no surprises in production.' },
              { icon: Lock, title: 'Approval Workflows', desc: 'Enterprise-grade versioning with mandatory review and approval before any policy change reaches enforcement.' },
              { icon: GitBranch, title: 'Policy Diff & Audit', desc: 'Track every policy change with full diff history, change ownership, and automated impact analysis against your active Architecture Nexus.' },
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
              <div className="section-label mb-4">Policy-as-Code Workflow</div>
              <h2 className="section-title mb-6">From requirement to enforcement in one workflow</h2>
              <p className="section-subtitle mb-6">
                OmniGuard's Policy Engine bridges the gap between security intent and technical enforcement. Write what you mean — OmniGuard handles the translation, testing, and deployment.
              </p>

              <div className="space-y-3 mb-6">
                {[
                  { flag: 'omniguard policy install omniguard/pci-dss-bundle', desc: 'Install a curated policy bundle' },
                  { flag: 'omniguard policy validate ./policies/', desc: 'Validate syntax before deployment' },
                  { flag: 'omniguard policy test --rule my-custom-rule.yaml', desc: 'Dry-run a rule against live Architecture Nexus' },
                  { flag: 'omniguard policy diff ./policies/v2 --format table', desc: 'Review impact before activating' },
                ].map((item) => (
                  <div key={item.flag} className="bg-white border border-gray-200 rounded-lg p-4">
                    <code className="text-xs font-mono text-blue-600 block mb-1">{item.flag}</code>
                    <p className="text-xs text-gray-500">{item.desc}</p>
                  </div>
                ))}
              </div>

              <div className="bg-gray-950 rounded-lg p-4">
                <div className="text-xs text-gray-500 font-mono mb-3">example-policy.yaml</div>
                <pre className="text-xs font-mono text-green-400 leading-relaxed overflow-x-auto">{`policy "pci-cardholder-isolation" {
  when service.tags contains "cardholder-data"
  require:
    - network.segment == "pci-isolated"
    - network.ingress.internet == false
    - tls.minimum_version >= "1.3"
    - audit.log.tamper_evident == true
  frameworks: [PCI-DSS-4.0:1.3, PCI-DSS-4.0:10.2]
  severity: CRITICAL
}`}</pre>
              </div>
            </div>

            <div>
              <div className="section-label mb-4">Compliance Frameworks</div>
              <h2 className="section-title mb-6">180+ frameworks, continuously mapped</h2>
              <p className="section-subtitle mb-6">
                OmniGuard Nexus maintains an up-to-date library of compliance frameworks. Every policy is automatically cross-referenced with applicable control families across all relevant frameworks simultaneously.
              </p>
              <div className="flex flex-wrap gap-2">
                {frameworks.map((fw) => (
                  <span key={fw} className="px-3 py-1.5 bg-white border border-gray-200 rounded-full text-xs font-medium text-gray-700">
                    {fw}
                  </span>
                ))}
                <span className="px-3 py-1.5 bg-blue-50 border border-blue-100 rounded-full text-xs font-medium text-blue-700">
                  + 160 more
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-gray-950">
        <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-white mb-4">Write it once, enforce it everywhere</h2>
          <p className="text-gray-400 mb-8 max-w-lg mx-auto">
            YAML or Wasm — tested, versioned, and continuously enforced across your entire SDLC.
          </p>
          <Link to="/book-demo" className="btn-primary text-sm px-7 py-3">
            Book a Demo <ArrowRight size={16} />
          </Link>
        </div>
      </section>
    </>
  );
}
