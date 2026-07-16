import { useState, useEffect } from 'react'
import { useAuth } from '../hooks/useAuth'
import { supabase, Tables } from '../lib/supabase'
import { User, Layers, Search, X, Download, Radio, ChevronRight } from 'lucide-react'

type Log = Tables<'audit_logs'>

const AC: Record<string, string> = {
  scan_triggered: 'text-blue-400', scan_completed: 'text-green-400', finding_resolved: 'text-green-400',
  finding_suppressed: 'text-slate-400', api_key_created: 'text-yellow-400', api_key_revoked: 'text-red-400',
  webhook_received: 'text-blue-300', pr_scan_triggered: 'text-blue-300', policy_created: 'text-blue-400',
  okta_sso_login: 'text-cyan-400', semantic_scan_completed: 'text-purple-400', graph_snapshot_created: 'text-indigo-400',
  pro_scan_enabled: 'text-orange-400', aws_scan_completed: 'text-orange-300',
}

export function AuditLogs() {
  const { currentOrganizationId } = useAuth()
  const [logs, setLogs] = useState<Log[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [af, setAf] = useState(''); const [rf, setRf] = useState('')
  const [page, setPage] = useState(0); const [total, setTotal] = useState(0)
  const [liveMode, setLiveMode] = useState(false)
  const [selectedLog, setSelectedLog] = useState<Log | null>(null)
  const P = 50

  useEffect(() => {
    if (!currentOrganizationId) return; setLoading(true)
    let q = supabase.from('audit_logs').select('*', { count: 'exact' }).eq('organization_id', currentOrganizationId).order('created_at', { ascending: false }).range(page * P, (page + 1) * P - 1)
    if (af) q = q.eq('action', af); if (rf) q = q.eq('resource_type', rf)
    q.then(({ data, count }) => { setLogs(data || []); setTotal(count || 0); setLoading(false) })
  }, [currentOrganizationId, page, af, rf])

  const shown = search ? logs.filter(l => l.action.includes(search) || l.resource_name?.toLowerCase().includes(search.toLowerCase())) : logs
  const uA = [...new Set(logs.map(l => l.action))].sort()
  const uR = [...new Set(logs.map(l => l.resource_type))].sort()

  // ── Realtime subscription ──
  useEffect(() => {
    if (!currentOrganizationId || !liveMode) return
    const channel = supabase.channel('audit-logs-live')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'audit_logs', filter: `organization_id=eq.${currentOrganizationId}` }, payload => {
        setLogs(prev => [payload.new as Log, ...prev].slice(0, P))
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [currentOrganizationId, liveMode])

  const exportLogs = (format: 'json' | 'csv') => {
    const data = format === 'json' ? JSON.stringify(logs, null, 2) : [
      ['Timestamp', 'Action', 'Resource Type', 'Resource Name', 'User ID', 'Details'].join(','),
      ...logs.map(l => [l.created_at, l.action, l.resource_type, l.resource_name || '', l.user_id || '', JSON.stringify(l.metadata || {})].map(v => `"${String(v).replace(/"/g, '\\"')}"`).join(',')),
    ].join('\n')
    const blob = new Blob([data], { type: format === 'json' ? 'application/json' : 'text/csv' })
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob)
    a.download = `audit-logs-${currentOrganizationId}.${format}`; a.click()
  }

  return (
    <div className="p-8 space-y-6 animate-fade-in">
      <div><h1 className="text-3xl font-bold text-white">Audit Logs</h1><p className="text-slate-400 mt-1">Tamper-proof record · {total} events</p></div>
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" /><input className="input pl-9 w-56" placeholder="Search…" value={search} onChange={e => setSearch(e.target.value)} />{search && <button onClick={() => setSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500"><X className="w-4 h-4" /></button>}</div>
        <select className="input w-44" value={af} onChange={e => { setAf(e.target.value); setPage(0) }}><option value="">All Actions</option>{uA.map(a => <option key={a} value={a}>{a.replace(/_/g,' ')}</option>)}</select>
        <select className="input w-36" value={rf} onChange={e => { setRf(e.target.value); setPage(0) }}><option value="">All Resources</option>{uR.map(r => <option key={r} value={r}>{r}</option>)}</select>
        {(af || rf) && <button onClick={() => { setAf(''); setRf(''); setPage(0) }} className="btn-ghost text-sm text-slate-400">Clear</button>}
      </div>
      <div className="card overflow-hidden">
        {loading ? <div className="flex justify-center py-12"><div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" /></div>
        : shown.length === 0 ? <div className="p-12 text-center text-slate-500">No events found</div>
        : <>
          <table className="w-full text-sm"><thead><tr className="border-b border-slate-700">{['Timestamp','Action','Resource','Actor','Details'].map(h => <th key={h} className="px-4 py-3 text-left text-slate-400 font-medium text-xs uppercase tracking-wider">{h}</th>)}</tr></thead>
          <tbody>
            {shown.map(l => (
              <tr key={l.id} className="border-b border-slate-800 hover:bg-slate-800/30 transition-colors cursor-pointer" onClick={() => setSelectedLog(l)}>
                <td className="px-4 py-3 text-slate-500 text-xs font-mono whitespace-nowrap">{new Date(l.created_at).toLocaleString()}</td>
                <td className="px-4 py-3"><span className={`text-xs font-mono font-medium ${AC[l.action] || 'text-slate-300'}`}>{l.action.replace(/_/g,' ')}</span></td>
                <td className="px-4 py-3"><div className="flex items-center gap-1.5"><Layers className="w-3 h-3 text-slate-600" /><span className="badge text-xs" style={{background:'#1e293b',color:'#94a3b8'}}>{l.resource_type}</span>{l.resource_name && <span className="text-slate-400 text-xs truncate max-w-32">{l.resource_name}</span>}</div></td>
                <td className="px-4 py-3">{l.user_id ? <span className="flex items-center gap-1 text-slate-400 text-xs"><User className="w-3 h-3" /><span className="font-mono">{l.user_id.slice(0,8)}…</span></span> : <span className="text-slate-600 text-xs">System</span>}</td>
                <td className="px-4 py-3 text-slate-600 text-xs font-mono">{l.metadata && Object.keys(l.metadata).length > 0 ? JSON.stringify(l.metadata).slice(0,60) + (JSON.stringify(l.metadata).length > 60 ? '…' : '') : '—'} <ChevronRight className="w-3 h-3 inline text-slate-600" /></td>
              </tr>
            ))}
          </tbody></table>
          {total > P && <div className="flex items-center justify-between px-4 py-3 border-t border-slate-700"><button onClick={() => setPage(p => Math.max(0,p-1))} disabled={page===0} className="btn-secondary text-sm">Previous</button><span className="text-slate-500 text-sm">Page {page+1} of {Math.ceil(total/P)}</span><button onClick={() => setPage(p => p+1)} disabled={(page+1)*P >= total} className="btn-secondary text-sm">Next</button></div>}
        </>}
      </div>

      {/* ── Detail Drawer ── */}
      {selectedLog && (
        <div className="fixed inset-0 bg-black/50 z-50 flex justify-end" onClick={() => setSelectedLog(null)}>
          <div className="w-96 max-w-full h-full bg-slate-900 border-l border-slate-700 p-6 overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-white font-medium">Event Details</h3>
              <button onClick={() => setSelectedLog(null)} className="text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-xs text-slate-500 uppercase">Timestamp</label>
                <p className="text-slate-200 text-sm font-mono">{new Date(selectedLog.created_at).toLocaleString()}</p>
              </div>
              <div>
                <label className="text-xs text-slate-500 uppercase">Action</label>
                <p className={`text-sm font-mono font-medium ${AC[selectedLog.action] || 'text-slate-300'}`}>{selectedLog.action}</p>
              </div>
              <div>
                <label className="text-xs text-slate-500 uppercase">Resource</label>
                <p className="text-slate-200 text-sm">{selectedLog.resource_type} {selectedLog.resource_name && `→ ${selectedLog.resource_name}`}</p>
              </div>
              <div>
                <label className="text-xs text-slate-500 uppercase">Actor</label>
                <p className="text-slate-200 text-sm font-mono">{selectedLog.user_id || 'System'}</p>
              </div>
              <div>
                <label className="text-xs text-slate-500 uppercase">Metadata</label>
                <pre className="text-xs text-slate-300 bg-slate-800 p-3 rounded-lg overflow-x-auto">{JSON.stringify(selectedLog.metadata, null, 2)}</pre>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
