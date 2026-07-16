import { useState, useEffect } from 'react'
import { useAuth } from '../hooks/useAuth'
import { supabase, supabaseAuth } from '../lib/supabase'
import { Cloud, Key, Users, Zap, Check, AlertCircle, Loader2 } from 'lucide-react'

const API = import.meta.env.VITE_SUPABASE_URL + '/functions/v1'

export function AdvancedSettings() {
  const { currentOrganizationId, canManageOrg } = useAuth()
  const [tab, setTab] = useState<'okta' | 'aws' | 'pro-scan' | 'performance'>('okta')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [orgData, setOrgData] = useState<any>(null)

  const [oktaConfig, setOktaConfig] = useState({
    enabled: false,
    domain: '',
    clientId: '',
    clientSecret: '',
    issuer: '',
    redirectUri: '',
    autoProvision: true,
    defaultRole: 'developer',
  })

  const [awsConfig, setAwsConfig] = useState({
    enabled: false,
    accessKeyId: '',
    secretAccessKey: '',
    region: 'us-east-1',
    proScanEnabled: false,
    ecrScanEnabled: false,
    lambdaScanEnabled: false,
    iamAuditEnabled: false,
  })

  const [perfConfig, setPerfConfig] = useState({
    parallelScans: true,
    maxWorkers: 8,
    cacheTTL: 3600,
    incrementalScans: true,
    semanticOnSave: true,
    graphOnScan: true,
  })

  useEffect(() => {
    if (!currentOrganizationId) return
    supabase.from('organizations').select('*').eq('id', currentOrganizationId).single().then(({ data }) => {
      setOrgData(data)
      if (data?.okta_config) setOktaConfig(prev => ({ ...prev, ...data.okta_config, enabled: true }))
      if (data?.aws_config) setAwsConfig(prev => ({ ...prev, ...data.aws_config, enabled: true }))
      if (data?.features) setPerfConfig(prev => ({ ...prev, ...data.features }))
      if (data?.pro_scan_enabled) setAwsConfig(prev => ({ ...prev, proScanEnabled: true }))
    })
  }, [currentOrganizationId])

  const saveOkta = async () => {
    if (!currentOrganizationId) return
    setSaving(true)
    const { data: { session } } = await supabaseAuth.getSession()
    try {
      // Store Okta config (secrets go to vault via secrets-proxy, non-secret to org table)
      await supabase.from('organizations').update({
        okta_config: { enabled: oktaConfig.enabled, domain: oktaConfig.domain, clientId: oktaConfig.clientId, issuer: oktaConfig.issuer, redirectUri: oktaConfig.redirectUri, autoProvision: oktaConfig.autoProvision, defaultRole: oktaConfig.defaultRole },
      }).eq('id', currentOrganizationId)

      // Store client secret in vault
      if (oktaConfig.clientSecret && session) {
        await fetch(`${API}/secrets-proxy`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
          body: JSON.stringify({ key: 'okta_client_secret', value: oktaConfig.clientSecret }),
        })
      }

      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch (e) { console.error('Save Okta failed:', e) }
    setSaving(false)
  }

  const saveAWS = async () => {
    if (!currentOrganizationId) return
    setSaving(true)
    try {
      await supabase.from('organizations').update({
        aws_config: { enabled: awsConfig.enabled, region: awsConfig.region, ecrScan: awsConfig.ecrScanEnabled, lambdaScan: awsConfig.lambdaScanEnabled, iamAudit: awsConfig.iamAuditEnabled },
        pro_scan_enabled: awsConfig.proScanEnabled,
      }).eq('id', currentOrganizationId)

      // Store AWS credentials in vault
      const { data: { session } } = await supabaseAuth.getSession()
      if (session && awsConfig.accessKeyId) {
        await fetch(`${API}/secrets-proxy`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
          body: JSON.stringify({ key: 'aws_access_key_id', value: awsConfig.accessKeyId }),
        })
        await fetch(`${API}/secrets-proxy`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
          body: JSON.stringify({ key: 'aws_secret_access_key', value: awsConfig.secretAccessKey }),
        })
      }

      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch (e) { console.error('Save AWS failed:', e) }
    setSaving(false)
  }

  const savePerf = async () => {
    if (!currentOrganizationId) return
    setSaving(true)
    await supabase.from('organizations').update({ features: perfConfig }).eq('id', currentOrganizationId)
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const TABS = [
    { key: 'okta' as const, label: 'Okta SSO', icon: Users },
    { key: 'aws' as const, label: 'AWS Pro Scan', icon: Cloud },
    { key: 'pro-scan' as const, label: 'Pro Scan Tier', icon: Zap },
    { key: 'performance' as const, label: 'Performance', icon: Key },
  ]

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-white">Advanced Settings</h1>
        <p className="text-slate-400 text-sm mt-1">Enterprise integrations, AWS pro scanning, and performance tuning</p>
      </div>

      <div className="flex gap-1 border-b border-slate-700 pb-px overflow-x-auto">
        {TABS.map(t => {
          const Icon = t.icon
          return (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`px-4 py-2 text-sm font-medium whitespace-nowrap border-b-2 -mb-px flex items-center gap-2 ${tab === t.key ? 'border-blue-500 text-blue-400' : 'border-transparent text-slate-400 hover:text-slate-200'}`}>
              <Icon className="w-4 h-4" /> {t.label}
            </button>
          )
        })}
      </div>

      {/* ── Okta SSO ── */}
      {tab === 'okta' && (
        <div className="space-y-4">
          <div className="card p-4 bg-blue-500/5 border-blue-500/20">
            <p className="text-blue-300 text-sm font-medium mb-1">Okta SSO Integration</p>
            <p className="text-slate-400 text-sm">Configure Okta as your SSO provider. In production, Okta is always enabled if the OKTA_DOMAIN env var is detected on the server.</p>
          </div>

          <div className="card p-5 space-y-4">
            <label className="flex items-center gap-3 cursor-pointer">
              <div onClick={() => setOktaConfig({ ...oktaConfig, enabled: !oktaConfig.enabled })}
                className={`w-10 h-6 rounded-full relative transition-colors ${oktaConfig.enabled ? 'bg-blue-500' : 'bg-slate-700'}`}>
                <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${oktaConfig.enabled ? 'translate-x-5' : 'translate-x-1'}`} />
              </div>
              <span className="text-slate-300 text-sm">Enable Okta SSO</span>
            </label>

            {oktaConfig.enabled && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">Okta Domain</label>
                    <input className="input" placeholder="yourco.okta.com" value={oktaConfig.domain} onChange={e => setOktaConfig({ ...oktaConfig, domain: e.target.value })} />
                  </div>
                  <div>
                    <label className="label">Client ID</label>
                    <input className="input" placeholder="0oa..." value={oktaConfig.clientId} onChange={e => setOktaConfig({ ...oktaConfig, clientId: e.target.value })} />
                  </div>
                  <div>
                    <label className="label">Client Secret</label>
                    <input className="input" type="password" placeholder="Stored in vault" value={oktaConfig.clientSecret} onChange={e => setOktaConfig({ ...oktaConfig, clientSecret: e.target.value })} />
                  </div>
                  <div>
                    <label className="label">Issuer URI</label>
                    <input className="input" placeholder="https://yourco.okta.com/oauth2/default" value={oktaConfig.issuer} onChange={e => setOktaConfig({ ...oktaConfig, issuer: e.target.value })} />
                  </div>
                  <div>
                    <label className="label">Redirect URI</label>
                    <input className="input" placeholder="https://app.omniguard.io/auth/okta/callback" value={oktaConfig.redirectUri} onChange={e => setOktaConfig({ ...oktaConfig, redirectUri: e.target.value })} />
                  </div>
                  <div>
                    <label className="label">Default Role for New Users</label>
                    <select className="input" value={oktaConfig.defaultRole} onChange={e => setOktaConfig({ ...oktaConfig, defaultRole: e.target.value })}>
                      <option value="developer">Developer</option>
                      <option value="manager">Manager</option>
                      <option value="viewer">Viewer</option>
                    </select>
                  </div>
                </div>
                <label className="flex items-center gap-3 cursor-pointer">
                  <div onClick={() => setOktaConfig({ ...oktaConfig, autoProvision: !oktaConfig.autoProvision })}
                    className={`w-10 h-6 rounded-full relative transition-colors ${oktaConfig.autoProvision ? 'bg-blue-500' : 'bg-slate-700'}`}>
                    <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${oktaConfig.autoProvision ? 'translate-x-5' : 'translate-x-1'}`} />
                  </div>
                  <span className="text-slate-300 text-sm">Auto-provision users on first SSO login</span>
                </label>
              </>
            )}

            <button onClick={saveOkta} disabled={saving || !canManageOrg} className="btn-primary">
              {saved ? <><Check className="w-4 h-4" />Saved!</> : saving ? <><Loader2 className="w-4 h-4 animate-spin" />Saving…</> : 'Save Okta Configuration'}
            </button>
          </div>
        </div>
      )}

      {/* ── AWS Pro Scan ── */}
      {tab === 'aws' && (
        <div className="space-y-4">
          <div className="card p-4 bg-orange-500/5 border-orange-500/20">
            <p className="text-orange-300 text-sm font-medium mb-1">AWS Pro-Level Scanning</p>
            <p className="text-slate-400 text-sm">Enable AWS-level project scanning: ECR container images, Lambda functions, IAM policies, and S3 bucket configurations. Installable via Docker on AWS.</p>
          </div>

          <div className="card p-5 space-y-4">
            <label className="flex items-center gap-3 cursor-pointer">
              <div onClick={() => setAwsConfig({ ...awsConfig, enabled: !awsConfig.enabled })}
                className={`w-10 h-6 rounded-full relative transition-colors ${awsConfig.enabled ? 'bg-orange-500' : 'bg-slate-700'}`}>
                <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${awsConfig.enabled ? 'translate-x-5' : 'translate-x-1'}`} />
              </div>
              <span className="text-slate-300 text-sm">Enable AWS Integration</span>
            </label>

            {awsConfig.enabled && (
              <>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="label">AWS Access Key ID</label>
                    <input className="input" type="password" placeholder="AKIA..." value={awsConfig.accessKeyId} onChange={e => setAwsConfig({ ...awsConfig, accessKeyId: e.target.value })} />
                  </div>
                  <div>
                    <label className="label">Secret Access Key</label>
                    <input className="input" type="password" placeholder="Stored in vault" value={awsConfig.secretAccessKey} onChange={e => setAwsConfig({ ...awsConfig, secretAccessKey: e.target.value })} />
                  </div>
                  <div>
                    <label className="label">Region</label>
                    <select className="input" value={awsConfig.region} onChange={e => setAwsConfig({ ...awsConfig, region: e.target.value })}>
                      {['us-east-1', 'us-east-2', 'us-west-1', 'us-west-2', 'eu-west-1', 'eu-central-1', 'ap-south-1', 'ap-southeast-1'].map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </div>
                </div>

                <div className="space-y-3 pt-2 border-t border-slate-700">
                  <h4 className="text-slate-300 font-medium text-sm">Pro Scan Capabilities</h4>
                  {[
                    ['ecrScanEnabled', 'ECR Container Image Scanning', 'Scan all ECR repositories for vulnerabilities'],
                    ['lambdaScanEnabled', 'Lambda Function Analysis', 'Analyze Lambda functions for security misconfigurations'],
                    ['iamAuditEnabled', 'IAM Policy Audit', 'Audit IAM policies for over-permissive access'],
                  ].map(([key, label, desc]) => (
                    <label key={key as string} className="flex items-start gap-3 cursor-pointer">
                      <div onClick={() => setAwsConfig({ ...awsConfig, [key]: !(awsConfig as any)[key] })}
                        className={`w-10 h-6 rounded-full relative transition-colors mt-1 ${(awsConfig as any)[key] ? 'bg-orange-500' : 'bg-slate-700'}`}>
                        <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${(awsConfig as any)[key] ? 'translate-x-5' : 'translate-x-1'}`} />
                      </div>
                      <div>
                        <span className="text-slate-300 text-sm block">{label}</span>
                        <span className="text-slate-500 text-xs">{desc}</span>
                      </div>
                    </label>
                  ))}
                </div>
              </>
            )}

            <button onClick={saveAWS} disabled={saving || !canManageOrg} className="btn-primary">
              {saved ? <><Check className="w-4 h-4" />Saved!</> : saving ? <><Loader2 className="w-4 h-4 animate-spin" />Saving…</> : 'Save AWS Configuration'}
            </button>
          </div>
        </div>
      )}

      {/* ── Pro Scan Tier ── */}
      {tab === 'pro-scan' && (
        <div className="space-y-4">
          <div className="card p-4 bg-purple-500/5 border-purple-500/20">
            <p className="text-purple-300 text-sm font-medium mb-1">Pro Scan Tier</p>
            <p className="text-slate-400 text-sm">Pro scanning includes deep semantic analysis, multi-framework compliance mapping, architecture graph diffing, and AI-powered false positive reduction. Available on Enterprise plan.</p>
          </div>

          <div className="card p-5 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className={`p-4 rounded-xl border ${orgData?.plan === 'enterprise' ? 'border-green-500/30 bg-green-500/5' : 'border-slate-700 bg-slate-900'}`}>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-slate-200 font-medium">Standard Scan</h4>
                  {!awsConfig.proScanEnabled && <Check className="w-4 h-4 text-green-400" />}
                </div>
                <ul className="text-xs text-slate-400 space-y-1">
                  <li>• Regex-based SAST, secrets, IaC, deps</li>
                  <li>• Basic compliance mapping</li>
                  <li>• Single framework report</li>
                  <li>• No architecture graph</li>
                </ul>
              </div>
              <div className={`p-4 rounded-xl border ${awsConfig.proScanEnabled ? 'border-purple-500/30 bg-purple-500/5' : 'border-slate-700 bg-slate-900'}`}>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-slate-200 font-medium">Pro Scan</h4>
                  {awsConfig.proScanEnabled && <Check className="w-4 h-4 text-purple-400" />}
                </div>
                <ul className="text-xs text-slate-400 space-y-1">
                  <li>• Semantic taint analysis</li>
                  <li>• Multi-framework compliance (7 frameworks)</li>
                  <li>• Architecture graph with diff tracking</li>
                  <li>• AI false positive reduction (Layer 1)</li>
                  <li>• Deterministic clause mapping</li>
                  <li>• AWS ECR/Lambda/IAM scanning</li>
                  <li>• Real-time scan events</li>
                </ul>
              </div>
            </div>

            <label className="flex items-center gap-3 cursor-pointer">
              <div onClick={() => setAwsConfig({ ...awsConfig, proScanEnabled: !awsConfig.proScanEnabled })}
                className={`w-10 h-6 rounded-full relative transition-colors ${awsConfig.proScanEnabled ? 'bg-purple-500' : 'bg-slate-700'}`}>
                <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${awsConfig.proScanEnabled ? 'translate-x-5' : 'translate-x-1'}`} />
              </div>
              <span className="text-slate-300 text-sm">Enable Pro Scan Tier</span>
            </label>

            <button onClick={saveAWS} disabled={saving || !canManageOrg} className="btn-primary">
              {saved ? <><Check className="w-4 h-4" />Saved!</> : saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </div>
      )}

      {/* ── Performance ── */}
      {tab === 'performance' && (
        <div className="space-y-4">
          <div className="card p-5 space-y-4">
            <h3 className="text-white font-medium">Scan Performance</h3>
            <div className="grid grid-cols-2 gap-4">
              <label className="flex items-center gap-3 cursor-pointer">
                <div onClick={() => setPerfConfig({ ...perfConfig, parallelScans: !perfConfig.parallelScans })}
                  className={`w-10 h-6 rounded-full relative transition-colors ${perfConfig.parallelScans ? 'bg-blue-500' : 'bg-slate-700'}`}>
                  <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${perfConfig.parallelScans ? 'translate-x-5' : 'translate-x-1'}`} />
                </div>
                <span className="text-slate-300 text-sm">Parallel file scanning</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <div onClick={() => setPerfConfig({ ...perfConfig, incrementalScans: !perfConfig.incrementalScans })}
                  className={`w-10 h-6 rounded-full relative transition-colors ${perfConfig.incrementalScans ? 'bg-blue-500' : 'bg-slate-700'}`}>
                  <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${perfConfig.incrementalScans ? 'translate-x-5' : 'translate-x-1'}`} />
                </div>
                <span className="text-slate-300 text-sm">Incremental scanning (only changed files)</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <div onClick={() => setPerfConfig({ ...perfConfig, semanticOnSave: !perfConfig.semanticOnSave })}
                  className={`w-10 h-6 rounded-full relative transition-colors ${perfConfig.semanticOnSave ? 'bg-blue-500' : 'bg-slate-700'}`}>
                  <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${perfConfig.semanticOnSave ? 'translate-x-5' : 'translate-x-1'}`} />
                </div>
                <span className="text-slate-300 text-sm">Semantic scan on save (VS Code)</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <div onClick={() => setPerfConfig({ ...perfConfig, graphOnScan: !perfConfig.graphOnScan })}
                  className={`w-10 h-6 rounded-full relative transition-colors ${perfConfig.graphOnScan ? 'bg-blue-500' : 'bg-slate-700'}`}>
                  <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${perfConfig.graphOnScan ? 'translate-x-5' : 'translate-x-1'}`} />
                </div>
                <span className="text-slate-300 text-sm">Generate graph on every scan</span>
              </label>
            </div>
            <div>
              <label className="label">Max Parallel Workers</label>
              <input className="input max-w-xs" type="number" min="1" max="32" value={perfConfig.maxWorkers} onChange={e => setPerfConfig({ ...perfConfig, maxWorkers: parseInt(e.target.value) || 8 })} />
              <p className="text-slate-500 text-xs mt-1">Controls how many files are scanned simultaneously</p>
            </div>
            <div>
              <label className="label">AI Cache TTL (seconds)</label>
              <input className="input max-w-xs" type="number" min="0" value={perfConfig.cacheTTL} onChange={e => setPerfConfig({ ...perfConfig, cacheTTL: parseInt(e.target.value) || 3600 })} />
              <p className="text-slate-500 text-xs mt-1">How long AI analysis results are cached (0 = no cache)</p>
            </div>
            <button onClick={savePerf} disabled={saving || !canManageOrg} className="btn-primary">
              {saved ? <><Check className="w-4 h-4" />Saved!</> : saving ? 'Saving…' : 'Save Performance Settings'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
