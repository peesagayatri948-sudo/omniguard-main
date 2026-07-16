import { useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth, type UserRole } from '../../context/AuthContext';
import {
  Shield,
  LayoutDashboard,
  Network,
  Cloud,
  Users,
  Key,
  FileCheck,
  LogOut,
  Menu,
  X,
  ChevronDown,
  Sparkles,
  Cpu,
  Activity,
} from 'lucide-react';

interface NavItem {
  label: string;
  href: string;
  icon: typeof LayoutDashboard;
  roles: UserRole[];
}

const navItems: NavItem[] = [
  { label: 'Overview', href: '/app', icon: LayoutDashboard, roles: ['developer', 'manager', 'ciso'] },
  { label: 'Architecture Nexus', href: '/app/nexus', icon: Network, roles: ['developer', 'manager', 'ciso'] },
  { label: 'AI Remediation Hub', href: '/app/remediation', icon: Sparkles, roles: ['developer', 'manager', 'ciso'] },
  { label: 'Cloud Drift', href: '/app/drift', icon: Cloud, roles: ['manager', 'ciso'] },
  { label: 'Team & Org', href: '/app/team', icon: Users, roles: ['manager', 'ciso'] },
  { label: 'API & Integrations', href: '/app/api', icon: Key, roles: ['developer', 'manager', 'ciso'] },
  { label: 'AI Provider & Cost', href: '/app/ai-config', icon: Cpu, roles: ['developer', 'manager', 'ciso'] },
  { label: 'SBOM & Compliance', href: '/app/compliance', icon: FileCheck, roles: ['developer', 'manager', 'ciso'] },
  { label: 'Audit & Checkpoint Logs', href: '/app/logs', icon: Activity, roles: ['developer', 'manager', 'ciso'] },
];

const roleLabels: Record<UserRole, string> = {
  developer: 'Developer',
  manager: 'Security Manager',
  ciso: 'CISO',
};

const roleBadgeColors: Record<UserRole, string> = {
  developer: 'bg-blue-100 text-blue-700',
  manager: 'bg-amber-100 text-amber-700',
  ciso: 'bg-red-100 text-red-700',
};

export default function DashboardLayout() {
  const { user, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  if (!user) return null;

  const visibleNav = navItems.filter((item) => item.roles.includes(user.role));
  const initials = user.name
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const isActive = (href: string) =>
    href === '/app' ? location.pathname === '/app' : location.pathname.startsWith(href);

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar - desktop */}
      <aside
        className={`fixed lg:sticky top-0 left-0 z-40 h-screen w-64 bg-gray-950 text-gray-300 flex flex-col transition-transform duration-200 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="flex items-center justify-between px-5 h-16 border-b border-gray-800">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-blue-600 rounded flex items-center justify-center">
              <Shield size={16} className="text-white" />
            </div>
            <span className="text-sm font-bold text-white tracking-tight">OmniGuard Nexus</span>
          </Link>
          <button className="lg:hidden text-gray-400" onClick={() => setSidebarOpen(false)}>
            <X size={18} />
          </button>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {visibleNav.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                to={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  active
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800'
                }`}
              >
                <Icon size={17} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="px-3 py-4 border-t border-gray-800">
          <div className="flex items-center gap-2.5 px-3 py-2">
            <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-xs font-semibold text-white">
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{user.name}</p>
              <p className="text-xs text-gray-500 truncate">{user.email}</p>
            </div>
          </div>
          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ml-3 mt-1 ${roleBadgeColors[user.role]}`}>
            {roleLabels[user.role]}
          </span>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar */}
        <header className="sticky top-0 z-20 bg-white border-b border-gray-200 h-16 flex items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <button
              className="lg:hidden p-2 rounded text-gray-600 hover:bg-gray-100"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu size={20} />
            </button>
            <div className="text-sm font-semibold text-gray-900">
              {visibleNav.find((item) => isActive(item.href))?.label ?? 'Dashboard'}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/"
              className="hidden sm:inline-flex text-sm text-gray-500 hover:text-gray-900 transition-colors"
            >
              View public site
            </Link>
            <div className="relative">
              <button
                className="flex items-center gap-2 p-1 rounded-lg hover:bg-gray-100 transition-colors"
                onClick={() => setUserMenuOpen(!userMenuOpen)}
              >
                <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-xs font-semibold text-white">
                  {initials}
                </div>
                <ChevronDown size={14} className="text-gray-400" />
              </button>
              {userMenuOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setUserMenuOpen(false)} />
                  <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-200 rounded-lg shadow-lg z-20 py-1">
                    <div className="px-4 py-3 border-b border-gray-100">
                      <p className="text-sm font-medium text-gray-900 truncate">{user.name}</p>
                      <p className="text-xs text-gray-500 truncate">{user.email}</p>
                    </div>
                    <button
                      onClick={handleSignOut}
                      className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <LogOut size={15} />
                      Sign out
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
