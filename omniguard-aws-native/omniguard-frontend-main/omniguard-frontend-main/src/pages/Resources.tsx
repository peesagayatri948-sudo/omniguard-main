import { ChevronRight } from 'lucide-react';

const resources = [
  {
    type: 'Whitepaper',
    title: 'The Case for Continuous Threat Modeling',
    desc: 'A comprehensive analysis of why point-in-time threat modeling creates systemic blind spots and how continuous architectural analysis changes the risk equation.',
    pages: '22 pages',
  },
  {
    type: 'Guide',
    title: 'PCI DSS 4.0 Compliance Automation Guide',
    desc: 'A technical guide for engineering teams on automating PCI DSS 4.0 control validation, evidence collection, and continuous compliance monitoring.',
    pages: '18 pages',
  },
  {
    type: 'Report',
    title: '2025 State of Architecture Security',
    desc: 'OmniGuard\'s annual analysis of architectural security trends, common missing controls, and the most exploited design flaws across modern cloud applications.',
    pages: '35 pages',
  },
  {
    type: 'Guide',
    title: 'Secure AI Development: Governance Patterns for Enterprise Teams',
    desc: 'How to govern AI-powered development workflows — from prompt policy enforcement to AI data flow mapping and model risk management.',
    pages: '14 pages',
  },
  {
    type: 'Whitepaper',
    title: 'Trust Boundary Analysis in Microservices Architectures',
    desc: 'Deep dive into trust boundary identification, validation, and enforcement across distributed, containerized, and cloud-native application architectures.',
    pages: '26 pages',
  },
  {
    type: 'Checklist',
    title: 'Enterprise Security Architecture Review Checklist',
    desc: '150+ control checks across architecture design, cloud configuration, identity and access, data protection, monitoring, and incident response.',
    pages: '12 pages',
  },
];

export default function Resources() {
  return (
    <>
      <section className="py-20 bg-white border-b border-gray-100">
        <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mb-12">
            <div className="section-label mb-4">Resources</div>
            <h1 className="text-5xl font-bold text-gray-900 leading-tight mb-6">
              Security architecture research and guides
            </h1>
            <p className="section-subtitle">
              Whitepapers, technical guides, and research reports from the OmniGuard Nexus security team.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {resources.map((r) => (
              <div key={r.title} className="card group cursor-pointer">
                <div className="flex items-center gap-2 mb-4">
                  <span className={`tag text-xs ${
                    r.type === 'Whitepaper' ? 'bg-blue-50 text-blue-700' :
                    r.type === 'Guide' ? 'bg-green-50 text-green-700' :
                    r.type === 'Report' ? 'bg-orange-50 text-orange-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>{r.type}</span>
                  <span className="text-xs text-gray-400">{r.pages}</span>
                </div>
                <h3 className="text-sm font-semibold text-gray-900 mb-3 group-hover:text-blue-700 transition-colors leading-snug">
                  {r.title}
                </h3>
                <p className="text-xs text-gray-500 leading-relaxed mb-4">{r.desc}</p>
                <span className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 group-hover:gap-2 transition-all">
                  Download <ChevronRight size={12} />
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 bg-gray-50">
        <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Stay up to date</h2>
          <p className="text-gray-500 mb-8 max-w-lg mx-auto">
            Get new research, guides, and product updates delivered to your inbox.
          </p>
          <div className="flex max-w-md mx-auto gap-3">
            <input
              type="email"
              placeholder="your@company.com"
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button className="btn-primary text-sm">Subscribe</button>
          </div>
        </div>
      </section>
    </>
  );
}
