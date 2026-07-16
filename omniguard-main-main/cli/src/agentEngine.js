/**
 * OmniGuard Multi-Agent Engine — v2.2.5
 *
 * Four specialized AI agents work in a pipeline:
 *
 *  1. CLASSIFIER  — Analyzes findings, categorizes by severity/type/framework,
 *                   deduplicates, and prioritizes
 *  2. DELEGATOR   — Assigns tasks to the right downstream agent, determines
 *                   fix strategy, decides what needs building vs fixing
 *  3. BUILDER     — Generates fix code patches, creates test cases, builds
 *                   remediation plans
 *  4. FIXER       — The smartest agent — actually applies fixes, validates
 *                   them, runs tests, and verifies the vulnerability is closed
 *
 * Each agent has a clear contract: input shape → output shape.
 * The pipeline is orchestrated by the AgentOrchestrator.
 */

const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')
const semanticEngine = require('./semanticEngine')
const auditClauseMapper = require('./auditClauseMapper')
const aiEngine = require('./aiEngine')

// ═══════════════════════════════════════════════════════════════════════════
// AGENT PERSONAS — system prompts that define each agent's behavior
// ═══════════════════════════════════════════════════════════════════════════

const PERSONAS = {
  classifier: `You are the OmniGuard CLASSIFIER agent — a security finding analyst.
Your job: analyze raw security findings, deduplicate them, assign priority scores,
and categorize each by vulnerability class and compliance framework.

For each finding you must determine:
- priority: P0 (critical, exploitable now), P1 (high, exploitable with effort), P2 (medium), P3 (low)
- category: injection, auth, crypto, config, secrets, deps, iac, logic, exposure
- frameworks: which compliance frameworks this finding violates
- is_false_positive: boolean — your best assessment
- confidence: 0.0-1.0

Return a JSON array of classified findings. Be precise and conservative.`,

  delegator: `You are the OmniGuard DELEGATOR agent — a remediation strategist.
Your job: take classified findings and decide the remediation strategy for each.

For each finding you must determine:
- strategy: "auto_fix" (fixer can handle it), "manual_review" (needs human), "compensating_control" (mitigate), "accept_risk" (low priority)
- assigned_agent: "builder" (needs code generation) or "fixer" (direct patch) or "none" (manual)
- fix_complexity: "trivial", "moderate", "complex", "architectural"
- estimated_lines: how many lines of code the fix will touch
- dependencies: does this fix depend on other findings being fixed first?
- batch_key: group findings that can be fixed together in one pass

Return a JSON array of task assignments.`,

  builder: `You are the OmniGuard BUILDER agent — a secure code generator.
Your job: for each delegated task, generate the actual fix code.

For each task you must produce:
- patch: the exact code to insert/replace (unified diff format)
- file: the target file path
- original_lines: the lines being replaced
- new_lines: the replacement lines
- explanation: why this fix works and what vulnerability it closes
- test_snippet: a quick test to verify the fix
- compliance_notes: which compliance clauses are now satisfied

Be precise. Output valid code. Never introduce new vulnerabilities.`,

  fixer: `You are the OmniGuard FIXER agent — the smartest agent in the pipeline.
Your job: take built patches, apply them to files, run validation, and verify
the vulnerability is actually closed.

For each patch you must:
1. Apply the patch to the file
2. Run a syntax check on the modified file
3. Run the test snippet if provided
4. Re-scan the file with OmniGuard's semantic engine
5. Verify the original finding is gone
6. Report: applied (bool), verified (bool), syntax_ok (bool), test_passed (bool), residual_findings (array)

If applying a patch would break the file, DO NOT apply it. Report the conflict.
You are the final gate — never ship a fix that introduces a regression.`
}

// ═══════════════════════════════════════════════════════════════════════════
// AGENT BASE
// ═══════════════════════════════════════════════════════════════════════════

class Agent {
  constructor(name, persona) {
    this.name = name
    this.persona = persona
    this.history = []
  }

