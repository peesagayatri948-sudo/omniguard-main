import { Link } from 'react-router-dom';
import { ArrowRight, ChevronRight } from 'lucide-react';

const solutions = [
  {
    category: 'By Use Case',
    items: [
      { title: 'Continuous Threat Modeling', href: '/solutions/threat-modeling', desc: 'Replace point-in-time threat modeling exercises with always-on architectural threat analysis that updates continuously as your systems evolve.' },
      { title: 'Secure SDLC', href: '/solutions/secure-sdlc', desc: 'Embed security at every stage of the software development lifecycle — from design review to deployment — with automated gates and developer tooling.' },
      { title: 'AI Security & Governance', href: '/solutions/ai-security', desc: 'Govern AI usage across your organization. Map AI data flows, enforce prompt policies, monitor model risk, and maintain compliance with emerging AI regulations.' },
      { title: 'Compliance Automation', href: '/solutions/compliance', desc: 'Continuously map your security controls to PCI DSS, HIPAA, SOC 2, ISO 27001, NIST, and 180+ frameworks. Generate audit-ready reports automatically.' },
      { title: 'Cloud Security Posture', href: '/solutions/cloud-security', desc: 'Continuously detect configuration drift between your deployed cloud infrastructure and secure design baseline. Know instantly when your architecture changes.' },
    ],
  },
  {
    category: 'By Industry',
    items: [
      { title: 'Financial Services', href: '/solutions/financial-services', desc: 'PCI DSS 4.0, SOX, DORA, and SWIFT CSCF compliance with continuous cardholder data environment monitoring and automated evidence collection.' },
      { title: 'Healthcare', href: '/solutions/healthcare', desc: 'HIPAA and HITRUST compliance automation with PHI data flow mapping, access control validation, and continuous privacy posture monitoring.' },
      { title: 'Technology', href: '/solutions/technology', desc: 'Scale security with your engineering organization. Secure modern microservices, APIs, containerized workloads, and multi-cloud deployments.' },
      { title: 'Government', href: '/solutions/government', desc: 'FedRAMP, FISMA, NIST SP 800-53, and CMMC compliance with self-hosted deployment options and full air-gap support.' },
    ],
  },
];

export default function Solutions() {
  return (
    <>
      <section className="py-20 bg-white border-b border-gray-100">
        <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mb-16">
            <div className="section-label mb-4">Solutions</div>
            <h1 className="text-5xl font-bold text-gray-900 leading-tight mb-6">
              Enterprise security solutions for every organization
            </h1>
            <p className="text-xl text-gray-500 leading-relaxed">
              OmniGuard Nexus adapts to your use case, industry, and compliance requirements — whether you're a technology startup scaling security or a regulated enterprise managing complex compliance obligations.
            </p>
          </div>

          {solutions.map((group) => (
            <div key={group.category} className="mb-16">
              <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-6">{group.category}</h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {group.items.map((item) => (
                  <Link key={item.title} to={item.href} className="card group">
                    <h3 className="text-base font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">{item.title}</h3>
                    <p className="text-sm text-gray-500 leading-relaxed mb-4">{item.desc}</p>
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 group-hover:gap-2 transition-all">
                      Learn more <ChevronRight size={13} />
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          ))}

          <div className="bg-blue-600 rounded-xl p-8 flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <h3 className="text-xl font-bold text-white mb-2">Need a custom solution?</h3>
              <p className="text-blue-100 text-sm">Our team works with every organization to design a deployment that fits your security workflow, compliance requirements, and AI adoption strategy.</p>
            </div>
            <Link to="/contact" className="flex-shrink-0 inline-flex items-center gap-2 bg-white text-blue-600 font-semibold text-sm px-6 py-3 rounded hover:bg-blue-50 transition-colors">
              Contact Sales <ArrowRight size={15} />
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
