import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

export default function About() {
  return (
    <>
      <section className="py-20 bg-white border-b border-gray-100">
        <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mb-16">
            <div className="section-label mb-4">About</div>
            <h1 className="text-5xl font-bold text-gray-900 leading-tight mb-6">
              We built OmniGuard Nexus because we were tired of finding the same things everyone else finds.
            </h1>
            <p className="text-xl text-gray-500 leading-relaxed">
              Traditional application security tools are reactive. They scan code that already exists and report vulnerabilities that are already present. OmniGuard Nexus was founded on a different premise: security should find what's missing, not just what's there.
            </p>
          </div>
        </div>
      </section>

      <section className="py-20 bg-gray-50 border-b border-gray-100">
        <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <div className="section-label mb-4">Our Mission</div>
              <h2 className="section-title mb-6">
                Make continuous, defensible security architecture the standard for every engineering organization
              </h2>
              <p className="section-subtitle mb-6">
                Every organization deserves a continuously maintained threat model — not just enterprises with dedicated security architects who can manually update diagrams quarterly. OmniGuard Nexus automates the hard parts of security architecture so teams can focus on building.
              </p>
              <p className="text-gray-500 leading-relaxed">
                The Architecture Nexus is our approach to this problem. By continuously mapping architecture, data flows, trust boundaries, threats, and controls into a queryable graph, we give security and engineering teams a shared source of truth that stays current as systems evolve.
              </p>
            </div>
            <div className="space-y-6">
              {[
                { label: 'Founded', value: '2022' },
                { label: 'Headquarters', value: 'San Francisco, CA' },
                { label: 'Team', value: 'Growing' },
                { label: 'Frameworks supported', value: '180+' },
                { label: 'Funding', value: 'Series A' },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between py-4 border-b border-gray-200">
                  <span className="text-sm text-gray-500">{item.label}</span>
                  <span className="text-sm font-semibold text-gray-900">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-white border-b border-gray-100">
        <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="section-label mb-4">Our Principles</div>
          <h2 className="section-title mb-12 max-w-2xl">The values that guide how we build OmniGuard Nexus</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { title: 'Defensible by default', desc: 'Every recommendation must trace back to a threat, framework, control, and evidence. Nothing should appear as an unexplained AI suggestion.' },
              { title: 'Continuous over point-in-time', desc: 'Security posture decays the moment it\'s assessed. We build systems that maintain security continuously, not quarterly.' },
              { title: 'Developer experience matters', desc: 'Security tools that developers ignore are worthless. We build for the developer workflow first, then extend to security teams.' },
              { title: 'Transparency in AI', desc: 'AI-assisted security must be auditable. We build AI workflows that are explainable, deterministic where it matters, and always traceable.' },
              { title: 'Architecture is the root', desc: 'Most security failures trace back to architectural decisions. We focus on the design layer, not just the code layer.' },
              { title: 'No vendor lock-in', desc: 'BYOM, BYOK, self-hosted deployment, and open standards ensure OmniGuard fits into your stack rather than replacing it.' },
            ].map((p) => (
              <div key={p.title}>
                <h3 className="text-base font-semibold text-gray-900 mb-3">{p.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 bg-gray-50">
        <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Join us in building safer software</h2>
          <p className="text-gray-500 mb-8 max-w-lg mx-auto">
            We're a growing team of security engineers, platform engineers, and AI researchers building the future of application security.
          </p>
          <div className="flex justify-center gap-4">
            <Link to="/careers" className="btn-primary text-sm">View Open Roles <ArrowRight size={15} /></Link>
            <Link to="/contact" className="btn-secondary text-sm">Contact Us</Link>
          </div>
        </div>
      </section>
    </>
  );
}
