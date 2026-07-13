import { useState } from 'react';
import { ArrowRight, Check, Calendar } from 'lucide-react';

const times = ['9:00 AM', '9:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM',
  '1:00 PM', '1:30 PM', '2:00 PM', '2:30 PM', '3:00 PM', '3:30 PM', '4:00 PM'];

export default function BookDemo() {
  const [submitted, setSubmitted] = useState(false);
  const [selectedTime, setSelectedTime] = useState('');
  const [form, setForm] = useState({ name: '', email: '', company: '', role: '', teamSize: '' });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <>
      <section className="py-20 bg-white border-b border-gray-100">
        <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-start">
            <div>
              <div className="section-label mb-4">Book a Demo</div>
              <h1 className="text-5xl font-bold text-gray-900 leading-tight mb-6">
                See OmniGuard Nexus in your environment
              </h1>
              <p className="text-lg text-gray-500 leading-relaxed mb-8">
                In a 45-minute demo, our team will walk through the Architecture Nexus built live for one of your repositories — showing exactly what OmniGuard Nexus finds that other tools miss.
              </p>

              <div className="space-y-4 mb-10">
                {[
                  { label: '45-minute session', desc: 'Focused demo tailored to your stack and use case' },
                  { label: 'Live architecture discovery', desc: 'We\'ll run OmniGuard on a real repository during the call' },
                  { label: 'Architecture Nexus walkthrough', desc: 'See your architecture, trust boundaries, and threats visualized' },
                  { label: 'Missing controls analysis', desc: 'Identify what existing tools aren\'t finding in your environment' },
                  { label: 'Q&A with a security engineer', desc: 'Technical questions answered by the team that built OmniGuard' },
                ].map((item) => (
                  <div key={item.label} className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check size={11} className="text-blue-600" />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-900">{item.label}</div>
                      <div className="text-sm text-gray-400">{item.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              {submitted ? (
                <div className="bg-green-50 border border-green-200 rounded-xl p-10 text-center">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Calendar size={22} className="text-green-600" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">Demo scheduled</h3>
                  <p className="text-gray-500 text-sm mb-2">
                    You'll receive a calendar invitation at <span className="font-medium">{form.email}</span> within a few minutes.
                  </p>
                  <p className="text-gray-400 text-xs">
                    Please connect a repository link before the call if you'd like us to demo against your actual codebase.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="bg-gray-50 border border-gray-200 rounded-xl p-8 space-y-5">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1.5">Full Name *</label>
                      <input
                        required type="text"
                        className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                        placeholder="Jane Smith"
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1.5">Work Email *</label>
                      <input
                        required type="email"
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
                        required type="text"
                        className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                        placeholder="Acme Corp"
                        value={form.company}
                        onChange={(e) => setForm({ ...form, company: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1.5">Your Role</label>
                      <input
                        type="text"
                        className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                        placeholder="CISO, VP Engineering, etc."
                        value={form.role}
                        onChange={(e) => setForm({ ...form, role: e.target.value })}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-3">Select a Time (PT)</label>
                    <div className="grid grid-cols-3 gap-2">
                      {times.map((t) => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => setSelectedTime(t)}
                          className={`py-2 text-xs font-medium rounded-lg border transition-colors ${
                            selectedTime === t
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
                    Book Demo <ArrowRight size={15} />
                  </button>
                  <p className="text-xs text-gray-400 text-center">
                    No commitment required. Your information is never shared.
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
