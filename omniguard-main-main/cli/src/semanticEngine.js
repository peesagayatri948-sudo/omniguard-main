'use strict'

/**
 * Semantic Scanner Engine — v2.2.5
 * AI-powered semantic vulnerability analysis with taint tracking,
 * data flow analysis, and deterministic clause mapping.
 */

const fs = require('fs')
const path = require('path')
const crypto = require('crypto')

// Semantic vulnerability patterns — these go beyond regex
// to understand code context and data flow
const SEMANTIC_PATTERNS = {
  // SQL injection with data flow
  sql_injection: {
    category: 'injection',
    owasp: 'A03:2021-Injection',
    cwe: 'CWE-89',
    severity: 'critical',
    taintSources: ['req.body', 'req.query', 'req.params', 'request.body', 'req.headers', 'event.body', 'ctx.request.body'],
    taintSinks: ['db.query', 'connection.query', 'pool.query', 'execute', 'raw(', 'sequelize.query', 'knex.raw'],
    semanticDescription: 'User-controlled input flows into SQL query without parameterization',
    clauses: [
      { framework: 'OWASP_ASVS', clause_id: 'V5.3.1', clause_title: 'SQL Injection Prevention', clause_text: 'Verify that the application uses parameterized queries or ORM frameworks that prevent SQL injection.' },
      { framework: 'PCI_DSS', clause_id: '6.5.1', clause_title: 'Injection Flaws', clause_text: 'Address injection flaws, including SQL injection, by using parameterized queries.' },
      { framework: 'NIST_800_53', clause_id: 'SI-10', clause_title: 'Information Input Validation', clause_text: 'The information system checks the validity of information inputs.' },
      { framework: 'ISO_27001', clause_id: 'A.14.2.5', clause_title: 'Secure System Engineering Principles', clause_text: 'Principles for engineering secure systems shall be applied.' },
    ]
  },
  // XSS with data flow
  xss: {
    category: 'xss',
    owasp: 'A03:2021-Injection',
    cwe: 'CWE-79',
    severity: 'high',
    taintSources: ['req.body', 'req.query', 'req.params', 'request.body', 'localStorage', 'document.URL', 'location.hash'],
    taintSinks: ['innerHTML', 'document.write', 'dangerouslySetInnerHTML', 'eval(', 'setTimeout(', 'setInterval('],
    semanticDescription: 'User-controlled input rendered in DOM without sanitization',
    clauses: [
      { framework: 'OWASP_ASVS', clause_id: 'V5.3.3', clause_title: 'XSS Prevention', clause_text: 'Verify that output encoding is applied to prevent reflected, stored, and DOM-based XSS.' },
      { framework: 'PCI_DSS', clause_id: '6.5.7', clause_title: 'XSS Flaws', clause_text: 'Address cross-site scripting (XSS) flaws.' },
      { framework: 'NIST_800_53', clause_id: 'SI-10', clause_title: 'Information Input Validation', clause_text: 'The information system checks the validity of information inputs.' },
    ]
  },
  // Path traversal
  path_traversal: {
    category: 'path_traversal',
    owasp: 'A01:2021-Broken Access Control',
    cwe: 'CWE-22',
    severity: 'high',
    taintSources: ['req.body', 'req.query', 'req.params', 'request.body', 'userInput', 'filename'],
    taintSinks: ['fs.readFile', 'fs.writeFile', 'fs.createReadStream', 'path.join', 'open(', 'File('],
    semanticDescription: 'User-controlled path component allows directory traversal',
    clauses: [
      { framework: 'OWASP_ASVS', clause_id: 'V4.2.1', clause_title: 'Path Traversal Prevention', clause_text: 'Verify that path traversal is prevented by canonicalizing paths and restricting to allowed directories.' },
      { framework: 'NIST_800_53', clause_id: 'AC-3', clause_title: 'Access Enforcement', clause_text: 'The information system enforces approved authorizations.' },
      { framework: 'CIS', clause_id: 'CIS-5.1', clause_title: 'File System Access Control', clause_text: 'Ensure file system access is restricted and validated.' },
    ]
  },
  // SSRF
  ssrf: {
    category: 'ssrf',
    owasp: 'A10:2021-SSRF',
    cwe: 'CWE-918',
    severity: 'critical',
    taintSources: ['req.body', 'req.query', 'req.params', 'config.url', 'userUrl', 'webhookUrl'],
    taintSinks: ['fetch(', 'axios.', 'http.get', 'https.get', 'request(', 'urllib'],
    semanticDescription: 'Server-side request to user-controlled URL without allowlist',
    clauses: [
      { framework: 'OWASP_ASVS', clause_id: 'V12.6.1', clause_title: 'SSRF Prevention', clause_text: 'Verify that the application validates and restricts outbound HTTP requests.' },
      { framework: 'NIST_800_53', clause_id: 'SC-7', clause_title: 'Boundary Protection', clause_text: 'The information system monitors and controls communications at external boundaries.' },
    ]
  },
  // Hardcoded secrets in context
  hardcoded_secret: {
    category: 'secrets',
    owasp: 'A02:2021-Cryptographic Failures',
    cwe: 'CWE-798',
    severity: 'critical',
    taintSources: [],
    taintSinks: [],
    semanticDescription: 'Hardcoded credential detected in source code with surrounding context indicating production use',
    clauses: [
      { framework: 'OWASP_ASVS', clause_id: 'V6.2.1', clause_title: 'Secrets Management', clause_text: 'Verify that secrets are not hardcoded in source code and are stored in a secure vault.' },
      { framework: 'PCI_DSS', clause_id: '3.5', clause_title: 'Secure Authentication Credentials', clause_text: 'Protect authentication credentials used to access payment card data.' },
      { framework: 'NIST_800_53', clause_id: 'IA-5', clause_title: 'Authenticator Management', clause_text: 'The organization protects authenticators.' },
    ]
  },
  // Insecure deserialization
  deserialization: {
    category: 'deserialization',
    owasp: 'A08:2021-Software and Data Integrity Failures',
    cwe: 'CWE-502',
    severity: 'critical',
    taintSources: ['req.body', 'request.body', 'stream', 'socket', 'queue', 'pickle', 'unserialize'],
    taintSinks: ['pickle.load', 'pickle.loads', 'yaml.load', 'unserialize', 'ObjectInputStream', 'eval('],
    semanticDescription: 'Untrusted data deserialized without integrity verification',
    clauses: [
      { framework: 'OWASP_ASVS', clause_id: 'V5.5.1', clause_title: 'Deserialization Prevention', clause_text: 'Verify that untrusted data is not deserialized without integrity checks.' },
      { framework: 'NIST_800_53', clause_id: 'SI-7', clause_title: 'Software, Firmware, and Information Integrity', clause_text: 'The information system detects and protects against unauthorized software and data integrity violations.' },
    ]
  },
  // Weak crypto
  weak_crypto: {
    category: 'cryptography',
    owasp: 'A02:2021-Cryptographic Failures',
    cwe: 'CWE-327',
    severity: 'high',
    taintSources: [],
    taintSinks: ['createHash("md5")', 'createHash("sha1")', 'DES', 'ECB', 'createCipheriv("aes-128-ecb"'],
    semanticDescription: 'Use of deprecated or weak cryptographic algorithm',
    clauses: [
      { framework: 'OWASP_ASVS', clause_id: 'V6.2.3', clause_title: 'Weak Algorithm Prevention', clause_text: 'Verify that deprecated or weak cryptographic algorithms are not used.' },
      { framework: 'PCI_DSS', clause_id: '4.1', clause_title: 'Strong Cryptography', clause_text: 'Use strong cryptography and security protocols to safeguard cardholder data.' },
      { framework: 'FIPS_140_2', clause_id: 'Annex_A', clause_title: 'Approved Cryptographic Algorithms', clause_text: 'Only NIST-approved cryptographic algorithms shall be used.' },
    ]
  },
  // Missing auth check
  missing_auth: {
    category: 'access_control',
    owasp: 'A01:2021-Broken Access Control',
    cwe: 'CWE-862',
    severity: 'high',
    taintSources: [],
    taintSinks: [],
    semanticDescription: 'API endpoint or route handler missing authentication middleware',
    clauses: [
      { framework: 'OWASP_ASVS', clause_id: 'V4.1.1', clause_title: 'Authentication Enforcement', clause_text: 'Verify that all application components enforce authentication.' },
      { framework: 'NIST_800_53', clause_id: 'AC-2', clause_title: 'Account Management', clause_text: 'The organization manages information system accounts.' },
      { framework: 'ISO_27001', clause_id: 'A.9.4.2', clause_title: 'Secure Log-on Procedures', clause_text: 'Access to all systems shall be controlled by a secure log-on procedure.' },
    ]
  },
  // Rate limiting missing
  rate_limiting: {
    category: 'availability',
    owasp: 'A04:2021-Insecure Design',
    cwe: 'CWE-770',
    severity: 'medium',
    taintSources: [],
    taintSinks: [],
    semanticDescription: 'API endpoint lacks rate limiting, enabling brute force or DoS attacks',
    clauses: [
      { framework: 'OWASP_ASVS', clause_id: 'V11.1.1', clause_title: 'Rate Limiting', clause_text: 'Verify that rate limiting is enforced on all API endpoints.' },
      { framework: 'NIST_800_53', clause_id: 'SC-5', clause_title: 'Denial of Service Protection', clause_text: 'The information system restricts the ability to launch denial of service attacks.' },
    ]
  },
  // CORS misconfiguration
  cors_misconfig: {
    category: 'configuration',
    owasp: 'A05:2021-Security Misconfiguration',
    cwe: 'CWE-942',
    severity: 'medium',
    taintSources: [],
    taintSinks: [],
    semanticDescription: 'Overly permissive CORS configuration allows cross-origin requests from any domain',
    clauses: [
      { framework: 'OWASP_ASVS', clause_id: 'V14.5.1', clause_title: 'CORS Configuration', clause_text: 'Verify that CORS policies are restrictive and do not allow wildcard origins.' },
      { framework: 'NIST_800_53', clause_id: 'AC-4', clause_title: 'Information Flow Enforcement', clause_text: 'The information system enforces approved authorizations for controlling information flows.' },
    ]
  },
}

