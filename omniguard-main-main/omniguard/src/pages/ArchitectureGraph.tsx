import { useState, useEffect, useRef, useCallback } from 'react'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabase'

interface GraphNode {
  id: string
  label: string
  type: string
  path: string
  riskScore: number
  findingCount: number
  maxSeverity: string
}

interface GraphEdge {
  source: string
  target: string
  type: string
}

interface GraphSnapshot {
  id: string
  nodes: GraphNode[]
  edges: GraphEdge[]
  clusters: Array<{ id: string; label: string; nodeIds: string[] }>
  metrics: Record<string, any>
  node_count: number
  edge_count: number
  risk_delta: number
  added_nodes: any[]
  removed_nodes: any[]
  created_at: string
}

export function ArchitectureGraph() {
  const { currentOrganizationId } = useAuth()
  const [snapshots, setSnapshots] = useState<GraphSnapshot[]>([])
  const [selected, setSelected] = useState<GraphSnapshot | null>(null)
  const [repos, setRepos] = useState<any[]>([])
  const [selectedRepo, setSelectedRepo] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [liveMode, setLiveMode] = useState(true)
  const [viewMode, setViewMode] = useState<'graph' | 'diff' | 'metrics'>('graph')
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [hoveredNode, setHoveredNode] = useState<GraphNode | null>(null)
  const [nodePositions, setNodePositions] = useState<Map<string, { x: number; y: number }>>(new Map())

  useEffect(() => {
    if (!currentOrganizationId) return
    setLoading(true)
    supabase.from('repositories').select('id, name, full_name').eq('organization_id', currentOrganizationId).then(({ data }) => {
      setRepos(data || [])
      if (data?.length && !selectedRepo) setSelectedRepo(data[0].id)
      setLoading(false)
    })
  }, [currentOrganizationId])

  const loadSnapshots = useCallback(async () => {
    if (!currentOrganizationId || !selectedRepo) return
    const { data } = await supabase
      .from('graph_snapshots')
      .select('*')
      .eq('organization_id', currentOrganizationId)
      .eq('repository_id', selectedRepo)
      .order('created_at', { ascending: false })
      .limit(20)
    if (data?.length) {
      setSnapshots(data as GraphSnapshot[])
      setSelected(data[0] as GraphSnapshot)
    } else {
      setSnapshots([])
      setSelected(null)
    }
  }, [currentOrganizationId, selectedRepo])

  useEffect(() => {
    loadSnapshots()
  }, [loadSnapshots])

  // Realtime subscription
  useEffect(() => {
    if (!liveMode || !currentOrganizationId || !selectedRepo) return
    const channel = supabase
      .channel(`graph_snapshots:org=${currentOrganizationId}:repo=${selectedRepo}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'graph_snapshots',
        filter: `organization_id=eq.${currentOrganizationId}`,
      }, (payload) => {
        if (payload.new.repository_id === selectedRepo) {
          setSnapshots(prev => [payload.new as GraphSnapshot, ...prev].slice(0, 20))
          setSelected(payload.new as GraphSnapshot)
        }
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [liveMode, currentOrganizationId, selectedRepo])

  // Force-directed layout
  useEffect(() => {
    if (!selected || !canvasRef.current) return
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')!
    const W = canvas.width = canvas.parentElement?.clientWidth || 800
    const H = canvas.height = canvas.parentElement?.clientHeight || 600

    const nodes = selected.nodes || []
    const edges = selected.edges || []

    // Initialize positions
    const pos = new Map<string, { x: number; y: number; vx: number; vy: number }>()
    nodes.forEach((n, i) => {
      const angle = (i / nodes.length) * Math.PI * 2
      const r = Math.min(W, H) * 0.3
      pos.set(n.id, { x: W / 2 + Math.cos(angle) * r, y: H / 2 + Math.sin(angle) * r, vx: 0, vy: 0 })
    })

    let animId: number
    const nodeMap = new Map(nodes.map(n => [n.id, n]))

    function draw() {
      ctx.fillStyle = '#0f172a'
      ctx.fillRect(0, 0, W, H)

      // Force simulation
      for (const [id, p] of pos) {
        // Repulsion
        for (const [id2, p2] of pos) {
          if (id === id2) continue
          const dx = p.x - p2.x
          const dy = p.y - p2.y
          const dist = Math.sqrt(dx * dx + dy * dy) + 0.1
          const force = 2000 / (dist * dist)
          p.vx += (dx / dist) * force
          p.vy += (dy / dist) * force
        }
        // Center gravity
        p.vx += (W / 2 - p.x) * 0.002
        p.vy += (H / 2 - p.y) * 0.002
      }

      // Attraction along edges
      for (const e of edges) {
        const p1 = pos.get(e.source)
        const p2 = pos.get(e.target)
        if (!p1 || !p2) continue
        const dx = p2.x - p1.x
        const dy = p2.y - p1.y
        const dist = Math.sqrt(dx * dx + dy * dy) + 0.1
        const force = (dist - 80) * 0.01
        p1.vx += (dx / dist) * force
        p1.vy += (dy / dist) * force
        p2.vx -= (dx / dist) * force
        p2.vy -= (dy / dist) * force
      }

      // Apply velocity with damping
      for (const p of pos.values()) {
        p.vx *= 0.85
        p.vy *= 0.85
        p.x += p.vx
        p.y += p.vy
        p.x = Math.max(30, Math.min(W - 30, p.x))
        p.y = Math.max(30, Math.min(H - 30, p.y))
      }

      // Draw edges
      ctx.strokeStyle = '#334155'
      ctx.lineWidth = 0.5
      for (const e of edges) {
        const p1 = pos.get(e.source)
        const p2 = pos.get(e.target)
        if (!p1 || !p2) continue
        ctx.beginPath()
        ctx.moveTo(p1.x, p1.y)
        ctx.lineTo(p2.x, p2.y)
        ctx.stroke()
      }

      // Draw nodes
      for (const n of nodes) {
        const p = pos.get(n.id)
        if (!p) continue
        const risk = n.riskScore || 0
        const r = Math.max(4, Math.min(16, 4 + (n.findingCount || 0) * 2))
        const color = risk > 5 ? '#ef4444' : risk > 2 ? '#f59e0b' : risk > 0 ? '#22c55e' : '#64748b'

        ctx.beginPath()
        ctx.arc(p.x, p.y, r, 0, Math.PI * 2)
        ctx.fillStyle = color
        ctx.fill()
        ctx.strokeStyle = '#1e293b'
        ctx.lineWidth = 2
        ctx.stroke()

        // Label on hover or high risk
        if (hoveredNode?.id === n.id || risk > 5) {
          ctx.fillStyle = '#e2e8f0'
          ctx.font = '11px sans-serif'
          ctx.fillText(n.label, p.x + r + 3, p.y + 3)
        }
      }

      animId = requestAnimationFrame(draw)
    }
    draw()

    // Mouse interaction
    const handleMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect()
      const mx = e.clientX - rect.left
      const my = e.clientY - rect.top
      let closest: GraphNode | null = null
      let minDist = 20
      for (const n of nodes) {
        const p = pos.get(n.id)
        if (!p) continue
        const d = Math.sqrt((p.x - mx) ** 2 + (p.y - my) ** 2)
        if (d < minDist) { minDist = d; closest = n }
      }
      setHoveredNode(closest)
    }
    canvas.addEventListener('mousemove', handleMove)

    return () => {
      cancelAnimationFrame(animId)
      canvas.removeEventListener('mousemove', handleMove)
    }
  }, [selected, hoveredNode])

  if (loading) return <div className="p-8 text-slate-400">Loading architecture graph...</div>

  return (
    <div className="p-6 space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Architecture Graph</h1>
          <p className="text-slate-400 text-sm mt-1">Real-time code structure visualization with risk overlay</p>
        </div>
        <div className="flex gap-3 items-center">
          <select className="input max-w-xs" value={selectedRepo} onChange={e => setSelectedRepo(e.target.value)}>
            <option value="">Select repository...</option>
            {repos.map(r => <option key={r.id} value={r.id}>{r.full_name || r.name}</option>)}
          </select>
          <label className="flex items-center gap-2 text-sm text-slate-300">
            <input type="checkbox" checked={liveMode} onChange={e => setLiveMode(e.target.checked)} />
            Live
          </label>
        </div>
      </div>

      <div className="flex gap-1 border-b border-slate-700 pb-px">
        {(['graph', 'diff', 'metrics'] as const).map(m => (
          <button key={m} onClick={() => setViewMode(m)}
            className={`px-4 py-2 text-sm font-medium capitalize border-b-2 -mb-px ${viewMode === m ? 'border-blue-500 text-blue-400' : 'border-transparent text-slate-400 hover:text-slate-200'}`}>
            {m === 'graph' ? 'Graph View' : m === 'diff' ? 'Diff View' : 'Metrics'}
          </button>
        ))}
      </div>

      {viewMode === 'graph' && (
        <div className="grid grid-cols-4 gap-4">
          <div className="col-span-3 card p-0 overflow-hidden" style={{ height: '600px' }}>
            {selected ? (
              <canvas ref={canvasRef} className="w-full h-full cursor-pointer" />
            ) : (
              <div className="flex items-center justify-center h-full text-slate-500">
                {selectedRepo ? 'No snapshots yet. Run a scan to generate a graph.' : 'Select a repository.'}
              </div>
            )}
            {hoveredNode && (
              <div className="absolute bottom-4 left-4 card p-3 max-w-xs pointer-events-none">
                <p className="text-slate-200 font-medium text-sm">{hoveredNode.label}</p>
                <p className="text-slate-500 text-xs">{hoveredNode.path}</p>
                <p className="text-slate-400 text-xs mt-1">Risk: {hoveredNode.riskScore?.toFixed(2)} | Findings: {hoveredNode.findingCount} | {hoveredNode.maxSeverity}</p>
              </div>
            )}
          </div>

          <div className="card p-4 space-y-3">
            <h3 className="text-slate-300 font-medium text-sm">Snapshot History</h3>
            {snapshots.length === 0 ? (
              <p className="text-slate-500 text-xs">No snapshots</p>
            ) : (
              <div className="space-y-2 max-h-[500px] overflow-y-auto">
                {snapshots.map((s, i) => (
                  <button key={s.id} onClick={() => setSelected(s)}
                    className={`w-full text-left p-2 rounded-lg border transition-colors ${selected?.id === s.id ? 'border-blue-500/50 bg-blue-500/5' : 'border-slate-800 hover:border-slate-700'}`}>
                    <p className="text-slate-300 text-xs font-mono">{new Date(s.created_at).toLocaleString()}</p>
                    <p className="text-slate-500 text-xs">{s.node_count} nodes · {s.edge_count} edges · Δ{s.risk_delta}</p>
                    {i === 0 && <span className="text-green-400 text-xs">Latest</span>}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {viewMode === 'diff' && selected && (
        <div className="grid grid-cols-2 gap-4">
          <div className="card p-4">
            <h3 className="text-green-400 font-medium mb-3">Added Nodes ({selected.added_nodes?.length || 0})</h3>
            {(selected.added_nodes || []).map((n: any, i: number) => (
              <div key={i} className="text-sm text-slate-300 py-1 border-b border-slate-800">
                <span className="text-green-400">+</span> {n.label} <span className="text-slate-500 text-xs">{n.path}</span>
              </div>
            ))}
            {(!selected.added_nodes || selected.added_nodes.length === 0) && <p className="text-slate-500 text-sm">No additions</p>}
          </div>
          <div className="card p-4">
            <h3 className="text-red-400 font-medium mb-3">Removed Nodes ({selected.removed_nodes?.length || 0})</h3>
            {(selected.removed_nodes || []).map((n: any, i: number) => (
              <div key={i} className="text-sm text-slate-300 py-1 border-b border-slate-800">
                <span className="text-red-400">-</span> {n.label} <span className="text-slate-500 text-xs">{n.path}</span>
              </div>
            ))}
            {(!selected.removed_nodes || selected.removed_nodes.length === 0) && <p className="text-slate-500 text-sm">No removals</p>}
          </div>
          <div className="col-span-2 card p-4">
            <h3 className="text-slate-300 font-medium mb-3">Risk Delta: <span className={selected.risk_delta > 0 ? 'text-red-400' : 'text-green-400'}>{selected.risk_delta > 0 ? '+' : ''}{selected.risk_delta}</span></h3>
          </div>
        </div>
      )}

      {viewMode === 'metrics' && selected && (
        <div className="grid grid-cols-4 gap-4">
          {[
            ['Total Nodes', selected.node_count],
            ['Total Edges', selected.edge_count],
            ['Max Depth', selected.metrics?.max_depth || 'N/A'],
            ['Total Lines', selected.metrics?.total_lines || 'N/A'],
            ['Avg Degree', selected.metrics?.avg_degree || 'N/A'],
            ['Hub Nodes', selected.metrics?.hubs?.length || 0],
            ['Leaf Nodes', selected.metrics?.leaf_count || 0],
            ['Cyclic Edges', selected.metrics?.cyclic_edges || 0],
            ['Total Risk', (selected.metrics?.total_risk || 0).toFixed(2)],
            ['Critical Files', selected.metrics?.critical_files || 0],
            ['High Risk Files', selected.metrics?.high_files || 0],
            ['Avg Risk', (selected.metrics?.avg_risk || 0).toFixed(2)],
          ].map(([label, val]) => (
            <div key={label as string} className="card p-4">
              <p className="text-slate-500 text-xs">{label}</p>
              <p className="text-slate-200 font-mono font-bold text-xl">{val}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
