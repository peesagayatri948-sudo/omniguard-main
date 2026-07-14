'use strict'

/**
 * Graph Engine — v2.2.5
 * Architecture graph generation, dependency analysis, and diff tracking.
 */

const fs = require('fs')
const path = require('path')
const crypto = require('crypto')

function fileToNodeId(filePath) {
  return crypto.createHash('md5').update(filePath).digest('hex').slice(0, 12)
}

function scanArchitecture(rootDir, options = {}) {
  const { maxDepth = 50, maxFiles = 1000 } = options
  const nodes = []
  const edges = []
  const seen = new Set()
  const exclude = ['node_modules', '.git', 'dist', 'build', '.next', '__pycache__', '.cache', 'vendor']

  function walk(dir, depth) {
    if (depth > maxDepth || nodes.length > maxFiles) return
    let entries
    try { entries = fs.readdirSync(dir, { withFileTypes: true }) } catch { return }

    for (const entry of entries) {
      if (nodes.length > maxFiles) break
      if (exclude.includes(entry.name)) continue

      const fullPath = path.join(dir, entry.name)
      const relPath = path.relative(rootDir, fullPath)

      if (entry.isDirectory()) {
        walk(fullPath, depth + 1)
      } else if (isCodeFile(entry.name)) {
        const nodeId = fileToNodeId(relPath)
        if (seen.has(nodeId)) continue
        seen.add(nodeId)

        const ext = path.extname(entry.name)
        const nodeType = getNodeType(ext, entry.name)
        const dir_ = path.dirname(relPath)

        let imports = []
        let lineCount = 0
        try {
          const code = fs.readFileSync(fullPath, 'utf8')
          lineCount = code.split('\n').length
          imports = extractImports(code, ext, path.dirname(fullPath))
        } catch {}

        nodes.push({
          id: nodeId,
          label: entry.name,
          type: nodeType,
          path: relPath,
          directory: dir_,
          depth,
          lineCount,
          imports: imports.map(i => i.resolved),
          riskScore: 0,
          findingCount: 0,
          maxSeverity: 'none',
        })

        for (const imp of imports) {
          if (imp.resolved) {
            const targetId = fileToNodeId(imp.resolved)
            edges.push({ source: nodeId, target: targetId, type: imp.type })
          }
        }
      }
    }
  }

  walk(rootDir, 0)

  // Only keep edges where source exists
  const nodeIds = new Set(nodes.map(n => n.id))
  const validEdges = edges.filter(e => nodeIds.has(e.source))

  // Compute in-degree and out-degree
  const inDeg = {}, outDeg = {}
  for (const e of validEdges) {
    outDeg[e.source] = (outDeg[e.source] || 0) + 1
    inDeg[e.target] = (inDeg[e.target] || 0) + 1
  }
  for (const n of nodes) {
    n.inDegree = inDeg[n.id] || 0
    n.outDegree = outDeg[n.id] || 0
  }

  // Build clusters by directory
  const clusters = buildClusters(nodes)

  // Compute metrics
  const metrics = {
    total_nodes: nodes.length,
    total_edges: validEdges.length,
    avg_degree: nodes.length > 0 ? parseFloat((validEdges.length * 2 / nodes.length).toFixed(2)) : 0,
    max_depth: Math.max(0, ...nodes.map(n => n.depth)),
    total_lines: nodes.reduce((s, n) => s + n.lineCount, 0),
    hubs: nodes.filter(n => n.inDegree >= 5).map(n => ({ id: n.id, label: n.label, inDegree: n.inDegree })),
    leaf_count: nodes.filter(n => n.outDegree === 0).length,
    cyclic_edges: detectCycles(nodes, validEdges),
  }

  return { nodes, edges: validEdges, clusters, metrics }
}

function isCodeFile(name) {
  const exts = ['.js', '.ts', '.tsx', '.jsx', '.py', '.go', '.rb', '.java', '.php', '.cs', '.rs', '.swift', '.kt', '.vue', '.svelte']
  return exts.some(e => name.endsWith(e)) && !name.endsWith('.min.js') && !name.endsWith('.test.js') && !name.endsWith('.spec.js')
}

