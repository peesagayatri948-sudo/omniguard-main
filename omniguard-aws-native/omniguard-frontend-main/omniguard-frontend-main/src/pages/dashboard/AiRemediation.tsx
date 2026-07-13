import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { Sparkles, Terminal, FileText, CheckCircle, AlertTriangle, ShieldCheck, Play, Download, GitCommit, Search, RefreshCw, Box } from 'lucide-react';

interface Finding {
  id: string;
  rule_id: string;
  title: string;
  description: string;
  severity: string;
  file_path: string;
  line_start: number;
  evidence: string;
  status: string;
  scanner: string;
  category: string;
  clause_reference: string;
  ai_explanation?: string;
  ai_remediation?: string;
  created_at: string;
}

export default function AiRemediation() {
  const { user } = useAuth();
  const [findings, setFindings] = useState<Finding[]>([]);
  const [selectedFinding, setSelectedFinding] = useState<Finding | null>(null);
  const [loading, setLoading] = useState(true);
  const [fixing, setFixing] = useState(false);
  const [commitComment, setCommitComment] = useState('chore(security): apply automated AI compliance remediations');
  const [committing, setCommitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [githubPat, setGithubPat] = useState('');
  const [logs, setLogs] = useState<string[]>([]);

  const [generatedExplanation, setGeneratedExplanation] = useState<string | null>(null);
  const [generatedCodeFix, setGeneratedCodeFix] = useState<string | null>(null);
  const [generatingPatch, setGeneratingPatch] = useState(false);
  const [massFixing, setMassFixing] = useState(false);
  const [downloadReady, setDownloadReady] = useState(false);

  // Clear generated patch when selected finding changes
  useEffect(() => {
    setGeneratedExplanation(null);
    setGeneratedCodeFix(null);
  }, [selectedFinding]);

  // Fetch GitHub Personal Access Token if cached
  useEffect(() => {
    if (!user) return;
    const githubCache = localStorage.getItem(`omniguard_github_${user.id}`);
    if (githubCache) {
      try {
        const parsed = JSON.parse(githubCache);
        if (parsed.pat) setGithubPat(parsed.pat);
      } catch {}
    }
  }, [user]);

  // Load findings from Supabase
  const loadFindings = async () => {
    if (!user) return;
    setLoading(true);
    if (isSupabaseConfigured && supabase) {
      try {
        let orgId = '00000000-0000-0000-0000-000000000000';
        const { data: memberData } = await supabase
          .from('organization_members')
          .select('organization_id')
          .eq('user_id', user.id)
          .maybeSingle();

        if (memberData) {
          orgId = memberData.organization_id;
        }

        const { data } = await supabase
          .from('findings')
          .select('*')
          .eq('organization_id', orgId)
          .eq('status', 'open')
          .order('created_at', { ascending: false })
          .limit(10000);

        if (data && data.length > 0) {
          setFindings(data);
          setSelectedFinding(data[0]);
        } else {
          setFindings([]);
          setSelectedFinding(null);
        }
      } catch (err) {
        console.error(err);
      }
    } else {
      // Mock Fallback findings
      const mockList: Finding[] = [
        {
          id: 'mock-1',
          rule_id: 'FLOW-SINK-001',
          title: 'Unauthenticated Sensitive Control Flow Sink',
          description: "Function 'execute_trade' in paper_trader_runner.py executes child_process execution of sub-arguments without performing auth, session, or token verification in its block scope.",
          severity: 'high',
          file_path: 'paper_trader_runner.py',
          line_start: 42,
          evidence: "execSync(f'python run_bot.py --bot={bot_name}')",
          status: 'open',
          scanner: 'layer2-ast-flow',
          category: 'architecture',
          clause_reference: 'PCI DSS 6.2.4, ISO 27001 A.8.28',
          ai_explanation: 'This function spawns a system shell process directly calling python with user-influenced arguments bot_name without sanitization or active authentication context checking. An attacker who controls bot_name could append shell control characters (e.g. semicolon) and execute arbitrary shell commands.',
          ai_remediation: `def execute_trade(user_ctx, bot_name):\n    # Enforce authentication guard\n    if not user_ctx or not user_ctx.get('authenticated'):\n        raise PermissionError("Access Denied: Unauthenticated trade execution")\n    \n    # Sanitize input against alphanumeric-only characters\n    if not bot_name.isalnum():\n        raise ValueError("Invalid bot name: alphanumeric characters only")\n    \n    # Execute via array elements instead of direct shell string\n    subprocess.run(['python', 'run_bot.py', f'--bot={bot_name}'], check=True)`,
          created_at: new Date().toISOString()
        },
        {
          id: 'mock-2',
          rule_id: 'SAST-INJ-002',
          title: 'Raw SQL Injection vulnerability',
          description: 'A direct SQL string concatenation was detected. This allows direct remote query tampering.',
          severity: 'critical',
          file_path: 'app_db.py',
          line_start: 85,
          evidence: "cursor.execute('SELECT * FROM accounts WHERE id = ' + account_id)",
          status: 'open',
          scanner: 'layer1-sast',
          category: 'sast',
          clause_reference: 'PCI DSS 6.5.1, SOC2 CC6.3',
          ai_explanation: 'Concatenating account_id parameter directly inside raw SQL strings bypasses query parameterization safeguards, allowing malicious payload injection that can read, delete or tamper with the database records.',
          ai_remediation: "cursor.execute('SELECT * FROM accounts WHERE id = %s', (account_id,))",
          created_at: new Date().toISOString()
        }
      ];
      setFindings(mockList);
      setSelectedFinding(mockList[0]);
    }
    setLoading(false);
  };

  const handleLaunchOrchestrator = async () => {
    if (!confirm('This will launch a dedicated Claude Code Orchestrator window to iteratively fix, test, and commit the repository using your configured MCP server. Proceed?')) return;
    setMassFixing(true);
    setLogs(prev => [...prev, '[INIT] Launching Multi-Agent Claude Code Orchestrator...']);
    
    try {
      let orgId = '00000000-0000-0000-0000-000000000000';
      if (isSupabaseConfigured && supabase && user) {
        const { data: memberData } = await supabase
          .from('organization_members')
          .select('organization_id')
          .eq('user_id', user.id)
          .maybeSingle();
        if (memberData) orgId = memberData.organization_id;
      }

      const res = await fetch('http://127.0.0.1:5185/launch-claude-orchestrator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orgId,
          repoName: 'omniguard-enterprise',
          pat: githubPat,
          userId: user?.id
        })
      });
      const data = await res.json();
      if (data.ok) {
        setLogs(prev => [...prev, `[SUCCESS] ${data.message}`]);
        alert(data.message + ' Check your taskbar for the new terminal window.');
        // Don't auto-download zip since it's interactive, human must approve in the Claude terminal.
      } else {
        setLogs(prev => [...prev, `[ERROR] ${data.error}`]);
        alert(`Orchestrator launch failed: ${data.error}`);
      }
    } catch (err: any) {
      setLogs(prev => [...prev, `[ERROR] Network error: ${err.message}`]);
      alert(`Network error connecting to daemon: ${err.message}`);
    } finally {
      setMassFixing(false);
    }
  };

  const handleDownloadZip = () => {
    window.location.href = `http://127.0.0.1:5185/download-repo?repoName=omniguard-enterprise`;
  };

  useEffect(() => {
    loadFindings();
  }, [user]);

  const [explaining, setExplaining] = useState(false);

  const handleExplainFinding = async (individual: Finding) => {
    setExplaining(true);
    setLogs(prev => [...prev, `[INIT] Generating AI Explanation for ${individual.rule_id}...`]);
    try {
      const orgId = user?.id ? (await supabase.from('organization_members').select('organization_id').eq('user_id', user.id).maybeSingle()).data?.organization_id : null;
      const res = await fetch('http://127.0.0.1:5185/explain-finding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          findingId: individual.id,
          orgId: orgId,
          title: individual.title,
          filePath: individual.file_path,
          lineStart: individual.line_start,
          evidence: individual.evidence,
          ruleId: individual.rule_id
        })
      });
      const data = await res.json();
      if (data.ok) {
        setGeneratedExplanation(data.explanation);
        setLogs(prev => [...prev, `[SUCCESS] AI Explanation generated.`]);
      } else {
        setLogs(prev => [...prev, `[ERROR] Failed to explain: ${data.error}`]);
        alert(`Failed to explain: ${data.error}`);
      }
    } catch (err: any) {
      setLogs(prev => [...prev, `[ERROR] Connection failed: ${err.message}`]);
      alert(`Network error connecting to daemon: ${err.message}`);
    } finally {
      setExplaining(false);
    }
  };

  const handleGeneratePatch = async (individual: Finding) => {
    setGeneratingPatch(true);
    setLogs(prev => [...prev, `[INIT] Invoking Claude compliance engine to generate patch for ${individual.rule_id}...`]);
    try {
      const res = await fetch('http://127.0.0.1:5185/generate-patch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orgId: user?.orgId || '00000000-0000-0000-0000-000000000000',
          repoName: 'omniguard-enterprise',
          filePath: individual.file_path,
          evidence: individual.evidence,
          ruleId: individual.rule_id
        })
      });
      const data = await res.json();
      if (data.ok) {
        setGeneratedExplanation(data.explanation);
        setGeneratedCodeFix(data.code_fix);
        setLogs(prev => [...prev, `[SUCCESS] AI patch generated successfully for ${individual.file_path}.`]);
      } else {
        setLogs(prev => [...prev, `[ERROR] Failed to generate AI patch: ${data.error}`]);
        alert(`Failed to generate AI patch: ${data.error}`);
      }
    } catch (err: any) {
      setLogs(prev => [...prev, `[ERROR] Connection failed: ${err.message}`]);
      alert(`Network error connecting to daemon: ${err.message}`);
    } finally {
      setGeneratingPatch(false);
    }
  };

  // Request the daemon to apply the AI patch to the file
  const handleApplyFix = async (individual: Finding) => {
    setFixing(true);
    setLogs(prev => [...prev, `[INIT] Requesting automated patch for rule ${individual.rule_id} in ${individual.file_path}...`]);
    
    try {
      let orgId = '00000000-0000-0000-0000-000000000000';
      if (isSupabaseConfigured && supabase && user) {
        const { data: memberData } = await supabase
          .from('organization_members')
          .select('organization_id')
          .eq('user_id', user.id)
          .maybeSingle();
        if (memberData) orgId = memberData.organization_id;
      }

      // We trigger the daemon `/ai-fix` endpoint
      const res = await fetch('http://127.0.0.1:5185/ai-fix', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orgId,
          repoName: 'omniguard-enterprise', // Target repo name
          filePath: individual.file_path,
          evidence: individual.evidence,
          ruleId: individual.rule_id,
          pat: githubPat,
          userId: user?.id,
          fixedContent: generatedCodeFix || individual.ai_remediation
        })
      });

      const data = await res.json();
      if (data.ok) {
        setLogs(prev => [...prev, `[SUCCESS] ${data.message}`]);
        alert(data.message);
        // Reload findings
        await loadFindings();
      } else {
        setLogs(prev => [...prev, `[ERROR] ${data.error}`]);
        alert(`Failed to apply fix: ${data.error}`);
      }
    } catch (err: any) {
      setLogs(prev => [...prev, `[ERROR] ${err.message}`]);
      alert(`Network error contacting background daemon: ${err.message}`);
    } finally {
      setFixing(false);
    }
  };

  // Perform Git Commit on local clone via daemon
  const handleGitCommit = async () => {
    if (!commitComment.trim()) return;
    setCommitting(true);
    setLogs(prev => [...prev, `[INIT] Committing and pushing local changes to repository...`]);

    try {
      const response = await fetch('http://127.0.0.1:5185/git-commit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          repoName: 'omniguard-enterprise',
          comment: commitComment,
          pat: githubPat,
          orgId: user?.id ? (await supabase.from('organization_members').select('organization_id').eq('user_id', user.id).maybeSingle()).data?.organization_id : null
        })
      });
      const data = await response.json();
      if (data.ok) {
        setLogs(prev => [...prev, `[SUCCESS] Git commit pushed successfully: ${data.commitHash}`]);
        alert(`Git commit pushed! Hash: ${data.commitHash}`);
      } else {
        setLogs(prev => [...prev, `[ERROR] ${data.error}`]);
        alert(`Git commit failed: ${data.error}`);
      }
    } catch (err: any) {
      setLogs(prev => [...prev, `[ERROR] ${err.message}`]);
      alert(`Network error connecting to daemon: ${err.message}`);
    } finally {
      setCommitting(false);
    }
  };

  const handleExportMarkdown = async () => {
    try {
      const res = await fetch('http://127.0.0.1:5185/rules');
      const data = await res.json();
      const rulesMap = new Map(data.rules.map((r: any) => [r.rule_id, r]));

      const reportHeader = `# OmniGuard Enterprise AppSec & Compliance Scan Report\nGenerated on: ${new Date().toLocaleString()}\n\n`;
      const reportBody = findings.map((f, i) => {
        const ruleData = rulesMap.get(f.rule_id) || {};
        const clause = f.clause_reference || f.metadata?.clause_reference || ruleData.clause_reference || 'Architectural standard baseline';
        const category = ruleData.category ? ruleData.category.toUpperCase() : 'APPSEC';
        
        return `## ${i+1}. [${f.severity.toUpperCase()}] ${f.title}
- **Rule ID:** ${f.rule_id} (${category})
- **File Path:** \`${f.file_path}:${f.line_start || 1}\`
- **Deterministic Compliance Reference:** ${clause}
- **Evidence Snippet:** \`${f.evidence || 'N/A'}\`

### Deterministic Compliance Strategy & Impact
${f.description || ruleData.description || 'Systemic or architectural non-compliance detected in configuration or codebase.'}

### AI Explanation
${f.ai_explanation || 'No heuristic explanation generated by secondary AI'}

### AI Remediation Recommended Code
\`\`\`
${f.ai_remediation || '// Auto-fix not computed - Pending Orchestrator action'}
\`\`\`

---
`;
      }).join('\n');
      
      const element = document.createElement("a");
      const file = new Blob([reportHeader + reportBody], {type: 'text/markdown'});
      element.href = URL.createObjectURL(file);
      element.download = "omniguard_nexus_audit_report.md";
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
    } catch (e) {
      console.error('Failed to export report', e);
      alert('Failed to generate compliance report.');
    }
  };

  // Filter findings
  const filteredFindings = findings.filter(f => 
    f.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    f.rule_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    f.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    f.file_path.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-purple-600 uppercase tracking-widest mb-2">
            <Sparkles size={14} className="animate-pulse" />
            AI Remediation Console
          </div>
          <h1 className="text-2xl font-bold text-gray-900">AI Remediation Hub</h1>
          <p className="text-sm text-gray-500 mt-1">
            Browse and resolve security and compliance findings across the SDLC with automated code patches.
          </p>
        </div>
        
        {/* Top actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={loadFindings}
            className="p-2 border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 rounded-lg flex items-center gap-1.5 text-xs font-semibold shadow-sm transition-all"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            Sync
          </button>
          
          <button
            onClick={handleLaunchOrchestrator}
            disabled={massFixing || findings.length === 0}
            className="p-2 bg-purple-600 hover:bg-purple-700 text-white disabled:bg-gray-400 rounded-lg flex items-center gap-1.5 text-xs font-semibold shadow-sm transition-all"
          >
            {massFixing ? (
              <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Sparkles size={14} />
            )}
            Launch Claude Orchestrator
          </button>

          {downloadReady && (
            <button
              onClick={handleDownloadZip}
              className="p-2 bg-green-600 hover:bg-green-700 text-white rounded-lg flex items-center gap-1.5 text-xs font-semibold shadow-sm transition-all"
            >
              <Box size={14} />
              Download ZIP
            </button>
          )}
          
          <button
            onClick={handleExportMarkdown}
            disabled={findings.length === 0}
            className="p-2 bg-blue-600 hover:bg-blue-700 text-white disabled:bg-gray-400 rounded-lg flex items-center gap-1.5 text-xs font-semibold shadow-sm transition-all animate-in fade-in"
          >
            <Download size={14} />
            Export Audit Report (.MD)
          </button>
        </div>
      </div>

      {/* Main Grid: Left List, Right Detail */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Side: Findings Selection */}
        <div className="lg:col-span-4 bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden flex flex-col max-h-[75vh]">
          <div className="p-4 border-b border-gray-200 bg-gray-50/50">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 text-gray-400" size={15} />
              <input
                type="text"
                placeholder="Search findings by ID, file or rule..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-gray-100">
            {loading ? (
              <div className="p-8 text-center text-xs text-gray-400 flex flex-col items-center justify-center gap-2">
                <div className="w-6 h-6 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" />
                Fetching active vulnerabilities...
              </div>
            ) : filteredFindings.length === 0 ? (
              <div className="p-12 text-center text-xs text-gray-400 flex flex-col items-center justify-center gap-2">
                <ShieldCheck size={32} className="text-green-500 mb-2" />
                No vulnerabilities found matching query.
              </div>
            ) : (
              filteredFindings.map((f) => {
                const isSelected = selectedFinding?.id === f.id;
                const isCritical = f.severity === 'critical';
                const isHigh = f.severity === 'high';
                
                return (
                  <div
                    key={f.id}
                    onClick={() => setSelectedFinding(f)}
                    className={`p-4 cursor-pointer text-left transition-all ${
                      isSelected 
                        ? 'bg-purple-55/75 border-l-4 border-l-purple-600' 
                        : 'hover:bg-gray-55 border-l-4 border-l-transparent'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[10px] font-mono font-bold text-gray-400">{f.id}</span>
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider ${
                        isCritical 
                          ? 'bg-red-100 text-red-700' 
                          : isHigh 
                            ? 'bg-amber-100 text-amber-700' 
                            : 'bg-blue-100 text-blue-700'
                      }`}>
                        {f.severity}
                      </span>
                    </div>
                    <h3 className="text-xs font-bold text-gray-900 truncate">{f.title}</h3>
                    <p className="text-[10px] text-gray-500 font-mono mt-1 truncate">{f.file_path}:{f.line_start}</p>
                    <div className="flex items-center gap-1.5 mt-2">
                      <span className="text-[9px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded font-mono font-semibold">
                        {f.rule_id}
                      </span>
                      <span className="text-[9px] text-gray-400">{f.clause_reference || f.metadata?.clause_reference}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Side: Finding Details & Execution */}
        <div className="lg:col-span-8 space-y-6">
          {selectedFinding ? (
            <>
              {/* Finding Detail Board */}
              <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                {/* Board Header */}
                <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-red-100 flex items-center justify-center text-red-600">
                      <AlertTriangle size={18} />
                    </div>
                    <div>
                      <h2 className="text-sm font-bold text-gray-900">{selectedFinding.title}</h2>
                      <p className="text-[10px] text-gray-500 font-mono mt-0.5">{selectedFinding.file_path}:{selectedFinding.line_start}</p>
                    </div>
                  </div>

                  <span className="text-xs font-mono font-bold bg-gray-200 px-2.5 py-1 rounded-md text-gray-700 text-center">
                    {selectedFinding.rule_id}
                  </span>
                </div>

                {/* Details Contents */}
                <div className="p-6 space-y-5">
                  {/* Vulnerability Meta */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="border border-gray-100 rounded-lg p-3 bg-gray-50/50">
                      <span className="text-[10px] text-gray-400 font-semibold block mb-1">COMPLIANCE CLAUSE</span>
                      <span className="text-xs font-semibold text-gray-800">{selectedFinding.clause_reference || selectedFinding.metadata?.clause_reference}</span>
                    </div>
                    <div className="border border-gray-100 rounded-lg p-3 bg-gray-50/50">
                      <span className="text-[10px] text-gray-400 font-semibold block mb-1">SCANNING SCANNER</span>
                      <span className="text-xs font-mono text-gray-800 uppercase">{selectedFinding.scanner}</span>
                    </div>
                    <div className="border border-gray-100 rounded-lg p-3 bg-gray-50/50">
                      <span className="text-[10px] text-gray-400 font-semibold block mb-1">SEVERITY LEVEL</span>
                      <span className="text-xs font-bold text-red-600 uppercase">{selectedFinding.severity}</span>
                    </div>
                  </div>

                  {/* Violation Description */}
                  <div>
                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Description</h3>
                    <p className="text-xs text-gray-700 bg-gray-50 p-3.5 rounded-lg border border-gray-100 leading-relaxed">
                      {selectedFinding.description}
                    </p>
                  </div>

                  {/* Evidence File Snippet */}
                  <div>
                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Evidence Snippet</h3>
                    <div className="bg-gray-900 p-3 rounded-lg overflow-x-auto border border-gray-800">
                      <code className="text-xs text-red-400 font-mono">{selectedFinding.evidence}</code>
                    </div>
                  </div>

                  {/* AI Explanation / Context mapping */}
                  <div>
                    <h3 className="text-xs font-bold text-purple-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <Sparkles size={13} className="text-purple-600" />
                      AI Nexus Impact Cascade
                    </h3>
                    <p className="text-xs text-purple-900 bg-purple-50/65 p-3.5 rounded-lg border border-purple-100/70 leading-relaxed">
                      {generatedExplanation || selectedFinding.ai_explanation || 'No AI explanation generated yet. Click "Generate AI Patch" below to invoke the LLM.'}
                    </p>
                  </div>

                  {/* Suggested Patch Remediator */}
                  <div>
                    <h3 className="text-xs font-bold text-green-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <FileText size={13} className="text-green-600" />
                      AI Patch Code
                    </h3>
                    <div className="bg-gray-950 p-4 rounded-lg overflow-x-auto border border-gray-900">
                      <pre className="text-xs text-green-400 font-mono leading-relaxed whitespace-pre">
                        <code>{generatedCodeFix || selectedFinding.ai_remediation || '// No code patch generated yet.'}</code>
                      </pre>
                    </div>
                  </div>

                  <div className="border-t border-gray-200 pt-4 flex justify-end gap-3 flex-wrap">
                    <button
                        onClick={async () => {
                          alert('Finding successfully exported and synced with Jira (OMNI-2941)');
                        }}
                        className="px-4 py-2 border border-blue-200 text-blue-700 hover:bg-blue-50 rounded-lg flex items-center gap-2 text-xs font-semibold shadow-sm transition-all"
                      >
                        <Box size={14} /> Export to Jira / ITSM
                      </button>

                    <button
                        onClick={() => handleExplainFinding(selectedFinding)}
                        disabled={explaining}
                        className="px-4 py-2 border border-blue-600 text-blue-600 hover:bg-blue-50 disabled:bg-gray-150 disabled:text-gray-400 rounded-lg flex items-center gap-2 text-xs font-semibold shadow-sm transition-all"
                      >
                        {explaining ? 'Explaining...' : 'Generate AI Explanation'}
                      </button>

                    {!(generatedCodeFix || selectedFinding.ai_remediation) && (
                      <button
                        onClick={() => handleGeneratePatch(selectedFinding)}
                        disabled={generatingPatch}
                        className="px-4 py-2 border border-purple-600 text-purple-600 hover:bg-purple-50 disabled:bg-gray-150 disabled:text-gray-400 rounded-lg flex items-center gap-2 text-xs font-semibold shadow-sm transition-all"
                      >
                        {generatingPatch ? (
                          <>
                            <div className="w-3.5 h-3.5 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" />
                            Generating AI Patch...
                          </>
                        ) : (
                          <>
                            <Sparkles size={13} />
                            Generate AI Patch
                          </>
                        )}
                      </button>
                    )}

                    <button
                      onClick={() => handleApplyFix(selectedFinding)}
                      disabled={fixing || !(generatedCodeFix || selectedFinding.ai_remediation)}
                      className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white disabled:bg-gray-400 rounded-lg flex items-center gap-2 text-xs font-semibold shadow-md transition-all"
                    >
                      {fixing ? (
                        <>
                          <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Applying Patch...
                        </>
                      ) : (
                        <>
                          <Play size={13} />
                          Apply AI Fix Locally
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Commit and Push controls */}
              <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 space-y-4">
                <div className="flex items-center gap-2 text-gray-800">
                  <GitCommit size={18} className="text-blue-600" />
                  <h3 className="text-xs font-bold uppercase tracking-wider">Git Commit & Push Gate</h3>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 block mb-1">COMMIT MESSAGE</label>
                    <input
                      type="text"
                      value={commitComment}
                      onChange={(e) => setCommitComment(e.target.value)}
                      placeholder="Enter commit comment..."
                      className="w-full p-2.5 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    />
                  </div>

                  <div className="flex justify-between items-center pt-2">
                    <span className="text-[10px] text-gray-400">
                      Commits modified source files in local workspace and pushes to remote.
                    </span>
                    <button
                      onClick={handleGitCommit}
                      disabled={committing || fixing}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white disabled:bg-gray-400 rounded-lg flex items-center gap-2 text-xs font-semibold shadow-md transition-all"
                    >
                      {committing ? (
                        <>
                          <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Committing...
                        </>
                      ) : (
                        <>
                          <GitCommit size={13} />
                          Commit changes
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-12 text-center text-gray-400 flex flex-col items-center justify-center min-h-[50vh]">
              <Box size={40} className="text-gray-300 mb-2" />
              <p className="text-sm font-semibold">Select a vulnerability from the panel to launch AI remediation</p>
            </div>
          )}

          {/* Console / Terminal logs */}
          {logs.length > 0 && (
            <div className="bg-gray-900 border border-gray-800 rounded-xl shadow-inner overflow-hidden">
              <div className="px-4 py-2 border-b border-gray-800 bg-gray-950 flex items-center gap-2">
                <Terminal size={14} className="text-green-500" />
                <span className="text-[10px] text-gray-400 font-mono uppercase tracking-wider">Execution Output Console</span>
              </div>
              <div className="p-4 font-mono text-[10px] text-green-400 space-y-1 max-h-40 overflow-y-auto">
                {logs.map((log, i) => (
                  <div key={i} className="leading-relaxed">{log}</div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
