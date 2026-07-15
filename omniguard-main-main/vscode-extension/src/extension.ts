import * as vscode from 'vscode'
import { spawnSync, spawn } from 'child_process'
import * as path from 'path'
import * as fs from 'fs'

// ─── Types ───────────────────────────────────────────────────────────────────

interface Finding {
  id: string
  title: string
  description?: string
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info'
  scanner: string
  rule_id?: string
  rule_name?: string
  category?: string
  file_path: string
  line_start: number
  line_end?: number
  evidence?: string
  remediation?: string
  ai_summary?: string
  ai_remediation?: string
  metadata?: {
    semantic?: boolean
    semantic_type?: string
    taint_source?: string
    taint_sink?: string
    taint_path?: Array<{ line: number; code: string; type: string }>
    clauses?: Array<{ framework: string; clause_id: string; clause_title: string }>
  }
}

interface SemanticFinding {
  semantic_type: string
  semantic_description: string
  severity: string
  confidence: number
  risk_weight: number
  file_path: string
  line_start: number
  line_end: number
  code_snippet: string
  taint_source?: string
  taint_sink?: string
  taint_path?: Array<{ line: number; code: string; type: string }>
  clauses: Array<{ framework: string; clause_id: string; clause_title: string }>
}

interface GraphNode {
  id: string
  label: string
  type: string
  path: string
  riskScore?: number
  findingCount?: number
  maxSeverity?: string
}

interface GraphEdge {
  source: string
  target: string
  type: string
}

interface GraphSnapshot {
  nodes: GraphNode[]
  edges: GraphEdge[]
  clusters: Array<{ id: string; label: string; nodeIds: string[] }>
  metrics: Record<string, any>
}

const SEVERITY_ORDER: Record<string, number> = { critical: 4, high: 3, medium: 2, low: 1, info: 0 }

// ─── CLI Resolution ──────────────────────────────────────────────────────────

function getCliCommand(): string {
  const config = vscode.workspace.getConfiguration('omniguard')
  const configured = config.get<string>('cliPath', '')
  if (configured && fs.existsSync(configured)) return configured

  // Check for local node_modules omniguard-enterprise-cli
  const workspaceFolders = vscode.workspace.workspaceFolders
  if (workspaceFolders) {
    const localPath = path.join(workspaceFolders[0].uri.fsPath, 'node_modules', 'omniguard-enterprise-cli', 'src', 'index.js')
    if (fs.existsSync(localPath)) return `node ${localPath}`
  }

  // Check global install
  const globalCheck = spawnSync('which', ['omniguard'], { encoding: 'utf8' })
  if (globalCheck.status === 0 && globalCheck.stdout.trim()) return globalCheck.stdout.trim()

  // Check npx
  return 'npx omniguard-enterprise-cli'
}

function getCliArgs(baseArgs: string[]): string[] {
  const config = vscode.workspace.getConfiguration('omniguard')
  const apiUrl = config.get<string>('supabaseUrl', '')
  const apiKey = config.get<string>('apiKey', '')

  const args = [...baseArgs]
  if (apiKey) {
    args.push('--api-key', apiKey)
  }
  if (apiUrl) {
    args.push('--backend-url', apiUrl)
  }
  return args
}

// ─── CLI Execution ───────────────────────────────────────────────────────────

function executeCliScan(filePath: string): Finding[] {
  const cmd = getCliCommand()
  const parts = cmd.split(' ')
  const args = getCliArgs(['scan', '--json', filePath])

  const result = spawnSync(parts[0], [...parts.slice(1), ...args], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    timeout: 30000,
  })

  if (result.error || !result.stdout) {
    console.error('OmniGuard CLI Error:', result.stderr || result.error)
    return []
  }

  try {
    const parsed = JSON.parse(result.stdout)
    return Array.isArray(parsed.findings) ? parsed.findings : []
  } catch {
    return []
  }
}

