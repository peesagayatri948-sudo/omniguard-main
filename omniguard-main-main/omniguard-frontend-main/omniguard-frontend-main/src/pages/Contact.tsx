import { useState } from 'react';
import { ArrowRight, Check } from 'lucide-react';

const industries = [
  'Technology / SaaS', 'Financial Services', 'Healthcare', 'Government / Public Sector',
  'Retail / E-commerce', 'Manufacturing', 'Media / Entertainment', 'Other',
];
const teamSizes = ['1–10', '11–50', '51–200', '201–500', '501–2,000', '2,000+'];
const cloudProviders = ['AWS', 'Azure', 'Google Cloud', 'Multi-cloud', 'On-premises', 'Other'];
const aiProviders = ['OpenAI', 'Anthropic', 'Google Gemini', 'AWS Bedrock', 'Azure OpenAI', 'Self-hosted / Ollama', 'None yet'];
const meetingTimes = ['Morning (9am–12pm)', 'Afternoon (12pm–4pm)', 'Late afternoon (4pm–6pm)', 'Flexible'];

export default function Contact() {
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    company: '', teamSize: '', industry: '', stack: '', cloud: '',
    aiProvider: '', message: '', meetingTime: '', email: '', name: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <>
      <section className="py-20 bg-white border-b border-gray-100">
        <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16">
            {/* Left */}
            <div>
              <div className="section-label mb-4">Contact Sales</div>
              <h1 className="text-5xl font-bold text-gray-900 leading-tight mb-6">
                Schedule a Discovery Call
              </h1>
              <p className="text-lg text-gray-500 leading-relaxed mb-8">
                We work closely with every organization to understand existing security workflows, compliance requirements, AI adoption strategy, deployment preferences, and enterprise goals before implementation.
              </p>

              <div className="space-y-6">
                {[
                  { step: '1', label: 'Discovery Call', desc: 'We learn about your environment, team, and security goals.' },
                  { step: '2', label: 'Live Demo', desc: 'We build an Architecture Nexus for one of your repositories, live.' },
                  { step: '3', label: 'Proposal', desc: 'We recommend the right plan, deployment model, and integration path.' },
                  { step: '4', label: 'Onboarding', desc: 'Your dedicated CSM guides you through full deployment and policy setup.' },
                ].map((s) => (
                  <div key={s.step} className="flex items-start gap-4">
                    <div className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                      {s.step}
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-gray-900">{s.label}</div>
                      <div className="text-sm text-gray-500 mt-0.5">{s.desc}</div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-12 pt-8 border-t border-gray-100">
                <div className="text-sm font-semibold text-gray-900 mb-4">What we'll cover</div>
                <ul className="space-y-2">
                  {[
                    'Your current security stack and gap analysis',
                    'Compliance requirements and framework coverage',
                    'AI adoption strategy and governance needs',
                    'Deployment preferences (SaaS, self-hosted, air-gapped)',
                    'Integration requirements with existing tooling',
                    'Team structure and rollout plan',
                  ].map((item) => (
                    <li key={item} className="flex items-center gap-3 text-sm text-gray-600">
                      <Check size={13} className="text-blue-600 flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Form */}
            <div>
              {submitted ? (
                <div className="bg-green-50 border border-green-200 rounded-xl p-10 text-center">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Check size={22} className="text-green-600" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">Thanks for reaching out</h3>
                  <p className="text-gray-500 text-sm">
                    A member of our team will be in touch within one business day to schedule your discovery call.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="bg-gray-50 border border-gray-200 rounded-xl p-8 space-y-5">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1.5">Full Name *</label>
                      <input
                        required
                        type="text"
                        className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                        placeholder="Jane Smith"
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1.5">Work Email *</label>
                      <input
                        required
                        type="email"
                        className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                        placeholder="jane@company.com"
                        value={form.email}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1.5">Company *</label>
                      <input
                        required
                        type="text"
                        className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                        placeholder="Acme Corp"
                        value={form.company}
                        onChange={(e) => setForm({ ...form, company: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1.5">Team Size</label>
                      <select
                        className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                        value={form.teamSize}
                        onChange={(e) => setForm({ ...form, teamSize: e.target.value })}
                      >
                        <option value="">Select...</option>
                        {teamSizes.map((s) => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">Industry</label>
                    <select
                      className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                      value={form.industry}
                      onChange={(e) => setForm({ ...form, industry: e.target.value })}
                    >
                      <option value="">Select...</option>
                      {industries.map((i) => <option key={i} value={i}>{i}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">Current Security Stack</label>
                    <input
                      type="text"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                      placeholder="e.g. Snyk, Wiz, GitHub Advanced Security..."
                      value={form.stack}
                      onChange={(e) => setForm({ ...form, stack: e.target.value })}
                    />
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1.5">Cloud Providers</label>
                      <select
                        className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                        value={form.cloud}
                        onChange={(e) => setForm({ ...form, cloud: e.target.value })}
                      >
                        <option value="">Select...</option>
                        {cloudProviders.map((c) => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1.5">Primary AI Provider</label>
                      <select
                        className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                        value={form.aiProvider}
                        onChange={(e) => setForm({ ...form, aiProvider: e.target.value })}
                      >
                        <option value="">Select...</option>
                        {aiProviders.map((a) => <option key={a} value={a}>{a}</option>)}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">Message</label>
                    <textarea
                      rows={3}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white resize-none"
                      placeholder="Tell us about your security goals and what you're hoping to accomplish..."
                      value={form.message}
                      onChange={(e) => setForm({ ...form, message: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">Preferred Meeting Time</label>
                    <div className="grid grid-cols-2 gap-2">
                      {meetingTimes.map((t) => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => setForm({ ...form, meetingTime: t })}
                          className={`py-2 text-xs font-medium rounded-lg border transition-colors ${
                            form.meetingTime === t
                              ? 'border-blue-600 bg-blue-50 text-blue-700'
                              : 'border-gray-300 text-gray-600 hover:border-gray-400 bg-white'
                          }`}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>

                  <button type="submit" className="btn-primary w-full justify-center text-sm py-3">
                    Book Consultation <ArrowRight size={15} />
                  </button>

                  <p className="text-xs text-gray-400 text-center">
                    By submitting, you agree to our Privacy Policy and Terms of Service.
                  </p>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
