import { Link } from 'react-router-dom';
import { ArrowRight, Check } from 'lucide-react';

export default function Support() {
  return (
    <>
      <section className="py-20 bg-white border-b border-gray-100">
        <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mb-16">
            <div className="section-label mb-4">Support</div>
            <h1 className="text-5xl font-bold text-gray-900 leading-tight mb-6">
              We're here to help
            </h1>
            <p className="text-xl text-gray-500 leading-relaxed">
              From documentation and community forums to dedicated enterprise support, OmniGuard Nexus provides the support resources you need at every stage.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 mb-16">
            {[
              { title: 'Documentation', desc: 'Comprehensive guides, API references, CLI documentation, and architecture walkthroughs.', cta: 'Browse Docs', href: '/docs' },
              { title: 'Community Forum', desc: 'Ask questions, share configurations, and connect with other OmniGuard Nexus users.', cta: 'Join Community', href: '#' },
              { title: 'Enterprise Support', desc: 'Dedicated support with SLA guarantees, priority escalation, and direct engineering access.', cta: 'Contact Support', href: '/contact' },
            ].map((item) => (
              <div key={item.title} className="card">
                <h3 className="text-base font-semibold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed mb-4">{item.desc}</p>
                <Link to={item.href} className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:gap-2 transition-all">
                  {item.cta} <ArrowRight size={12} />
                </Link>
              </div>
            ))}
          </div>

          <div id="status">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Platform Status</h2>
            <div className="bg-green-50 border border-green-200 rounded-lg p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
                <span className="text-sm font-semibold text-green-800">All systems operational</span>
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {[
                  'API — Operational',
                  'Graph Engine — Operational',
                  'Scanning Service — Operational',
                  'Agent Orchestration — Operational',
                  'VS Code Extension — Operational',
                  'CLI — Operational',
                  'Dashboard — Operational',
                  'Compliance Reports — Operational',
                ].map((service) => (
                  <div key={service} className="flex items-center gap-2 text-xs text-green-700">
                    <Check size={11} className="text-green-600" />
                    {service}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