// Async version for real-time scanning — does NOT block the VS Code UI thread
function executeCliScanAsync(filePath: string): Promise<Finding[]> {
  return new Promise((resolve) => {
    const cmd = getCliCommand()
    const parts = cmd.split(' ')
    const args = getCliArgs(['scan', '--json', '--semantic', filePath])
    const child = spawn(parts[0], [...parts.slice(1), ...args], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    })
    let stdout = ''
    let stderr = ''
    let settled = false

    const timer = setTimeout(() => {
      if (!settled) { settled = true; try { child.kill('SIGKILL') } catch {} resolve([]) }
    }, 25000)

    child.stdout?.on('data', (d) => { stdout += d })
    child.stderr?.on('data', (d) => { stderr += d })
    child.on('error', () => { if (!settled) { settled = true; clearTimeout(timer); resolve([]) } })
    child.on('close', () => {
      if (settled) return
      settled = true
      clearTimeout(timer)
      if (!stdout) { resolve([]); return }
      try { const parsed = JSON.parse(stdout); resolve(Array.isArray(parsed.findings) ? parsed.findings : []) }
      catch { resolve([]) }
    })
  })
}

function executeSemanticScan(filePath: string): SemanticFinding[] {
  const cmd = getCliCommand()
  const parts = cmd.split(' ')
  const result = spawnSync(parts[0], [...parts.slice(1), 'semantic', '--json', filePath], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    timeout: 30000,
  })

  if (result.error || !result.stdout) return []
  try {
    const parsed = JSON.parse(result.stdout)
    return Array.isArray(parsed.findings) ? parsed.findings : []
  } catch {
    return []
  }
}

// Async semantic scan for real-time path
function executeSemanticScanAsync(filePath: string): Promise<SemanticFinding[]> {
  return new Promise((resolve) => {
    const cmd = getCliCommand()
    const parts = cmd.split(' ')
    const child = spawn(parts[0], [...parts.slice(1), 'semantic', '--json', filePath], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    })
    let stdout = ''
    let settled = false

    const timer = setTimeout(() => {
      if (!settled) { settled = true; try { child.kill('SIGKILL') } catch {} resolve([]) }
    }, 25000)

    child.stdout?.on('data', (d) => { stdout += d })
    child.on('error', () => { if (!settled) { settled = true; clearTimeout(timer); resolve([]) } })
    child.on('close', () => {
      if (settled) return
      settled = true
      clearTimeout(timer)
      if (!stdout) { resolve([]); return }
      try { const parsed = JSON.parse(stdout); resolve(Array.isArray(parsed.findings) ? parsed.findings : []) }
      catch { resolve([]) }
    })
  })
}

function executeGraphScan(dirPath: string): GraphSnapshot | null {
  const cmd = getCliCommand()
  const parts = cmd.split(' ')
  const result = spawnSync(parts[0], [...parts.slice(1), 'graph', '--format=json', dirPath], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    timeout: 60000,
  })

  if (result.error || !result.stdout) return null
  try {
    return JSON.parse(result.stdout)
  } catch {
    return null
  }
}

function executeAuditReport(dirPath: string): string {
  const cmd = getCliCommand()
  const parts = cmd.split(' ')
  const result = spawnSync(parts[0], [...parts.slice(1), 'audit', '--json', dirPath], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    timeout: 60000,
  })

  return result.stdout || '{}'
}

// ─── Debounced Real-Time Scanning ────────────────────────────────────────────

class DebouncedScanner {
  private timer: NodeJS.Timeout | undefined
  private delay: number
  private running = false
  private pending = false

  constructor(delay: number) {
    this.delay = delay
  }

  fire(callback: () => Promise<void>) {
    if (this.timer) clearTimeout(this.timer)
    this.timer = setTimeout(() => {
      this.timer = undefined
      this.exec(callback)
    }, this.delay)
  }