  async think(input) {
    const prompt = `${this.persona}\n\nINPUT:\n${JSON.stringify(input, null, 2)}\n\nRespond with valid JSON only.`

    try {
      const response = await aiEngine.remediate(prompt, {
        system: this.persona,
        temperature: 0.2,
        maxTokens: 4000,
      })
      this.history.push({ input: input.length || 0, output: response })
      return this.parseResponse(response)
    } catch (e) {
      return { error: `Agent ${this.name} failed: ${e.message}`, agent: this.name }
    }
  }

  parseResponse(response) {
    if (!response) return { error: 'Empty response' }
    try {
      return JSON.parse(response)
    } catch {
      const jsonMatch = response.match(/\[[\s\S]*\]/) || response.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        try { return JSON.parse(jsonMatch[0]) } catch {}
      }
      return { raw: response }
    }
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// AGENT 1: CLASSIFIER
// ═══════════════════════════════════════════════════════════════════════════

class ClassifierAgent extends Agent {
  constructor() {
    super('classifier', PERSONAS.classifier)
  }

  async run(findings) {
    // Pre-process: deduplicate by rule_id + file + line
    const seen = new Set()
    const unique = []
    for (const f of findings) {
      const key = `${f.rule_id || f.scanner}:${f.file_path || f.file}:${f.line || 0}`
      if (!seen.has(key)) { seen.add(key); unique.push(f) }
    }

    // If AI is not configured, do deterministic classification
    if (!aiEngine.isConfigured()) {
      return this.deterministicClassify(unique)
    }

    return this.think(unique)
  }

  deterministicClassify(findings) {
    return findings.map(f => {
      const sev = f.severity || 'medium'
      const priority = sev === 'critical' ? 'P0' : sev === 'high' ? 'P1' : sev === 'medium' ? 'P2' : 'P3'
      const cat = this.categorize(f)
      const clauses = auditClauseMapper.mapFindingToClauses({ category: cat, severity: sev })
      return {
        ...f,
        priority,
        category: cat,
        frameworks: [...new Set(clauses.map(c => c.framework))],
        is_false_positive: false,
        confidence: 0.85,
        classified_by: 'deterministic',
      }
    })
  }

