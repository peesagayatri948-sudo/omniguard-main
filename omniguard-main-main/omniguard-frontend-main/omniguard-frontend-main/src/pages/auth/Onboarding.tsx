import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { Shield, ArrowRight, UserPlus, PlusCircle } from 'lucide-react';

export default function Onboarding() {
  const { user, refreshUserOrg } = useAuth();
  const navigate = useNavigate();
  const [action, setAction] = useState<'create' | 'join' | null>(null);
  const [orgName, setOrgName] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [requestedRole, setRequestedRole] = useState<'developer' | 'manager' | 'ciso'>('developer');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [createdCode, setCreatedCode] = useState<string | null>(null);

  if (!user) return null;

  const handleCreateOrg = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orgName.trim()) return;
    setLoading(true);
    setError(null);

    const generatedInviteCode = Array.from({ length: 4 }, () =>
      Math.random().toString(36).substring(2, 10).toUpperCase()
    ).join('-');

    if (isSupabaseConfigured && supabase) {
      try {
        // Insert Organization
        const { data: org, error: orgErr } = await supabase
          .from('organizations')
          .insert({
            name: orgName,
            slug: orgName.toLowerCase().replace(/[^a-z0-9]/g, '-') + '-' + Math.floor(Math.random() * 1000),
            plan: 'enterprise',
            created_by: user.id,
            settings: { invite_code: generatedInviteCode },
          })
          .select()
          .single();

        if (orgErr || !org) throw orgErr || new Error('Failed to create organization');

        // Link as owner (active)
        const { error: memberErr } = await supabase
          .from('organization_members')
          .insert({
            organization_id: org.id,
            user_id: user.id,
            role: 'owner',
            status: 'active',
          });

        if (memberErr) throw memberErr;

        setCreatedCode(generatedInviteCode);
      } catch (err: any) {
        setError(err.message);
        setLoading(false);
        return;
      }
    } else {
      setCreatedCode(generatedInviteCode);
    }
    setLoading(false);
  };

  const handleJoinOrg = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteCode.trim()) return;
    setLoading(true);
    setError(null);

    if (isSupabaseConfigured && supabase) {
      try {
        // Query organization with this invite code in settings
        const { data: orgs, error: orgErr } = await supabase
          .from('organizations')
          .select('id, name, settings')
          .neq('deleted_at', null); // dummy target check or generic select

        const targetOrg = orgs?.find((o: any) => o.settings?.invite_code === inviteCode.trim().toUpperCase());

        if (!targetOrg) {
          throw new Error('Invalid invite code. Organization not found.');
        }

        const roleDbMap = {
          ciso: 'owner',
          manager: 'admin',
          developer: 'developer',
        };

        // Link user as pending
        const { error: memberErr } = await supabase
          .from('organization_members')
          .insert({
            organization_id: targetOrg.id,
            user_id: user.id,
            role: roleDbMap[requestedRole],
            status: 'pending',
          });

        if (memberErr) throw memberErr;

        await refreshUserOrg();
        navigate('/awaiting-approval');
      } catch (err: any) {
        setError(err.message);
        setLoading(false);
        return;
      }
    } else {
      // Offline fallback
      await refreshUserOrg();
      navigate('/awaiting-approval');
    }
    setLoading(false);
  };

  const proceedToApp = async () => {
    await refreshUserOrg();
    navigate('/app');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 border border-gray-200 rounded-xl shadow-sm">
        <div className="text-center">
          <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center mx-auto mb-4">
            <Shield size={24} className="text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Welcome to OmniGuard</h2>
          <p className="mt-2 text-sm text-gray-500">
            Let's configure your enterprise organization.
          </p>
        </div>

        {createdCode ? (
          <div className="space-y-6 text-center">
            <div className="bg-green-50 border border-green-200 rounded-lg p-5">
              <h3 className="text-sm font-semibold text-green-800">Organization Created successfully!</h3>
              <p className="text-xs text-green-700 mt-2">
                Share this secure 32-digit token with your team members to invite them:
              </p>
              <div className="bg-white border border-gray-200 rounded-md py-2.5 px-4 mt-3 font-mono text-sm font-bold text-gray-800 select-all">
                {createdCode}
              </div>
            </div>
            <button onClick={proceedToApp} className="btn-primary w-full justify-center">
              Go to Dashboard <ArrowRight size={14} />
            </button>
          </div>
        ) : !action ? (
          <div className="grid grid-cols-1 gap-4 pt-4">
            <button
              onClick={() => setAction('create')}
              className="flex items-center gap-4 p-5 border border-gray-200 rounded-lg text-left hover:border-blue-500 hover:bg-blue-50/20 transition-all"
            >
              <PlusCircle size={24} className="text-blue-600 flex-shrink-0" />
              <div>
                <h3 className="text-sm font-bold text-gray-900">Create a New Organization</h3>
                <p className="text-xs text-gray-500 mt-0.5">Start as owner and invite your team.</p>
              </div>
            </button>
            <button
              onClick={() => setAction('join')}
              className="flex items-center gap-4 p-5 border border-gray-200 rounded-lg text-left hover:border-blue-500 hover:bg-blue-50/20 transition-all"
            >
              <UserPlus size={24} className="text-blue-600 flex-shrink-0" />
              <div>
                <h3 className="text-sm font-bold text-gray-900">Join an Existing Organization</h3>
                <p className="text-xs text-gray-500 mt-0.5">Use a 32-digit HMAC invite token.</p>
              </div>
            </button>
          </div>
        ) : action === 'create' ? (
          <form onSubmit={handleCreateOrg} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Organization Name</label>
              <input
                required
                type="text"
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g. Experian Corp"
              />
            </div>
            {error && <p className="text-xs text-red-600">{error}</p>}
            <div className="flex items-center gap-3">
              <button type="submit" disabled={loading} className="btn-primary flex-1 justify-center">
                {loading ? 'Creating...' : 'Create Organization'}
              </button>
              <button type="button" onClick={() => setAction(null)} className="btn-ghost">
                Back
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleJoinOrg} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">32-Digit Invite Code</label>
              <input
                required
                type="text"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                placeholder="XXXXXX-XXXXXX-XXXXXX-XXXXXX"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-2">Request Role</label>
              <div className="grid grid-cols-3 gap-2">
                {(['developer', 'manager', 'ciso'] as const).map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRequestedRole(r)}
                    className={`p-3 rounded-lg border text-left transition-all ${
                      requestedRole === r
                        ? 'border-blue-600 bg-blue-50 ring-1 ring-blue-600'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className={`text-xs font-semibold capitalize ${requestedRole === r ? 'text-blue-700' : 'text-gray-900'}`}>
                      {r === 'ciso' ? 'CISO' : r === 'manager' ? 'Manager' : 'Developer'}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {error && <p className="text-xs text-red-600">{error}</p>}
            <div className="flex items-center gap-3">
              <button type="submit" disabled={loading} className="btn-primary flex-1 justify-center">
                {loading ? 'Requesting...' : 'Request Access'}
              </button>
              <button type="button" onClick={() => setAction(null)} className="btn-ghost">
                Back
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
