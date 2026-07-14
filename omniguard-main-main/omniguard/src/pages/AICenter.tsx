import { useState, useEffect } from 'react'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabase'
import { Brain, Activity, DollarSign, Zap, TrendingUp, Cpu, CheckCircle, AlertCircle } from 'lucide-react'

export function AICenter() {
  const { currentOrganizationId } = useAuth()
  const [providers, setProviders] = useState<any[]>([])
  const [usage, setUsage] = useState<any[]>([])
  const [cacheHits, setCacheHits] = useState(0)
  const [cacheMisses, setCacheMisses] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!currentOrganizationId) return
    Promise.all([
      supabase.from('ai_provider_configs').select('*').order('created_at', { ascending: false }),
      supabase.from('ai_usage').select('*').order('created_at', { ascending: false }).limit(50),
      supabase.from('ai_cache').select('id, created_at', { count: 'exact', head: true }),
    ]).then(([p, u, c]) => {
      setProviders(p.data || [])
      setUsage(u.data || [])
      setCacheHits(c.count || 0)
      setCacheMisses(usage.filter(x => !x.cached).length)
      setLoading(false)
    })
  }, [currentOrganizationId])

  const totalTokens = usage.reduce((sum, u) => sum + (u.tokens_used || 0), 0)
  const totalCost = usage.reduce((sum, u) => sum + (u.cost_usd || 0), 0)
  const avgLatency = usage.length ? Math.round(usage.reduce((s, u) => s + (u.latency_ms || 0), 0) / usage.length) : 0
  const successRate = usage.length ? Math.round(usage.filter(u => u.status === 'success').length / usage.length * 100) : 0

  const byProvider = providers.map(p => ({
    ...p,
    calls: usage.filter(u => u.provider === p.provider).length,
    tokens: usage.filter(u => u.provider === p.provider).reduce((s, u) => s + (u.tokens_used || 0), 0),
  }))

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-white">AI Center</h1>
        <p className="text-slate-400 text-sm mt-1">Model routing, token usage, cache performance, and provider health</p>
      </div>

      {/* ── Summary Cards ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard icon={Activity} label="Total Calls" value={usage.length} color="blue" />
        <MetricCard icon={Zap} label="Tokens Used" value={totalTokens.toLocaleString()} color="cyan" />
        <MetricCard icon={DollarSign} label="Est. Cost" value={`$${totalCost.toFixed(2)}`} color="green" />
        <MetricCard icon={TrendingUp} label="Success Rate" value={`${successRate}%`} color={successRate > 90 ? 'green' : 'orange'} />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <MetricCard icon={Cpu} label="Avg Latency" value={`${avgLatency}ms`} color="purple" />
        <MetricCard icon={CheckCircle} label="Cache Hits" value={cacheHits} color="green" />
        <MetricCard icon={AlertCircle} label="Cache Misses" value={cacheMisses} color="orange" />
      </div>

      {/* ── Provider Routing Table ── */}
      <div className="card p-5">
        <h3 className="text-white font-medium mb-4 flex items-center gap-2"><Brain className="w-5 h-5 text-blue-400" />Provider Routing</h3>
        {loading ? (
          <p className="text-slate-400 text-sm">Loading...</p>
        ) : providers.length === 0 ? (
          <p className="text-slate-500 text-sm">No AI providers configured. Add an API key in Settings → AI Provider.</p>
        ) : (
          <div className="space-y-3">
            {byProvider.map(p => (
              <div key={p.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50 border border-slate-700">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${p.status === 'active' ? 'bg-green-400' : 'bg-slate-500'}`} />
                  <div>
                    <span className="text-slate-200 text-sm font-medium">{p.provider}</span>
                    <span className="text-slate-500 text-xs ml-2">{p.model}</span>
                  </div>
                </div>
                <div className="flex gap-6 text-xs">
                  <div className="text-right">
                    <div className="text-slate-500">Calls</div>
                    <div className="text-slate-200 font-medium">{p.calls}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-slate-500">Tokens</div>
                    <div className="text-slate-200 font-medium">{p.tokens.toLocaleString()}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Token Usage Bar Chart ── */}
      <div className="card p-5">
        <h3 className="text-white font-medium mb-4 flex items-center gap-2"><Zap className="w-5 h-5 text-cyan-400" />Token Usage by Provider</h3>
        {byProvider.length === 0 ? (
          <p className="text-slate-500 text-sm">No usage data yet.</p>
        ) : (
          <div className="space-y-3">
            {byProvider.filter(p => p.tokens > 0).map(p => {
              const maxTokens = Math.max(...byProvider.map(x => x.tokens), 1)
              const widthPct = (p.tokens / maxTokens) * 100
              return (
                <div key={p.id} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-300">{p.provider} ({p.model})</span>
                    <span className="text-slate-400">{p.tokens.toLocaleString()} tokens</span>
                  </div>
                  <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full transition-all duration-500" style={{ width: `${widthPct}%` }} />
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* ── Recent AI Calls ── */}
      <div className="card p-5">
        <h3 className="text-white font-medium mb-4 flex items-center gap-2"><Activity className="w-5 h-5 text-purple-400" />Recent AI Activity</h3>
        {usage.length === 0 ? (
          <p className="text-slate-500 text-sm">No AI calls recorded yet. Run a scan with AI remediation to see activity.</p>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {usage.slice(0, 20).map(u => (
              <div key={u.id} className="flex items-center justify-between text-xs p-2 rounded bg-slate-800/30">
                <div className="flex items-center gap-3">
                  <div className={`w-1.5 h-1.5 rounded-full ${u.status === 'success' ? 'bg-green-400' : 'bg-red-400'}`} />
                  <span className="text-slate-300">{u.provider}</span>
                  <span className="text-slate-500">{u.action || 'remediation'}</span>
                </div>
                <div className="flex gap-4 text-slate-400">
                  <span>{u.tokens_used || 0} tok</span>
                  <span>{u.latency_ms || 0}ms</span>
                  <span>${(u.cost_usd || 0).toFixed(4)}</span>
                  <span className="text-slate-600">{new Date(u.created_at).toLocaleTimeString()}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function MetricCard({ icon: Icon, label, value, color }: { icon: any; label: string; value: any; color: string }) {
  const colors: Record<string, string> = {
    blue: 'text-blue-400 bg-blue-500/10',
    cyan: 'text-cyan-400 bg-cyan-500/10',
    green: 'text-green-400 bg-green-500/10',
    orange: 'text-orange-400 bg-orange-500/10',
    purple: 'text-purple-400 bg-purple-500/10',
  }
  return (
    <div className="card p-4">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${colors[color] || colors.blue}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="text-2xl font-bold text-white">{value}</div>
      <div className="text-xs text-slate-400 mt-1">{label}</div>
    </div>
  )
}