  private async exec(callback: () => Promise<void>) {
    if (this.running) { this.pending = true; return }
    this.running = true
    try { await callback() } catch (e) { console.error('OmniGuard scan error:', e) }
    this.running = false
    if (this.pending) { this.pending = false; this.exec(callback) }
  }

  cancel() {
    if (this.timer) {
      clearTimeout(this.timer)
      this.timer = undefined
    }
    this.pending = false
  }
}

// ─── Diagnostics ─────────────────────────────────────────────────────────────

function findingToDiagnostic(finding: Finding, document: vscode.TextDocument, failOn: string): vscode.Diagnostic {
  const line = Math.max(0, (finding.line_start || 1) - 1)
  const endLine = Math.max(line, (finding.line_end || line))
  const lineText = document.lineAt(Math.min(line, document.lineCount - 1)).text
  const start = lineText.search(/\S/) || 0

  const range = new vscode.Range(
    new vscode.Position(line, start),
    new vscode.Position(Math.min(endLine, document.lineCount - 1), lineText.length)
  )

  const threshold = SEVERITY_ORDER[failOn] ?? 3
  const isError = (SEVERITY_ORDER[finding.severity] ?? 0) >= threshold

  let message = `[OmniGuard ${finding.severity.toUpperCase()}] ${finding.title}`
  if (finding.evidence) message += ` — ${finding.evidence}`
  if (finding.metadata?.semantic) {
    message += `\nSemantic: ${finding.metadata.semantic_type}`
    if (finding.metadata.taint_source) {
      message += `\nTaint: ${finding.metadata.taint_source} → ${finding.metadata.taint_sink}`
    }
    if (finding.metadata.clauses && finding.metadata.clauses.length > 0) {
      message += `\nClauses: ${finding.metadata.clauses.map(c => c.clause_id).join(', ')}`
    }
  }

  const diag = new vscode.Diagnostic(range, message, isError ? vscode.DiagnosticSeverity.Error : vscode.DiagnosticSeverity.Warning)
  diag.source = 'OmniGuard'
  diag.code = finding.rule_id || finding.scanner

  return diag
}

// ─── Hover Provider ──────────────────────────────────────────────────────────

class OmniGuardHoverProvider implements vscode.HoverProvider {
  private findingMap: Map<string, Finding[]>

  constructor(findingMap: Map<string, Finding[]>) {
    this.findingMap = findingMap
  }

  provideHover(document: vscode.TextDocument, position: vscode.Position): vscode.Hover | undefined {
    const findings = this.findingMap.get(document.uri.fsPath)
    if (!findings) return undefined

    const lineFindings = findings.filter(f => {
      const start = Math.max(0, (f.line_start || 1) - 1)
      const end = Math.max(start, (f.line_end || start))
      return position.line >= start && position.line <= end
    })

    if (lineFindings.length === 0) return undefined

    const md = new vscode.MarkdownString()
    md.isTrusted = true

    for (const f of lineFindings) {
      const icon = f.severity === 'critical' ? '🔴' : f.severity === 'high' ? '🟠' : '🟡'
      md.appendMarkdown(`**${icon} ${f.severity.toUpperCase()}** — ${f.title}\n\n`)
      if (f.evidence) md.appendMarkdown(`\`${f.evidence}\`\n\n`)
      if (f.metadata?.semantic && f.metadata.taint_path) {
        md.appendMarkdown(`**Taint Flow:**\n\n`)
        for (const step of f.metadata.taint_path) {
          md.appendMarkdown(`- L${step.line}: \`${step.code}\` (${step.type})\n`)
        }
        md.appendMarkdown('\n')
      }
      if (f.metadata?.clauses && f.metadata.clauses.length > 0) {
        md.appendMarkdown(`**Compliance Clauses:**\n\n`)
        for (const c of f.metadata.clauses) {
          md.appendMarkdown(`- ${c.framework} ${c.clause_id}: ${c.clause_title}\n`)
        }
        md.appendMarkdown('\n')
      }
      if (f.ai_remediation) {
        md.appendMarkdown(`**AI Fix:**\n\n${f.ai_remediation}\n\n`)
      } else if (f.remediation) {
        md.appendMarkdown(`**Fix:** ${f.remediation}\n\n`)
      }
      md.appendMarkdown(`---\n\n`)
    }

    return new vscode.Hover(md, document.getWordRangeAtPosition(position) || new vscode.Range(position, position))
  }
}

