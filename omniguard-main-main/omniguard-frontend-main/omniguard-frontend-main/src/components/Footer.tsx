import { Link } from 'react-router-dom';
import { Shield } from 'lucide-react';

const footerLinks = {
  Platform: [
    { label: 'Platform Overview', href: '/platform' },
    { label: 'Architecture Nexus', href: '/platform/architecture-nexus' },
    { label: 'Security Engine', href: '/platform/security-engine' },
    { label: 'AI Platform', href: '/platform/ai-platform' },
    { label: 'Policy Engine', href: '/platform/policy-engine' },
    { label: 'Threat Modeling', href: '/platform/threat-modeling' },
    { label: 'Platform Architecture', href: '/platform/architecture' },
  ],
  Solutions: [
    { label: 'Continuous Threat Modeling', href: '/solutions/threat-modeling' },
    { label: 'Secure SDLC', href: '/solutions/secure-sdlc' },
    { label: 'AI Security & Governance', href: '/solutions/ai-security' },
    { label: 'Compliance Automation', href: '/solutions/compliance' },
    { label: 'Cloud Security Posture', href: '/solutions/cloud-security' },
    { label: 'Financial Services', href: '/solutions/financial-services' },
    { label: 'Healthcare', href: '/solutions/healthcare' },
  ],
  Developers: [
    { label: 'CLI', href: '/cli' },
    { label: 'VS Code Extension', href: '/vscode' },
    { label: 'MCP Server', href: '/mcp' },
    { label: 'Documentation', href: '/docs' },
    { label: 'API Reference', href: '/docs/api' },
    { label: 'Integrations', href: '/integrations' },
    { label: 'Blog', href: '/blog' },
  ],
  Company: [
    { label: 'About', href: '/about' },
    { label: 'Careers', href: '/careers' },
    { label: 'Contact', href: '/contact' },
    { label: 'Enterprise', href: '/enterprise' },
    { label: 'Pricing', href: '/pricing' },
    { label: 'Support', href: '/support' },
    { label: 'Book a Demo', href: '/book-demo' },
  ],
};

export default function Footer() {
  return (
    <footer className="bg-gray-950 text-gray-400">
      <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top grid */}
        <div className="py-16 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8">
          {/* Brand */}
          <div className="col-span-2 md:col-span-3 lg:col-span-1">
            <Link to="/" className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center">
                <Shield size={18} className="text-white" />
              </div>
              <span className="text-base font-bold text-white tracking-tight">
                OmniGuard <span className="text-blue-400">Nexus</span>
              </span>
            </Link>
            <p className="text-sm leading-relaxed mb-6 max-w-xs">
              AI finds what's there. OmniGuard Nexus finds what's missing.
            </p>
            <p className="text-xs text-gray-600">
              Adaptable Agentic SDLC Monitoring &<br />Remediation Platform
            </p>
          </div>

          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <div className="text-xs font-semibold text-gray-300 uppercase tracking-widest mb-4">
                {category}
              </div>
              <ul className="space-y-2.5">
                {links.map((link) => (
                  <li key={link.href}>
                    <Link
                      to={link.href}
                      className="text-sm text-gray-500 hover:text-gray-200 transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="border-t border-gray-800 py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-gray-600">
            &copy; {new Date().getFullYear()} OmniGuard Nexus, Inc. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            <Link to="/privacy" className="text-xs text-gray-600 hover:text-gray-400 transition-colors">
              Privacy Policy
            </Link>
            <Link to="/terms" className="text-xs text-gray-600 hover:text-gray-400 transition-colors">
              Terms of Service
            </Link>
            <Link to="/support" className="text-xs text-gray-600 hover:text-gray-400 transition-colors">
              Support
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
