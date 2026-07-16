import { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ChevronDown, Menu, X, Shield, ArrowRight, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface MegaMenuSection {
  label: string;
  items: { label: string; href: string; desc?: string }[];
}

interface NavItem {
  label: string;
  href?: string;
  megaMenu?: MegaMenuSection[];
}

const navItems: NavItem[] = [
  {
    label: 'Platform',
    megaMenu: [
      {
        label: 'Core Platform',
        items: [
          { label: 'Platform Overview', href: '/platform', desc: 'The complete OmniGuard Nexus platform' },
          { label: 'Architecture Nexus', href: '/platform/architecture-nexus', desc: 'Single source of truth for architecture & security' },
          { label: 'Platform Architecture', href: '/platform/architecture', desc: 'Three-agent orchestration engine' },
          { label: 'Threat Modeling', href: '/platform/threat-modeling', desc: 'Continuous automated threat analysis' },
        ],
      },
      {
        label: 'Capabilities',
        items: [
          { label: 'Security Engine', href: '/platform/security-engine', desc: 'AI-powered scanning & detection' },
          { label: 'AI Platform', href: '/platform/ai-platform', desc: 'Governed multi-model orchestration' },
          { label: 'Policy Engine', href: '/platform/policy-engine', desc: 'Policy-as-Code enforcement' },
        ],
      },
      {
        label: 'Developer Tools',
        items: [
          { label: 'CLI', href: '/cli', desc: 'Full-featured command-line interface' },
          { label: 'VS Code Extension', href: '/vscode', desc: 'Live security inside your editor' },
          { label: 'MCP Server', href: '/mcp', desc: 'Model Context Protocol integration' },
        ],
      },
    ],
  },
  {
    label: 'Solutions',
    megaMenu: [
      {
        label: 'By Use Case',
        items: [
          { label: 'Continuous Threat Modeling', href: '/solutions/threat-modeling', desc: 'Always-on architectural threat analysis' },
          { label: 'Secure SDLC', href: '/solutions/secure-sdlc', desc: 'Security at every development stage' },
          { label: 'AI Security & Governance', href: '/solutions/ai-security', desc: 'Secure your AI-powered applications' },
          { label: 'Compliance Automation', href: '/solutions/compliance', desc: 'PCI, HIPAA, SOC 2, ISO 27001 & more' },
          { label: 'Cloud Security Posture', href: '/solutions/cloud-security', desc: 'Continuous cloud configuration analysis' },
        ],
      },
      {
        label: 'By Industry',
        items: [
          { label: 'Financial Services', href: '/solutions/financial-services', desc: 'PCI DSS & regulatory compliance' },
          { label: 'Healthcare', href: '/solutions/healthcare', desc: 'HIPAA & PHI protection workflows' },
          { label: 'Technology', href: '/solutions/technology', desc: 'Secure modern software at scale' },
          { label: 'Government', href: '/solutions/government', desc: 'FedRAMP, FISMA & NIST frameworks' },
        ],
      },
    ],
  },
  {
    label: 'Integrations',
    href: '/integrations',
  },
  {
    label: 'Enterprise',
    href: '/enterprise',
  },
  {
    label: 'Pricing',
    href: '/pricing',
  },
  {
    label: 'Resources',
    megaMenu: [
      {
        label: 'Learn',
        items: [
          { label: 'Documentation', href: '/docs', desc: 'Guides, references, and API docs' },
          { label: 'Blog', href: '/blog', desc: 'Security research and product updates' },
          { label: 'Resource Library', href: '/resources', desc: 'Whitepapers, reports, and guides' },
        ],
      },
      {
        label: 'Support',
        items: [
          { label: 'Support Center', href: '/support', desc: 'Get help from our team' },
          { label: 'Status', href: '/support#status', desc: 'Platform availability' },
        ],
      },
      {
        label: 'Company',
        items: [
          { label: 'About', href: '/about', desc: 'Our mission and team' },
          { label: 'Careers', href: '/careers', desc: 'Join the OmniGuard team' },
          { label: 'Contact', href: '/contact', desc: 'Talk to our team' },
        ],
      },
    ],
  },
];

export default function Navigation() {
  const [open, setOpen] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setOpen(null);
    setMobileOpen(false);
  }, [location]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(null);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-200 ${
          scrolled ? 'bg-white border-b border-gray-200 shadow-sm' : 'bg-white border-b border-gray-200'
        }`}
      >
        <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16" ref={menuRef}>
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2.5 flex-shrink-0">
              <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center">
                <Shield className="w-4.5 h-4.5 text-white" size={18} />
              </div>
              <span className="text-base font-bold text-gray-900 tracking-tight">
                OmniGuard <span className="text-blue-600">Nexus</span>
              </span>
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden lg:flex items-center gap-1">
              {navItems.map((item) => (
                <div key={item.label} className="relative">
                  {item.megaMenu ? (
                    <button
                      className={`flex items-center gap-1 px-3 py-2 text-sm font-medium rounded transition-colors ${
                        open === item.label
                          ? 'text-gray-900 bg-gray-100'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                      }`}
                      onMouseEnter={() => setOpen(item.label)}
                      onClick={() => setOpen(open === item.label ? null : item.label)}
                    >
                      {item.label}
                      <ChevronDown
                        size={14}
                        className={`transition-transform duration-200 ${open === item.label ? 'rotate-180' : ''}`}
                      />
                    </button>
                  ) : (
                    <Link
                      to={item.href!}
                      className="flex items-center px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded transition-colors"
                    >
                      {item.label}
                    </Link>
                  )}

                  {/* Mega Menu Dropdown */}
                  {item.megaMenu && open === item.label && (
                    <div
                      className="absolute top-full left-1/2 -translate-x-1/2 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-5 min-w-max"
                      onMouseLeave={() => setOpen(null)}
                    >
                      <div className="flex gap-8">
                        {item.megaMenu.map((section) => (
                          <div key={section.label} className="min-w-[180px]">
                            <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                              {section.label}
                            </div>
                            <ul className="space-y-1">
                              {section.items.map((link) => (
                                <li key={link.label}>
                                  <Link
                                    to={link.href}
                                    className="block px-2 py-1.5 rounded hover:bg-gray-50 group"
                                  >
                                    <div className="text-sm font-medium text-gray-800 group-hover:text-blue-600 transition-colors">
                                      {link.label}
                                    </div>
                                    {link.desc && (
                                      <div className="text-xs text-gray-400 mt-0.5 leading-snug">{link.desc}</div>
                                    )}
                                  </Link>
                                </li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </nav>

            {/* CTA */}
            <div className="hidden lg:flex items-center gap-3">
              <Link to="/contact" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
                Contact Sales
              </Link>
              {user ? (
                <>
                  <Link to="/app" className="btn-secondary text-xs px-4 py-2">
                    Dashboard
                  </Link>
                  <button
                    onClick={async () => { await signOut(); navigate('/'); }}
                    className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
                  >
                    Sign out
                  </button>
                </>
              ) : (
                <>
                  <Link to="/login" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
                    Sign in
                  </Link>
                  <Link to="/book-demo" className="btn-primary text-xs px-4 py-2">
                    Book a Demo
                  </Link>
                </>
              )}
            </div>

            {/* Mobile hamburger */}
            <button
              className="lg:hidden p-2 rounded text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileOpen && (
          <div className="lg:hidden bg-white border-t border-gray-200 max-h-screen overflow-y-auto">
            <div className="px-4 py-4 space-y-1">
              {navItems.map((item) => (
                <div key={item.label}>
                  {item.href ? (
                    <Link
                      to={item.href}
                      className="block px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded"
                    >
                      {item.label}
                    </Link>
                  ) : (
                    <div>
                      <div className="px-3 py-1.5 text-xs font-semibold text-gray-400 uppercase tracking-wider mt-3">
                        {item.label}
                      </div>
                      {item.megaMenu?.map((section) =>
                        section.items.map((link) => (
                          <Link
                            key={link.href}
                            to={link.href}
                            className="block px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded"
                          >
                            {link.label}
                          </Link>
                        ))
                      )}
                    </div>
                  )}
                </div>
              ))}
              <div className="pt-4 space-y-2 border-t border-gray-100 mt-4">
                <Link to="/contact" className="block px-3 py-2.5 text-sm font-medium text-gray-700 text-center border border-gray-300 rounded">
                  Contact Sales
                </Link>
                {user ? (
                  <>
                    <Link to="/app" className="btn-secondary w-full justify-center text-sm">
                      Dashboard
                    </Link>
                    <button
                      onClick={async () => { await signOut(); navigate('/'); }}
                      className="flex items-center justify-center gap-1.5 w-full px-4 py-2.5 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
                    >
                      <LogOut size={14} /> Sign out
                    </button>
                  </>
                ) : (
                  <>
                    <Link to="/login" className="block px-3 py-2.5 text-sm font-medium text-gray-700 text-center border border-gray-300 rounded">
                      Sign in
                    </Link>
                    <Link to="/book-demo" className="btn-primary w-full justify-center text-sm">
                      Book a Demo <ArrowRight size={14} />
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </header>
      {/* Spacer */}
      <div className="h-16" />
    </>
  );
}
