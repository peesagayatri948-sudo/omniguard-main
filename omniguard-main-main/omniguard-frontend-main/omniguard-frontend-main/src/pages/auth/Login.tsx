import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth, type UserRole } from '../../context/AuthContext';
import { isSupabaseConfigured } from '../../lib/supabase';
import { Shield, ArrowRight, Check, AlertCircle } from 'lucide-react';

const roles: { value: UserRole; label: string; desc: string }[] = [
  { value: 'developer', label: 'Developer', desc: 'View your PRs, local graph traces, and personal API keys' },
  { value: 'manager', label: 'Security Manager', desc: 'Manage teams, view global drift, and enforce policies' },
  { value: 'ciso', label: 'CISO', desc: 'Full oversight, org-wide tokens, and auto-shutdown authority' },
];

export default function Login() {
  const navigate = useNavigate();
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { error } = await signIn(email, password);
    setLoading(false);
    if (error) {
      setError(error);
    } else {
      navigate('/app');
    }
  };

  return (
    <div className="min-h-screen flex">
      <div className="flex-1 flex flex-col justify-center px-6 sm:px-12 lg:px-20 bg-white">
        <div className="max-w-md w-full mx-auto">
          <Link to="/" className="flex items-center gap-2.5 mb-12">
            <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center">
              <Shield size={18} className="text-white" />
            </div>
            <span className="text-base font-bold text-gray-900 tracking-tight">
              OmniGuard <span className="text-blue-600">Nexus</span>
            </span>
          </Link>

          <h1 className="text-3xl font-bold text-gray-900 mb-2">Sign in to your workspace</h1>
          <p className="text-sm text-gray-500 mb-8">
            Access the Architecture Nexus, threat models, and compliance dashboards.
          </p>

          {!isSupabaseConfigured && (
            <div className="mb-6 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2.5">
              <AlertCircle size={15} className="text-amber-600 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-amber-800 leading-relaxed">
                Running in demo mode. Supabase credentials not detected — authentication is mocked locally. Any email and password will work.
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
               <label className="block text-xs font-semibold text-gray-600 mb-1.5">Email</label>
              <input
                required
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="you@company.com"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Password</label>
              <input
                required
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2.5">
                <AlertCircle size={15} className="text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-red-800">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full justify-center py-3 disabled:opacity-60"
            >
              {loading ? 'Signing in...' : 'Sign In'} <ArrowRight size={15} />
            </button>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="px-2 bg-white text-gray-500">Or continue with</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => alert('Redirecting to Okta SAML Provider (Enterprise Identity)...')}
              className="w-full flex items-center justify-center gap-2 py-3 border border-gray-300 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Enterprise SSO (Okta / Ping)
            </button>
          </form>

          <p className="text-sm text-gray-500 mt-8 text-center">
            Don't have an account?{' '}
            <Link to="/signup" className="text-blue-600 font-medium hover:underline">
              Create one
            </Link>
          </p>
        </div>
      </div>

      <div className="hidden lg:flex flex-1 bg-gray-950 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(37,99,235,0.08),_transparent_60%)]" />
        <div className="flex flex-col justify-center px-16 xl:px-24 max-w-xl relative">
          <div className="text-xs font-semibold tracking-widest uppercase text-blue-400 mb-4">
            Enterprise Dashboard
          </div>
          <h2 className="text-3xl font-bold text-white leading-tight mb-6">
            The control plane for your continuous security architecture
          </h2>
          <p className="text-gray-400 leading-relaxed mb-10">
            Monitor threats, track architecture drift, manage compliance, and govern AI usage — all grounded in your live Architecture Nexus.
          </p>
          <ul className="space-y-4">
            {[
              'Real-time threat map across all repositories',
              'Architecture Nexus with historical audit trail',
              'Cloud drift detection with auto-shutdown policies',
              'Compliance matrix mapped to 180+ frameworks',
              'MCP intercept feed for AI guardrails',
            ].map((item) => (
              <li key={item} className="flex items-center gap-3 text-sm text-gray-300">
                <Check size={15} className="text-blue-400 flex-shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