// ─── Tree Providers ──────────────────────────────────────────────────────────

class FindingItem extends vscode.TreeItem {
  constructor(public finding: Finding, public uri: vscode.Uri) {
    super(finding.title, vscode.TreeItemCollapsibleState.None)
    this.tooltip = `${finding.severity.toUpperCase()} — ${finding.description || finding.evidence || ''}`
    this.description = `${finding.scanner} · L${finding.line_start}`
    this.iconPath = new vscode.ThemeIcon(
      finding.severity === 'critical' ? 'error' :
      finding.severity === 'high' ? 'warning' : 'info'
    )
    this.contextValue = 'finding'
  }
}

class OmniGuardTreeProvider implements vscode.TreeDataProvider<FindingItem> {
  private findingMap = new Map<string, { uri: vscode.Uri; findings: Finding[] }>()
  private _onDidChange = new vscode.EventEmitter<void>()
  readonly onDidChangeTreeData = this._onDidChange.event

  update(uri: vscode.Uri, findings: Finding[]) {
    this.findingMap.set(uri.fsPath, { uri, findings })
    this._onDidChange.fire()
  }

  clearAll() {
    this.findingMap.clear()
    this._onDidChange.fire()
  }

  getTreeItem(element: FindingItem) { return element }
  getChildren(): FindingItem[] {
    const items: FindingItem[] = []
    for (const { uri, findings } of this.findingMap.values()) {
      for (const f of findings) items.push(new FindingItem(f, uri))
    }
    return items.sort((a, b) => (SEVERITY_ORDER[b.finding.severity] ?? 0) - (SEVERITY_ORDER[a.finding.severity] ?? 0))
  }
}

class SemanticItem extends vscode.TreeItem {
  constructor(public semantic: SemanticFinding) {
    super(semantic.semantic_description, vscode.TreeItemCollapsibleState.Collapsed)
    this.description = `${semantic.semantic_type} · ${(semantic.confidence * 100).toFixed(0)}%`
    this.iconPath = new vscode.ThemeIcon('sparkle')
  }
}

class SemanticTreeProvider implements vscode.TreeDataProvider<vscode.TreeItem> {
  private semantics: SemanticFinding[] = []
  private _onDidChange = new vscode.EventEmitter<void>()
  readonly onDidChangeTreeData = this._onDidChange.event

  update(findings: SemanticFinding[]) {
    this.semantics = findings
    this._onDidChange.fire()
  }

  getTreeItem(element: vscode.TreeItem) { return element }
  getChildren(element?: vscode.TreeItem): vscode.TreeItem[] {
    if (!element) {
      return this.semantics.map(s => new SemanticItem(s))
    }
    if (element instanceof SemanticItem) {
      const items: vscode.TreeItem[] = []
      items.push(new vscode.TreeItem(`File: ${element.semantic.file_path}:${element.semantic.line_start}`, vscode.TreeItemCollapsibleState.None))
      if (element.semantic.taint_source) {
        items.push(new vscode.TreeItem(`Taint: ${element.semantic.taint_source} → ${element.semantic.taint_sink}`, vscode.TreeItemCollapsibleState.None))
      }
      for (const c of element.semantic.clauses) {
        const ci = new vscode.TreeItem(`${c.framework} ${c.clause_id}`, vscode.TreeItemCollapsibleState.None)
        ci.tooltip = c.clause_title
        items.push(ci)
      }
      return items
    }
    return []
  }
}