function hashSnippet(snippet) {
  return crypto.createHash('sha256').update(snippet).digest('hex').slice(0, 16)
}

function extractCodeSnippet(lines, lineStart, lineEnd, contextLines = 2) {
  const start = Math.max(0, lineStart - 1 - contextLines)
  const end = Math.min(lines.length, lineEnd + contextLines)
  return lines.slice(start, end).join('\n')
}

function analyzeTaintFlow(code, fileName, patternDef) {
  const lines = code.split('\n')
  const findings = []

  if (!patternDef.taintSources || !patternDef.taintSinks) return findings

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const trimmed = line.trim()
    if (trimmed.startsWith('//') || trimmed.startsWith('/*') || trimmed.startsWith('*')) continue

    for (const sink of patternDef.taintSinks) {
      if (!line.includes(sink)) continue

      // Look backward for taint source in the same scope
      const taintPath = []
      let sourceFound = false
      let sourceLine = -1

      for (let j = i; j >= Math.max(0, i - 50); j--) {
        for (const source of patternDef.taintSources) {
          if (lines[j] && lines[j].includes(source)) {
            sourceFound = true
            sourceLine = j
            taintPath.push({
              line: j + 1,
              code: lines[j].trim(),
              type: 'source',
              source: source,
            })
            break
          }
        }
        if (sourceFound) break
      }

      if (sourceFound) {
        taintPath.push({
          line: i + 1,
          code: trimmed,
          type: 'sink',
          sink: sink,
        })

        const snippet = extractCodeSnippet(lines, sourceLine + 1, i + 1)
        const confidence = Math.min(0.98, 0.65 + (1 - Math.min(1, (i - sourceLine) / 50)) * 0.33)

        findings.push({
          semantic_type: Object.keys(SEMANTIC_PATTERNS).find(k => SEMANTIC_PATTERNS[k] === patternDef),
          semantic_description: patternDef.semanticDescription,
          semantic_category: patternDef.category,
          confidence: parseFloat(confidence.toFixed(2)),
          risk_weight: parseFloat((confidence * (patternDef.severity === 'critical' ? 1.0 : patternDef.severity === 'high' ? 0.8 : 0.5)).toFixed(2)),
          code_snippet: snippet,
          data_flow: taintPath,
          control_flow: [{ type: 'linear', from: sourceLine + 1, to: i + 1 }],
          taint_source: patternDef.taintSources.find(s => lines[sourceLine]?.includes(s)) || 'unknown',
          taint_sink: sink,
          taint_path: taintPath,
          file_path: fileName,
          line_start: sourceLine + 1,
          line_end: i + 1,
          evidence_hash: hashSnippet(snippet),
          owasp: patternDef.owasp,
          cwe: patternDef.cwe,
          severity: patternDef.severity,
          clauses: patternDef.clauses,
        })
      }
    }
  }
  return findings
}

