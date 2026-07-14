import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabase'
import { FileDown, FileText, BarChart3, ShieldCheck, Activity, Download, RefreshCw } from 'lucide-react'

type Scan = { id: string; status: string; created_at: string; duration_seconds: number | null; summary: Record<string, number> | null; repository_id: string }
type Finding = { id: string; severity: string; status: string; risk_score: number; created_at: string; resolved_at: string | null; scanner: string }
type Audit = { id: string; action: string; created_at: string; resource_type: string; resource_name: string | null }

function download(filename: string, text: string, type = 'application/json') {
  const blob = new Blob([text], { type })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export function Reports() {
  const { currentOrganizationId } = useAuth()
  const [scans, setScans] = useState<Scan[]>([])
  const [findings, setFindings] = useState<Finding[]>([])
  const [logs, setLogs] = useState<Audit[]>([])
  const [loading, setLoading] = useState(true)

  const load = async () => {
    if (!currentOrganizationId) return
    setLoading(true)
    const [scansRes, findingsRes, logsRes] = await Promise.all([
      supabase.from('scans').select('id, status, created_at, duration_seconds, summary, repository_id').eq('organization_id', currentOrganizationId).order('created_at', { ascending: false }).limit(100),
      supabase.from('findings').select('id, severity, status, risk_score, created_at, resolved_at, scanner').eq('organization_id', currentOrganizationId).order('created_at', { ascending: false }).limit(500),
      supabase.from('audit_logs').select('id, action, created_at, resource_type, resource_name').eq('organization_id', currentOrganizationId).order('created_at', { ascending: false }).limit(100),
    ])
    setScans((scansRes.data || []) as Scan[])
    setFindings((findingsRes.data || []) as Finding[])
    setLogs((logsRes.data || []) as Audit[])
    setLoading(false)
  }

  useEffect(() => { load() }, [currentOrganizationId])

  const metrics = useMemo(() => {
    const open = findings.filter(f => !['resolved', 'suppressed', 'false_positive'].includes(f.status))
    const critical = open.filter(f => f.severity === 'critical').length
    const high = open.filter(f => f.severity === 'high').length
    const risk = open.length ? Math.round(open.reduce((s, f) => s + (f.risk_score || 0), 0) / open.length) : 0
    const resolved = findings.filter(f => f.status === 'resolved' && f.resolved_at)
    const mttr = resolved.length
      ? Math.round((resolved.map(f => (new Date(f.resolved_at!).getTime() - new Date(f.created_at).getTime()) / 3600000).reduce((a, b) => a + b, 0) / resolved.length) * 10) / 10
      : 0
    return {
      open,
      critical,
      high,
      risk,
      scanCount: scans.length,
      completed: scans.filter(s => s.status === 'completed').length,
      failed: scans.filter(s => s.status === 'failed').length,
      mttr,
    }
  }, [findings, scans])

  const exportJson = () => download(`omniguard-report-${currentOrganizationId || 'org'}.json`, JSON.stringify({ generated_at: new Date().toISOString(), scans, findings, logs, metrics }, null, 2))
  const exportCsv = () => {
    const rows = ['type,id,severity_or_action,status,risk_or_time,created_at']
    findings.forEach(f => rows.push(`finding,${f.id},${f.severity},${f.status},${f.risk_score},${f.created_at}`))
    scans.forEach(s => rows.push(`scan,${s.id},,${s.status},${s.duration_seconds ?? ''},${s.created_at}`))
    logs.forEach(l => rows.push(`audit,${l.id},${l.action},${l.resource_type},,${l.created_at}`))
    download(`omniguard-report-${currentOrganizationId || 'org'}.csv`, rows.join('\n'), 'text/csv')
  }
  const exportMarkdown = () => download(`omniguard-report-${currentOrganizationId || 'org'}.md`, [
    '# OmniGuard Report',
    `Generated: ${new Date().toISOString()}`,
    '',
    `- Open findings: ${metrics.open.length}`,
    `- Critical: ${metrics.critical}`,
    `- High: ${metrics.high}`,
    `- Avg risk: ${metrics.risk}`,
    `- Scans: ${metrics.scanCount}`,
    `- Completed scans: ${metrics.completed}`,
    `- Failed scans: ${metrics.failed}`,
    `- MTTR: ${metrics.mttr}h`,
  ].join('\n'), 'text/markdown')

  const exportSarif = () => {
    const sarif = {
      $schema: 'https://json.schemastore.org/sarif-2.1.0.json',
      version: '2.1.0',
      runs: [{
        tool: { driver: { name: 'OmniGuard', version: '2.2.5', informationUri: 'https://omniguard.io' } },
        results: findings.map(f => ({
          ruleId: f.rule_id || f.scanner || 'omniguard',
          level: f.severity === 'critical' ? 'error' : f.severity === 'high' ? 'error' : f.severity === 'medium' ? 'warning' : 'note',
          message: { text: f.title || f.description || 'Finding detected' },
          locations: [{ physicalLocation: { artifactLocation: { uri: f.file_path || f.file || 'unknown' }, region: { startLine: f.line || 1 } } }],
          partialFingerprints: { primaryLocationLineHash: `${f.id}` },
          properties: { severity: f.severity, category: f.category, status: f.status, remediation: f.remediation },
        })),
      }],
    }
    download(`omniguard-report-${currentOrganizationId || 'org'}.sarif`, JSON.stringify(sarif, null, 2), 'application/json')
  }

  const exportHtml = () => {
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>OmniGuard Report</title><style>body{font-family:system-ui,sans-serif;max-width:960px;margin:40px auto;padding:0 20px;color:#1e293b}h1{border-bottom:2px solid #3b82f6;padding-bottom:10px}h2{color:#3b82f6;margin-top:32px}.metric{display:inline-block;width:180px;padding:16px;margin:8px;border:1px solid #e2e8f0;border-radius:8px;text-align:center}.metric .value{font-size:28px;font-weight:bold;color:#3b82f6}.metric .label{font-size:12px;color:#64748b;text-transform:uppercase}table{width:100%;border-collapse:collapse;margin:16px 0}th{background:#f1f5f9;padding:8px;text-align:left;font-size:12px;text-transform:uppercase}td{padding:8px;border-bottom:1px solid #e2e8f0}.sev-critical{color:#dc2626;font-weight:bold}.sev-high{color:#ea580c;font-weight:bold}.sev-medium{color:#ca8a04}.sev-low{color:#64748b}.timestamp{color:#94a3b8;font-size:12px}</style></head><body>
    <h1>OmniGuard Security Report</h1>
    <p class="timestamp">Generated: ${new Date().toISOString()}</p>
    <div><div class="metric"><div class="value">${metrics.open.length}</div><div class="label">Open Findings</div></div><div class="metric"><div class="value">${metrics.critical}</div><div class="label">Critical</div></div><div class="metric"><div class="value">${metrics.high}</div><div class="label">High</div></div><div class="metric"><div class="value">${metrics.scanCount}</div><div class="label">Scans</div></div><div class="metric"><div class="value">${metrics.mttr}h</div><div class="label">MTTR</div></div></div>
    <h2>Findings</h2><table><thead><tr><th>Severity</th><th>Title</th><th>File</th><th>Status</th><th>Created</th></tr></thead><tbody>${findings.map(f => `<tr><td class="sev-${f.severity}">${f.severity}</td><td>${f.title || ''}</td><td>${f.file_path || f.file || ''}</td><td>${f.status}</td><td>${new Date(f.created_at).toLocaleDateString()}</td></tr>`).join('')}</tbody></table>
    <h2>Recent Scans</h2><table><thead><tr><th>Status</th><th>Repository</th><th>Findings</th><th>Duration</th><th>Date</th></tr></thead><tbody>${scans.map(s => `<tr><td>${s.status}</td><td>${s.repository_id || ''}</td><td>${s.findings_count || 0}</td><td>${s.duration_seconds || 0}s</td><td>${new Date(s.created_at).toLocaleDateString()}</td></tr>`).join('')}</tbody></table>
    </body></html>`
    download(`omniguard-report-${currentOrganizationId || 'org'}.html`, html, 'text/html')
  }

  return (
    <div className="p-8 space-y-6 animate-fade-in">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Reports</h1>
          <p className="text-slate-600 mt-1">Executive, compliance, security, and developer summaries</p>
        </div>
        <div className="flex gap-2">
          <button onClick={load} className="btn-secondary"><RefreshCw className="w-4 h-4" />Refresh</button>
          <button onClick={exportJson} className="btn-secondary"><FileDown className="w-4 h-4" />JSON</button>
          <button onClick={exportCsv} className="btn-secondary"><Download className="w-4 h-4" />CSV</button>
          <button onClick={exportSarif} className="btn-secondary"><FileDown className="w-4 h-4" />SARIF</button>
          <button onClick={exportHtml} className="btn-secondary"><FileDown className="w-4 h-4" />HTML</button>
          <button onClick={exportMarkdown} className="btn-primary"><FileText className="w-4 h-4" />Markdown</button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Metric title="Security Score" value={Math.max(0, 100 - metrics.risk)} helper="Risk-adjusted org score" icon={ShieldCheck} />
        <Metric title="Critical Findings" value={metrics.critical} helper="Open blockers" icon={BarChart3} />
        <Metric title="Scans Completed" value={metrics.completed} helper={`${metrics.failed} failed`} icon={Activity} />
        <Metric title="MTTR" value={`${metrics.mttr}h`} helper="Mean time to resolve" icon={FileText} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="card p-5">
          <h2 className="text-slate-900 font-semibold mb-4">Executive Summary</h2>
          <div className="space-y-2 text-sm text-slate-600">
            <p>{metrics.open.length} open finding{metrics.open.length === 1 ? '' : 's'} remain across {metrics.scanCount} scans.</p>
            <p>{metrics.critical} critical and {metrics.high} high severity issues are active.</p>
            <p>Average open-risk score is {metrics.risk} and mean time to resolve is {metrics.mttr} hours.</p>
          </div>
        </div>
        <div className="card p-5">
          <h2 className="text-slate-900 font-semibold mb-4">Recent Activity</h2>
          <div className="space-y-2 max-h-56 overflow-auto">
            {logs.slice(0, 8).map(l => (
              <div key={l.id} className="flex items-center justify-between gap-3 p-2 rounded bg-slate-50 border border-slate-200">
                <div>
                  <p className="text-slate-900 text-sm">{l.action.replace(/_/g, ' ')}</p>
                  <p className="text-xs text-slate-500">{l.resource_type}{l.resource_name ? ` · ${l.resource_name}` : ''}</p>
                </div>
                <span className="text-xs text-slate-500">{new Date(l.created_at).toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="card p-5">
          <h2 className="text-slate-900 font-semibold mb-4">Developer Report</h2>
          <p className="text-sm text-slate-600">Use the dashboard findings and audit log stream to track what developers changed, which scans were triggered, and what remains blocked by policy.</p>
        </div>
        <div className="card p-5">
          <h2 className="text-slate-900 font-semibold mb-4">Compliance Report</h2>
          <p className="text-sm text-slate-600">Tie open critical and high findings to compliance drift and use the compliance dashboard page for framework scoring and evidence collection.</p>
        </div>
        <div className="card p-5">
          <h2 className="text-slate-900 font-semibold mb-4">Risk Trend</h2>
          <p className="text-sm text-slate-600">Scores are calculated from the current open finding set. For trend exports, use JSON, CSV, and the scan history page for time-series context.</p>
        </div>
      </div>

      {loading && <div className="text-slate-500 text-sm">Loading report data...</div>}
    </div>
  )
}

function Metric({ title, value, helper, icon: Icon }: { title: string; value: string | number; helper: string; icon: React.ComponentType<{ className?: string }> }) {
  return (
    <div className="card p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-500">{title}</p>
          <p className="text-3xl font-bold font-mono text-slate-900 mt-2">{value}</p>
          <p className="text-xs text-slate-500 mt-1">{helper}</p>
        </div>
        <Icon className="w-5 h-5 text-blue-500" />
      </div>
    </div>
  )
}