class GraphNodeItem extends vscode.TreeItem {
  constructor(public node: GraphNode) {
    super(node.label, vscode.TreeItemCollapsibleState.None)
    const risk = node.riskScore || 0
    this.description = `risk: ${risk.toFixed(1)} · ${node.findingCount || 0} findings`
    this.iconPath = new vscode.ThemeIcon(risk > 5 ? 'error' : risk > 2 ? 'warning' : 'circle')
    this.tooltip = `Path: ${node.path}\nType: ${node.type}\nRisk: ${risk}\nFindings: ${node.findingCount || 0}`
  }
}

class GraphTreeProvider implements vscode.TreeDataProvider<GraphNodeItem> {
  private snapshot: GraphSnapshot | null = null
  private _onDidChange = new vscode.EventEmitter<void>()
  readonly onDidChangeTreeData = this._onDidChange.event

  update(snap: GraphSnapshot) {
    this.snapshot = snap
    this._onDidChange.fire()
  }

  getTreeItem(element: GraphNodeItem) { return element }
  getChildren(): GraphNodeItem[] {
    if (!this.snapshot) return []
    return this.snapshot.nodes
      .map(n => new GraphNodeItem(n))
      .sort((a, b) => (b.node.riskScore || 0) - (a.node.riskScore || 0))
      .slice(0, 100)
  }
}

// ─── Extension Activation ────────────────────────────────────────────────────

