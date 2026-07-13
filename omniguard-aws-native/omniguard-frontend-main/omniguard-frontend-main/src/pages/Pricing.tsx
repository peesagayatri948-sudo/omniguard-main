import { Link } from 'react-router-dom';
import { ArrowRight, Check } from 'lucide-react';

const plans = [
  {
    name: 'Starter',
    price: 'Free',
    period: 'forever',
    desc: 'For individual security researchers and developers evaluating OmniGuard Nexus.',
    highlight: false,
    cta: 'Start Free',
    ctaHref: '#',
    features: [
      '1 repository',
      'Architecture Nexus (single repo)',
      'CLI & VS Code Extension',
      'Basic threat modeling',
      '5 compliance frameworks',
      'Community support',
    ],
  },
  {
    name: 'Team',
    price: '$299',
    period: 'per month',
    desc: 'For growing engineering teams that need continuous threat modeling and compliance coverage.',
    highlight: true,
    cta: 'Start 14-Day Trial',
    ctaHref: '#',
    features: [
      'Up to 25 repositories',
      'Full Architecture Nexus',
      'All three autonomous agents',
      'PR blocking & merge protection',
      '50 compliance frameworks',
      'AI-assisted remediation',
      'Jira & Slack integration',
      'Priority support',
    ],
  },
  {
    name: 'Business',
    price: '$799',
    period: 'per month',
    desc: 'For security-focused engineering organizations with multi-team deployment needs.',
    highlight: false,
    cta: 'Start 14-Day Trial',
    ctaHref: '#',
    features: [
      'Up to 100 repositories',
      'Full Architecture Nexus',
      'All integrations included',
      '100 compliance frameworks',
      'BYOM & BYOK (AI providers)',
      'Basic RBAC',
      'Audit logs',
      'Priority support + SLA',
    ],
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    period: 'contact us',
    desc: 'For large-scale enterprise deployments with governance, compliance, and data residency requirements.',
    highlight: false,
    cta: 'Contact Sales',
    ctaHref: '/contact',
    features: [
      'Unlimited repositories',
      'Advanced RBAC & SSO',
      'Self-hosted deployment',
      '180+ compliance frameworks',
      'Custom policy development',
      'Dedicated CSM',
      'SLA guarantees',
      '24/7 enterprise support',
    ],
  },
];

const faqs = [
  { q: 'How is pricing calculated?', a: 'Team and Business plans are priced per month. Enterprise pricing is based on the number of active repositories, users, and deployment configuration.' },
  { q: 'Can I start with a free trial?', a: 'Yes. Team and Business plans include a 14-day free trial with no credit card required. The Starter plan is free forever for a single repository.' },
  { q: 'What does "Bring Your Own Model" mean?', a: 'BYOM (Bring Your Own Model) allows you to connect OmniGuard Nexus to your own AI provider contracts — including Anthropic, OpenAI, Azure OpenAI, AWS Bedrock, or a self-hosted model via Ollama or LM Studio. You pay your AI provider directly; OmniGuard does not mark up AI usage.' },
  { q: 'Is self-hosted deployment available on all plans?', a: 'Self-hosted deployment is available on the Enterprise plan. It includes the same feature set as the cloud deployment, including all three autonomous agents and AI capabilities.' },
  { q: 'How quickly can we be up and running?', a: 'OmniGuard Nexus builds a complete Architecture Nexus for a typical repository in minutes. Most teams complete onboarding and see their first graph within the first hour.' },
  { q: 'Do you offer discounts for non-profits or startups?', a: 'Yes. We offer special pricing for early-stage startups and qualifying non-profit organizations. Contact our sales team for details.' },
];

export default function Pricing() {
  return (
    <>
      <section className="py-20 bg-white border-b border-gray-100">
        <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mx-auto text-center mb-16">
            <div className="section-label mb-4">Pricing</div>
            <h1 className="text-5xl font-bold text-gray-900 leading-tight mb-6">
              Transparent pricing for every stage
            </h1>
            <p className="text-xl text-gray-500 leading-relaxed">
              Start free and scale as your security program grows. Every plan includes the Architecture Nexus and continuous threat modeling.
            </p>
          </div>

          <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-6">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`rounded-xl border p-8 flex flex-col ${
                  plan.highlight
                    ? 'border-blue-600 bg-blue-600 shadow-lg'
                    : 'border-gray-200 bg-white'
                }`}
              >
                <div>
                  <div className={`text-xs font-semibold uppercase tracking-wider mb-2 ${plan.highlight ? 'text-blue-200' : 'text-gray-400'}`}>
                    {plan.name}
                  </div>
                  <div className={`text-4xl font-bold mb-1 ${plan.highlight ? 'text-white' : 'text-gray-900'}`}>
                    {plan.price}
                  </div>
                  <div className={`text-sm mb-4 ${plan.highlight ? 'text-blue-200' : 'text-gray-400'}`}>{plan.period}</div>
                  <p className={`text-sm leading-relaxed mb-6 ${plan.highlight ? 'text-blue-100' : 'text-gray-500'}`}>{plan.desc}</p>
                  <ul className="space-y-2.5 mb-8">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-start gap-2.5 text-sm">
                        <Check size={14} className={`mt-0.5 flex-shrink-0 ${plan.highlight ? 'text-blue-200' : 'text-blue-600'}`} />
                        <span className={plan.highlight ? 'text-blue-50' : 'text-gray-700'}>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <Link
                  to={plan.ctaHref}
                  className={`mt-auto block text-center py-2.5 text-sm font-semibold rounded transition-colors ${
                    plan.highlight
                      ? 'bg-white text-blue-600 hover:bg-blue-50'
                      : 'border border-gray-300 text-gray-800 hover:bg-gray-50'
                  }`}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>

          <div className="mt-12 text-center">
            <p className="text-sm text-gray-500">
              All plans include a 14-day trial. No credit card required for Starter.{' '}
              <Link to="/contact" className="text-blue-600 hover:underline">Contact sales</Link>{' '}
              for volume discounts.
            </p>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-3xl font-bold text-gray-900 mb-12 text-center">Frequently asked questions</h2>
            <div className="space-y-6">
              {faqs.map((faq) => (
                <div key={faq.q} className="bg-white border border-gray-200 rounded-lg p-6">
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">{faq.q}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{faq.a}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-gray-950">
        <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-white mb-4">Not sure which plan is right?</h2>
          <p className="text-gray-400 mb-8 max-w-lg mx-auto">
            Talk to our team. We'll help you find the right plan for your organization and use case.
          </p>
          <Link to="/contact" className="btn-primary text-sm px-7 py-3">
            Contact Sales <ArrowRight size={16} />
          </Link>
        </div>
      </section>
    </>
  );
}
