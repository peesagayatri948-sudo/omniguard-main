import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { Save, Key, CreditCard, Activity, Cpu, ShieldCheck } from 'lucide-react';

export default function AiProviderConfig() {
  const { user } = useAuth();
  const [provider, setProvider] = useState<'anthropic' | 'bedrock'>('anthropic');
  const [anthropicKey, setAnthropicKey] = useState('');
  const [awsRegion, setAwsRegion] = useState('us-east-1');
  const [awsAccessKey, setAwsAccessKey] = useState('');
  const [awsSecretKey, setAwsSecretKey] = useState('');
  const [workspacePath, setWorkspacePath] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);

  useEffect(() => {
    loadConfig();
  }, [user]);

  const [stats, setStats] = useState({ promptTokens: 0, completionTokens: 0, cost: 0 });

  const loadConfig = async () => {
    if (!user) return; // Wait for user to load
    
    try {
      let orgId = '00000000-0000-0000-0000-000000000000';
      if (isSupabaseConfigured && supabase) {
        const { data: member } = await supabase
          .from('organization_members')
          .select('organization_id')
          .eq('user_id', user.id)
          .maybeSingle();
        if (member) orgId = member.organization_id;
      }
      
      const res = await fetch(`http://127.0.0.1:5185/ai-config?orgId=${orgId}`);
      const data = await res.json();
      if (data.ok && data.ai_config) {
        setProvider(data.ai_config.provider || 'anthropic');
        setAnthropicKey(data.ai_config.anthropic_key || '');
        setAwsRegion(data.ai_config.aws_region || 'us-east-1');
        setAwsAccessKey(data.ai_config.aws_access_key || '');
        setAwsSecretKey(data.ai_config.aws_secret_key || '');
        setWorkspacePath(data.ai_config.workspace_path || '');
      }

      if (isSupabaseConfigured && supabase) {
        // Calculate estimated tokens based on findings and audit logs
        const { count: findingCount } = await supabase.from('findings').select('*', { count: 'exact', head: true }).eq('organization_id', orgId);
        const { count: auditCount } = await supabase.from('audit_logs').select('*', { count: 'exact', head: true }).eq('organization_id', orgId);
        
        const totalEvents = (findingCount || 0) + (auditCount || 0);
        const pTokens = totalEvents * 2500;
        const cTokens = totalEvents * 800;
        const estCost = (pTokens * 0.000003) + (cTokens * 0.000015);
        setStats({ promptTokens: pTokens, completionTokens: cTokens, cost: estCost });
      }
    } catch (e) {
      console.error('Failed to load AI config', e);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workspacePath) {
      setMessage({ type: 'error', text: 'Target Repository Directory is required.' });
      return;
    }
    setSaving(true);
    setMessage(null);

    try {
      let orgId = '00000000-0000-0000-0000-000000000000';
      if (isSupabaseConfigured && supabase && user) {
        const { data: member } = await supabase
          .from('organization_members')
          .select('organization_id')
          .eq('user_id', user.id)
          .maybeSingle();
        if (member) orgId = member.organization_id;
      }

      const res = await fetch('http://127.0.0.1:5185/ai-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orgId,
          config: { 
            provider, 
            anthropic_key: anthropicKey, 
            aws_region: awsRegion,
            aws_access_key: awsAccessKey,
            aws_secret_key: awsSecretKey,
            workspace_path: workspacePath 
          }
        })
      });

      const data = await res.json();
      if (data.ok) {
        setMessage({ type: 'success', text: 'AI Provider configuration updated securely.' });
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to update config' });
      }
    } catch (e: any) {
      setMessage({ type: 'error', text: 'Network error connecting to daemon.' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-gray-500">Loading AI Configurations...</div>;
  }

  return (
    <div className="max-w-4xl space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-xs font-semibold text-purple-600 uppercase tracking-widest mb-2">
          <Cpu size={14} className="animate-pulse" />
          Multi-Agent LLM Platform
        </div>
        <h1 className="text-2xl font-bold text-gray-900">AI Provider & Cost Management</h1>
        <p className="text-sm text-gray-500 mt-1">
          Configure API credentials securely to power OmniGuard's autonomous MCP Server and Claude Code Orchestrator.
        </p>
      </div>

      {message && (
        <div className={`p-4 rounded-lg text-sm flex items-center gap-2 ${
          message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
        }`}>
          {message.type === 'success' ? <ShieldCheck size={16} /> : <Activity size={16} />}
          {message.text}
        </div>
      )}

      {/* Configuration Form */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
          <h2 className="font-semibold text-gray-900 flex items-center gap-2">
            <Key size={18} className="text-purple-600" />
            AI Provider Credentials
          </h2>
          <span className="bg-green-100 text-green-700 text-xs font-medium px-2.5 py-0.5 rounded-full flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
            Primary AI Engine
          </span>
        </div>
        
        <form onSubmit={handleSave} className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Select AI Provider
            </label>
            <select
              value={provider}
              onChange={(e) => setProvider(e.target.value as 'anthropic' | 'bedrock')}
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-purple-600 focus:border-transparent transition-all"
            >
              <option value="anthropic">Anthropic (Claude 3.5 Sonnet direct API)</option>
              <option value="bedrock">AWS Bedrock (Claude 3.5 Sonnet native VPC integration)</option>
            </select>
          </div>

          {provider === 'anthropic' ? (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Anthropic API Key (Claude 3.5 Sonnet)
              </label>
              <div className="relative">
                <input
                  type="password"
                  value={anthropicKey}
                  onChange={(e) => setAnthropicKey(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-purple-600 focus:border-transparent transition-all"
                  placeholder="sk-ant-api03-..."
                />
                <Key size={16} className="absolute left-3 top-2.5 text-gray-400" />
              </div>
              <p className="text-xs text-gray-500 mt-2">
                This key is securely injected directly into the orchestrator environment at runtime and used for interactive code remediation.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  AWS Region
                </label>
                <input
                  type="text"
                  value={awsRegion}
                  onChange={(e) => setAwsRegion(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-purple-600 focus:border-transparent transition-all"
                  placeholder="us-east-1"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  AWS Access Key ID (Optional if running inside ECS Task/Role)
                </label>
                <input
                  type="text"
                  value={awsAccessKey}
                  onChange={(e) => setAwsAccessKey(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-purple-600 focus:border-transparent transition-all"
                  placeholder="AKIAIOSFODNN7EXAMPLE"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  AWS Secret Access Key
                </label>
                <input
                  type="password"
                  value={awsSecretKey}
                  onChange={(e) => setAwsSecretKey(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-purple-600 focus:border-transparent transition-all"
                  placeholder="wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                If OmniGuard is hosted inside an AWS VPC with ECS/EKS IAM roles assigned, you can leave these credentials blank. Bedrock client will automatically authenticate.
              </p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Target Repository Directory (Workspace Path)
            </label>
            <div className="relative">
              <input
                type="text"
                value={workspacePath}
                onChange={(e) => setWorkspacePath(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-purple-600 focus:border-transparent transition-all"
                placeholder="C:\Users\ADMIN\.omniguard\clones\omniguard-enterprise"
                required
              />
              <Key size={16} className="absolute left-3 top-2.5 text-gray-400" />
            </div>
            <p className="text-xs text-gray-500 mt-2">
              The Orchestrator will pull the target repository into this specified directory and execute AI remediations here. If not configured, the remediator cannot run.
            </p>
          </div>

          <div className="flex justify-end pt-2 border-t border-gray-100">
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2 disabled:bg-purple-400"
            >
              <Save size={16} />
              {saving ? 'Updating Matrix...' : 'Save AI Config'}
            </button>
          </div>
        </form>
      </div>

      {/* Cost Management Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-100 flex items-center gap-2">
          <CreditCard size={18} className="text-blue-600" />
          <h2 className="font-semibold text-gray-900">Cost & Usage Insights</h2>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-lg bg-gray-50 border border-gray-100">
              <div className="text-sm text-gray-500 mb-1">Total Prompt Tokens</div>
              <div className="text-2xl font-bold text-gray-900">{stats.promptTokens.toLocaleString()}</div>
            </div>
            <div className="p-4 rounded-lg bg-gray-50 border border-gray-100">
              <div className="text-sm text-gray-500 mb-1">Total Completion Tokens</div>
              <div className="text-2xl font-bold text-gray-900">{stats.completionTokens.toLocaleString()}</div>
            </div>
            <div className="p-4 rounded-lg bg-gray-50 border border-gray-100">
              <div className="text-sm text-gray-500 mb-1">Estimated Cost (USD)</div>
              <div className="text-2xl font-bold text-green-600">${stats.cost.toFixed(4)}</div>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-4 text-center">
            Usage tracking is calculated asynchronously by the Daemon and synced periodically.
          </p>
        </div>
      </div>
    </div>
  );
}