function getNodeType(ext, name) {
  if (name.endsWith('.test.ts') || name.endsWith('.test.js') || name.endsWith('.spec.ts') || name.endsWith('.spec.js')) return 'test'
  if (name === 'index.js' || name === 'index.ts') return 'entry'
  if (name.includes('router') || name.includes('route')) return 'router'
  if (name.includes('controller')) return 'controller'
  if (name.includes('model') || name.includes('schema')) return 'model'
  if (name.includes('middleware')) return 'middleware'
  if (name.includes('config')) return 'config'
  if (name.includes('util') || name.includes('helper') || name.includes('service')) return 'service'
  switch (ext) {
    case '.py': return 'python'
    case '.go': return 'go'
    case '.rb': return 'ruby'
    case '.java': return 'java'
    case '.rs': return 'rust'
    case '.vue': return 'component'
    case '.svelte': return 'component'
    case '.tsx': case '.jsx': return 'component'
    default: return 'module'
  }
}

function extractImports(code, ext, baseDir) {
  const imports = []
  const patterns = {
    '.js': [/(?:const|let|var)\s+.*=\s*require\s*\(\s*['"`]([^'"`]+)['"`]/g, /import\s+.*from\s+['"`]([^'"`]+)['"`]/g, /import\s+['"`]([^'"`]+)['"`]/g],
    '.ts': [/(?:const|let|var)\s+.*=\s*require\s*\(\s*['"`]([^'"`]+)['"`]/g, /import\s+.*from\s+['"`]([^'"`]+)['"`]/g, /import\s+['"`]([^'"`]+)['"`]/g],
    '.tsx': [/(?:const|let|var)\s+.*=\s*require\s*\(\s*['"`]([^'"`]+)['"`]/g, /import\s+.*from\s+['"`]([^'"`]+)['"`]/g],
    '.jsx': [/(?:const|let|var)\s+.*=\s*require\s*\(\s*['"`]([^'"`]+)['"`]/g, /import\s+.*from\s+['"`]([^'"`]+)['"`]/g],
    '.py': [/^import\s+(\S+)/gm, /^from\s+(\S+)\s+import/gm],
    '.go': [/\s*import\s+"([^"]+)"/g, /import\s+\(([^)]+)\)/g],
    '.rb': [/require\s+['"]([^'"]+)['"]/g, /require_relative\s+['"]([^'"]+)['"]/g],
    '.java': [/import\s+([\w.]+);/g],
    '.rs': [/use\s+([\w:]+)/g, /mod\s+(\w+)/g],
    '.vue': [/import\s+.*from\s+['"`]([^'"`]+)['"`]/g],
  }
  const extPatterns = patterns[ext] || patterns['.js']
  for (const pattern of extPatterns) {
    let match
    while ((match = pattern.exec(code)) !== null) {
      const importPath = match[1]
      if (importPath.startsWith('.') || importPath.startsWith('/') || importPath.startsWith('..')) {
        const resolved = resolveImportPath(importPath, baseDir, ext)
        if (resolved) imports.push({ path: importPath, resolved, type: 'local' })
      } else {
        imports.push({ path: importPath, resolved: null, type: 'external' })
      }
    }
  }
  return imports
}

function resolveImportPath(importPath, baseDir, ext) {
  const candidates = [
    path.join(baseDir, importPath),
    path.join(baseDir, importPath + '.js'),
    path.join(baseDir, importPath + '.ts'),
    path.join(baseDir, importPath + '.tsx'),
    path.join(baseDir, importPath + '.jsx'),
    path.join(baseDir, importPath + '.py'),
    path.join(baseDir, importPath + '.go'),
    path.join(baseDir, importPath + '.rb'),
    path.join(baseDir, importPath + '.rs'),
    path.join(baseDir, importPath, 'index.js'),
    path.join(baseDir, importPath, 'index.ts'),
  ]
  for (const c of candidates) {
    if (fs.existsSync(c)) return path.relative(baseDir, c)
  }
  return null
}

function buildClusters(nodes) {
  const dirMap = new Map()
  for (const node of nodes) {
    const dir = node.directory || '.'
    if (!dirMap.has(dir)) dirMap.set(dir, [])
    dirMap.get(dir).push(node.id)
  }
  const clusters = []
  for (const [dir, ids] of dirMap) {
    if (ids.length >= 2) {
      clusters.push({
        id: crypto.createHash('md5').update(dir).digest('hex').slice(0, 8),
        label: dir,
        nodeIds: ids,
        nodeCount: ids.length,
      })
    }
  }
  return clusters
}

function detectCycles(nodes, edges) {
  const adj = {}
  for (const n of nodes) adj[n.id] = []
  for (const e of edges) {
    if (adj[e.source]) adj[e.source].push(e.target)
  }
  let cycleCount = 0
  const visited = new Set()
  const recStack = new Set()

  function dfs(node) {
    visited.add(node)
    recStack.add(node)
    for (const neighbor of (adj[node] || [])) {
      if (!visited.has(neighbor)) {
        dfs(neighbor)
      } else if (recStack.has(neighbor)) {
        cycleCount++
      }
    }
    recStack.delete(node)
  }

  for (const n of nodes) {
    if (!visited.has(n.id)) dfs(n.id)
  }
  return cycleCount
}

function diffSnapshots(prev, current) {
  if (!prev) {
    return {
      added_nodes: current.nodes,
      removed_nodes: [],
      added_edges: current.edges,
      removed_edges: [],
      risk_delta: 0,
      is_first_snapshot: true,
    }
  }

  const prevNodeIds = new Set(prev.nodes.map(n => n.id))
  const currNodeIds = new Set(current.nodes.map(n => n.id))

  const added_nodes = current.nodes.filter(n => !prevNodeIds.has(n.id))
  const removed_nodes = prev.nodes.filter(n => !currNodeIds.has(n.id))

  const prevEdgeKeys = new Set(prev.edges.map(e => `${e.source}->${e.target}`))
  const currEdgeKeys = new Set(current.edges.map(e => `${e.source}->${e.target}`))

  const added_edges = current.edges.filter(e => !prevEdgeKeys.has(`${e.source}->${e.target}`))
  const removed_edges = prev.edges.filter(e => !currEdgeKeys.has(`${e.source}->${e.target}`))

  const prevRisk = (prev.metrics?.total_risk) || 0
  const currRisk = (current.metrics?.total_risk) || 0

  return {
    added_nodes: added_nodes.map(n => ({ id: n.id, label: n.label, path: n.path, type: n.type })),
    removed_nodes: removed_nodes.map(n => ({ id: n.id, label: n.label, path: n.path, type: n.type })),
    added_edges: added_edges.map(e => ({ source: e.source, target: e.target, type: e.type })),
    removed_edges: removed_edges.map(e => ({ source: e.source, target: e.target, type: e.type })),
    risk_delta: parseFloat((currRisk - prevRisk).toFixed(2)),
    is_first_snapshot: false,
  }
}

function generateReport(snapshot, format = 'json') {
  if (format === 'dot') {
    let dot = 'digraph architecture {\n'
    dot += '  rankdir=LR;\n  node [shape=box, style=filled];\n'
    for (const n of snapshot.nodes) {
      const color = n.riskScore > 5 ? '#ff6b6b' : n.riskScore > 2 ? '#ffd93d' : '#d3f9d3'
      dot += `  "${n.id}" [label="${n.label}", fillcolor="${color}"];\n`
    }
    for (const e of snapshot.edges) {
      dot += `  "${e.source}" -> "${e.target}";\n`
    }
    dot += '}\n'
    return dot
  }
  if (format === 'mermaid') {
    let m = 'graph TD\n'
    for (const n of snapshot.nodes) {
      const risk = n.riskScore > 5 ? '🔥' : n.riskScore > 2 ? '⚠️' : '✅'
      m += `  ${n.id}["${risk} ${n.label}"]\n`
    }
    for (const e of snapshot.edges) {
      m += `  ${e.source} --> ${e.target}\n`
    }
    return m
  }
  return JSON.stringify(snapshot, null, 2)
}

module.exports = {
  scanArchitecture,
  diffSnapshots,
  generateReport,
  fileToNodeId,
  isCodeFile,
}
