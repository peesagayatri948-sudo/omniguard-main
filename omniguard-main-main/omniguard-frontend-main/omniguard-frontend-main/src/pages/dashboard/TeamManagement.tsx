import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { Users, UserPlus, Shield, Copy, RefreshCw, Trash2 } from 'lucide-react';

interface InviteCode {
  id: string;
  code: string;
  createdAt: string;
  used: boolean;
}

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: 'developer' | 'manager' | 'ciso';
  status: 'active' | 'invited' | 'pending';
}

export default function TeamManagement() {
  const { user } = useAuth();
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [invites, setInvites] = useState<InviteCode[]>([]);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [newRole, setNewRole] = useState<'developer' | 'manager' | 'ciso'>('developer');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetchTeam = async () => {
      if (isSupabaseConfigured && supabase) {
        try {
          // Get the user's organization
          const { data: memberData } = await supabase
            .from('organization_members')
            .select('organization_id')
            .eq('user_id', user.id)
            .maybeSingle();

          if (memberData) {
            const orgId = memberData.organization_id;
            
            // Fetch all members in this organization
            const { data: allMembers } = await supabase
              .from('organization_members')
              .select(`
                id,
                role,
                status,
                user_id,
                user_profiles:user_id (
                  first_name,
                  last_name,
                  email
                )
              `)
              .eq('organization_id', orgId);

            if (allMembers) {
              const mapped: TeamMember[] = allMembers.map((m: any) => {
                const profile = m.user_profiles || {};
                const name = `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || profile.email?.split('@')[0] || 'Unknown User';
                
                // Map db roles to frontend roles
                let r: 'developer' | 'manager' | 'ciso' = 'developer';
                if (m.role === 'owner') r = 'ciso';
                else if (m.role === 'admin' || m.role === 'engineer') r = 'manager';

                return {
                  id: m.id,
                  name,
                  email: profile.email || 'no-email@company.com',
                  role: r,
                  status: m.status === 'active' ? 'active' : 'pending',
                };
              });
              setMembers(mapped);
            }
          }
        } catch (e) {
          console.error(e);
        }
      } else {
        // Fallback mock data
        setMembers([
          { id: '1', name: user.name, email: user.email, role: user.role, status: 'active' },
          { id: '2', name: 'Alex Sec', email: 'alex.sec@experian.com', role: 'manager', status: 'active' }
        ]);
      }
      setLoading(false);
    };

    fetchTeam();
  }, [user]);

  const generateCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    const segments = Array.from({ length: 4 }, () =>
      Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
    );
    return segments.join('-');
  };

  const handleApprove = async (memberId: string) => {
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase
          .from('organization_members')
          .update({ status: 'active' })
          .eq('id', memberId);
      } catch (e) {
        console.error(e);
      }
    }
    setMembers((prev) => prev.map((m) => (m.id === memberId ? { ...m, status: 'active' } : m)));
  };

  const handleDecline = async (memberId: string) => {
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase
          .from('organization_members')
          .update({ status: 'suspended' })
          .eq('id', memberId);
      } catch (e) {
        console.error(e);
      }
    }
    setMembers((prev) => prev.filter((m) => m.id !== memberId));
  };

  const handleCreateInvite = () => {
    const code = generateCode();
    setInvites([
      {
        id: `invite-${Date.now()}`,
        code,
        createdAt: new Date().toISOString(),
        used: false,
      },
      ...invites,
    ]);
    setShowInviteForm(false);
  };

  const revokeInvite = (id: string) => {
    setInvites(invites.filter((i) => i.id !== id));
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
  };

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 text-xs font-semibold text-blue-600 uppercase tracking-widest mb-2">
          <Users size={14} />
          Team & Organization
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Team Management</h1>
        <p className="text-sm text-gray-500 mt-1">
          Generate secure HMAC invite codes, assign roles, and manage your organization's members.
        </p>
      </div>

      {/* Invite Portal */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <UserPlus size={16} className="text-blue-500" />
            <h2 className="text-sm font-semibold text-gray-900">Invite Portal</h2>
          </div>
          {!showInviteForm && (
            <button
              onClick={() => setShowInviteForm(true)}
              className="btn-primary text-xs px-3 py-1.5"
            >
              <UserPlus size={14} /> Generate Invite Code
            </button>
          )}
        </div>

        {showInviteForm && (
          <div className="mb-5 p-5 bg-gray-50 border border-gray-200 rounded-lg">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">New Invite Code</h3>
            <div className="mb-4">
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Assign role</label>
              <div className="grid grid-cols-3 gap-2">
                {(['developer', 'manager', 'ciso'] as const).map((r) => (
                  <button
                    key={r}
                    onClick={() => setNewRole(r)}
                    className={`p-3 rounded-lg border text-left transition-all ${
                      newRole === r
                        ? 'border-blue-600 bg-blue-50 ring-1 ring-blue-600'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className={`text-xs font-semibold capitalize ${newRole === r ? 'text-blue-700' : 'text-gray-900'}`}>
                      {r === 'ciso' ? 'CISO' : r === 'manager' ? 'Security Manager' : 'Developer'}
                    </div>
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={handleCreateInvite} className="btn-primary text-xs px-4 py-2">
                <Shield size={14} /> Generate 32-Digit HMAC Code
              </button>
              <button onClick={() => setShowInviteForm(false)} className="btn-ghost text-xs">
                Cancel
              </button>
            </div>
          </div>
        )}

        {invites.length === 0 && !showInviteForm ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-3">
              <UserPlus size={20} className="text-gray-400" />
            </div>
            <p className="text-sm text-gray-500">No invite codes generated yet.</p>
            <p className="text-xs text-gray-400 mt-1">
              Generate secure 32-digit HMAC invite codes to onboard developers.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {invites.map((invite) => (
              <div
                key={invite.id}
                className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="font-mono text-xs text-gray-700 truncate">{invite.code}</span>
                  {invite.used && (
                    <span className="tag bg-gray-100 text-gray-500">Used</span>
                  )}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => copyCode(invite.code)}
                    className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
                    title="Copy code"
                  >
                    <Copy size={14} />
                  </button>
                  <button
                    onClick={() => revokeInvite(invite.id)}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                    title="Revoke"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pending Approvals Queue (CISO/Manager Only) */}
      {(user?.role === 'ciso' || user?.role === 'manager') && members.filter((m) => m.status === 'pending').length > 0 && (
        <div className="bg-white border border-amber-200 rounded-lg p-6">
          <div className="flex items-center gap-2 mb-5">
            <Shield size={16} className="text-amber-500" />
            <h2 className="text-sm font-semibold text-gray-900">Pending Role Approvals Queue</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left text-xs font-semibold text-gray-500 py-3 px-2">Name</th>
                  <th className="text-left text-xs font-semibold text-gray-500 py-3 px-2">Email</th>
                  <th className="text-left text-xs font-semibold text-gray-500 py-3 px-2">Requested Role</th>
                  <th className="text-right text-xs font-semibold text-gray-500 py-3 px-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {members.filter((m) => m.status === 'pending').map((m) => (
                  <tr key={m.id} className="border-b border-gray-100">
                    <td className="py-3 px-2 text-sm font-semibold text-gray-900">{m.name}</td>
                    <td className="py-3 px-2 text-sm text-gray-500">{m.email}</td>
                    <td className="py-3 px-2 text-sm text-gray-700 capitalize">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-amber-100 text-amber-800">
                        {m.role === 'ciso' ? 'CISO' : m.role}
                      </span>
                    </td>
                    <td className="py-3 px-2 text-right space-x-2">
                      <button
                        onClick={() => handleApprove(m.id)}
                        className="btn-primary text-xs px-3 py-1.5"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleDecline(m.id)}
                        className="btn-secondary border-red-200 hover:bg-red-50 text-red-600 text-xs px-3 py-1.5"
                      >
                        Decline
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Team Members */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center gap-2 mb-5">
          <Users size={16} className="text-gray-600" />
          <h2 className="text-sm font-semibold text-gray-900">Team Members</h2>
        </div>
        {members.filter((m) => m.status === 'active').length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-3">
              <Users size={20} className="text-gray-400" />
            </div>
            <p className="text-sm text-gray-500">No team members yet.</p>
            <p className="text-xs text-gray-400 mt-1">
              Generate an invite code above to onboard your first team member.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left text-xs font-semibold text-gray-500 py-3 px-2">Name</th>
                  <th className="text-left text-xs font-semibold text-gray-500 py-3 px-2">Email</th>
                  <th className="text-left text-xs font-semibold text-gray-500 py-3 px-2">Role</th>
                  <th className="text-left text-xs font-semibold text-gray-500 py-3 px-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {members.filter((m) => m.status === 'active').map((m) => (
                  <tr key={m.id} className="border-b border-gray-100">
                    <td className="py-3 px-2 text-sm text-gray-900 font-medium">{m.name}</td>
                    <td className="py-3 px-2 text-sm text-gray-500">{m.email}</td>
                    <td className="py-3 px-2 text-sm text-gray-700 capitalize font-mono text-xs">{m.role}</td>
                    <td className="py-3 px-2">
                      <span className="tag bg-green-100 text-green-700">
                        {m.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Role Assignment Info */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center gap-2 mb-4">
          <RefreshCw size={16} className="text-gray-600" />
          <h2 className="text-sm font-semibold text-gray-900">Role Permissions</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { role: 'Developer', perms: ['View own PRs', 'Local graph traces', 'Personal API keys'] },
            { role: 'Security Manager', perms: ['Manage teams', 'View global drift', 'Org-wide tokens'] },
            { role: 'CISO', perms: ['Full oversight', 'Auto-shutdown authority', 'Enforce policies'] },
          ].map((r) => (
            <div key={r.role} className="p-4 border border-gray-200 rounded-lg">
              <p className="text-sm font-semibold text-gray-900 mb-2">{r.role}</p>
              <ul className="space-y-1">
                {r.perms.map((p) => (
                  <li key={p} className="text-xs text-gray-500 flex items-center gap-1.5">
                    <span className="w-1 h-1 rounded-full bg-gray-400" />
                    {p}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