export function activate(context: vscode.ExtensionContext) {
  const diagCollection = vscode.languages.createDiagnosticCollection('omniguard')
  const findingMap = new Map<string, Finding[]>()
  const treeProvider = new OmniGuardTreeProvider()
  const semanticProvider = new SemanticTreeProvider()
  const graphProvider = new GraphTreeProvider()

  const statusBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100)
  statusBar.text = '$(shield) OmniGuard'
  statusBar.tooltip = 'OmniGuard Security Scanner v2.2.5'
  statusBar.command = 'omniguard.showFindings'
  statusBar.show()

  const treeView = vscode.window.createTreeView('omniguardFindings', { treeDataProvider: treeProvider })
  const semanticView = vscode.window.createTreeView('omniguardSemantic', { treeDataProvider: semanticProvider })
  const graphView = vscode.window.createTreeView('omniguardGraph', { treeDataProvider: graphProvider })

  const hoverProvider = vscode.languages.registerHoverProvider({ scheme: 'file' }, new OmniGuardHoverProvider(findingMap))

  context.subscriptions.push(diagCollection, statusBar, treeView, semanticView, graphView, hoverProvider)

  // Debounced scanner for real-time on-type scanning
  const config = vscode.workspace.getConfiguration('omniguard')
  const scanner = new DebouncedScanner(config.get<number>('scanDelay', 500))
  const semanticEnabled = config.get<boolean>('semanticScan', true)

  async function runScan(document: vscode.TextDocument) {
    statusBar.text = '$(sync~spin) OmniGuard: scanning...'

    // Run both scans in parallel — async, non-blocking
    const [findings, semantic] = await Promise.all([
      executeCliScanAsync(document.uri.fsPath),
      semanticEnabled ? executeSemanticScanAsync(document.uri.fsPath) : Promise.resolve([]),
    ])

    findingMap.set(document.uri.fsPath, findings)
    treeProvider.update(document.uri, findings)
    if (semanticEnabled) semanticProvider.update(semantic)

    const failOn = config.get<string>('failOnSeverity', 'high')
    const diags = findings.map(f => findingToDiagnostic(f, document, failOn))
    diagCollection.set(document.uri, diags)

    const crit = findings.filter(f => f.severity === 'critical').length
    const high = findings.filter(f => f.severity === 'high').length

    if (findings.length === 0) {
      statusBar.text = '$(shield) OmniGuard ✓'
      statusBar.backgroundColor = undefined
    } else {
      statusBar.text = `$(shield) OmniGuard (${crit}C, ${high}H)`
      statusBar.backgroundColor = crit > 0
        ? new vscode.ThemeColor('statusBarItem.errorBackground')
        : new vscode.ThemeColor('statusBarItem.warningBackground')
    }

    vscode.commands.executeCommand('setContext', 'omniguard.hasFindings', findings.length > 0)
  }

  // ─── Commands ─────────────────────────────────────────────────────────────

  const cmdScanFile = vscode.commands.registerCommand('omniguard.scanFile', () => {
    const editor = vscode.window.activeTextEditor
    if (editor) runScan(editor.document)
    else vscode.window.showInformationMessage('Open a file to run OmniGuard scan.')
  })

  const cmdScanWorkspace = vscode.commands.registerCommand('omniguard.scanWorkspace', async () => {
    const folders = vscode.workspace.workspaceFolders
    if (!folders?.length) {
      vscode.window.showInformationMessage('Open a workspace folder to scan.')
      return
    }

    statusBar.text = '$(sync~spin) OmniGuard: scanning workspace...'

    const wsPath = folders[0].uri.fsPath
    const excludePatterns = config.get<string[]>('excludePatterns', ['**/node_modules/**'])
    const excludeGlob = excludePatterns.map(p => `{${p}}`).join(',')

    const uris = await vscode.workspace.findFiles('**/*', excludeGlob)
    let total = 0, critical = 0, high = 0

    for (const uri of uris) {
      try {
        const doc = await vscode.workspace.openTextDocument(uri)
        await runScan(doc)
        const f = findingMap.get(uri.fsPath) || []
        total += f.length
        critical += f.filter(x => x.severity === 'critical').length
        high += f.filter(x => x.severity === 'high').length
      } catch {}
    }

    statusBar.text = `$(shield) OmniGuard (${critical}C, ${high}H, ${total} total)`

    // Also generate graph
    const graph = executeGraphScan(wsPath)
    if (graph) graphProvider.update(graph)

    vscode.window.showInformationMessage(`OmniGuard workspace scan complete: ${total} findings (${critical} critical, ${high} high).`)
  })

  const cmdSemanticScan = vscode.commands.registerCommand('omniguard.semanticScan', () => {
    const editor = vscode.window.activeTextEditor
    if (!editor) return vscode.window.showInformationMessage('Open a file first.')

    statusBar.text = '$(sync~spin) OmniGuard: semantic scan...'

    const semantics = executeSemanticScan(editor.document.uri.fsPath)
    semanticProvider.update(semantics)

    if (semantics.length === 0) {
      vscode.window.showInformationMessage('No semantic vulnerabilities detected.')
    } else {
      vscode.window.showInformationMessage(`Found ${semantics.length} semantic findings with taint analysis.`)
    }

    statusBar.text = `$(shield) OmniGuard (${semantics.length} semantic)`
  })

  const cmdShowGraph = vscode.commands.registerCommand('omniguard.showGraph', () => {
    const folders = vscode.workspace.workspaceFolders
    if (!folders?.length) return vscode.window.showInformationMessage('Open a workspace first.')

    statusBar.text = '$(sync~spin) OmniGuard: building graph...'

    const graph = executeGraphScan(folders[0].uri.fsPath)
    if (graph) {
      graphProvider.update(graph)
      vscode.window.showInformationMessage(`Graph: ${graph.nodes.length} nodes, ${graph.edges.length} edges, ${graph.clusters.length} clusters.`)
    } else {
      vscode.window.showErrorMessage('Failed to generate graph.')
    }

    statusBar.text = '$(shield) OmniGuard ✓'
  })

  const cmdAuditReport = vscode.commands.registerCommand('omniguard.auditReport', () => {
    const folders = vscode.workspace.workspaceFolders
    if (!folders?.length) return vscode.window.showInformationMessage('Open a workspace first.')

    const report = executeAuditReport(folders[0].uri.fsPath)
    const panel = vscode.window.createWebviewPanel(
      'omniguardAudit',
      'OmniGuard Compliance Audit',
      vscode.ViewColumn.Beside,
      {}
    )
    panel.webview.html = generateAuditHtml(report)
  })

  const cmdExplain = vscode.commands.registerCommand('omniguard.explain', (findingId: string) => {
    const cli = getCliCommand()
    const parts = cli.split(' ')
    const terminal = vscode.window.createTerminal('OmniGuard Explanation')
    terminal.show()
    terminal.sendText(`${parts[0]} ${parts.slice(1).join(' ')} explain ${findingId}`)
  })

  const cmdConfigure = vscode.commands.registerCommand('omniguard.configure', () => {
    vscode.commands.executeCommand('workbench.action.openSettings', 'omniguard')
  })

  const cmdClear = vscode.commands.registerCommand('omniguard.clearDiagnostics', () => {
    diagCollection.clear()
    findingMap.clear()
    treeProvider.clearAll()
    semanticProvider.update([])
    statusBar.text = '$(shield) OmniGuard'
    statusBar.backgroundColor = undefined
    vscode.commands.executeCommand('setContext', 'omniguard.hasFindings', false)
  })

  const cmdShow = vscode.commands.registerCommand('omniguard.showFindings', () => {
    vscode.commands.executeCommand('omniguardFindings.focus')
  })

  const cmdNexusGraph = vscode.commands.registerCommand('omniguard.nexusGraph', () => {
    vscode.commands.executeCommand('omniguard.showGraph')
  })

  const cmdAgentMap = vscode.commands.registerCommand('omniguard.agentMap', async () => {
    const folders = vscode.workspace.workspaceFolders
    if (!folders?.length) return

    vscode.window.showInformationMessage('Running system mapping agent...')
    const graph = executeGraphScan(folders[0].uri.fsPath)
    if (graph) {
      graphProvider.update(graph)
      vscode.window.showInformationMessage(`System mapped: ${graph.nodes.length} nodes, ${graph.metrics.cyclic_edges} cycles detected.`)
    }
  })

  // ── Multi-Agent Pipeline: full 4-agent run (classify → delegate → build → fix) ──
  const cmdAgentRun = vscode.commands.registerCommand('omniguard.agentRun', async () => {
    const folders = vscode.workspace.workspaceFolders
    if (!folders?.length) return vscode.window.showInformationMessage('Open a workspace first.')

    const choice = await vscode.window.showQuickPick(
      ['Full Pipeline (classify → delegate → build → fix)', 'Classify Only', 'Classify + Delegate', 'Dry Run (no fixes applied)', 'Explain Pipeline'],
      { placeHolder: 'Select agent pipeline mode' }
    )
    if (!choice) return

    const terminal = vscode.window.createTerminal('OmniGuard Agents')
    terminal.show()

    const cli = getCliCommand()
    const parts = cli.split(' ')
    const cliBase = `${parts[0]} ${parts.slice(1).join(' ')}`.trim()

    if (choice.startsWith('Full')) {
      terminal.sendText(`${cliBase} agent run --verbose "${folders[0].uri.fsPath}"`)
    } else if (choice === 'Classify Only') {
      terminal.sendText(`${cliBase} agent classify "${folders[0].uri.fsPath}"`)
    } else if (choice === 'Classify + Delegate') {
      terminal.sendText(`${cliBase} agent delegate "${folders[0].uri.fsPath}"`)
    } else if (choice === 'Dry Run') {
      terminal.sendText(`${cliBase} agent run --dry-run --verbose "${folders[0].uri.fsPath}"`)
    } else if (choice === 'Explain') {
      terminal.sendText(`${cliBase} agent explain "${folders[0].uri.fsPath}"`)
    }
  })

  // ── Agent: fix current file with the pipeline ──
  const cmdAgentFixFile = vscode.commands.registerCommand('omniguard.agentFixFile', async () => {
    const editor = vscode.window.activeTextEditor
    if (!editor) return vscode.window.showInformationMessage('Open a file first.')

    const cli = getCliCommand()
    const parts = cli.split(' ')
    const cliBase = `${parts[0]} ${parts.slice(1).join(' ')}`.trim()

    const terminal = vscode.window.createTerminal('OmniGuard Agent Fix')
    terminal.show()
    terminal.sendText(`${cliBase} agent fix "${editor.document.uri.fsPath}"`)
  })

  // ─── Real-Time Watchers ───────────────────────────────────────────────────

  // On-save scanning
  const onSave = vscode.workspace.onDidSaveTextDocument(doc => {
    if (config.get<boolean>('enableOnSave', true)) {
      runScan(doc)
    }
  })

  // On-type real-time scanning (debounced)
  const onType = vscode.workspace.onDidChangeTextDocument(event => {
    if (!config.get<boolean>('enableOnType', true)) return
    const doc = event.document
    if (doc.uri.scheme !== 'file') return
    if (doc.languageId === 'Log' || doc.languageId === 'output') return

    scanner.fire(() => runScan(doc))
  })

  // On-active-editor change
  const onEditorChange = vscode.window.onDidChangeActiveTextEditor(editor => {
    if (editor && config.get<boolean>('enableOnSave', true)) {
      runScan(editor.document)
    }
  })

  context.subscriptions.push(
    cmdScanFile, cmdScanWorkspace, cmdSemanticScan, cmdShowGraph, cmdAuditReport,
    cmdExplain, cmdConfigure, cmdClear, cmdShow, cmdNexusGraph, cmdAgentMap,
    cmdAgentRun, cmdAgentFixFile,
    onSave, onType, onEditorChange
  )

  // Initial scan of active file
  if (vscode.window.activeTextEditor) {
    runScan(vscode.window.activeTextEditor.document)
  }
}