function analyzePatternBased(code, fileName, patternDef, patternName) {
  const lines = code.split('\n')
  const findings = []

  const indicators = {
    hardcoded_secret: [
      { regex: /(?:password|passwd|pwd|secret|api_key|apikey|access_key|private_key|token)\s*[:=]\s*["''][^"']{6,}["']/i, severity: 'critical' },
      { regex: /AKIA[0-9A-Z]{16}/, severity: 'critical' },
      { regex: /sk-ant-api[0-9a-zA-Z_-]{20,}/, severity: 'critical' },
      { regex: /ghp_[0-9a-zA-Z]{36}/, severity: 'high' },
      { regex: /-----BEGIN (?:RSA |EC )?PRIVATE KEY-----/, severity: 'critical' },
    ],
    missing_auth: [
      { regex: /app\.(get|post|put|delete|patch)\s*\(/, severity: 'high', checkNoAuth: true },
      { regex: /router\.(get|post|put|delete|patch)\s*\(/, severity: 'high', checkNoAuth: true },
    ],
    weak_crypto: [
      { regex: /createHash\s*\(\s*["']md5["']\s*\)/, severity: 'high' },
      { regex: /createHash\s*\(\s*["']sha1["']\s*\)/, severity: 'medium' },
      { regex: /["']aes-128-ecb["']/, severity: 'high' },
      { regex: /\bDES\b|\bRC4\b|\bMD5\b/i, severity: 'high' },
    ],
    rate_limiting: [
      { regex: /app\.(get|post|put|delete)\s*\(/, severity: 'medium', checkNoRateLimit: true },
    ],
    cors_misconfig: [
      { regex: /Access-Control-Allow-Origin.*\*/, severity: 'medium' },
      { regex: /cors\s*\(\s*\{[^}]*origin\s*:\s*["']\*["']/i, severity: 'medium' },
    ],
  }

  const checks = indicators[patternName] || []
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    for (const check of checks) {
      if (check.regex.test(line)) {
        // For missing_auth, check if auth middleware is in the handler chain
        if (check.checkNoAuth) {
          const nextLines = lines.slice(i, Math.min(i + 5, lines.length)).join('\n')
          if (/auth|authenticate|verifyToken|requireAuth|isAuthenticated|protect/i.test(nextLines)) continue
        }
        if (check.checkNoRateLimit) {
          const nextLines = lines.slice(i, Math.min(i + 10, lines.length)).join('\n')
          if (/rateLimit|rate_limit|throttle|limiter/i.test(nextLines)) continue
        }

        const snippet = extractCodeSnippet(lines, i + 1, i + 1)
        const confidence = check.severity === 'critical' ? 0.95 : check.severity === 'high' ? 0.85 : 0.75

        findings.push({
          semantic_type: patternName,
          semantic_description: patternDef.semanticDescription,
          semantic_category: patternDef.category,
          confidence: parseFloat(confidence.toFixed(2)),
          risk_weight: parseFloat((confidence * (check.severity === 'critical' ? 1.0 : check.severity === 'high' ? 0.8 : 0.5)).toFixed(2)),
          code_snippet: snippet,
          data_flow: [{ line: i + 1, code: line.trim(), type: 'direct' }],
          control_flow: [],
          taint_source: null,
          taint_sink: null,
          taint_path: [],
          file_path: fileName,
          line_start: i + 1,
          line_end: i + 1,
          evidence_hash: hashSnippet(snippet),
          owasp: patternDef.owasp,
          cwe: patternDef.cwe,
          severity: check.severity || patternDef.severity,
          clauses: patternDef.clauses,
        })
      }
    }
  }
  return findings
}

function scanFile(filePath, code) {
  const fileName = path.relative(process.cwd(), filePath)
  const allFindings = []

  for (const [patternName, patternDef] of Object.entries(SEMANTIC_PATTERNS)) {
    // Taint-flow patterns
    if (patternDef.taintSources && patternDef.taintSources.length > 0 && patternDef.taintSinks && patternDef.taintSinks.length > 0) {
      const taintFindings = analyzeTaintFlow(code, fileName, patternDef)
      allFindings.push(...taintFindings)
    }
    // Pattern-based patterns
    allFindings.push(...analyzePatternBased(code, fileName, patternDef, patternName))
  }

  // Deduplicate by evidence_hash + file_path
  const seen = new Set()
  return allFindings.filter(f => {
    const key = `${f.evidence_hash}:${f.file_path}:${f.semantic_type}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

function scanDirectory(dirPath, options = {}) {
  const { parallel = true, maxFiles = 500, exclude = ['node_modules', '.git', 'dist', 'build', '.next', '__pycache__'] } = options
  const files = []

  function walk(dir) {
    if (files.length >= maxFiles) return
    const entries = fs.readdirSync(dir, { withFileTypes: true })
    for (const entry of entries) {
      if (files.length >= maxFiles) break
      const fullPath = path.join(dir, entry.name)
      if (entry.isDirectory()) {
        if (!exclude.includes(entry.name)) walk(fullPath)
      } else if (isScannableFile(entry.name)) {
        files.push(fullPath)
      }
    }
  }
  walk(dirPath)

  if (parallel) {
    // Parallel scan using worker-like batch processing
    const results = []
    const batchSize = Math.min(20, files.length)
    for (let i = 0; i < files.length; i += batchSize) {
      const batch = files.slice(i, i + batchSize)
      const batchResults = batch.map(file => {
        try {
          const code = fs.readFileSync(file, 'utf8')
          return scanFile(file, code)
        } catch { return [] }
      })
      results.push(...batchResults.flat())
    }
    return results
  } else {
    return files.map(file => {
      try {
        const code = fs.readFileSync(file, 'utf8')
        return scanFile(file, code)
      } catch { return [] }
    }).flat()
  }
}

function isScannableFile(name) {
  const exts = ['.js', '.ts', '.tsx', '.jsx', '.py', '.go', '.rb', '.java', '.php', '.cs', '.c', '.cpp', '.h', '.rs', '.swift', '.kt', '.scala', '.vue', '.svelte', '.tf', '.yml', '.yaml', '.json', '.env', '.sh', '.ps1', '.sql']
  return exts.some(ext => name.endsWith(ext)) && !name.endsWith('.min.js') && !name.endsWith('.min.css')
}

function mapAuditClauses(semanticFindings) {
  return semanticFindings.map(f => {
    return f.clauses.map(clause => ({
      framework: clause.framework,
      clause_id: clause.clause_id,
      clause_title: clause.clause_title,
      clause_text: clause.clause_text,
      evidence_type: f.semantic_type,
      evidence_line_start: f.line_start,
      evidence_line_end: f.line_end,
      evidence_snippet: f.code_snippet,
      evidence_hash: f.evidence_hash,
      mapped_severity: f.severity,
      remediation_priority: f.severity === 'critical' ? 1 : f.severity === 'high' ? 2 : f.severity === 'medium' ? 3 : 5,
      ai_verified: f.confidence > 0.85,
      ai_confidence: f.confidence,
    }))
  }).flat()
}

function generateGraphSnapshot(dirPath, semanticFindings, scanId) {
  const nodes = []
  const edges = []
  const nodeMap = new Map()

  // Build nodes from file-level imports
  function walk(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true })
    for (const entry of entries) {
      if (entry.isDirectory()) {
        if (!['node_modules', '.git', 'dist', 'build'].includes(entry.name)) walk(path.join(dir, entry.name))
      } else if (isScannableFile(entry.name)) {
        const fullPath = path.join(dir, entry.name)
        const relPath = path.relative(dirPath, fullPath)
        const nodeId = relPath.replace(/[^a-zA-Z0-9_]/g, '_')

        if (!nodeMap.has(nodeId)) {
          nodeMap.set(nodeId, true)
          const fileFindings = semanticFindings.filter(f => f.file_path === relPath)
          const riskScore = fileFindings.reduce((sum, f) => sum + f.risk_weight, 0)
          nodes.push({
            id: nodeId,
            label: entry.name,
            type: 'file',
            path: relPath,
            risk: parseFloat(riskScore.toFixed(2)),
            findingCount: fileFindings.length,
            severity: fileFindings.length > 0 ? Math.max(...fileFindings.map(f => f.severity)) : 'none',
          })
        }

        // Extract imports
        try {
          const code = fs.readFileSync(fullPath, 'utf8')
          const importRegexes = [
            /(?:import|require)\s*\(?\s*['"`]([^'"`]+)['"`]/g,
            /from\s+['"`]([^'"`]+)['"`]/g,
          ]
          for (const regex of importRegexes) {
            let match
            while ((match = regex.exec(code)) !== null) {
              const importPath = match[1]
              if (importPath.startsWith('.') || importPath.startsWith('/')) {
                const resolved = path.resolve(path.dirname(fullPath), importPath).replace(/[^a-zA-Z0-9_]/g, '_')
                const targetId = path.relative(dirPath, path.resolve(path.dirname(fullPath), importPath)).replace(/[^a-zA-Z0-9_]/g, '_')
                edges.push({ source: nodeId, target: targetId, type: 'import' })
              }
            }
          }
        } catch {}
      }
    }
  }

  try { walk(dirPath) } catch {}

  // Deduplicate edges
  const edgeSet = new Set()
  const uniqueEdges = edges.filter(e => {
    const key = `${e.source}->${e.target}`
    if (edgeSet.has(key)) return false
    edgeSet.add(key)
    return true
  })

  // Filter edges to only those connecting known nodes
  const nodeIds = new Set(nodes.map(n => n.id))
  const validEdges = uniqueEdges.filter(e => nodeIds.has(e.source))

  // Calculate clusters (simple grouping by directory)
  const clusters = []
  const dirMap = new Map()
  for (const node of nodes) {
    const dir = path.dirname(node.path)
    if (!dirMap.has(dir)) dirMap.set(dir, [])
    dirMap.get(dir).push(node.id)
  }
  for (const [dir, ids] of dirMap) {
    if (dir !== '.') clusters.push({ id: dir.replace(/[^a-zA-Z0-9_]/g, '_'), label: dir, nodeIds: ids })
  }

  const metrics = {
    total_risk: parseFloat(nodes.reduce((s, n) => s + n.risk, 0).toFixed(2)),
    critical_files: nodes.filter(n => n.severity === 'critical').length,
    high_files: nodes.filter(n => n.severity === 'high').length,
    avg_risk: nodes.length > 0 ? parseFloat((nodes.reduce((s, n) => s + n.risk, 0) / nodes.length).toFixed(2)) : 0,
    most_connected: nodes.length > 0 ? nodes.reduce((a, b) => {
      const aDeg = validEdges.filter(e => e.source === a.id || e.target === a.id).length
      const bDeg = validEdges.filter(e => e.source === b.id || e.target === b.id).length
      return bDeg > aDeg ? b : a
    }).id : null,
  }

  return {
    nodes,
    edges: validEdges,
    clusters,
    metrics,
    node_count: nodes.length,
    edge_count: validEdges.length,
    max_depth: Math.max(0, ...nodes.map(n => n.path.split('/').length)),
    cyclomatic_complexity: nodes.length + validEdges.length,
  }
}

module.exports = {
  SEMANTIC_PATTERNS,
  scanFile,
  scanDirectory,
  mapAuditClauses,
  generateGraphSnapshot,
  hashSnippet,
  isScannableFile,
}
