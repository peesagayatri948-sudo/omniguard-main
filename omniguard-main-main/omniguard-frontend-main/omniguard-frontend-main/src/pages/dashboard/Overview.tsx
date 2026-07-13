import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { Shield, Activity, AlertTriangle, GitBranch, Zap, TrendingUp, Eye } from 'lucide-react';

interface Threat {
  id: string;
  title: string;
  severity: string;
  file_path: string;
  rule_id: string;
  created_at: string;
}

interface Delta {
  id: string;
  action: string;
  resource_name: string;
  created_at: string;
  new_values: any;
}

export default function Overview() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    threatsCount: 0,
    deltasCount: 0,
    interceptsCount: 0,
    coverage: 85,
  });
  const [threats, setThreats] = useState<Threat[]>([]);
  const [deltas, setDeltas] = useState<Delta[]>([]);
  const [intercepts, setIntercepts] = useState<Delta[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const orgId = user.orgId || '00000000-0000-0000-0000-000000000000';

    const fetchData = async () => {
      if (isSupabaseConfigured && supabase) {
        try {
          // Query exact count of all threats from DB to bypass PostgREST max row limits (default 1000)
          const { count: exactThreatsCount } = await supabase
            .from('findings')
            .select('*', { count: 'exact', head: true })
            .in('severity', ['critical', 'high'])
            .eq('status', 'open')
            .or(`organization_id.eq.${orgId},organization_id.eq.00000000-0000-0000-0000-000000000000`);

          // Query findings filtered by org directly on the DB side to avoid PostgREST 1000 cap truncation
          const { data: threatData } = await supabase
            .from('findings')
            .select('id, title, severity, file_path, rule_id, created_at, organization_id')
            .in('severity', ['critical', 'high'])
            .eq('status', 'open')
            .or(`organization_id.eq.${orgId},organization_id.eq.00000000-0000-0000-0000-000000000000`)
            .order('created_at', { ascending: false })
            .limit(100); // Only load first 100 for the UI table view

          // Fetch graph deltas
          const { data: deltaData } = await supabase
            .from('audit_logs')
            .select('id, action, resource_name, created_at, new_values')
            .eq('action', 'graph_delta')
            .order('created_at', { ascending: false })
            .limit(20);

          // Fetch MCP intercepts
          const { data: interceptData } = await supabase
            .from('audit_logs')
            .select('id, action, resource_name, created_at, new_values')
            .eq('action', 'mcp_intercept')
            .order('created_at', { ascending: false })
            .limit(20);

          // Filter findings to org (nil UUID = daemon scans; real UUID = org scans)
          const allThreats = threatData || [];
          const orgThreats = allThreats.filter(
            t => t.organization_id === orgId || t.organization_id === '00000000-0000-0000-0000-000000000000'
          );

          const deltaList = deltaData || [];
          const interceptList = interceptData || [];

          setThreats(orgThreats);
          setDeltas(deltaList);
          setIntercepts(interceptList);
          setStats({
            threatsCount: exactThreatsCount !== null ? exactThreatsCount : orgThreats.length,
            deltasCount: deltaList.length,
            interceptsCount: interceptList.length,
            coverage: orgThreats.length === 0 ? 100 : Math.max(0, 100 - orgThreats.reduce((acc, t) => acc + (t.severity === 'critical' ? 5 : t.severity === 'high' ? 2 : 1), 0)),
          });
        } catch (e) {
          console.error(e);
        }
      } else {
        // Mock fallback data for offline view
        setThreats([
          {
            id: '1',
            title: 'Unsafe Deserialization detected',
            severity: 'critical',
            file_path: 'paper_trader_runner.py',
            rule_id: 'SAST-DESER-001',
            created_at: new Date().toISOString(),
          }
        ]);
        setDeltas([
          {
            id: '1',
            action: 'graph_delta',
            resource_name: 'experian/trader_bot',
            created_at: new Date().toISOString(),
            new_values: { change: 'Added local Edge node: Hardware Gateway' },
          }
        ]);
        setIntercepts([
          {
            id: '1',
            action: 'mcp_intercept',
            resource_name: 'Claude Code Agent',
            created_at: new Date().toISOString(),
            new_values: { file: 'paper_trader_runner.py', rule: 'SAST-DESER-001' },
          }
        ]);
        setStats({
          threatsCount: 1,
          deltasCount: 1,
          interceptsCount: 1,
          coverage: 85,
        });
      }
      setLoading(false);
    };

    fetchData();

    // Realtime: auto-refresh when daemon writes new findings or audit events
    if (isSupabaseConfigured && supabase) {
      const channel = supabase
        .channel('overview-realtime')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'findings' }, () => {
          fetchData();
        })
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'audit_logs' }, () => {
          fetchData();
        })
        .subscribe();

      return () => { supabase.removeChannel(channel); };
    }
  }, [user]);

  if (!user) return null;

  const roleLabel =
    user.role === 'ciso' ? 'CISO' : user.role === 'manager' ? 'Security Manager' : 'Developer';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-xs font-semibold text-blue-600 uppercase tracking-widest mb-2">
          <Activity size={14} />
          Shared Attention Dashboard
        </div>
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome back, {user.name.split(' ')[0]}
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Real-time overview of your security posture — scoped to your role as {roleLabel}.
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={AlertTriangle}
          label="High-Risk Threats Today"
          value={loading ? '...' : String(stats.threatsCount)}
          sub={stats.threatsCount > 0 ? `${stats.threatsCount} critical threat(s)` : 'No new threats detected'}
          color="red"
        />
        <StatCard
          icon={GitBranch}
          label="Graph Deltas (24h)"
          value={loading ? '...' : String(stats.deltasCount)}
          sub={stats.deltasCount > 0 ? `${stats.deltasCount} architecture change(s)` : 'No architecture changes'}
          color="blue"
        />
        <StatCard
          icon={Zap}
          label="MCP Intercepts"
          value={loading ? '...' : String(stats.interceptsCount)}
          sub={stats.interceptsCount > 0 ? 'AI edits intercepted' : 'No AI guardrail triggers'}
          color="amber"
        />
        <StatCard
          icon={Shield}
          label="Control Coverage"
          value={loading ? '...' : `${stats.coverage}%`}
          sub={stats.coverage === 100 ? 'All policies passing' : 'Action items detected'}
          color="green"
        />
      </div>

      {/* Live Threat Map */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <AlertTriangle size={16} className="text-red-500" />
            <h2 className="text-sm font-semibold text-gray-900">Live Threat Map</h2>
          </div>
          <span className="text-xs text-gray-400">High-risk vulnerabilities introduced today across all repos</span>
        </div>
        {threats.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-3">
              <Eye size={20} className="text-gray-400" />
            </div>
            <p className="text-sm text-gray-500">No threats have been detected yet.</p>
            <p className="text-xs text-gray-400 mt-1">
              Threats will appear here once repositories are connected and scanned.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left text-xs font-semibold text-gray-500 py-3 px-2">Vulnerability</th>
                  <th className="text-left text-xs font-semibold text-gray-500 py-3 px-2">File</th>
                  <th className="text-left text-xs font-semibold text-gray-500 py-3 px-2">Severity</th>
                  <th className="text-left text-xs font-semibold text-gray-500 py-3 px-2">Rule ID</th>
                </tr>
              </thead>
              <tbody>
                {threats.map((t) => (
                  <tr key={t.id} className="border-b border-gray-100">
                    <td className="py-3 px-2 text-sm font-medium text-gray-900">{t.title}</td>
                    <td className="py-3 px-2 text-sm text-gray-500 font-mono text-xs">{t.file_path}</td>
                    <td className="py-3 px-2 text-sm capitalize">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-red-100 text-red-700">
                        {t.severity}
                      </span>
                    </td>
                    <td className="py-3 px-2 text-sm text-gray-400 font-mono text-xs">{t.rule_id}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Graph Delta Feed */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center gap-2 mb-4">
            <GitBranch size={16} className="text-blue-500" />
            <h2 className="text-sm font-semibold text-gray-900">Graph Delta Feed</h2>
          </div>
          {deltas.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-sm text-gray-500">No architecture changes recorded.</p>
              <p className="text-xs text-gray-400 mt-1">
                Changes to the Architecture Nexus will stream here in real time.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {deltas.map((d) => (
                <div key={d.id} className="flex items-start gap-3 p-2 border-b border-gray-100 last:border-0">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-800 font-semibold">{d.new_values?.change || 'Architecture updated'}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{d.resource_name} • {new Date(d.created_at).toLocaleTimeString()}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* MCP Intercept Feed */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center gap-2 mb-4">
            <Zap size={16} className="text-amber-500" />
            <h2 className="text-sm font-semibold text-gray-900">MCP Intercept Feed</h2>
          </div>
          {intercepts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-sm text-gray-500">No MCP interceptions recorded.</p>
              <p className="text-xs text-gray-400 mt-1">
                AI guardrail blocks from Claude/Antigravity will appear here.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {intercepts.map((i) => (
                <div key={i.id} className="flex items-start gap-3 p-2 border-b border-gray-100 last:border-0">
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-2 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-800 font-semibold">Blocked AI Agent from editing: <span className="font-mono text-xs">{i.new_values?.file}</span></p>
                    <p className="text-xs text-amber-600 mt-0.5 font-mono">Violated rule: {i.new_values?.rule}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{new Date(i.created_at).toLocaleTimeString()}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Role-specific quick links */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp size={16} className="text-gray-600" />
          <h2 className="text-sm font-semibold text-gray-900">Quick Actions</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <QuickLink href="/app/nexus" label="View Architecture Nexus" />
          <QuickLink href="/app/api" label="Generate API Key" />
          <QuickLink href="/app/compliance" label="Download SBOM" />
        </div>
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  color,
}: {
  icon: typeof Shield;
  label: string;
  value: string;
  sub: string;
  color: 'red' | 'blue' | 'amber' | 'green';
}) {
  const colors = {
    red: 'bg-red-50 text-red-600',
    blue: 'bg-blue-50 text-blue-600',
    amber: 'bg-amber-50 text-amber-600',
    green: 'bg-green-50 text-green-600',
  };
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-5">
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-3 ${colors[color]}`}>
        <Icon size={18} />
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-xs font-semibold text-gray-600 mt-1">{label}</p>
      <p className="text-xs text-gray-400 mt-0.5">{sub}</p>
    </div>
  );
}

function QuickLink({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      className="flex items-center justify-between px-4 py-3 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:border-blue-300 hover:bg-blue-50 transition-colors"
    >
      {label}
      <ArrowRightSmall />
    </a>
  );
}

function ArrowRightSmall() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M5 12h14M12 5l7 7-7 7" />
    </svg>
  );
}
