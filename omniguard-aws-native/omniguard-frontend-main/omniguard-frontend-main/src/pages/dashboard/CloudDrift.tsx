import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { Cloud, AlertOctagon, Power, Shield, Plus, Check } from 'lucide-react';

interface ProviderForm {
  provider: 'aws' | 'gcp' | 'azure';
  iamRoleArn: string;
  externalId: string;
}

interface ActiveDrift {
  id: string;
  title: string;
  description: string;
  severity: string;
  file_path: string;
  remediation: string;
}

export default function CloudDrift() {
  const { user } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [providers, setProviders] = useState<any[]>([]);
  const [drifts, setDrifts] = useState<ActiveDrift[]>([]);
  const [form, setForm] = useState<ProviderForm>({
    provider: 'aws',
    iamRoleArn: '',
    externalId: '',
  });

  const [policies, setPolicies] = useState([
    { id: 'shutdown-ssh', label: 'Auto-shutdown services with open SSH (port 22) to the internet', enabled: false, severity: 'critical' },
    { id: 'shutdown-rdp', label: 'Auto-isolate services with open RDP (port 3389) to the internet', enabled: false, severity: 'critical' },
    { id: 'shutdown-public-db', label: 'Auto-shutdown databases exposed to 0.0.0.0/0', enabled: false, severity: 'high' },
    { id: 'shutdown-iam', label: 'Auto-quarantine IAM role changes without CISO approval', enabled: false, severity: 'high' },
  ]);

  useEffect(() => {
    if (!user) return;

    const fetchCloudData = async () => {
      if (isSupabaseConfigured && supabase) {
        try {
          // Get organization details for settings
          const { data: memberData } = await supabase
            .from('organization_members')
            .select('organization_id')
            .eq('user_id', user.id)
            .maybeSingle();

          if (memberData) {
            const orgId = memberData.organization_id;

            // Fetch organization settings for policy toggles
            const { data: org } = await supabase
              .from('organizations')
              .select('settings')
              .eq('id', orgId)
              .maybeSingle();

            if (org?.settings?.policies) {
              const savedPolicies = org.settings.policies;
              setPolicies((prev) =>
                prev.map((p) => ({
                  ...p,
                  enabled: savedPolicies[p.id] ?? p.enabled,
                }))
              );
            }

            // Fetch integrations (Connected Cloud Providers)
            const { data: integrations } = await supabase
              .from('integrations')
              .select('*')
              .eq('organization_id', orgId)
              .in('provider', ['github', 'gitlab', 'bitbucket', 'azuredevops', 'slack', 'jira', 'pagerduty', 'sentry', 'custom']);

            if (integrations) {
              setProviders(integrations);
            }

            // Fetch active drifts from findings table
            const { data: driftFindings } = await supabase
              .from('findings')
              .select('id, title, description, severity, file_path, remediation')
              .eq('organization_id', orgId)
              .eq('category', 'drift')
              .eq('status', 'open');

            if (driftFindings) {
              setDrifts(driftFindings);
            }
          }
        } catch (e) {
          console.error(e);
        }
      } else {
        // Fallback simulated drifts
        setDrifts([
          {
            id: 'drift-1',
            title: 'Permissive Cloud Security Group (Port 22 Open)',
            description: 'Inbound port 22 (SSH) is wide open to the internet (0.0.0.0/0). This violates policy SEC-001.',
            severity: 'high',
            file_path: 'terraform/security_groups.tf',
            remediation: 'Restrict CIDR blocks to office range.',
          }
        ]);
      }
      setLoading(false);
    };

    fetchCloudData();
  }, [user]);

  const saveProvider = async () => {
    if (!user) return;
    if (isSupabaseConfigured && supabase) {
      try {
        const { data: memberData } = await supabase
          .from('organization_members')
          .select('organization_id')
          .eq('user_id', user.id)
          .maybeSingle();

        if (memberData) {
          const orgId = memberData.organization_id;
          await supabase.from('integrations').insert({
            organization_id: orgId,
            provider: 'custom',
            name: `${form.provider.toUpperCase()} Infrastructure Integration`,
            config: {
              provider: form.provider,
              iamRoleArn: form.iamRoleArn,
              externalId: form.externalId,
            },
            status: 'active',
            created_by: user.id,
          });

          // Refresh integrations list
          const { data: integrations } = await supabase
            .from('integrations')
            .select('*')
            .eq('organization_id', orgId);
          if (integrations) setProviders(integrations);
        }
      } catch (e) {
        console.error(e);
      }
    } else {
      setProviders([...providers, {
        id: `provider-${Date.now()}`,
        name: `${form.provider.toUpperCase()} Infrastructure Integration`,
        config: form,
      }]);
    }
    setShowForm(false);
  };

  const togglePolicy = async (id: string) => {
    const updated = policies.map((p) => (p.id === id ? { ...p, enabled: !p.enabled } : p));
    setPolicies(updated);

    if (isSupabaseConfigured && supabase && user) {
      try {
        const { data: memberData } = await supabase
          .from('organization_members')
          .select('organization_id')
          .eq('user_id', user.id)
          .maybeSingle();

        if (memberData) {
          const orgId = memberData.organization_id;
          const policiesObj = updated.reduce((acc: any, p) => {
            acc[p.id] = p.enabled;
            return acc;
          }, {});

          // Fetch original settings
          const { data: org } = await supabase
            .from('organizations')
            .select('settings')
            .eq('id', orgId)
            .maybeSingle();

          const settings = org?.settings || {};
          settings.policies = policiesObj;

          await supabase
            .from('organizations')
            .update({ settings })
            .eq('id', orgId);
        }
      } catch (e) {
        console.error(e);
      }
    }
  };

  const triggerAutoShutdown = async (driftId: string) => {
    if (isSupabaseConfigured && supabase && user) {
      try {
        const { data: memberData } = await supabase
          .from('organization_members')
          .select('organization_id')
          .eq('user_id', user.id)
          .maybeSingle();

        if (memberData) {
          const orgId = memberData.organization_id;
          
          // Log an audit event for auto shutdown execution
          await supabase.from('audit_logs').insert({
            organization_id: orgId,
            user_id: user.id,
            action: 'auto_shutdown_executed',
            resource_type: 'cloud_drift',
            resource_id: driftId,
            resource_name: 'AWS Cloud Security Group Mitigation',
            metadata: { message: 'Auto-shutdown rule triggered on open port. Service isolated.' },
          });

          // Resolve the finding in findings table
          await supabase
            .from('findings')
            .update({ status: 'resolved', resolution_note: 'Mitigated via Auto-Shutdown drift control.' })
            .eq('id', driftId);

          setDrifts(drifts.filter((d) => d.id !== driftId));
        }
      } catch (e) {
        console.error(e);
      }
    } else {
      setDrifts(drifts.filter((d) => d.id !== driftId));
    }
  };


  const [fixingDrift, setFixingDrift] = useState<string | null>(null);
  const [driftNotification, setDriftNotification] = useState<string | null>(null);

  const handleDriftAutoFix = async (drift: ActiveDrift) => {
    setDriftNotification(`⚠️ Cloud Drift detected: "${drift.title}" in ${drift.file_path}. OmniGuard AI will attempt a remediation.`);
    
    const approved = confirm(
      `[HITL APPROVAL REQUIRED]\n\nCloud drift detected:\n"${drift.title}"\nFile: ${drift.file_path}\nSeverity: ${drift.severity}\n\nOmniGuard AI will attempt to auto-fix this drift, rescan the entire repository, and update Architecture Nexus + Compliance Matrix.\n\nDo you approve this autonomous remediation?`
    );
    if (!approved) {
      setDriftNotification(null);
      return;
    }

    setFixingDrift(drift.id);
    setDriftNotification(`🔄 AI is fixing drift "${drift.title}"...`);

    try {
      let orgId = '00000000-0000-0000-0000-000000000000';
      if (isSupabaseConfigured && supabase && user) {
        const { data: m } = await supabase.from('organization_members').select('organization_id').eq('user_id', user.id).maybeSingle();
        if (m) orgId = m.organization_id;
      }

      const res = await fetch('http://127.0.0.1:5185/drift-auto-fix', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          driftId: drift.id,
          title: drift.title,
          filePath: drift.file_path,
          remediation: drift.remediation,
          orgId
        })
      });
      const data = await res.json();

      if (data.ok) {
        setDriftNotification(`✅ Drift "${drift.title}" fixed, rescanned, and all dashboards updated.`);
        setDrifts(prev => prev.filter(d => d.id !== drift.id));
      } else {
        setDriftNotification(`❌ Auto-fix failed: ${data.error}`);
      }
    } catch (err: any) {
      setDriftNotification(`❌ Network error: ${err.message}`);
    } finally {
      setFixingDrift(null);
      setTimeout(() => setDriftNotification(null), 8000);
    }
  };

  return (
    <div className="space-y-6">
      {driftNotification && (
        <div className="p-4 rounded-lg border border-blue-200 bg-blue-50 text-blue-800 text-sm font-medium animate-pulse">
          {driftNotification}
        </div>
      )}

      <div>
        <div className="flex items-center gap-2 text-xs font-semibold text-blue-600 uppercase tracking-widest mb-2">
          <Cloud size={14} />
          Cloud Drift & Auto-Shutdown
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Cloud Provider Control Center</h1>
        <p className="text-sm text-gray-500 mt-1">
          Connect cloud providers, monitor active drift, and configure negligence auto-shutdown rules.
        </p>
      </div>

      {/* Provider Config */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <Cloud size={16} className="text-blue-500" />
            <h2 className="text-sm font-semibold text-gray-900">Provider Configuration</h2>
          </div>
          {!showForm && (
            <button
              onClick={() => setShowForm(true)}
              className="btn-secondary text-xs px-3 py-1.5"
            >
              <Plus size={14} /> Connect Provider
            </button>
          )}
        </div>

        {showForm && (
          <div className="mb-6 p-5 bg-gray-50 border border-gray-200 rounded-lg">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Connect a Cloud Provider</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Provider</label>
                <select
                  value={form.provider}
                  onChange={(e) => setForm({ ...form, provider: e.target.value as ProviderForm['provider'] })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="aws">AWS</option>
                  <option value="gcp">GCP</option>
                  <option value="azure">Azure</option>
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                  IAM Role ARN
                </label>
                <input
                  type="text"
                  value={form.iamRoleArn}
                  onChange={(e) => setForm({ ...form, iamRoleArn: e.target.value })}
                  placeholder="arn:aws:iam::123456789012:role/OmniGuardNexus"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="sm:col-span-3">
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                  External ID
                </label>
                <input
                  type="text"
                  value={form.externalId}
                  onChange={(e) => setForm({ ...form, externalId: e.target.value })}
                  placeholder="omniguard-external-id"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="flex items-center gap-3 mt-4">
              <button
                onClick={saveProvider}
                className="btn-primary text-xs px-4 py-2"
              >
                <Check size={14} /> Save Provider
              </button>
              <button
                onClick={() => setShowForm(false)}
                className="btn-ghost text-xs"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {providers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-3">
              <Cloud size={20} className="text-gray-400" />
            </div>
            <p className="text-sm text-gray-500">No cloud providers connected.</p>
            <p className="text-xs text-gray-400 mt-1">
              Connect AWS, GCP, or Azure via IAM roles to start monitoring drift.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {providers.map((p: any) => (
              <div key={p.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 font-semibold">
                    {(p.config?.provider || 'aws').toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{p.name || 'Connected Provider'}</p>
                    <p className="text-xs text-gray-400 font-mono">{p.config?.iamRoleArn || 'Role Configured'}</p>
                  </div>
                </div>
                <span className="tag bg-green-100 text-green-700">active</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Active Drifts */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center gap-2 mb-5">
          <AlertOctagon size={16} className="text-red-500" />
          <h2 className="text-sm font-semibold text-gray-900">Active Drifts</h2>
        </div>
        {drifts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center mb-3">
              <Check size={20} className="text-green-500" />
            </div>
            <p className="text-sm text-gray-500">No unapproved changes detected.</p>
            <p className="text-xs text-gray-400 mt-1">
              Drifts like "Port 22 manually opened on DB-Server" will appear here.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {drifts.map((d) => (
              <div key={d.id} className="flex items-start justify-between p-4 border border-red-200 bg-red-50/50 rounded-lg">
                <div className="min-w-0 flex-1 pr-4">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wide bg-red-100 text-red-700 px-2 py-0.5 rounded">
                      {d.severity}
                    </span>
                    <h3 className="text-sm font-semibold text-gray-900">{d.title}</h3>
                  </div>
                  <p className="text-xs text-gray-600 mt-1.5">{d.description}</p>
                  <p className="text-xs text-gray-400 mt-1 font-mono">{d.file_path}</p>
                  <p className="text-xs text-green-700 mt-2 font-medium">Auto-Shutdown Fix: {d.remediation}</p>
                </div>
                <div className="flex flex-col gap-2 self-center flex-shrink-0">
                  <button
                    onClick={() => handleDriftAutoFix(d)}
                    disabled={fixingDrift === d.id}
                    className="text-xs px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold disabled:bg-gray-400 transition-colors"
                  >
                    {fixingDrift === d.id ? 'AI Fixing...' : '🤖 AI Auto-Fix & Rescan'}
                  </button>
                  <button
                    onClick={() => triggerAutoShutdown(d.id)}
                    className="btn-danger text-xs px-3 py-1.5"
                  >
                    Auto-Shutdown Service
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Auto-Shutdown Rules */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center gap-2 mb-5">
          <Power size={16} className="text-red-500" />
          <h2 className="text-sm font-semibold text-gray-900">Negligence Auto-Shutdown Rules</h2>
        </div>
        <p className="text-xs text-gray-500 mb-4">
          Toggle rules to allow OmniGuard to automatically isolate or shut down services when explicitly dangerous drift is detected without CISO approval.
        </p>
        <div className="space-y-3">
          {policies.map((policy) => (
            <div
              key={policy.id}
              className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
            >
              <div className="flex items-start gap-3">
                <Shield
                  size={16}
                  className={`flex-shrink-0 mt-0.5 ${policy.severity === 'critical' ? 'text-red-500' : 'text-amber-500'}`}
                />
                <div>
                  <p className="text-sm font-medium text-gray-900">{policy.label}</p>
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium mt-1 ${
                      policy.severity === 'critical'
                        ? 'bg-red-100 text-red-700'
                        : 'bg-amber-100 text-amber-700'
                    }`}
                  >
                    {policy.severity}
                  </span>
                </div>
              </div>
              <button
                onClick={() => togglePolicy(policy.id)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  policy.enabled ? 'bg-blue-600' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    policy.enabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