function generateAuditHtml(reportJson: string): string {
  let report: any = {}
  try { report = JSON.parse(reportJson) } catch {}

  let html = `<!DOCTYPE html>
<html><head><style>
body { font-family: -apple-system, sans-serif; padding: 20px; background: #0f172a; color: #e2e8f0; }
.framework { background: #1e293b; border-radius: 8px; padding: 16px; margin-bottom: 16px; }
.framework h2 { color: #38bdf8; margin-top: 0; }
.clause { background: #0f172a; border-radius: 6px; padding: 12px; margin: 8px 0; border-left: 3px solid #ef4444; }
.clause h3 { color: #f1f5f9; margin: 0 0 4px; font-size: 14px; }
.clause p { color: #94a3b8; font-size: 12px; margin: 4px 0; }
.status-non_compliant { color: #ef4444; } .status-partially_compliant { color: #f59e0b; } .status-compliant { color: #22c55e; }
</style></head><body>
<h1>OmniGuard Compliance Audit Report</h1>
<p>Generated: ${new Date().toISOString()}</p>`

  for (const [fw, data] of Object.entries(report)) {
    const d = data as any
    html += `<div class="framework">
      <h2>${fw} <span class="status-${d.summary?.compliance_status}">(${d.summary?.compliance_status})</span></h2>
      <p>Version: ${d.version} | Clauses Violated: ${d.summary?.total_clauses_violated} | Findings: ${d.summary?.total_findings}</p>`

    for (const clause of Object.values(d.clauses || {})) {
      const c = clause as any
      html += `<div class="clause">
        <h3>${c.clause_id}: ${c.clause_title}</h3>
        <p>${c.clause_text?.substring(0, 200)}...</p>
        <p>Evidence: ${c.findings?.length} findings</p>
      </div>`
    }
    html += `</div>`
  }
  html += `</body></html>`
  return html
}

export function deactivate() {}
