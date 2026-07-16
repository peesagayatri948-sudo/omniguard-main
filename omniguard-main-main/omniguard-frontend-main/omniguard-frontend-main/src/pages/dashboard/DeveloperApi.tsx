import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { Key, Plus, Copy, Trash2, Terminal, GitBranch, Zap, Eye, EyeOff, GitPullRequest } from 'lucide-react';

interface ApiKey {
  id: string;
  name: string;
  key: string;
  type: 'personal' | 'service';
  createdAt: string;
}

function generateKey() {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const body = Array.from({ length: 48 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  return `omniguard_sk_${body}`;
}

export default function DeveloperApi() {
  const { user } = useAuth();
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [newKeyType, setNewKeyType] = useState<'personal' | 'service'>('personal');
  const [aiProvider, setAiProvider] = useState<'anthropic' | 'openai' | 'local'>('anthropic');
  const [aiApiKey, setAiApiKey] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [visibleKeys, setVisibleKeys] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  // GitHub Commit Integration simulation states
  const [commits, setCommits] = useState([
    { id: 'c-1', hash: '8f3a9e1', author: 'jane.doe@experian.com', message: 'Add rate limiting middleware', status: 'passed', date: '5m ago' },
  ]);
  const [simulationStep, setSimulationStep] = useState<'idle' | 'blocked' | 'fixed'>('idle');

  // Real GitHub API Connection states
  const [githubConnected, setGithubConnected] = useState(false);
  const [githubPat, setGithubPat] = useState('');
  const [githubRepos, setGithubRepos] = useState<any[]>([]);
  const [showGithubAuthModal, setShowGithubAuthModal] = useState(false);
  const [loadingRepos, setLoadingRepos] = useState(false);
  const [githubError, setGithubError] = useState<string | null>(null);

  const [connectedIntegrations, setConnectedIntegrations] = useState<string[]>([]);
  const [selectedIntegrationForConfig, setSelectedIntegrationForConfig] = useState<any | null>(null);

  useEffect(() => {
    if (!user) return;

    // Load API Keys Cache
    const cacheKey = `omniguard_api_keys_${user.id}`;
    const cachedKeys = localStorage.getItem(cacheKey);
    if (cachedKeys) {
      try {
        setKeys(JSON.parse(cachedKeys));
      } catch {}
    }

    // Load GitHub Integration Cache
    const githubCache = localStorage.getItem(`omniguard_github_${user.id}`);
    if (githubCache) {
      try {
        const parsed = JSON.parse(githubCache);
        setGithubConnected(parsed.connected);
        setGithubPat(parsed.pat);
        setGithubRepos(parsed.repos);
      } catch {}
    }

    // Load Third-Party Integrations Cache
    const intCache = localStorage.getItem(`omniguard_integrations_${user.id}`);
    if (intCache) {
      try {
        setConnectedIntegrations(JSON.parse(intCache));
      } catch {}
    }

    const fetchKeys = async () => {
      if (isSupabaseConfigured && supabase) {
        try {
          const { data: memberData } = await supabase
            .from('organization_members')
            .select('organization_id')
            .eq('user_id', user.id)
            .maybeSingle();

          if (memberData) {
            const orgId = memberData.organization_id;
            const { data: apiKeys, error: keysErr } = await supabase
              .from('api_keys')
              .select('*')
              .eq('organization_id', orgId)
              .eq('is_active', true)
              .order('created_at', { ascending: false });

            if (keysErr) throw keysErr;

            if (apiKeys && apiKeys.length > 0) {
              const mapped: ApiKey[] = apiKeys.map((k: any) => ({
                id: k.id,
                name: k.name,
                key: `${k.key_prefix}••••••••••••••••••••••••••••••••`,
                type: k.scopes?.includes('service') ? 'service' : 'personal',
                createdAt: k.created_at,
              }));
              setKeys(mapped);
              localStorage.setItem(cacheKey, JSON.stringify(mapped));
            }

            // Fetch existing org config to pre-fill provider key
            const { data: orgData } = await supabase
              .from('organizations')
              .select('ai_config')
              .eq('id', orgId)
              .maybeSingle();
            if (orgData?.ai_config && orgData.ai_config.apiKey) {
              setAiApiKey(orgData.ai_config.apiKey);
              setAiProvider(orgData.ai_config.provider || 'anthropic');
            }

            // Fetch active third-party integrations
            const { data: orgIntegrations } = await supabase
              .from('organization_integrations')
              .select('provider')
              .eq('organization_id', orgId);
            if (orgIntegrations && orgIntegrations.length > 0) {
              const providers = orgIntegrations.map((i: any) => i.provider);
              setConnectedIntegrations(providers);
              localStorage.setItem(`omniguard_integrations_${user.id}`, JSON.stringify(providers));
            } else {
              // Fallback: Query policy_chunks with index -888 representing integrations config
              const { data: chunks } = await supabase
                .from('policy_chunks')
                .select('*')
                .eq('organization_id', orgId)
                .eq('chunk_index', -888);
              if (chunks) {
                const providers = chunks.map((c: any) => {
                  try {
                    const parsed = JSON.parse(c.content);
                    return parsed.provider;
                  } catch {
                    return null;
                  }
                }).filter(Boolean);
                setConnectedIntegrations(providers);
                localStorage.setItem(`omniguard_integrations_${user.id}`, JSON.stringify(providers));
              }
            }
          }
        } catch (e: any) {
          console.error('Supabase fetch error, using local cache:', e.message);
        }
      } else {
        if (!cachedKeys) {
          const mockKeys = [
            { id: '1', name: 'Developer CLI Key', key: 'omniguard_sk_devCLI123456789••••••••••••••••••••', type: 'personal', createdAt: new Date().toISOString() }
          ];
          setKeys(mockKeys);
          localStorage.setItem(cacheKey, JSON.stringify(mockKeys));
        }
      }
      setLoading(false);
    };

    fetchKeys();
  }, [user]);

  const handleCreateKey = async () => {
    if (!newKeyName.trim() || !user) return;
    setFormError(null);

    if (!aiApiKey.trim()) {
      setFormError('Please configure your AI Provider API Key first to enable automatic remediations.');
      return;
    }

    const rawKey = generateKey();
    const prefix = rawKey.slice(0, 16);

    if (isSupabaseConfigured && supabase) {
      try {
        const { data: memberData } = await supabase
          .from('organization_members')
          .select('organization_id')
          .eq('user_id', user.id)
          .maybeSingle();

        if (memberData) {
          const orgId = memberData.organization_id;
          
          // Save provider configuration
          await supabase
            .from('organizations')
            .update({
              ai_config: { provider: aiProvider, apiKey: aiApiKey }
            })
            .eq('id', orgId);

          // Save API Key
          await supabase.from('api_keys').insert({
            organization_id: orgId,
            created_by: user.id,
            name: newKeyName,
            key_prefix: prefix,
            key_hash: rawKey,
            scopes: [newKeyType],
            is_active: true,
          });
        }
      } catch (e) {
        console.error(e);
      }
    }

    const newKey: ApiKey = {
      id: `key-${Date.now()}`,
      name: newKeyName,
      key: rawKey,
      type: newKeyType,
      createdAt: new Date().toISOString(),
    };
    const updatedKeys = [newKey, ...keys];
    setKeys(updatedKeys);
    localStorage.setItem(`omniguard_api_keys_${user.id}`, JSON.stringify(updatedKeys));
    setVisibleKeys(new Set([rawKey]));
    setNewKeyName('');
    setNewKeyType('personal');
    setShowCreateForm(false);
  };

  const deleteKey = async (id: string) => {
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase
          .from('api_keys')
          .update({ is_active: false })
          .eq('id', id);
      } catch (e) {
        console.error(e);
      }
    }
    const filteredKeys = keys.filter((k) => k.id !== id);
    setKeys(filteredKeys);
    if (user) {
      localStorage.setItem(`omniguard_api_keys_${user.id}`, JSON.stringify(filteredKeys));
    }
  };

  const runHarmfulCommitSim = async () => {
    setSimulationStep('blocked');
    setCommits([
      { id: 'c-2', hash: 'd9b2a7e', author: 'dev.bot@experian.com', message: 'Inject unsanitized user query in db.py', status: 'blocked', date: 'Just now' },
      ...commits
    ]);
    
    // Post to the local background daemon to compile graph and findings database records
    try {
      await fetch('http://127.0.0.1:5175/webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orgId: user?.orgId || '00000000-0000-0000-0000-000000000000',
          userId: user?.id,
          repository: {
            name: 'experian-payment-processor',
            clone_url: 'https://github.com/experian/payment-processor.git'
          },
          commits: [
            {
              id: 'd9b2a7e',
              message: 'Inject unsanitized user query in db.py',
              author: { name: 'dev.bot@experian.com' }
            }
          ],
          simulateVulnerability: true
        })
      });
    } catch (e) {
      console.warn('Local background daemon offline, writing mock records directly:', e);
      if (isSupabaseConfigured && supabase && user) {
        try {
          const { data: memberData } = await supabase
            .from('organization_members')
            .select('organization_id')
            .eq('user_id', user.id)
            .maybeSingle();

          if (memberData) {
            const orgId = memberData.organization_id;
            await supabase.from('findings').insert({
              organization_id: orgId,
              rule_id: 'GH-HOOK-SQL-9823',
              title: 'Direct SQL execution detected in GitHub commit hook',
              description: 'Unsanitized user input concatenation in SQL query.',
              severity: 'critical',
              file_path: 'db.py',
              line_start: 12,
              evidence: 'cursor.execute("SELECT * FROM users WHERE id = " + user_id)',
              status: 'active',
              scanner: 'github-actions',
              policy_violations: ['SOC2 CC6.2 Threat Prevention']
            });
          }
        } catch (e2) { console.error(e2); }
      }
    }
  };

  const applyRemediationFix = async () => {
    setSimulationStep('fixed');
    setCommits(prev => prev.map(c => c.id === 'c-2' ? { ...c, status: 'passed', message: 'Remediated & Fixed: Use parameterized SQL parameters' } : c));
    
    // Trigger real filesystem fix, commit, and push on daemon
    try {
      const response = await fetch('http://127.0.0.1:5175/ai-fix', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orgId: user?.orgId || '00000000-0000-0000-0000-000000000000',
          repoName: 'trader_bot',
          filePath: 'verify.py', // Test target
          evidence: 'verify or bypass logic pattern matching',
          ruleId: 'SEMANTIC-HEURISTIC-001',
          pat: githubPat || '',
          userId: user?.id
        })
      });
      const data = await response.json();
      if (data.ok) {
        alert(`✓ AI Remediation verified: ${data.message}`);
      } else {
        alert(`⚠️ AI Remediation failed: ${data.error}`);
      }
    } catch (err: any) {
      console.warn('Local background daemon not reachable or connection reset during recommit.');
    }

    if (isSupabaseConfigured && supabase && user) {
      try {
        const { data: memberData } = await supabase
          .from('organization_members')
          .select('organization_id')
          .eq('user_id', user.id)
          .maybeSingle();

        if (memberData) {
          const orgId = memberData.organization_id;
          await supabase
            .from('findings')
            .update({ status: 'resolved' })
            .eq('organization_id', orgId)
            .eq('rule_id', 'GH-HOOK-SQL-9823');
        }
      } catch (e) { console.error(e); }
    }
  };

  const handleGithubConnect = async (pat: string) => {
    if (!pat.trim()) return;
    setLoadingRepos(true);
    setGithubError(null);
    try {
      const res = await fetch('https://api.github.com/user/repos?per_page=15&sort=updated', {
        headers: {
          'Authorization': `token ${pat}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      });
      if (!res.ok) throw new Error('Invalid GitHub token or missing permissions. Please verify scopes (repo).');
      const data = await res.json();
      
      const mapped = data.map((r: any) => ({
        id: r.id,
        name: r.name,
        full_name: r.full_name,
        html_url: r.html_url,
        active: false
      }));

      setGithubRepos(mapped);
      setGithubConnected(true);
      setGithubPat(pat);

      if (user) {
        localStorage.setItem(`omniguard_github_${user.id}`, JSON.stringify({
          connected: true,
          pat,
          repos: mapped
        }));
      }

      // Save to Supabase integrations
      if (isSupabaseConfigured && supabase && user) {
        const { data: memberData } = await supabase
          .from('organization_members')
          .select('organization_id')
          .eq('user_id', user.id)
          .maybeSingle();

        if (memberData) {
          await supabase.from('integrations').insert({
            organization_id: memberData.organization_id,
            provider: 'github',
            name: 'GitHub Repository Sync',
            config: { pat, repos: mapped },
            status: 'active',
            created_by: user.id
          });
        }
      }
      setShowGithubAuthModal(false);
    } catch (err: any) {
      setGithubError(err.message);
    }
    setLoadingRepos(false);
  };

  const toggleRepoActive = async (repoId: number) => {
    const target = githubRepos.find(r => r.id === repoId);
    if (!target) return;
    
    const nextState = !target.active;
    const updatedRepos = githubRepos.map(r => r.id === repoId ? { ...r, active: nextState } : r);
    setGithubRepos(updatedRepos);

    if (user) {
      localStorage.setItem(`omniguard_github_${user.id}`, JSON.stringify({
        connected: githubConnected,
        pat: githubPat,
        repos: updatedRepos
      }));
    }

    if (nextState) {
      console.log('Triggering first-run repo verification and visual graph compilation...');
      try {
        await fetch('http://127.0.0.1:5175/enable-gate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            pat: githubPat,
            orgId: user?.orgId || '00000000-0000-0000-0000-000000000000',
            repoName: target.name,
            htmlUrl: target.html_url
          })
        });
        alert(`OmniGuard Gate enabled! First-run graph creation compiled and synced to Architecture Nexus.`);
      } catch (err) {
        console.warn('Background daemon not reachable for graph sync:', err);
      }
    }
  };

  const toggleKeyVisibility = (key: string) => {
    setVisibleKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const copyKey = (key: string) => {
    navigator.clipboard.writeText(key);
  };

  const maskKey = (key: string) => key.slice(0, 14) + '••••••••••••••••••••••••••••••';

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 text-xs font-semibold text-blue-600 uppercase tracking-widest mb-2">
          <Key size={14} />
          API & Integrations
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Developer API Keys & Integration Hooks</h1>
        <p className="text-sm text-gray-500 mt-1">
          Generate API tokens, configure the MCP server, and embed OmniGuard into your CI/CD pipeline.
        </p>
      </div>

      {/* API Key Generation */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <Key size={16} className="text-blue-500" />
            <h2 className="text-sm font-semibold text-gray-900">API Keys</h2>
          </div>
          {!showCreateForm && (
            <button onClick={() => setShowCreateForm(true)} className="btn-primary text-xs px-3 py-1.5">
              <Plus size={14} /> Generate Key
            </button>
          )}
        </div>

        {showCreateForm && (
          <div className="mb-5 p-5 bg-gray-50 border border-gray-200 rounded-lg space-y-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-2">New API Key</h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Key name</label>
                <input
                  type="text"
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                  placeholder="e.g. CI/CD Pipeline"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Key type</label>
                <select
                  value={newKeyType}
                  onChange={(e) => setNewKeyType(e.target.value as 'personal' | 'service')}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="personal">Personal</option>
                  <option value="service">Service Account</option>
                </select>
              </div>
            </div>

            <div className="border-t border-gray-200 pt-4">
              <h4 className="text-xs font-bold text-gray-700 mb-3 uppercase tracking-wider">Configure Continuous AI Provider (Required)</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">AI Provider</label>
                  <select
                    value={aiProvider}
                    onChange={(e) => setAiProvider(e.target.value as 'anthropic' | 'openai' | 'local')}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="anthropic">Anthropic (Claude 3.5 Sonnet)</option>
                    <option value="openai">OpenAI (GPT-4o)</option>
                    <option value="local">Local Edge Guardrails</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">AI Provider API Key / Secret</label>
                  <input
                    type="password"
                    value={aiApiKey}
                    onChange={(e) => setAiApiKey(e.target.value)}
                    placeholder="sk-ant-... or sk-..."
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {formError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2.5 text-xs text-red-800 font-semibold">
                ⚠️ {formError}
              </div>
            )}

            <div className="flex items-center gap-3 pt-2">
              <button onClick={handleCreateKey} className="btn-primary text-xs px-4 py-2">
                <Key size={14} /> Generate Token
              </button>
              <button onClick={() => setShowCreateForm(false)} className="btn-ghost text-xs">
                Cancel
              </button>
            </div>
          </div>
        )}

        {keys.length === 0 && !showCreateForm ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-3">
              <Key size={20} className="text-gray-400" />
            </div>
            <p className="text-sm text-gray-500">No API keys generated yet.</p>
            <p className="text-xs text-gray-400 mt-1">
              Generate personal or service-account <code className="code-inline">omniguard_sk_...</code> tokens.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {keys.map((k) => (
              <div key={k.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-sm font-medium text-gray-900">{k.name}</p>
                    <span className={`tag ${k.type === 'service' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>
                      {k.type}
                    </span>
                  </div>
                  <code className="text-xs text-gray-500 font-mono">
                    {visibleKeys.has(k.key) ? k.key : maskKey(k.key)}
                  </code>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => toggleKeyVisibility(k.key)}
                    className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
                    title={visibleKeys.has(k.key) ? 'Hide' : 'Reveal'}
                  >
                    {visibleKeys.has(k.key) ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                  <button
                    onClick={() => copyKey(k.key)}
                    className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
                    title="Copy"
                  >
                    <Copy size={14} />
                  </button>
                  <button
                    onClick={() => deleteKey(k.id)}
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

      {/* MCP Server Configuration */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center gap-2 mb-5">
          <Zap size={16} className="text-amber-500" />
          <h2 className="text-sm font-semibold text-gray-900">MCP Server Configuration</h2>
        </div>
        <p className="text-sm text-gray-500 mb-4">
          Hook the OmniGuard MCP server into Claude Desktop or Antigravity IDE for real-time, pre-commit AI guardrails.
        </p>
        <div className="bg-gray-950 rounded-lg p-4 overflow-x-auto">
          <pre className="text-sm text-green-400 font-mono">{`{
  "mcpServers": {
    "omniguard-nexus": {
      "command": "node",
      "args": ["cli/src/mcp-server.js"]
    }
  }
}`}</pre>
        </div>
        <p className="text-xs text-gray-400 mt-3">
          Place this in your Claude Desktop config file or Antigravity IDE MCP settings. The server exposes tools for Threat Library, Secure Design Graph, Compliance Evidence, Drift Detection, and Architecture Mapping.
        </p>
      </div>

      {/* CI/CD Hooks */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center gap-2 mb-5">
          <GitBranch size={16} className="text-blue-500" />
          <h2 className="text-sm font-semibold text-gray-900">CI/CD Hooks</h2>
        </div>
        <p className="text-sm text-gray-500 mb-4">
          Copy-paste snippets to embed OmniGuard into your GitHub Actions or GitLab CI pipeline.
        </p>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Terminal size={14} className="text-gray-500" />
              <span className="text-xs font-semibold text-gray-700">GitHub Actions</span>
            </div>
            <div className="bg-gray-950 rounded-lg p-4 overflow-x-auto">
              <pre className="text-xs text-green-400 font-mono">{`- name: OmniGuard Nexus Check
  run: npx omniguard nexus check
  env:
    OMNIGUARD_API_KEY: \${{ secrets.OMNIGUARD_API_KEY }}`}</pre>
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Terminal size={14} className="text-gray-500" />
              <span className="text-xs font-semibold text-gray-700">GitLab CI</span>
            </div>
            <div className="bg-gray-950 rounded-lg p-4 overflow-x-auto">
              <pre className="text-xs text-green-400 font-mono">{`omniguard_check:
  script:
    - npx omniguard nexus check
  variables:
    OMNIGUARD_API_KEY: $CI_OMNIGUARD_API_KEY`}</pre>
            </div>
          </div>
        </div>
      </div>

      {/* GitHub Integration Security Gate (Pre-Commit & Push Guard) */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <GitPullRequest size={16} className="text-purple-600" />
            <h2 className="text-sm font-semibold text-gray-900">GitHub Provider Integration Gate</h2>
          </div>
          <span className={`tag ${githubConnected ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'} font-semibold`}>
            {githubConnected ? 'Connected' : 'Inactive'}
          </span>
        </div>
        <p className="text-sm text-gray-500 mb-6">
          OmniGuard monitors commits pushed to your repository. Harmful commits violating policies are blocked in real-time. Connect your GitHub account to see live repos.
        </p>

        {!githubConnected ? (
          <div className="flex flex-col items-center justify-center p-8 border border-dashed border-gray-300 rounded-xl text-center bg-gray-50">
            <GitPullRequest size={36} className="text-gray-400 mb-3 animate-pulse" />
            <h3 className="text-sm font-semibold text-gray-900">No GitHub Repositories Synced</h3>
            <p className="text-xs text-gray-500 mt-1 mb-4 max-w-sm">
              Authorize OmniGuard Nexus access to retrieve your enterprise repositories and enforce pre-commit rules.
            </p>
            <button
              onClick={() => setShowGithubAuthModal(true)}
              className="btn-primary text-xs px-4 py-2"
            >
              Connect GitHub Account
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            <div>
              <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-3">Sync & Select Repositories</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {githubRepos.map((repo) => (
                  <div key={repo.id} className="p-3 border border-gray-200 rounded-lg flex items-center justify-between bg-white shadow-sm">
                    <div className="min-w-0 pr-3">
                      <p className="text-xs font-bold text-gray-900 truncate">{repo.name}</p>
                      <a href={repo.html_url} target="_blank" rel="noreferrer" className="text-[10px] text-blue-500 truncate block hover:underline">
                        {repo.full_name}
                      </a>
                    </div>
                    <button
                      onClick={() => toggleRepoActive(repo.id)}
                      className={`text-xs px-2.5 py-1 rounded font-semibold transition-all ${
                        repo.active
                          ? 'bg-purple-100 text-purple-700 border border-purple-300'
                          : 'bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-200'
                      }`}
                    >
                      {repo.active ? 'Guard Active' : 'Enable Gate'}
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t border-gray-100 pt-4 space-y-4">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <span className="text-xs font-bold text-gray-700 uppercase">Recent Commits Scan Log</span>
                {simulationStep === 'idle' && (
                  <button
                    onClick={runHarmfulCommitSim}
                    className="btn-secondary border-red-200 text-red-600 hover:bg-red-50 text-xs px-3 py-1.5"
                  >
                    Simulate Harmful Commit on Active Repos
                  </button>
                )}
              </div>

              <div className="space-y-2">
                {commits.map((c) => (
                  <div key={c.id} className="p-4 border border-gray-200 rounded-lg flex items-center justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs text-gray-500 font-bold">[{c.hash}]</span>
                        <span className="text-xs text-gray-700 font-semibold">{c.message}</span>
                      </div>
                      <div className="text-xs text-gray-400">
                        By {c.author} • {c.date}
                      </div>
                    </div>
                    <div>
                      <span className={`tag ${c.status === 'passed' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {c.status.toUpperCase()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {simulationStep === 'blocked' && (
                <div className="mt-4 p-5 bg-red-50 border border-red-200 rounded-lg space-y-4">
                  <div className="flex items-center gap-2 text-red-800 font-bold text-sm">
                    <span>❌ Commit Blocked by OmniGuard Guardrails</span>
                  </div>
                  <div className="text-xs text-red-700 space-y-1 leading-relaxed">
                    <div><strong>Warning ID:</strong> <code className="bg-red-100 px-1 py-0.5 rounded font-mono">GH-HOOK-SQL-9823</code></div>
                    <div><strong>Exact Policy & Clause:</strong> SOC2 CC6.2 Threat Prevention - Direct SQL concatenation detected (potential SQL injection).</div>
                    <div className="bg-gray-900 text-green-400 p-3 rounded font-mono mt-2 overflow-x-auto">
                      <span className="text-red-400">- cursor.execute("SELECT * FROM users WHERE id = " + user_id)</span><br />
                      <span className="text-green-400">+ cursor.execute("SELECT * FROM users WHERE id = %s", (user_id,))</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={applyRemediationFix}
                      className="btn-primary text-xs bg-green-600 hover:bg-green-700 text-white border-transparent px-4 py-2"
                    >
                      Apply AI Remediation & Recommit
                    </button>
                  </div>
                </div>
              )}

              {simulationStep === 'fixed' && (
                <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg text-xs text-green-800 font-medium">
                  ✅ AI Remediation patch successfully compiled, committed and pushed with comment: <code className="bg-green-100 px-1 font-mono">Remediated & Fixed: Use parameterized SQL parameters</code>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Enterprise Incident & Secrets Integrations */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center gap-2 mb-5">
          <Zap size={16} className="text-blue-600" />
          <h2 className="text-sm font-semibold text-gray-900">Third-Party Incident, Secrets & Slack Gateways</h2>
        </div>
        <p className="text-sm text-gray-500 mb-6">
          Synchronize scan alerts with issue trackers, document remediation compliance automatically, and verify secret values against safe vaults.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            { id: 'slack', name: 'Slack Alerts', desc: 'Post real-time compliance gate alerts and scan failure details to Slack channels.', type: 'collaboration' },
            { id: 'teams', name: 'Microsoft Teams', desc: 'Sync threat metrics and alert notification updates into MS Teams channels.', type: 'collaboration' },
            { id: 'pagerduty', name: 'PagerDuty', desc: 'Trigger high-urgency incidents on critical posture drift detection.', type: 'incident' },
            { id: 'jira', name: 'Atlassian Jira', desc: 'Auto-create remediation tickets on scan failures.', type: 'incident' },
            { id: 'servicenow', name: 'ServiceNow', desc: 'File security incidents for policy violations.', type: 'incident' },
            { id: 'confluence', name: 'Confluence Docs', desc: 'Sync SBOM and compliance audit documents.', type: 'docs' },
            { id: 'vault', name: 'HashiCorp Vault', desc: 'Verify and rotate hardcoded secret credentials.', type: 'vault' }
          ].map((int) => (
            <div key={int.id} className="p-4 border border-gray-200 rounded-lg flex flex-col justify-between space-y-4">
              <div>
                <h3 className="text-sm font-bold text-gray-900">{int.name}</h3>
                <p className="text-xs text-gray-500 mt-1">{int.desc}</p>
              </div>
              <div className="flex items-center justify-between border-t border-gray-100 pt-3">
                <span className="text-xs font-semibold text-amber-600">
                  {connectedIntegrations.includes(int.id) ? 'Active' : 'Available'}
                </span>
                <button
                  onClick={() => setSelectedIntegrationForConfig(int)}
                  className={`text-xs px-2.5 py-1 font-semibold rounded transition-all ${
                    connectedIntegrations.includes(int.id)
                      ? 'bg-green-100 text-green-700 border border-green-300 hover:bg-green-200'
                      : 'btn-primary'
                  }`}
                >
                  {connectedIntegrations.includes(int.id) ? 'Configure' : 'Connect & Sync'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* GitHub Authentication Modal Overlay */}
      {showGithubAuthModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="bg-white border border-gray-200 rounded-xl shadow-xl max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div>
              <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <GitPullRequest size={18} className="text-purple-600" />
                Connect GitHub via Personal Access Token
              </h3>
              <p className="text-xs text-gray-500 mt-1">
                To sync your actual repository details, generate a classic token with <code className="bg-gray-100 px-1 py-0.5 rounded font-mono">repo</code> scope.
              </p>
            </div>

            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-[11px] text-gray-600 leading-relaxed">
              💡 <strong>Quick Instructions:</strong> Go to GitHub settings &rarr; Developer settings &rarr; Personal Access Tokens &rarr; Tokens (classic) &rarr; Generate new token.
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Personal Access Token (PAT)</label>
                <input
                  type="password"
                  placeholder="ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                  value={githubPat}
                  onChange={(e) => setGithubPat(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono"
                />
              </div>

              {githubError && (
                <div className="p-2.5 bg-red-50 border border-red-200 rounded-lg text-xs text-red-800 font-medium">
                  ⚠️ {githubError}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
              <button
                type="button"
                onClick={() => {
                  setShowGithubAuthModal(false);
                  setGithubError(null);
                }}
                className="btn-ghost text-xs px-3 py-2"
                disabled={loadingRepos}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleGithubConnect(githubPat)}
                className="btn-primary text-xs bg-purple-600 hover:bg-purple-700 text-white border-transparent px-4 py-2 flex items-center gap-1.5"
                disabled={loadingRepos}
              >
                {loadingRepos ? (
                  <>
                    <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Connecting...
                  </>
                ) : (
                  'Verify & Import Repositories'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Third-Party Integrations Configuration Modal */}
      {selectedIntegrationForConfig && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="bg-white border border-gray-200 rounded-xl shadow-xl max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div>
              <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <Zap size={18} className="text-blue-600" />
                Configure {selectedIntegrationForConfig.name}
              </h3>
              <p className="text-xs text-gray-500 mt-1">
                Enter your connection credentials to link {selectedIntegrationForConfig.name} with your organization.
              </p>
            </div>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const target = e.target as any;
                const credentials: any = {};
                
                if (selectedIntegrationForConfig.id === 'slack' || selectedIntegrationForConfig.id === 'teams') {
                  credentials.webhook_url = target.webhookUrl.value;
                } else if (selectedIntegrationForConfig.id === 'jira' || selectedIntegrationForConfig.id === 'confluence') {
                  credentials.host_url = target.hostUrl.value;
                  credentials.email = target.email.value;
                  credentials.api_token = target.apiToken.value;
                  if (selectedIntegrationForConfig.id === 'jira') credentials.project_key = target.projectKey.value;
                  if (selectedIntegrationForConfig.id === 'confluence') credentials.space_key = target.spaceKey.value;
                } else if (selectedIntegrationForConfig.id === 'servicenow') {
                  credentials.host_url = target.hostUrl.value;
                  credentials.username = target.username.value;
                  credentials.password = target.password.value;
                } else if (selectedIntegrationForConfig.id === 'vault') {
                  credentials.address = target.address.value;
                  credentials.token = target.token.value;
                } else if (selectedIntegrationForConfig.id === 'pagerduty') {
                  credentials.routing_key = target.routingKey.value;
                }

                if (isSupabaseConfigured && supabase && user) {
                  try {
                    const { data: memberData } = await supabase
                      .from('organization_members')
                      .select('organization_id')
                      .eq('user_id', user.id)
                      .maybeSingle();

                    if (memberData) {
                      // Try organization_integrations table first
                      const { error } = await supabase
                        .from('organization_integrations')
                        .upsert({
                          organization_id: memberData.organization_id,
                          provider: selectedIntegrationForConfig.id,
                          status: 'active',
                          credentials
                        }, { onConflict: 'organization_id,provider' });

                      if (error) {
                        // Fallback: Store inside policy_chunks with index -888 representing integrations config
                        await supabase
                          .from('policy_chunks')
                          .upsert({
                            organization_id: memberData.organization_id,
                            chunk_index: -888,
                            content: JSON.stringify({ provider: selectedIntegrationForConfig.id, credentials }),
                            metadata: { provider: selectedIntegrationForConfig.id, type: 'third_party_integration' }
                          }, { onConflict: 'organization_id,chunk_index' }); // upsert based on composite key if exists
                      }

                      const updated = [...connectedIntegrations, selectedIntegrationForConfig.id];
                      setConnectedIntegrations(updated);
                      localStorage.setItem(`omniguard_integrations_${user.id}`, JSON.stringify(updated));
                      alert(`Successfully connected ${selectedIntegrationForConfig.name}!`);
                    }
                  } catch (err: any) {
                    alert(`Integration error: ${err.message}`);
                  }
                } else {
                  // Fallback mock
                  const updated = [...connectedIntegrations, selectedIntegrationForConfig.id];
                  setConnectedIntegrations(updated);
                  localStorage.setItem(`omniguard_integrations_${user.id}`, JSON.stringify(updated));
                  alert(`Successfully connected ${selectedIntegrationForConfig.name} (Local Mock Mode)!`);
                }

                setSelectedIntegrationForConfig(null);
              }}
              className="space-y-4"
            >
              {/* Fields based on integration provider */}
              {(selectedIntegrationForConfig.id === 'slack' || selectedIntegrationForConfig.id === 'teams') && (
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Webhook URL</label>
                  <input
                    required
                    name="webhookUrl"
                    type="url"
                    placeholder="https://hooks.slack.com/services/..."
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}

              {(selectedIntegrationForConfig.id === 'jira' || selectedIntegrationForConfig.id === 'confluence') && (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">Host URL</label>
                    <input
                      required
                      name="hostUrl"
                      type="url"
                      placeholder="https://your-domain.atlassian.net"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">Account Email</label>
                    <input
                      required
                      name="email"
                      type="email"
                      placeholder="ciso@experian.com"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">API Token</label>
                    <input
                      required
                      name="apiToken"
                      type="password"
                      placeholder="ATATT3xFfGF..."
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  {selectedIntegrationForConfig.id === 'jira' && (
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1.5">Project Key</label>
                      <input
                        required
                        name="projectKey"
                        placeholder="e.g. SEC"
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  )}
                  {selectedIntegrationForConfig.id === 'confluence' && (
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1.5">Space Key</label>
                      <input
                        required
                        name="spaceKey"
                        placeholder="e.g. AUDIT"
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  )}
                </>
              )}

              {selectedIntegrationForConfig.id === 'servicenow' && (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">Instance URL</label>
                    <input
                      required
                      name="hostUrl"
                      type="url"
                      placeholder="https://dev12345.service-now.com"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">Username</label>
                    <input
                      required
                      name="username"
                      placeholder="admin"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">Password</label>
                    <input
                      required
                      name="password"
                      type="password"
                      placeholder="••••••••••••"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </>
              )}

              {selectedIntegrationForConfig.id === 'vault' && (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">Vault Address</label>
                    <input
                      required
                      name="address"
                      type="url"
                      placeholder="https://vault.internal.net:8200"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">Token</label>
                    <input
                      required
                      name="token"
                      type="password"
                      placeholder="hvs.xxxxxxxx"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </>
              )}

              {selectedIntegrationForConfig.id === 'pagerduty' && (
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Routing Key (Integration Key)</label>
                  <input
                    required
                    name="routingKey"
                    placeholder="e.g. pd-service-routing-key"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}

              <div className="flex justify-between items-center pt-3 border-t border-gray-100">
                {connectedIntegrations.includes(selectedIntegrationForConfig.id) ? (
                  <button
                    type="button"
                    onClick={async () => {
                      if (isSupabaseConfigured && supabase && user) {
                        try {
                          const { data: memberData } = await supabase
                            .from('organization_members')
                            .select('organization_id')
                            .eq('user_id', user.id)
                            .maybeSingle();

                          if (memberData) {
                            // Try deleting from organization_integrations first
                            const { error } = await supabase
                              .from('organization_integrations')
                              .delete()
                              .eq('organization_id', memberData.organization_id)
                              .eq('provider', selectedIntegrationForConfig.id);

                            if (error) {
                              // Fallback: Delete from policy_chunks
                              await supabase
                                .from('policy_chunks')
                                .delete()
                                .eq('organization_id', memberData.organization_id)
                                .eq('chunk_index', -888);
                            }
                          }
                        } catch {}
                      }

                      const updated = connectedIntegrations.filter(id => id !== selectedIntegrationForConfig.id);
                      setConnectedIntegrations(updated);
                      localStorage.setItem(`omniguard_integrations_${user.id}`, JSON.stringify(updated));
                      setSelectedIntegrationForConfig(null);
                      alert(`Disconnected ${selectedIntegrationForConfig.name}.`);
                    }}
                    className="text-xs text-red-600 font-semibold hover:underline"
                  >
                    Disconnect Integration
                  </button>
                ) : (
                  <span />
                )}

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedIntegrationForConfig(null)}
                    className="btn-ghost text-xs px-3 py-2"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn-primary text-xs px-4 py-2"
                  >
                    Save & Activate
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
