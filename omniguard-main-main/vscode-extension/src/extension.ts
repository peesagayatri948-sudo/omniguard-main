// OmniGuard VS Code Extension — UI Layer over CLI
// Features: executes CLI commands, displays inline diagnostics, trees, hover suggestions

import * as vscode from 'vscode'
import { spawnSync, execSync } from 'child_process'
import * as fs from 'fs'
import * as path from 'path'

// ─── Helper: Detect and resolve CLI command ───────────────────────────────────

function getCliCommand(): string {
  const config = vscode.workspace.getConfiguration('omniguard')
  const customPath = config.get<string>('cliPath', '').trim()
  if (customPath && fs.existsSync(customPath)) {
    return customPath
  }

  // 1. Check if omniguard is in system PATH
  try {
    const checkCmd = process.platform === 'win32' ? 'where omniguard' : 'which omniguard'
    execSync(checkCmd, { stdio: 'ignore' })
    return 'omniguard'
  } catch {}

  // 2. Local development fallback to peer CLI folder in workspace
  const workspaceFolders = vscode.workspace.workspaceFolders
  if (workspaceFolders) {
    for (const folder of workspaceFolders) {
      const localCli = path.join(folder.uri.fsPath, 'cli', 'src', 'index.js')
      const localCliParent = path.join(folder.uri.fsPath, '..', 'cli', 'src', 'index.js')
      if (fs.existsSync(localCli)) {
        return `node "${localCli}"`
      }
      if (fs.existsSync(localCliParent)) {
        return `node "${localCliParent}"`
      }
    }
  }

  // 3. Fallback to npx
  return 'npx @omniguard/cli'
}

function verifyCliInstalled() {
  const cli = getCliCommand()
  try {
    const cmd = cli.startsWith('node ') ? `${cli} version` : `${cli} --version`
    const output = execSync(cmd, { encoding: 'utf8' })
    if (output.includes('omniguard')) {
      return true
    }
  } catch {}
  return false
}

