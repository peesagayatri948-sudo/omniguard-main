import { Link } from 'react-router-dom';
import { ArrowRight, Check, Lock, Users, BarChart3, Shield, Building, Globe } from 'lucide-react';

const features = [
  { icon: Users, title: 'Role-Based Access Control', desc: 'Four-tier RBAC: Owner, Admin, Member, and Viewer. Granular resource-level permissions, cross-workspace policy inheritance, and CLI-enforced role boundaries.' },
  { icon: Lock, title: 'Single Sign-On (SSO)', desc: 'SAML 2.0 and OIDC support with Okta, Azure AD, Google Workspace, and any standard identity provider.' },
  { icon: Shield, title: 'Audit Logs', desc: 'Comprehensive, tamper-evident audit logs for every action, API call, policy change, and AI decision across your organization.' },
  { icon: Building, title: 'Organizations & Workspaces', desc: 'Multi-tenant organization management. Create isolated projects per business unit with omniguard project create. Invite team members with omniguard org invite and assign Owner, Admin, Member, or Viewer roles.' },
  { icon: BarChart3, title: 'Usage Analytics', desc: 'Detailed usage reporting for scanning activity, AI provider consumption, user actions, and security posture trends.' },
  { icon: Globe, title: 'Self-Hosted Deployment', desc: 'Deploy OmniGuard Nexus in your own cloud, on-premises, or air-gapped environment with full feature parity.' },
];

export default function Enterprise() {
  return (
    <>
      <section className="py-20 bg-white border-b border-gray-100">
        <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mb-16">
            <div className="section-label mb-4">Enterprise</div>
            <h1 className="text-5xl font-bold text-gray-900 leading-tight mb-6">
              Built for the governance requirements of enterprise organizations
            </h1>
            <p className="text-xl text-gray-500 leading-relaxed mb-8">
              OmniGuard Nexus includes everything large organizations need: RBAC, SSO, audit logs, self-hosted deployment, multi-org management, and dedicated enterprise support — all included in the Enterprise plan.
            </p>
            <div className="flex gap-3">
              <Link to="/contact" className="btn-primary">Contact Sales <ArrowRight size={15} /></Link>
              <Link to="/book-demo" className="btn-secondary">Book a Demo</Link>
            </div>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f) => (
              <div key={f.title} className="card">
                <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center mb-4">
                  <f.icon size={20} className="text-blue-600" />
                </div>
                <h3 className="text-base font-semibold text-gray-900 mb-2">{f.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 bg-gray-50 border-b border-gray-100">
        <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <div className="section-label mb-4">Deployment Options</div>
              <h2 className="section-title mb-6">Deploy where your data needs to stay</h2>
              <p className="section-subtitle mb-8">
                OmniGuard Nexus offers flexible deployment options to meet your data residency, compliance, and security requirements.
              </p>
              <div className="space-y-4">
                {[
                  { name: 'SaaS Cloud', desc: 'Fully managed deployment on OmniGuard infrastructure. Highest availability, fastest updates, zero ops burden.' },
                  { name: 'Customer-Hosted Cloud', desc: 'Deploy into your AWS, Azure, or GCP account. Data stays in your cloud environment under your control.' },
                  { name: 'On-Premises', desc: 'Deploy on your own servers or private cloud. Full feature parity with cloud deployments.' },
                  { name: 'Air-Gapped', desc: 'Fully disconnected deployment for highly classified or regulated environments. Local AI model support included.' },
                ].map((opt) => (
                  <div key={opt.name} className="bg-white border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center gap-3 mb-2">
                      <Check size={14} className="text-blue-600" />
                      <span className="text-sm font-semibold text-gray-900">{opt.name}</span>
                    </div>
                    <p className="text-xs text-gray-500 ml-5 leading-relaxed">{opt.desc}</p>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <div className="section-label mb-4">Customer Success</div>
              <h2 className="section-title mb-6">Dedicated enterprise support from day one</h2>
              <p className="section-subtitle mb-6">
                Every enterprise customer receives a dedicated customer success manager, onboarding assistance, architecture review, and direct access to our security engineering team.
              </p>
              <ul className="space-y-3">
                {[
                  'Dedicated Customer Success Manager',
                  'Guided onboarding and architecture review',
                  'Custom policy development assistance',
                  '24/7 priority support with SLA guarantees',
                  'Quarterly security posture reviews',
                  'Training for security and development teams',
                  'Direct access to product engineering',
                  'Custom compliance framework development',
                ].map((item) => (
                  <li key={item} className="flex items-center gap-3 text-sm text-gray-700">
                    <Check size={14} className="text-blue-600 flex-shrink-0" />
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
          <h2 className="text-4xl font-bold text-white mb-4">Ready to talk enterprise?</h2>
          <p className="text-gray-400 mb-8 max-w-lg mx-auto">
            Our sales team works closely with every organization to design the right deployment and pricing for your needs.
          </p>
          <Link to="/contact" className="btn-primary text-sm px-7 py-3">
            Contact Sales <ArrowRight size={16} />
          </Link>
        </div>
      </section>
    </>
  );
}
