import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { Network, Clock, AlertOctagon, Search, Layers, Server, Database, Cloud, AlertCircle, ArrowRight, X, ShieldAlert, Folder, ChevronRight, GitCommit, RefreshCw } from 'lucide-react';

interface AuditEvent {
  id: string;
  created_at: string;
  action: string;
  resource_name: string;
  new_values: any;
}

export default function ArchitectureNexus() {
  const { user } = useAuth();
  const [timelineValue, setTimelineValue] = useState(100);
  const [auditEvents, setAuditEvents] = useState<AuditEvent[]>([]);
  const [driftCount, setDriftCount] = useState(0);
  const [graphNodes, setGraphNodes] = useState<any[]>([]);
  const [repoFindings, setRepoFindings] = useState<any[]>([]);
  const [selectedNodeFinding, setSelectedNodeFinding] = useState<any | null>(null);
  const [repositories, setRepositories] = useState<any[]>([]);
  const [selectedRepo, setSelectedRepo] = useState<string>('');
  const [scanning, setScanning] = useState(false);
  const [scanLogs, setScanLogs] = useState<string[]>([]);
  const [scanProgress, setScanProgress] = useState<number>(0);
  const [lastScanDate, setLastScanDate] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Drill-down folder navigation state
  const [currentPath, setCurrentPath] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  // AI Fix state
  const [applyingFix, setApplyingFix] = useState(false);
  const [fixStatus, setFixStatus] = useState<string | null>(null);

  const fetchGraphData = async () => {
    if (!user) return;
    if (isSupabaseConfigured && supabase) {
      try {
        let orgId = user.orgId || '00000000-0000-0000-0000-000000000000';

        // Fetch graph delta audit trail events
        const { data: logs } = await supabase
          .from('audit_logs')
          .select('id, created_at, action, resource_name, new_values')
          .eq('organization_id', orgId)
          .order('created_at', { ascending: false });

        if (logs) {
          setAuditEvents(logs);
        }

        // Fetch live graph nodes from dedicated graph_nodes table
        const { data: nodes } = await supabase
          .from('graph_nodes')
          .select('*')
          .eq('organization_id', orgId)
          .order('depth', { ascending: true })
          .limit(400);

        if (nodes && nodes.length > 0) {
          const parsed = nodes.map(n => ({
            ...n,
            id: n.node_id,
            imports: typeof n.imports === 'string' ? (() => { try { return JSON.parse(n.imports); } catch { return []; } })() : (n.imports || [])
          }));
          setGraphNodes(parsed);
          localStorage.setItem(`omniguard_graph_${user.id}`, JSON.stringify(parsed));
        } else {
          setGraphNodes([]);
        }

        // Fetch findings for AI health indicators
        const { data: findings } = await supabase
          .from('findings')
          .select('*')
          .eq('organization_id', orgId);
        
        if (findings) setRepoFindings(findings);

        // Fetch active drifts count
        const { count } = await supabase
          .from('findings')
          .select('*', { count: 'exact', head: true })
          .eq('organization_id', orgId)
          .eq('category', 'drift')
          .eq('status', 'open');

        setDriftCount(count || 0);
      } catch (e) {
        console.error(e);
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    if (!user) return;

    // Fast local cache recovery
    const cached = localStorage.getItem(`omniguard_graph_${user.id}`);
    if (cached) {
      try { setGraphNodes(JSON.parse(cached)); } catch {}
    }

    // Retrieve active GitHub repositories
    const githubCache = localStorage.getItem(`omniguard_github_${user.id}`);
    if (githubCache) {
      try {
        const parsed = JSON.parse(githubCache);
        if (parsed.repos) {
          setRepositories(parsed.repos);
          const activeRepos = parsed.repos.filter((r: any) => r.active);
          if (activeRepos.length > 0) {
            setSelectedRepo(activeRepos[0].name);
          }
        }
      } catch {}
    }

    fetchGraphData();
  }, [user]);

  const handleTriggerScan = async () => {
    if (!selectedRepo) return;
    setScanning(true);
    setScanLogs(['Connecting to OmniGuard Compliance Engine...']);
    setScanProgress(1);

    let pat = '';
    let htmlUrl = '';
    const githubCache = localStorage.getItem(`omniguard_github_${user?.id}`);
    if (githubCache) {
      try {
        const parsed = JSON.parse(githubCache);
        pat = parsed.pat;
        const target = parsed.repos.find((r: any) => r.name === selectedRepo);
        if (target) htmlUrl = target.html_url;
      } catch {}
    }

    try {
      const response = await fetch('http://127.0.0.1:5185/scan-repo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pat,
          orgId: user?.orgId || '00000000-0000-0000-0000-000000000000',
          repoName: selectedRepo,
          htmlUrl,
          userId: user?.id
        })
      });
      const data = await response.json();
      
      if (!data.ok) {
        setScanLogs(prev => [...prev, `Error: ${data.error}`]);
        setScanning(false);
        return;
      }

      const scanId = data.scanId;
      setScanLogs(prev => [...prev, `Scan ${scanId} initiated. Connecting to live stream...`]);

      const evtSource = new EventSource(`http://127.0.0.1:5185/scan-stream?scanId=${scanId}`);
      
      evtSource.onmessage = (event) => {
        try {
          const entry = JSON.parse(event.data);
          setScanLogs(prev => [...prev, entry.message].slice(-15));
          if (typeof entry.progress === 'number') {
            setScanProgress(entry.progress);
          }

          if (entry.message === 'SCAN_COMPLETE') {
            evtSource.close();
            setScanProgress(100);
            setLastScanDate(new Date().toLocaleString());
            setScanLogs(prev => [...prev, `✓ Scan complete. ${entry.findingsCount || 0} findings detected.`]);
            fetchGraphData();
            setTimeout(() => {
              setScanning(false);
              setScanProgress(0);
              setScanLogs([]);
            }, 4000);
          }
        } catch {}
      };

      evtSource.onerror = () => {
        evtSource.close();
        // Fall back to short wait & pull
        setTimeout(() => {
          setScanProgress(100);
          setScanning(false);
          fetchGraphData();
        }, 5000);
      };

    } catch (err: any) {
      setScanLogs(prev => [...prev, `✗ Connection failed: ${err.message}`]);
      setTimeout(() => {
        setScanning(false);
        setScanProgress(0);
      }, 4000);
    }
  };

  const handleApplyFix = async () => {
    if (!selectedNodeFinding || !user) return;
    setApplyingFix(true);
    setFixStatus('Analyzing code changes...');

    let pat = '';
    const githubCache = localStorage.getItem(`omniguard_github_${user.id}`);
    if (githubCache) {
      try {
        const parsed = JSON.parse(githubCache);
        pat = parsed.pat;
      } catch {}
    }

    try {
      setFixStatus('Applying fix & committing to Git...');
      const response = await fetch('http://127.0.0.1:5185/ai-fix', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orgId: user.orgId || '00000000-0000-0000-0000-000000000000',
          repoName: selectedRepo,
          findingId: selectedNodeFinding.id,
          filePath: selectedNodeFinding.file_path,
          evidence: selectedNodeFinding.evidence,
          ruleId: selectedNodeFinding.rule_id,
          pat,
          userId: user.id
        })
      });
      
      const resData = await response.json();
      if (resData.ok) {
        setFixStatus('✓ Fix applied & pushed successfully!');
        setTimeout(() => {
          setSelectedNodeFinding(null);
          setFixStatus(null);
          setApplyingFix(false);
          fetchGraphData();
        }, 2000);
      } else {
        setFixStatus(`Error: ${resData.error || 'Failed to apply fix'}`);
        setApplyingFix(false);
      }
    } catch (err: any) {
      setFixStatus(`Connection failed: ${err.message}`);
      setApplyingFix(false);
    }
  };

  // Directory / Hierarchy Builder
  // Historical cutoff filtering (maps 100-0 to 0-30 days ago)
  const dayOffset = Math.round((100 - timelineValue) * 0.3);
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - dayOffset);

  const filteredGraphNodes = graphNodes.filter(n => {
    if (dayOffset === 0 || !n.created_at) return true;
    return new Date(n.created_at) <= cutoffDate;
  });

  const filteredFindings = repoFindings.filter(f => {
    if (dayOffset === 0 || !f.created_at) return true;
    return new Date(f.created_at) <= cutoffDate;
  });

  const repoNodes = filteredGraphNodes.filter(n => !selectedRepo || n.repository_name === selectedRepo);
  
  // Calculate folder items at the current path depth
  const getVisibleItems = () => {
    const parentPathStr = currentPath.join('/');
    
    // If searching, show all matching leaf files directly
    if (searchQuery.trim()) {
      return repoNodes.filter(n => 
        n.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        n.path.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    const itemsMap = new Map<string, any>();

    repoNodes.forEach(node => {
      // Split path to find current level name
      const relativePath = node.path;
      const parts = relativePath.split('/').filter(Boolean);
      
      // Check if node is inside current path prefix
      const matchesPrefix = currentPath.every((dir, index) => parts[index] === dir);
      if (!matchesPrefix) return;

      const nextPartIndex = currentPath.length;
      if (nextPartIndex >= parts.length) {
        // This is a leaf node at this exact level
        itemsMap.set(node.id, {
          ...node,
          isFolder: false
        });
      } else {
        // This is a folder node at this level
        const folderName = parts[nextPartIndex];
        const folderPath = parts.slice(0, nextPartIndex + 1).join('/');
        
        // Find if folder has any downstream violations
        const folderHasViolation = filteredFindings.some(f => 
          f.file_path.startsWith(folderPath) || f.file_path.includes('/' + folderPath)
        );

        itemsMap.set('dir-' + folderPath, {
          id: 'dir-' + folderPath,
          name: folderName,
          path: folderPath,
          isFolder: true,
          type: 'sublevel',
          depth: nextPartIndex,
          hasViolation: folderHasViolation
        });
      }
    });

    return Array.from(itemsMap.values());
  };

  const visibleItems = getVisibleItems();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-purple-600 uppercase tracking-widest mb-2">
            <Network size={14} />
            Architecture Nexus
          </div>
          <h1 className="text-2xl font-bold text-gray-900 font-display">Workspace Topology Graph</h1>
          <p className="text-sm text-gray-500 mt-1">
            Renders your exact repository structures and directory hierarchies computed by AST and IaC audits.
          </p>
        </div>
        <button 
          onClick={fetchGraphData}
          className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-gray-600 flex items-center gap-2 text-xs font-semibold"
        >
          <RefreshCw size={14} /> Refresh Data
        </button>
      </div>

      {/* Topological View */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5 border-b border-gray-100 pb-5">
          <div className="flex items-center gap-2">
            <Layers size={16} className="text-purple-500" />
            <h2 className="text-sm font-semibold text-gray-900">Drill-Down Graph Navigator</h2>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
              <input
                type="text"
                placeholder="Search components..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white w-48 font-medium text-gray-700"
              />
            </div>

            <select
              value={selectedRepo}
              onChange={(e) => {
                setSelectedRepo(e.target.value);
                setCurrentPath([]);
              }}
              className="px-3 py-1.5 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white font-semibold text-gray-700"
            >
              <option value="">-- All Repositories --</option>
              {repositories.map(r => (
                <option key={r.id} value={r.name}>{r.name}</option>
              ))}
            </select>

            <button
              onClick={handleTriggerScan}
              disabled={scanning || !selectedRepo}
              className="px-3 py-1.5 text-xs font-semibold text-white bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 rounded-lg flex items-center gap-1.5 transition-all shadow-sm"
            >
              {scanning ? (
                <>
                  <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Scanning...
                </>
              ) : (
                'Trigger Scan'
              )}
            </button>
          </div>
        </div>

        {/* Real-time Scan Status */}
        {scanLogs.length > 0 && (
          <div className="mb-6 p-4 bg-gray-950 rounded-lg shadow-inner overflow-hidden border border-gray-800">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-mono text-green-400 font-bold">OmniGuard AppSec Engine</span>
              <span className="text-xs font-mono text-gray-400">{Math.round(scanProgress)}%</span>
            </div>
            <div className="w-full bg-gray-900 rounded-full h-1.5 mb-3">
              <div className="bg-purple-500 h-1.5 rounded-full transition-all duration-300" style={{ width: `${scanProgress}%` }} />
            </div>
            <div className="space-y-1 h-20 overflow-y-auto">
              {scanLogs.map((log, i) => (
                <div key={i} className="text-[10px] font-mono text-gray-300 flex gap-2">
                  <span className="text-gray-500">[{new Date().toISOString().split('T')[1].split('.')[0]}]</span> {log}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Breadcrumb Navigation Trail */}
        {!searchQuery && (
          <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-4 bg-gray-50 p-2.5 rounded-lg border border-gray-100">
            <button 
              onClick={() => setCurrentPath([])}
              className={`font-semibold ${currentPath.length === 0 ? 'text-purple-600 font-bold' : 'hover:text-purple-600 hover:underline'}`}
            >
              root
            </button>
            {currentPath.map((dir, idx) => (
              <span key={idx} className="flex items-center gap-1">
                <ChevronRight size={12} className="text-gray-400" />
                <button 
                  onClick={() => setCurrentPath(currentPath.slice(0, idx + 1))}
                  className={`font-semibold ${idx === currentPath.length - 1 ? 'text-purple-600 font-bold' : 'hover:text-purple-600 hover:underline'}`}
                >
                  {dir}
                </button>
              </span>
            ))}
          </div>
        )}

        {/* Dynamic Topology Grid */}
        {visibleItems.length > 0 ? (
          <div className="w-full bg-gray-50 border border-gray-150 rounded-lg p-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {visibleItems.map((item) => {
                if (item.isFolder) {
                  return (
                    <div
                      key={item.id}
                      onClick={() => {
                        setCurrentPath([...currentPath, item.name]);
                      }}
                      className={`bg-white border p-4 rounded-lg flex flex-col justify-between transition-all cursor-pointer hover:shadow-md border-l-4
                        ${item.hasViolation ? 'border-l-red-500 border-red-200' : 'border-l-purple-500 border-gray-200'}`}
                    >
                      <div>
                        <div className="flex items-center justify-between">
                          <Folder className="text-purple-500 mb-2" size={24} />
                          {item.hasViolation && <ShieldAlert size={14} className="text-red-500 animate-pulse" />}
                        </div>
                        <span className="text-xs font-bold text-gray-900 block truncate mt-1">{item.name}</span>
                        <span className="text-[9px] text-gray-400 font-mono block truncate mt-0.5">{item.path}</span>
                      </div>
                      <div className="border-t border-gray-100 pt-2 mt-3 flex items-center justify-between text-[10px] font-semibold text-purple-700">
                        <span>Directory</span>
                        <span className="text-[9px] text-gray-400">Depth {item.depth}</span>
                      </div>
                    </div>
                  );
                }

                // File/Component view
                const nodeFinding = filteredFindings.find(f => 
                  f.file_path === item.path || 
                  (item.name === 'app_db.py' && f.file_path.includes('app_db.py'))
                );
                const isUnsafe = !!nodeFinding;

                return (
                  <div
                    key={item.id}
                    onClick={() => isUnsafe && setSelectedNodeFinding(nodeFinding)}
                    className={`bg-white border p-4 rounded-lg flex flex-col justify-between transition-all relative border-l-4 
                      ${isUnsafe ? 'border-l-red-500 border-red-200 hover:shadow-red-50 hover:border-red-300 cursor-pointer' : 'border-l-blue-500 border-gray-200 hover:shadow-md'}`}
                  >
                    <span className={`absolute top-2.5 right-2.5 w-2 h-2 rounded-full ${isUnsafe ? 'bg-red-500 animate-pulse' : 'bg-green-500'}`} />
                    
                    <div>
                      <Server className={`${isUnsafe ? 'text-red-500' : 'text-blue-500'} mb-2`} size={20} />
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-gray-900 block truncate">{item.name}</span>
                        {isUnsafe && <ShieldAlert size={12} className="text-red-500" />}
                      </div>
                      <span className="text-[9px] text-gray-400 font-mono block mt-1 truncate">{item.path}</span>
                      
                      {item.imports && item.imports.length > 0 && (
                        <div className="mt-2 bg-gray-50 p-1.5 rounded border border-gray-100">
                          <span className="text-[8px] font-bold text-gray-500 uppercase block mb-1">Calls</span>
                          <div className="space-y-0.5">
                            {item.imports.map((imp: string, i: number) => (
                              <div key={i} className="text-[8px] text-gray-600 font-mono truncate">{imp}</div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <div className="border-t border-gray-100 pt-2 mt-3 flex items-center justify-between">
                      <span className={`text-[10px] font-semibold capitalize ${isUnsafe ? 'text-red-600 font-bold' : 'text-gray-500'}`}>
                        {isUnsafe ? 'Violation' : item.type}
                      </span>
                      <span className="text-[9px] text-gray-400">Depth {item.depth}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="bg-gray-50 border border-gray-100 rounded-lg p-10 flex flex-col items-center justify-center text-center">
            <Network className="text-gray-300 mb-2 animate-pulse" size={32} />
            <p className="text-sm font-semibold text-gray-600">No components mapped at this level.</p>
            <p className="text-xs text-gray-400 mt-1">Select a repository and trigger a scan to build the topology map.</p>
          </div>
        )}
      </div>

      {/* Historical Audit Trail */}
      <div className="bg-white border border-gray-250 rounded-lg p-6">
        <div className="flex items-center gap-2 mb-5">
          <Clock size={16} className="text-gray-600" />
          <h2 className="text-sm font-semibold text-gray-900">Historical Audit Trail</h2>
        </div>

        <div className="mb-4">
          <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
            <span>30 days ago</span>
            <span className="font-semibold text-gray-900">Today</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={timelineValue}
            onChange={(e) => setTimelineValue(Number(e.target.value))}
            className="w-full accent-purple-600"
          />
        </div>

        {auditEvents.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center border border-dashed border-gray-200 rounded-lg">
            <p className="text-sm text-gray-500">No audit events recorded.</p>
          </div>
        ) : (
          <div className="relative border-l border-gray-200 pl-6 ml-3 space-y-4 max-h-60 overflow-y-auto">
            {auditEvents.map((event) => (
              <div key={event.id} className="relative">
                <span className="absolute -left-[31px] top-1.5 w-3 h-3 rounded-full bg-purple-500 ring-4 ring-white" />
                <div className="bg-gray-50 p-3.5 border border-gray-250 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-purple-600 uppercase tracking-widest">{event.action.replace('_', ' ')}</span>
                    <span className="text-[10px] text-gray-400">{new Date(event.created_at).toLocaleString()}</span>
                  </div>
                  <p className="text-xs font-semibold text-gray-800 mt-1">{event.new_values?.change || 'Architecture changes synced.'}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* AI Remediation Panel */}
      {selectedNodeFinding && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-950/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-y-auto m-4 border border-gray-250">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-red-55 flex items-center justify-center">
                  <ShieldAlert className="text-red-600" size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-900">Compliance Violation Detected</h3>
                  <p className="text-xs text-gray-405 font-mono">{selectedNodeFinding.file_path}</p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedNodeFinding(null)}
                className="text-gray-400 hover:text-gray-600 transition-colors bg-gray-100 hover:bg-gray-250 p-1.5 rounded-full"
              >
                <X size={16} />
              </button>
            </div>
            
            <div className="p-6 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-lg p-3 border border-gray-150">
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Rule Violated</span>
                  <span className="font-mono text-xs text-red-700 font-bold bg-red-50 px-2 py-0.5 rounded border border-red-100 inline-block">
                    {selectedNodeFinding.rule_id}
                  </span>
                </div>
                <div className="bg-gray-50 rounded-lg p-3 border border-gray-150">
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Severity</span>
                  <span className="text-xs font-bold text-red-600 uppercase">
                    {selectedNodeFinding.severity}
                  </span>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold text-gray-900 mb-1.5">Description</h4>
                <p className="text-xs text-gray-700 bg-gray-50 p-3 rounded-lg border border-gray-150">
                  {selectedNodeFinding.description}
                </p>
              </div>

              {selectedNodeFinding.evidence && (
                <div>
                  <h4 className="text-xs font-bold text-gray-900 mb-1.5">Evidence Detected</h4>
                  <pre className="text-xs text-red-700 bg-red-50/50 p-3 rounded-lg border border-red-100 font-mono overflow-x-auto">
                    <code>{selectedNodeFinding.evidence}</code>
                  </pre>
                </div>
              )}

              <div>
                <h4 className="text-xs font-bold text-purple-900 mb-1.5 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                  AI Suggested Remediation
                </h4>
                <div className="bg-gray-900 rounded-lg p-4 border border-gray-800 overflow-x-auto">
                  <pre className="text-xs text-green-400 font-mono">
                    <code>{selectedNodeFinding.ai_remediation || '// Auto-remediation code not available for this violation.'}</code>
                  </pre>
                </div>
              </div>

              {/* Action Buttons: Apply & Git Commit */}
              <div className="border-t border-gray-150 pt-4 mt-5 flex items-center justify-between">
                <div>
                  {fixStatus && (
                    <span className="text-xs text-purple-700 font-semibold animate-pulse">{fixStatus}</span>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setSelectedNodeFinding(null)}
                    className="px-4 py-2 text-xs font-semibold text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleApplyFix}
                    disabled={applyingFix}
                    className="px-4 py-2 text-xs font-semibold text-white bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 rounded-lg flex items-center gap-1.5 transition-all shadow-sm"
                  >
                    <GitCommit size={14} />
                    {applyingFix ? 'Remediating...' : 'Apply Fix & Commit Repo'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