function promptInstallCli() {
  vscode.window.showErrorMessage(
    'OmniGuard CLI is required but not found in PATH.',
    'Install Globally (npm)',
    'Run via NPX'
  ).then(choice => {
    if (choice === 'Install Globally (npm)') {
      const terminal = vscode.window.createTerminal('OmniGuard Installation')
      terminal.show()
      terminal.sendText('npm install -g omniguard-enterprise-cli')
    }
  })
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface Finding {
  id?:            string
  rule_id:        string
  severity:       'critical' | 'high' | 'medium' | 'low' | 'info'
  title:          string
  evidence?:      string
  file_path:      string
  line_start:     number
  scanner:        string
  ai_explanation?: string
  ai_remediation?: string
}

const SEVERITY_ORDER: Record<Finding['severity'], number> = { critical: 4, high: 3, medium: 2, low: 1, info: 0 }

// ─── Scan Execution via CLI ──────────────────────────────────────────────────

function executeCliScan(filePath: string): Finding[] {
  const cliRaw = getCliCommand()
  let args = ['scan', '--json', filePath]
  let command = cliRaw

  if (cliRaw.startsWith('node ')) {
    const parts = cliRaw.split('"')
    const jsPath = parts[1] || parts[0].replace('node ', '').trim()
    command = 'node'
    args = [jsPath, 'scan', '--json', filePath]
  }

  const result = spawnSync(command, args, {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe']
  })

  if (result.error || !result.stdout) {
    console.error('OmniGuard CLI Error:', result.stderr || result.error)
    return []
  }

  try {
    const parsed = JSON.parse(result.stdout)
    return Array.isArray(parsed.findings) ? parsed.findings : []
  } catch (err) {
    console.error('Failed to parse scan output JSON:', err)
    return []
  }
}

// ─── Diagnostics and Markers ──────────────────────────────────────────────────

function findingToDiagnostic(finding: Finding, document: vscode.TextDocument, failOn: string): vscode.Diagnostic {
  const line = Math.max(0, (finding.line_start || 1) - 1)
  const lineText = document.lineAt(Math.min(line, document.lineCount - 1)).text
  const start = lineText.search(/\S/) || 0

  const range = new vscode.Range(
    new vscode.Position(line, start),
    new vscode.Position(line, lineText.length)
  )

  const threshold = SEVERITY_ORDER[failOn as Finding['severity']] ?? 3
  const isError = (SEVERITY_ORDER[finding.severity] ?? 0) >= threshold

  const diag = new vscode.Diagnostic(
    range,
    `[OmniGuard ${finding.severity.toUpperCase()}] ${finding.title}${finding.evidence ? ` — ${finding.evidence}` : ''}`,
    isError ? vscode.DiagnosticSeverity.Error : vscode.DiagnosticSeverity.Warning
  )
  diag.source = 'OmniGuard'
  diag.code = finding.rule_id
  return diag
}

// ─── Hover Provider ───────────────────────────────────────────────────────────

class OmniGuardHoverProvider implements vscode.HoverProvider {
  constructor(private findingMap: Map<string, Finding[]>) {}

  async provideHover(document: vscode.TextDocument, position: vscode.Position): Promise<vscode.Hover | null> {
    const key = document.uri.fsPath
    const findings = this.findingMap.get(key)
    if (!findings) return null

    const matching = findings.filter(f => ((f.line_start || 1) - 1) === position.line)
    if (!matching.length) return null

    const md = new vscode.MarkdownString()
    md.isTrusted = true
    for (const f of matching) {
      md.appendMarkdown(`### 🛡️ OmniGuard Finding: ${f.title}\n\n`)
      md.appendMarkdown(`**Severity:** \`${f.severity.toUpperCase()}\` | **Rule:** \`${f.rule_id}\` | **Scanner:** \`${f.scanner}\`\n\n`)
      if (f.evidence) md.appendMarkdown(`**Evidence:** \`${f.evidence}\`\n\n`)
      
      md.appendMarkdown(`---\n`)
      md.appendMarkdown(`[Explain Finding](command:omniguard.explain?${encodeURIComponent(JSON.stringify([f.id || f.rule_id]))}) | `)
      md.appendMarkdown(`[Create Jira Ticket](command:omniguard.createJira?${encodeURIComponent(JSON.stringify([f.id || f.rule_id]))}) | `)
      md.appendMarkdown(`[Create ServiceNow Incident](command:omniguard.createServiceNow?${encodeURIComponent(JSON.stringify([f.id || f.rule_id]))})\n`)
    }
    return new vscode.Hover(md)
  }
}

// ─── Findings Panel Tree View ─────────────────────────────────────────────────

class FindingItem extends vscode.TreeItem {
  constructor(public readonly finding: Finding, public readonly uri: vscode.Uri) {
    super(`[${finding.severity.toUpperCase()}] ${finding.title}`, vscode.TreeItemCollapsibleState.None)
    this.description = `${path.basename(uri.fsPath)}:${finding.line_start}`
    this.iconPath = new vscode.ThemeIcon(
      finding.severity === 'critical' || finding.severity === 'high' ? 'error' : 'warning'
    )
    this.command = {
      command: 'vscode.open',
      arguments: [uri, { selection: new vscode.Range(Math.max(0, (finding.line_start || 1) - 1), 0, Math.max(0, (finding.line_start || 1) - 1), 0) }],
      title: 'Go to Finding'
    }
  }
}

class OmniGuardTreeProvider implements vscode.TreeDataProvider<FindingItem> {
  private _onDidChange = new vscode.EventEmitter<void>()
  readonly onDidChangeTreeData = this._onDidChange.event
  private findingMap: Map<string, { uri: vscode.Uri; findings: Finding[] }> = new Map()

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

// ─── Extension Activation ─────────────────────────────────────────────────────

export function activate(context: vscode.ExtensionContext) {
  const diagCollection = vscode.languages.createDiagnosticCollection('omniguard')
  const findingMap = new Map<string, Finding[]>()
  const treeProvider = new OmniGuardTreeProvider()

  // Status Bar
  const statusBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100)
  statusBar.text = '$(shield) OmniGuard'
  statusBar.tooltip = 'OmniGuard Security Scanner'
  statusBar.command = 'omniguard.showFindings'
  statusBar.show()

  // Register Tree view
  const treeView = vscode.window.createTreeView('omniguardFindings', { treeDataProvider: treeProvider })

  // Register Hover provider
  const hoverProvider = vscode.languages.registerHoverProvider({ scheme: 'file' }, new OmniGuardHoverProvider(findingMap))

  context.subscriptions.push(diagCollection, statusBar, treeView, hoverProvider)

  // Verify CLI is available on startup
  if (!verifyCliInstalled()) {
    promptInstallCli()
  }

  async function runScan(document: vscode.TextDocument) {
    statusBar.text = '$(sync~spin) OmniGuard: scanning...'
    
    // Execute scanning via CLI
    const findings = executeCliScan(document.uri.fsPath)
    findingMap.set(document.uri.fsPath, findings)
    treeProvider.update(document.uri, findings)

    const config = vscode.workspace.getConfiguration('omniguard')
    const failOn = config.get<string>('failOnSeverity', 'high')
    const diags = findings.map(f => findingToDiagnostic(f, document, failOn))
    diagCollection.set(document.uri, diags)

    const crit = findings.filter(f => f.severity === 'critical').length
    const high = findings.filter(f => f.severity === 'high').length

    if (findings.length === 0) {
      statusBar.text = '$(shield) OmniGuard ✓'
      statusBar.backgroundColor = undefined
    } else {
      statusBar.text = `$(shield) OmniGuard (${crit} Critical, ${high} High)`
      statusBar.backgroundColor = crit > 0 ? new vscode.ThemeColor('statusBarItem.errorBackground') : new vscode.ThemeColor('statusBarItem.warningBackground')
    }
  }

  // ─── Commands ─────────────────────────────────────────────────────────────

  const cmdScanFile = vscode.commands.registerCommand('omniguard.scanFile', () => {
    const editor = vscode.window.activeTextEditor
    if (editor) runScan(editor.document)
    else vscode.window.showInformationMessage('Open a file to run OmniGuard scan.')
  })

  const cmdExplain = vscode.commands.registerCommand('omniguard.explain', (findingId: string) => {
    const cli = getCliCommand()
    const terminal = vscode.window.createTerminal('OmniGuard Explanation')
    terminal.show()
    terminal.sendText(`${cli} explain ${findingId}`)
  })

  const cmdCreateJira = vscode.commands.registerCommand('omniguard.createJira', (findingId: string) => {
    const cli = getCliCommand()
    const terminal = vscode.window.createTerminal('OmniGuard Integration')
    terminal.show()
    terminal.sendText(`${cli} integrations jira create ${findingId}`)
  })

  const cmdCreateServiceNow = vscode.commands.registerCommand('omniguard.createServiceNow', (findingId: string) => {
    const cli = getCliCommand()
    const terminal = vscode.window.createTerminal('OmniGuard Integration')
    terminal.show()
    terminal.sendText(`${cli} integrations servicenow incident ${findingId}`)
  })

  const cmdConfigure = vscode.commands.registerCommand('omniguard.configure', () => {
    const cli = getCliCommand()
    const terminal = vscode.window.createTerminal('OmniGuard Login')
    terminal.show()
    terminal.sendText(`${cli} login`)
  })

  const cmdClear = vscode.commands.registerCommand('omniguard.clearDiagnostics', () => {
    diagCollection.clear()
    findingMap.clear()
    treeProvider.clearAll()
    statusBar.text = '$(shield) OmniGuard'
    statusBar.backgroundColor = undefined
  })

  const cmdShow = vscode.commands.registerCommand('omniguard.showFindings', () => {
    vscode.commands.executeCommand('omniguardFindings.focus')
  })

  const cmdNexusGraph = vscode.commands.registerCommand('omniguard.nexusGraph', () => {
    const cli = getCliCommand()
    const terminal = vscode.window.createTerminal('OmniGuard Nexus Graph')
    terminal.show()
    terminal.sendText(`${cli} nexus graph`)
  })

  const cmdAgentMap = vscode.commands.registerCommand('omniguard.agentMap', () => {
    const cli = getCliCommand()
    const terminal = vscode.window.createTerminal('OmniGuard System Mapping Agent')
    terminal.show()
    terminal.sendText(`${cli} agent map`)
  })

  // Watch saves
  const onSave = vscode.workspace.onDidSaveTextDocument(doc => {
    const config = vscode.workspace.getConfiguration('omniguard')
    if (config.get<boolean>('enableOnSave', true)) {
      runScan(doc)
    }
  })

  context.subscriptions.push(
    cmdScanFile, cmdExplain, cmdCreateJira, cmdCreateServiceNow,
    cmdConfigure, cmdClear, cmdShow, cmdNexusGraph, cmdAgentMap, onSave
  )

  console.log('OmniGuard extension activated successfully.')
}

export function deactivate() {}
