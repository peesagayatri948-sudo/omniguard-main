import { useState, useEffect } from 'react'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabase'
import { Shield, FileText, AlertTriangle, CheckCircle, ChevronDown, ChevronRight, Download } from 'lucide-react'

interface AuditClause {
  id: string
  framework: string
  clause_id: string
  clause_title: string
  clause_text: string
  clause_section: string
  evidence_type: string
  evidence_line_start: number
  evidence_line_end: number
  evidence_snippet: string
  evidence_hash: string
  mapped_severity: string
  remediation_priority: number
  ai_verified: boolean
  ai_confidence: number
  created_at: string
}

interface ComplianceMatrix {
  framework: string
  clause_id: string
  clause_title: string
  finding_count: number
  critical_count: number
  high_count: number
  medium_count: number
  low_count: number
  status: string
}

const FRAMEWORK_ICONS: Record<string, string> = {
  OWASP_ASVS: '🛡️',
  PCI_DSS: '💳',
  NIST_800_53: '🏛️',
  ISO_27001: '🌍',
  CIS: '📊',
  FIPS_140_2: '🔐',
  SOC2: '✅',
}

export function AuditClauses() {
  const { currentOrganizationId } = useAuth()
  const [clauses, setClauses] = useState<AuditClause[]>([])
  const [matrix, setMatrix] = useState<ComplianceMatrix[]>([])
  const [selectedFramework, setSelectedFramework] = useState<string>('all')
  const [expandedClause, setExpandedClause] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedScan, setSelectedScan] = useState<string>('')
  const [scans, setScans] = useState<any[]>([])

  useEffect(() => {
    if (!currentOrganizationId) return
    setLoading(true)
    supabase.from('scans').select('id, created_at, scan_type, findings_count').eq('organization_id', currentOrganizationId).order('created_at', { ascending: false }).limit(20).then(({ data }) => {
      setScans(data || [])
      if (data?.length && !selectedScan) setSelectedScan(data[0].id)
    })
  }, [currentOrganizationId])

  useEffect(() => {
    if (!currentOrganizationId) return
    setLoading(true)

    Promise.all([
      supabase.from('audit_clauses').select('*').eq('organization_id', currentOrganizationId).order('remediation_priority', { ascending: true }).order('created_at', { ascending: false }),
      supabase.rpc('get_compliance_matrix', { p_org_id: currentOrganizationId, p_scan_id: selectedScan || null }),
    ]).then(([{ data: clauseData }, { data: matrixData }]) => {
      setClauses((clauseData as AuditClause[]) || [])
      setMatrix((matrixData as ComplianceMatrix[]) || [])
      setLoading(false)
    })
  }, [currentOrganizationId, selectedScan])

  const frameworks = [...new Set(clauses.map(c => c.framework))]
  const filtered = selectedFramework === 'all' ? clauses : clauses.filter(c => c.framework === selectedFramework)
  const groupedByClause = filtered.reduce((acc, c) => {
    const key = `${c.framework}:${c.clause_id}`
    if (!acc[key]) acc[key] = { ...c, findings: [] as AuditClause[] }
    acc[key].findings.push(c)
    return acc
  }, {} as Record<string, AuditClause & { findings: AuditClause[] }>)

  const exportReport = (format: 'json' | 'csv' | 'html') => {
    if (format === 'json') {
      const blob = new Blob([JSON.stringify({ matrix, clauses: groupedByClause }, null, 2)], { type: 'application/json' })
      downloadBlob(blob, `omniguard-audit-${Date.now()}.json`)
    } else if (format === 'csv') {
      const rows = [['Framework', 'Clause ID', 'Clause Title', 'Severity', 'File', 'Line', 'Evidence', 'AI Verified', 'Confidence']]
      for (const c of filtered) {
        rows.push([c.framework, c.clause_id, c.clause_title, c.mapped_severity, '', String(c.evidence_line_start), c.evidence_snippet?.substring(0, 100) || '', String(c.ai_verified), String(c.ai_confidence)])
      }
      const csv = rows.map(r => r.map(c => `"${c.replace(/"/g, '""')}"`).join(',')).join('\n')
      downloadBlob(new Blob([csv], { type: 'text/csv' }), `omniguard-audit-${Date.now()}.csv`)
    } else if (format === 'html') {
      const html = generateHtmlReport(matrix, groupedByClause)
      downloadBlob(new Blob([html], { type: 'text/html' }), `omniguard-audit-${Date.now()}.html`)
    }
  }

  if (loading) return <div className="p-8 text-slate-400">Loading compliance audit data...</div>

  return (
    <div className="p-6 space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Shield className="w-6 h-6 text-blue-400" />
            Compliance Audit Explorer
          </h1>
          <p className="text-slate-400 text-sm mt-1">Deterministic clause mapping for each detected weakness</p>
        </div>
        <div className="flex gap-2">
          <select className="input max-w-xs" value={selectedScan} onChange={e => setSelectedScan(e.target.value)}>
            <option value="">All scans</option>
            {scans.map(s => <option key={s.id} value={s.id}>{new Date(s.created_at).toLocaleDateString()} ({s.findings_count} findings)</option>)}
          </select>
          <button onClick={() => exportReport('json')} className="btn-secondary text-xs"><Download className="w-3.5 h-3.5" /> JSON</button>
          <button onClick={() => exportReport('csv')} className="btn-secondary text-xs"><Download className="w-3.5 h-3.5" /> CSV</button>
          <button onClick={() => exportReport('html')} className="btn-secondary text-xs"><Download className="w-3.5 h-3.5" /> HTML</button>
        </div>
      </div>

      {/* Compliance Matrix Summary */}
      <div className="grid grid-cols-3 gap-3">
        {matrix.length === 0 ? (
          <div className="col-span-3 card p-8 text-center text-slate-500">No compliance data yet. Run a semantic scan to generate audit clauses.</div>
        ) : (
          frameworks.map(fw => {
            const fwClauses = matrix.filter(m => m.framework === fw)
            const totalFindings = fwClauses.reduce((s, c) => s + c.finding_count, 0)
            const criticalCount = fwClauses.reduce((s, c) => s + c.critical_count, 0)
            const status = fwClauses.some(c => c.status === 'non_compliant') ? 'non_compliant' :
                          fwClauses.some(c => c.status === 'partially_compliant') ? 'partially_compliant' : 'compliant'
            const statusColor = status === 'non_compliant' ? 'text-red-400 bg-red-500/10 border-red-500/20' :
                               status === 'partially_compliant' ? 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20' :
                               'text-green-400 bg-green-500/10 border-green-500/20'
            return (
              <div key={fw} className={`card p-4 border ${statusColor}`}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">{FRAMEWORK_ICONS[fw] || '📋'}</span>
                  <span className="font-medium text-slate-200">{fw.replace(/_/g, ' ')}</span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div><p className="text-slate-500">Clauses</p><p className="text-slate-200 font-mono font-bold">{fwClauses.length}</p></div>
                  <div><p className="text-slate-500">Findings</p><p className="text-slate-200 font-mono font-bold">{totalFindings}</p></div>
                  <div><p className="text-slate-500">Critical</p><p className="text-red-400 font-mono font-bold">{criticalCount}</p></div>
                </div>
                <p className={`text-xs mt-2 ${statusColor}`}>{status.replace(/_/g, ' ')}</p>
              </div>
            )
          })
        )}
      </div>

      {/* Framework Filter */}
      <div className="flex gap-2 flex-wrap">
        <button onClick={() => setSelectedFramework('all')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium ${selectedFramework === 'all' ? 'bg-blue-500 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}>
          All ({clauses.length})
        </button>
        {frameworks.map(fw => (
          <button key={fw} onClick={() => setSelectedFramework(fw)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium ${selectedFramework === fw ? 'bg-blue-500 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}>
            {FRAMEWORK_ICONS[fw] || '📋'} {fw.replace(/_/g, ' ')} ({clauses.filter(c => c.framework === fw).length})
          </button>
        ))}
      </div>

      {/* Clause Detail List */}
      <div className="space-y-2">
        {Object.entries(groupedByClause).map(([key, clause]) => (
          <div key={key} className="card overflow-hidden">
            <div className="flex items-center justify-between p-4 cursor-pointer" onClick={() => setExpandedClause(expandedClause === key ? null : key)}>
              <div className="flex items-center gap-3">
                {expandedClause === key ? <ChevronDown className="w-4 h-4 text-slate-500" /> : <ChevronRight className="w-4 h-4 text-slate-500" />}
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm text-blue-300">{clause.clause_id}</span>
                    <span className="text-slate-200 text-sm">{clause.clause_title}</span>
                  </div>
                  <p className="text-slate-500 text-xs mt-0.5">{clause.framework.replace(/_/g, ' ')} · {clause.clause_section}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className={`badge text-xs ${clause.mapped_severity === 'critical' ? 'bg-red-500/20 text-red-400' : clause.mapped_severity === 'high' ? 'bg-orange-500/20 text-orange-400' : 'bg-slate-700 text-slate-400'}`}>
                  {clause.mapped_severity}
                </span>
                <span className="text-slate-500 text-xs">{clause.findings.length} finding{clause.findings.length !== 1 ? 's' : ''}</span>
                {clause.ai_verified && <CheckCircle className="w-4 h-4 text-green-400" />}
              </div>
            </div>
            {expandedClause === key && (
              <div className="border-t border-slate-700 p-4 space-y-3 animate-fade-in">
                <p className="text-slate-400 text-sm">{clause.clause_text}</p>
                {clause.clause_section && <p className="text-slate-500 text-xs">Section: {clause.clause_section}</p>}
                <div className="space-y-2">
                  <p className="text-slate-300 text-xs font-medium">Evidence:</p>
                  {clause.findings.map((f, i) => (
                    <div key={i} className="bg-slate-900 rounded-lg p-3 border border-slate-800">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-slate-400">{f.evidence_type} · L{f.evidence_line_start}-{f.evidence_line_end}</span>
                        <span className="text-xs text-slate-500">AI Confidence: {(f.ai_confidence * 100).toFixed(0)}%</span>
                      </div>
                      <pre className="text-xs text-slate-300 font-mono overflow-x-auto">{f.evidence_snippet}</pre>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

function generateHtmlReport(matrix: ComplianceMatrix[], clauses: Record<string, any>): string {
  return `<!DOCTYPE html><html><head><style>
body{font-family:system-ui,sans-serif;padding:40px;max-width:1000px;margin:0 auto;color:#1e293b}
h1{color:#0f172a;border-bottom:2px solid #e2e8f0;padding-bottom:10px}
.framework{background:#f8fafc;border-radius:8px;padding:16px;margin:16px 0}
.framework h2{color:#1e40af;margin:0 0 8px}
.clause{background:white;border-left:3px solid #ef4444;padding:12px;margin:8px 0;border-radius:0 6px 6px 0}
.status{padding:2px 8px;border-radius:12px;font-size:12px;font-weight:600}
.non_compliant{background:#fee2e2;color:#dc2626}.partially_compliant{background:#fef3c7;color:#d97706}.compliant{background:#d1fae5;color:#059669}
table{width:100%;border-collapse:collapse;margin:16px 0}
th,td{text-align:left;padding:8px;border-bottom:1px solid #e2e8f0;font-size:13px}
th{background:#f1f5f9;font-weight:600}
</style></head><body>
<h1>OmniGuard Compliance Audit Report</h1>
<p>Generated: ${new Date().toISOString()}</p>
<table><tr><th>Framework</th><th>Clause</th><th>Title</th><th>Findings</th><th>Critical</th><th>Status</th></tr>
${matrix.map(m => `<tr><td>${m.framework.replace(/_/g,' ')}</td><td>${m.clause_id}</td><td>${m.clause_title}</td><td>${m.finding_count}</td><td>${m.critical_count}</td><td><span class="status ${m.status}">${m.status.replace(/_/g,' ')}</span></td></tr>`).join('')}
</table></body></html>`
}
