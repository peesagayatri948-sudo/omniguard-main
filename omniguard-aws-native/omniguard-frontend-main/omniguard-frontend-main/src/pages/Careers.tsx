import { Link } from 'react-router-dom';
import { ArrowRight, ChevronRight } from 'lucide-react';

const openRoles = [
  {
    dept: 'Engineering',
    roles: [
      { title: 'Senior Platform Engineer', location: 'San Francisco / Remote', type: 'Full-time' },
      { title: 'Security Research Engineer', location: 'San Francisco / Remote', type: 'Full-time' },
      { title: 'AI/ML Engineer — Security Models', location: 'Remote', type: 'Full-time' },
      { title: 'Frontend Engineer (React + TypeScript)', location: 'Remote', type: 'Full-time' },
      { title: 'Backend Engineer (Go/Rust)', location: 'Remote', type: 'Full-time' },
    ],
  },
  {
    dept: 'Security',
    roles: [
      { title: 'AppSec Research Lead', location: 'San Francisco / Remote', type: 'Full-time' },
      { title: 'Compliance & Frameworks Engineer', location: 'Remote', type: 'Full-time' },
      { title: 'Threat Modeling Specialist', location: 'Remote', type: 'Full-time' },
    ],
  },
  {
    dept: 'Go-To-Market',
    roles: [
      { title: 'Enterprise Account Executive', location: 'New York / San Francisco', type: 'Full-time' },
      { title: 'Solutions Engineer', location: 'Remote', type: 'Full-time' },
      { title: 'Customer Success Manager — Enterprise', location: 'Remote', type: 'Full-time' },
      { title: 'Product Marketing Manager', location: 'San Francisco / Remote', type: 'Full-time' },
    ],
  },
];

export default function Careers() {
  return (
    <>
      <section className="py-20 bg-white border-b border-gray-100">
        <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mb-16">
            <div className="section-label mb-4">Careers</div>
            <h1 className="text-5xl font-bold text-gray-900 leading-tight mb-6">
              Help us make continuous, defensible security the standard
            </h1>
            <p className="text-xl text-gray-500 leading-relaxed">
              We're a team of security engineers, platform engineers, and AI researchers who believe most security failures trace back to architecture — and that software can automatically find what's missing.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-16">
            {[
              { label: 'Competitive salary', desc: 'Top-of-market compensation benchmarked quarterly.' },
              { label: 'Remote-first', desc: 'Work from anywhere with optional office presence in SF and NYC.' },
              { label: 'Equity', desc: 'Meaningful equity in a high-growth security platform.' },
              { label: 'Health & wellness', desc: 'Full medical, dental, vision, and wellness stipend.' },
              { label: 'Learning budget', desc: '$3,000 annual learning and conference budget.' },
              { label: 'Mission-driven', desc: 'Build technology that meaningfully improves software security.' },
            ].map((b) => (
              <div key={b.label} className="card-subtle">
                <div className="text-sm font-semibold text-gray-900 mb-2">{b.label}</div>
                <p className="text-sm text-gray-500">{b.desc}</p>
              </div>
            ))}
          </div>

          {openRoles.map((group) => (
            <div key={group.dept} className="mb-10">
              <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">{group.dept}</h2>
              <div className="space-y-2">
                {group.roles.map((role) => (
                  <div key={role.title} className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg hover:border-blue-200 hover:bg-blue-50/30 transition-all group cursor-pointer">
                    <div>
                      <div className="text-sm font-semibold text-gray-900 group-hover:text-blue-700">{role.title}</div>
                      <div className="text-xs text-gray-400 mt-0.5">{role.location} · {role.type}</div>
                    </div>
                    <ChevronRight size={16} className="text-gray-300 group-hover:text-blue-500 transition-colors" />
                  </div>
                ))}
              </div>
            </div>
          ))}

          <div className="mt-8 bg-gray-50 border border-gray-200 rounded-xl p-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Don't see your role?</h3>
            <p className="text-sm text-gray-500 mb-5">
              We're always interested in exceptional security engineers, platform engineers, and researchers. Send us a note about how you'd contribute.
            </p>
            <Link to="/contact" className="btn-primary text-sm">
              Get in Touch <ArrowRight size={15} />
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