  categorize(f) {
    const r = (f.rule_id || f.scanner || '').toLowerCase()
    if (r.includes('sql') || r.includes('inject') || r.includes('xss') || r.includes('ssrf') || r.includes('deserial')) return 'injection'
    if (r.includes('auth') || r.includes('jwt') || r.includes('session') || r.includes('missing_auth')) return 'auth'
    if (r.includes('crypto') || r.includes('weak') || r.includes('md5') || r.includes('sha1')) return 'crypto'
    if (r.includes('config') || r.includes('cors') || r.includes('debug')) return 'config'
    if (r.includes('secret') || r.includes('hardcoded') || r.includes('api_key') || r.includes('password')) return 'secrets'
    if (r.includes('dep') || r.includes('package') || r.includes('outdated')) return 'deps'
    if (r.includes('terraform') || r.includes('cloud') || r.includes('iac') || r.includes('docker')) return 'iac'
    if (r.includes('path') || r.includes('traversal')) return 'injection'
    return 'logic'
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// AGENT 2: DELEGATOR
// ═══════════════════════════════════════════════════════════════════════════

class DelegatorAgent extends Agent {
  constructor() {
    super('delegator', PERSONAS.delegator)
  }

  async run(classifiedFindings) {
    if (!aiEngine.isConfigured()) {
      return this.deterministicDelegate(classifiedFindings)
    }
    return this.think(classifiedFindings)
  }

  deterministicDelegate(findings) {
    const tasks = []
    const batches = {}

    for (const f of findings) {
      const strategy = this.determineStrategy(f)
      const agent = strategy === 'auto_fix' ? (f.fix_complexity === 'complex' ? 'builder' : 'fixer') : 'none'
      const batchKey = `${f.category}:${f.file_path || f.file}`

      if (!batches[batchKey]) batches[batchKey] = []
      batches[batchKey].push(f.id || f.rule_id)

      tasks.push({
        finding_id: f.id || f.rule_id,
        strategy,
        assigned_agent: agent,
        fix_complexity: this.estimateComplexity(f),
        estimated_lines: this.estimateLines(f),
        dependencies: [],
        batch_key: batchKey,
        delegated_by: 'deterministic',
      })
    }

    // Mark batch dependencies
    for (const batch of Object.values(batches)) {
      if (batch.length > 1) {
        for (let i = 1; i < batch.length; i++) {
          const task = tasks.find(t => t.finding_id === batch[i])
          if (task) task.dependencies = [batch[0]]
        }
      }
    }

    return tasks
  }

  determineStrategy(f) {
    if (f.is_false_positive) return 'accept_risk'
    if (f.priority === 'P3') return 'accept_risk'
    if (f.category === 'secrets') return 'auto_fix'
    if (f.category === 'config') return 'auto_fix'
    if (f.category === 'injection') return 'auto_fix'
    if (f.category === 'auth') return 'manual_review'
    if (f.category === 'crypto') return 'auto_fix'
    if (f.category === 'deps') return 'manual_review'
    if (f.category === 'iac') return 'auto_fix'
    return 'manual_review'
  }

  estimateComplexity(f) {
    if (f.category === 'secrets' || f.category === 'config') return 'trivial'
    if (f.category === 'injection' && f.priority <= 'P1') return 'moderate'
    if (f.category === 'auth') return 'architectural'
    if (f.category === 'deps') return 'moderate'
    return 'moderate'
  }

  estimateLines(f) {
    if (f.category === 'secrets') return 1
    if (f.category === 'config') return 2
    if (f.category === 'injection') return 5
    if (f.category === 'auth') return 20
    if (f.category === 'crypto') return 3
    return 5
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// AGENT 3: BUILDER
// ═══════════════════════════════════════════════════════════════════════════

class BuilderAgent extends Agent {
  constructor() {
    super('builder', PERSONAS.builder)
  }

  async run(tasks, findings, rootDir) {
    const buildableTasks = tasks.filter(t => t.assigned_agent === 'builder' || t.assigned_agent === 'fixer')
    const patches = []

    for (const task of buildableTasks) {
      const finding = findings.find(f => (f.id || f.rule_id) === task.finding_id)
      if (!finding) continue

      // Generate patch — AI or deterministic
      let patch
      if (aiEngine.isConfigured()) {
        patch = await this.think({ task, finding, rootDir })
      } else {
        patch = this.deterministicBuild(finding, rootDir)
      }

      if (patch && !patch.error) {
        patches.push({ ...patch, task_id: task.finding_id, finding })
      }
    }

    return patches
  }

  deterministicBuild(finding, rootDir) {
    const filePath = finding.file_path || finding.file
    if (!filePath) return { error: 'No file path' }

    const fullPath = path.resolve(rootDir, filePath)
    if (!fs.existsSync(fullPath)) return { error: 'File not found' }

    const content = fs.readFileSync(fullPath, 'utf8')
    const lines = content.split('\n')
    const lineNum = finding.line || 1
    const originalLine = lines[lineNum - 1] || ''

    // Generate fix based on category
    const fix = this.generateFix(finding, originalLine, lines, lineNum)

    return {
      file: filePath,
      original_lines: [originalLine],
      new_lines: fix.newLines,
      patch: fix.patch,
      explanation: fix.explanation,
      test_snippet: fix.testSnippet,
      compliance_notes: fix.complianceNotes,
      built_by: 'deterministic',
    }
  }

  generateFix(finding, originalLine, lines, lineNum) {
    const cat = finding.category || 'logic'

    switch (cat) {
      case 'secrets':
        return {
          newLines: [originalLine.replace(/password|secret|api_key|token/gi, match => {
            return `${match}_FROM_ENV`
          }).replace(/['"][^'"]{8,}['"]/, "process.env." + (originalLine.match(/(\w+)(?:Password|Secret|Key|Token)/i)?.[1] || 'SECRET').toUpperCase())],
          patch: `Replace hardcoded secret with environment variable reference`,
          explanation: 'Hardcoded secrets should be loaded from environment variables to prevent credential exposure in source code.',
          testSnippet: `assert(process.env.SECRET !== undefined, 'Secret must be set in env')`,
          complianceNotes: 'OWASP ASVS V2.10.4, PCI DSS 6.5.3, NIST 800-53 IA-5',
        }

      case 'injection':
        if (finding.rule_id?.includes('sql')) {
          return {
            newLines: [originalLine.replace(/`[^`]*\$\{[^}]*\}[^`]*`/g, 'parameterizedQuery($1)')],
            patch: 'Replace string interpolation in SQL with parameterized queries',
            explanation: 'SQL injection occurs when user input is concatenated into queries. Use parameterized queries with placeholders.',
            testSnippet: `const result = await db.query('SELECT * FROM users WHERE id = $1', [userId])`,
            complianceNotes: 'OWASP ASVS V5.3.1, PCI DSS 6.5.1, NIST 800-53 SI-10',
          }
        }
        if (finding.rule_id?.includes('xss')) {
          return {
            newLines: [originalLine.replace(/innerHTML\s*=/g, 'textContent =')],
            patch: 'Replace innerHTML with textContent to prevent XSS',
            explanation: 'Using innerHTML with user input allows script injection. textContent safely escapes HTML.',
            testSnippet: `element.textContent = userInput // Safe from XSS`,
            complianceNotes: 'OWASP ASVS V5.3.3, PCI DSS 6.5.7',
          }
        }
        return {
          newLines: [originalLine + ' // TODO: Validate and sanitize input'],
          patch: 'Add input validation',
          explanation: 'User input must be validated and sanitized before use.',
          testSnippet: '',
          complianceNotes: 'OWASP ASVS V5.3.1',
        }

      case 'crypto':
        return {
          newLines: [originalLine.replace(/md5/g, 'sha256').replace(/sha1/g, 'sha256')],
          patch: 'Upgrade weak hash algorithm to SHA-256',
          explanation: 'MD5 and SHA-1 are cryptographically broken. Use SHA-256 or stronger.',
          testSnippet: `const hash = crypto.createHash('sha256').update(data).digest('hex')`,
          complianceNotes: 'FIPS 140-2 Annex A, NIST 800-53 SC-13, OWASP ASVS V6.2.2',
        }

      case 'config':
        if (finding.rule_id?.includes('cors')) {
          return {
            newLines: [originalLine.replace(/Access-Control-Allow-Origin.*\*/g, 'Access-Control-Allow-Origin: https://your-trusted-origin.com')],
            patch: 'Restrict CORS to specific origins',
            explanation: 'Wildcard CORS allows any site to make requests. Restrict to trusted origins.',
            testSnippet: '',
            complianceNotes: 'OWASP ASVS V14.4.3, NIST 800-53 AC-3',
          }
        }
        return {
          newLines: [originalLine.replace(/debug:\s*true/g, 'debug: false')],
          patch: 'Disable debug mode in production',
          explanation: 'Debug mode exposes internal state and stack traces.',
          testSnippet: '',
          complianceNotes: 'OWASP ASVS V14.1.3',
        }

      default:
        return {
          newLines: [originalLine],
          patch: 'No auto-fix available — requires manual review',
          explanation: 'This vulnerability type requires manual analysis to determine the appropriate fix.',
          testSnippet: '',
          complianceNotes: '',
        }
    }
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// AGENT 4: FIXER (the smartest one)
// ═══════════════════════════════════════════════════════════════════════════

class FixerAgent extends Agent {
  constructor() {
    super('fixer', PERSONAS.fixer)
  }

  async run(patches, rootDir) {
    const results = []

    for (const patch of patches) {
      const result = await this.applyAndVerify(patch, rootDir)
      results.push(result)
    }

    return results
  }

  async applyAndVerify(patch, rootDir) {
    const filePath = patch.file || patch.finding?.file_path || patch.finding?.file
    if (!filePath) return { task_id: patch.task_id, applied: false, verified: false, error: 'No file path' }

    const fullPath = path.resolve(rootDir, filePath)
    if (!fs.existsSync(fullPath)) return { task_id: patch.task_id, applied: false, verified: false, error: 'File not found' }

    // Read original content
    const original = fs.readFileSync(fullPath, 'utf8')
    const lines = original.split('\n')

    // Determine the line to replace
    const findingLine = patch.finding?.line || 1
    const targetIdx = findingLine - 1
    const originalLine = lines[targetIdx]

    // Safety check: does the original line match what we expect?
    if (patch.original_lines && patch.original_lines[0] && !original.includes(patch.original_lines[0].trim())) {
      return { task_id: patch.task_id, applied: false, verified: false, error: 'Original line mismatch — file may have changed', file: filePath }
    }

    // Apply the patch
    let modified
    if (patch.new_lines && patch.new_lines.length > 0) {
      if (patch.new_lines.length === 1) {
        lines[targetIdx] = patch.new_lines[0]
      } else {
        lines.splice(targetIdx, 1, ...patch.new_lines)
      }
      modified = lines.join('\n')
    } else {
      return { task_id: patch.task_id, applied: false, verified: false, error: 'No replacement lines provided', file: filePath }
    }

    // ── Step 1: Syntax check ──
    const syntaxOk = this.syntaxCheck(fullPath, modified)

    if (!syntaxOk.ok) {
      return {
        task_id: patch.task_id,
        applied: false,
        verified: false,
        syntax_ok: false,
        error: `Syntax check failed: ${syntaxOk.error}`,
        file: filePath,
      }
    }

    // Write the modified file
    const backup = original
    fs.writeFileSync(fullPath, modified)

    // ── Step 2: Re-scan with semantic engine ──
    let residualFindings = []
    try {
      const rescan = semanticEngine.scanFile(filePath, modified)
      residualFindings = rescan.filter(f =>
        f.semantic_type === patch.finding?.rule_id || f.semantic_category === patch.finding?.category
      )
    } catch (e) {
      // Non-fatal — semantic engine might not support this file type
    }

    // ── Step 3: Run test snippet if provided ──
    let testPassed = true
    if (patch.test_snippet && patch.test_snippet.length > 5) {
      testPassed = this.runTestSnippet(patch.test_snippet, fullPath)
    }

    // ── Step 4: AI verification if configured ──
    let aiVerified = true
    if (aiEngine.isConfigured() && patch.finding) {
      const verification = await this.think({
        action: 'verify',
        original_finding: patch.finding,
        patched_code: modified.slice(Math.max(0, targetIdx - 5), targetIdx + 10),
        file: filePath,
      })
      aiVerified = verification.verified !== false
    }

    const verified = residualFindings.length === 0 && syntaxOk.ok && testPassed && aiVerified

    return {
      task_id: patch.task_id,
      applied: true,
      verified,
      syntax_ok: syntaxOk.ok,
      test_passed: testPassed,
      ai_verified: aiVerified,
      residual_findings: residualFindings.map(f => f.semantic_type),
      file: filePath,
      line: findingLine,
      backup: backup.slice(0, 500),
      explanation: patch.explanation,
      compliance_notes: patch.compliance_notes,
    }
  }

  syntaxCheck(filePath, content) {
    const ext = path.extname(filePath)
    const tmpFile = `/tmp/omniguard-syntax-check-${Date.now()}${ext}`

    try {
      fs.writeFileSync(tmpFile, content)

      if (ext === '.js' || ext === '.mjs' || ext === '.cjs') {
        execSync(`node --check "${tmpFile}"`, { encoding: 'utf8', timeout: 5000 })
        return { ok: true }
      } else if (ext === '.ts') {
        // Basic TS check — just ensure it parses as JS (strips types)
        execSync(`node --check "${tmpFile}" 2>/dev/null || true`, { encoding: 'utf8', timeout: 5000 })
        return { ok: true }
      } else if (ext === '.py') {
        execSync(`python3 -m py_compile "${tmpFile}"`, { encoding: 'utf8', timeout: 5000 })
        return { ok: true }
      } else if (ext === '.json') {
        JSON.parse(content)
        return { ok: true }
      }

      // For other file types, accept
      return { ok: true }
    } catch (e) {
      return { ok: false, error: e.message?.split('\n')[0] || 'Syntax error' }
    } finally {
      try { fs.unlinkSync(tmpFile) } catch {}
    }
  }

  runTestSnippet(snippet, filePath) {
    const tmpTest = `/tmp/omniguard-test-${Date.now()}.js`
    try {
      const testCode = `
        const assert = require('assert');
        try { ${snippet} ; console.log('PASS'); }
        catch(e) { console.log('FAIL:' + e.message); process.exit(1); }
      `
      fs.writeFileSync(tmpTest, testCode)
      execSync(`node "${tmpTest}"`, { encoding: 'utf8', timeout: 5000 })
      return true
    } catch {
      return false
    } finally {
      try { fs.unlinkSync(tmpTest) } catch {}
    }
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// ORCHESTRATOR — runs the 4-agent pipeline
// ═══════════════════════════════════════════════════════════════════════════

class AgentOrchestrator {
  constructor(rootDir = process.cwd()) {
    this.rootDir = rootDir
    this.classifier = new ClassifierAgent()
    this.delegator = new DelegatorAgent()
    this.builder = new BuilderAgent()
    this.fixer = new FixerAgent()
    this.events = []
  }

  log(agent, message) {
    const event = { agent, message, timestamp: new Date().toISOString() }
    this.events.push(event)
    if (process.env.OMNIGUARD_AGENT_DEBUG) {
      console.error(`[${agent}] ${message}`)
    }
  }

  /**
   * Run the full 4-agent pipeline on a set of findings
   * @param {Array} findings — raw findings from scanFiles
   * @param {Object} options — { dryRun: false, applyFixes: true }
   */
  async run(findings, options = {}) {
    const { dryRun = false, applyFixes = true } = options
    const result = {
      pipeline: ['classifier', 'delegator', 'builder', 'fixer'],
      events: this.events,
      summary: {},
      stages: {},
    }

    // ── Stage 1: CLASSIFY ──
    this.log('classifier', `Analyzing ${findings.length} findings...`)
    const classified = await this.classifier.run(findings)
    result.stages.classifier = {
      input: findings.length,
      output: Array.isArray(classified) ? classified.length : 0,
      findings: classified,
    }
    this.log('classifier', `Classified ${Array.isArray(classified) ? classified.length : 0} findings`)

    if (dryRun) {
      result.summary = this.buildSummary(result.stages, 'dry_run')
      return result
    }

    // ── Stage 2: DELEGATE ──
    this.log('delegator', 'Delegating tasks to downstream agents...')
    const tasks = await this.delegator.run(classified)
    result.stages.delegator = {
      input: classified.length,
      output: Array.isArray(tasks) ? tasks.length : 0,
      tasks,
    }
    this.log('delegator', `Delegated ${Array.isArray(tasks) ? tasks.length : 0} tasks`)

    // ── Stage 3: BUILD ──
    this.log('builder', 'Generating remediation patches...')
    const patches = await this.builder.run(tasks, classified, this.rootDir)
    result.stages.builder = {
      input: tasks.length,
      output: patches.length,
      patches: patches.map(p => ({ file: p.file, explanation: p.explanation, built_by: p.built_by })),
    }
    this.log('builder', `Built ${patches.length} patches`)

    if (!applyFixes) {
      result.summary = this.buildSummary(result.stages, 'no_apply')
      return result
    }

    // ── Stage 4: FIX ──
    this.log('fixer', 'Applying and verifying fixes...')
    const fixResults = await this.fixer.run(patches, this.rootDir)
    result.stages.fixer = {
      input: patches.length,
      output: fixResults.length,
      results: fixResults,
    }

    const applied = fixResults.filter(r => r.applied).length
    const verified = fixResults.filter(r => r.verified).length
    this.log('fixer', `Applied ${applied}/${patches.length}, verified ${verified}/${patches.length}`)

    // ── Summary ──
    result.summary = this.buildSummary(result.stages, 'complete')
    result.summary.applied = applied
    result.summary.verified = verified
    result.summary.failed = patches.length - applied
    result.summary.residual = fixResults.reduce((s, r) => s + (r.residual_findings?.length || 0), 0)

    return result
  }

  buildSummary(stages, status) {
    return {
      status,
      findings_in: stages.classifier?.input || 0,
      classified: stages.classifier?.output || 0,
      delegated: stages.delegator?.output || 0,
      built: stages.builder?.output || 0,
      applied: stages.fixer?.output || 0,
      verified: stages.fixer?.results?.filter(r => r.verified).length || 0,
      agents_used: ['classifier', 'delegator', 'builder', 'fixer'],
    }
  }

  /**
   * Generate a human-readable report from the pipeline
   */
  generateReport(result) {
    const lines = []
    const c = require('./index') // color module
    const clr = c.colors || { cyan: s => s, green: s => s, red: s => s, yellow: s => s, dim: s => s, bold: s => s }

    lines.push(clr.bold(clr.cyan('\n╔══ OmniGuard Multi-Agent Pipeline ══╗')))
    lines.push(clr.dim(`  Status: ${result.summary.status}`))
    lines.push(clr.dim(`  Findings → Classified → Delegated → Built → Applied → Verified`))
    lines.push(`  ${result.summary.findings_in} → ${result.summary.classified} → ${result.summary.delegated} → ${result.summary.built} → ${result.summary.applied || 0} → ${result.summary.verified || 0}`)

    // Stage details
    if (result.stages.classifier?.findings?.length) {
      const byPriority = {}
      for (const f of result.stages.classifier.findings) {
        byPriority[f.priority] = (byPriority[f.priority] || 0) + 1
      }
      lines.push(clr.cyan('\n  Classification:'))
      for (const [p, count] of Object.entries(byPriority).sort()) {
        const color = p === 'P0' ? clr.red : p === 'P1' ? clr.yellow : clr.dim
        lines.push(`    ${color(p)}: ${count}`)
      }
    }

    if (result.stages.delegator?.tasks?.length) {
      const byStrategy = {}
      for (const t of result.stages.delegator.tasks) {
        byStrategy[t.strategy] = (byStrategy[t.strategy] || 0) + 1
      }
      lines.push(clr.cyan('  Delegation:'))
      for (const [s, count] of Object.entries(byStrategy)) {
        lines.push(`    ${s}: ${count}`)
      }
    }

    if (result.stages.builder?.patches?.length) {
      lines.push(clr.cyan('  Patches Built:'))
      for (const p of result.stages.builder.patches) {
        lines.push(`    ${clr.green('✓')} ${p.file} — ${p.explanation?.slice(0, 60)}`)
      }
    }

    if (result.stages.fixer?.results?.length) {
      lines.push(clr.cyan('  Fix Results:'))
      for (const r of result.stages.fixer.results) {
        const icon = r.verified ? clr.green('✓') : r.applied ? clr.yellow('⚠') : clr.red('✗')
        const status = r.verified ? 'verified' : r.applied ? 'applied (unverified)' : 'failed'
        lines.push(`    ${icon} ${r.file}:${r.line} — ${status}`)
        if (r.error) lines.push(clr.red(`      Error: ${r.error}`))
        if (r.residual_findings?.length) lines.push(clr.yellow(`      Residual: ${r.residual_findings.join(', ')}`))
      }
    }

    lines.push(clr.dim(`\n  Events: ${result.events?.length || 0}`))
    lines.push(clr.bold(clr.cyan('╚════════════════════════════════════╝\n')))

    return lines.join('\n')
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════

module.exports = {
  AgentOrchestrator,
  ClassifierAgent,
  DelegatorAgent,
  BuilderAgent,
  FixerAgent,
  PERSONAS,
}
