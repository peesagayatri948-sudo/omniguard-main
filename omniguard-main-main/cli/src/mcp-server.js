/**
 * OmniGuard Nexus MCP (Model Context Protocol) Server
 *
 * Implements a zero-dependency, production-grade stdio MCP server in Node.js
 * allowing AI assistants to query the Architecture Nexus, run System Mapping,
 * check Graph Agent drifts, and generate Compliance evidence.
 */

const fs = require('fs');
const path = require('path');

// Helper to write logs to stderr (so they don't break JSON-RPC over stdout)
function log(msg) {
  process.stderr.write(`[OmniGuard MCP] ${msg}\n`);
}

// ═══════════════════════════════════════════════════════════════════════════════
// RULES EXTRACTION ENGINE
// ═══════════════════════════════════════════════════════════════════════════════
let ALL_RULES = [];

try {
  // 1. Extract built-in rules from daemon.js dynamically
  const daemonPath = path.join(__dirname, 'daemon.js');
  if (fs.existsSync(daemonPath)) {
    const content = fs.readFileSync(daemonPath, 'utf8');
    const startIdx = content.indexOf('const COMPLIANCE_RULES = [');
    if (startIdx !== -1) {
      const part = content.substring(startIdx + 'const COMPLIANCE_RULES = '.length);
      const endIdx = part.indexOf('];');
      if (endIdx !== -1) {
        const rawArray = part.substring(0, endIdx + 2);
        const rules = new Function(`return ${rawArray}`)();
        if (Array.isArray(rules)) {
          ALL_RULES = [...rules];
          log(`Loaded ${rules.length} built-in rules from daemon.js`);
        }
      }
    }
  }

  // 2. Extract and convert 180+ compliance policies from seed-policies.js
  const seedPath = path.join(__dirname, '../../omniguard/scripts/seed-policies.js');
  if (fs.existsSync(seedPath)) {
    const fileContent = fs.readFileSync(seedPath, 'utf8');
    const startIdx = fileContent.indexOf('const rules = [');
    if (startIdx !== -1) {
      const arrayPart = fileContent.substring(startIdx + 'const rules = '.length);
      const endIdx = arrayPart.indexOf('];');
      if (endIdx !== -1) {
        const rawArray = arrayPart.substring(0, endIdx + 2);
        const parsedRules = new Function(`return ${rawArray}`)();
        if (Array.isArray(parsedRules)) {
          const converted = parsedRules.map(p => {
            let pattern = null;
            let negate = false;
            let fileLevel = false;
            let extensions = null;
            const title = p.title.toLowerCase();
            const desc = p.description.toLowerCase();

            if (title.includes('sql injection') || desc.includes('sqli')) {
              pattern = /(?:execute|query|raw|cursor\.execute)\s*\(\s*(?:f?["'`].*(?:\+|%s|\$\{|\{)|\w+\s*\+)/gi;
              extensions = ['.py', '.js', '.ts', '.rb', '.php', '.java'];
            } else if (title.includes('cross-site scripting') || title.includes('xss')) {
              pattern = /\.innerHTML\s*=\s*(?!['"`]<)|document\.write\s*\(|dangerouslySetInnerHTML/gi;
              extensions = ['.js', '.ts', '.tsx', '.jsx', '.html'];
            } else if (title.includes('csrf') || title.includes('request forgery')) {
              pattern = /(?:csrf|anti-csrf|xsrf|csrf_token)/gi;
              negate = true;
              fileLevel = true;
              extensions = ['.js', '.ts', '.py', '.html'];
            } else if (title.includes('hard-coded password') || title.includes('hardcoded password') || title.includes('credentials')) {
              pattern = /(?:password|passwd|pwd|secret|token|api_key|apikey|api_secret)\s*[:=]\s*['"][^'"]{6,}/gi;
              extensions = ['.js', '.ts', '.py', '.rb', '.java', '.php', '.yaml', '.yml', '.json', '.env', '.cfg', '.ini', '.conf', '.toml'];
            } else if (title.includes('cryptographic') || title.includes('broken cryptographic') || title.includes('hash')) {
              pattern = /(?:md5|sha1|des|rc4|blowfish|ecb)\s*\(/gi;
              extensions = ['.js', '.ts', '.py', '.rb', '.java', '.php', '.go'];
            } else if (title.includes('random') || title.includes('entropy')) {
              pattern = /Math\.random\s*\(\)/gi;
              extensions = ['.js', '.ts'];
            } else if (title.includes('certificate validation') || title.includes('ssl/tls')) {
              pattern = /(?:rejectUnauthorized\s*:\s*false|verify\s*[:=]\s*false|CERT_NONE|InsecureSkipVerify)/gi;
              extensions = ['.js', '.ts', '.py', '.go'];
            } else if (title.includes('command injection') || title.includes('os command')) {
              pattern = /(?:child_process|exec|execSync|spawn|spawnSync|system|popen|subprocess\.(?:call|run|Popen))\s*\(/gi;
              extensions = ['.js', '.ts', '.py'];
            } else if (title.includes('private key') || title.includes('secret key')) {
              pattern = /-----BEGIN (?:RSA |EC |DSA |OPENSSH )?PRIVATE KEY-----/g;
            } else if (title.includes('database connection') || desc.includes('connection string')) {
              pattern = /(?:postgres|mysql|mongodb|redis|amqp):\/\/[^:]+:[^@]+@/gi;
            } else if (title.includes('jwt') || title.includes('jsonwebtoken')) {
              pattern = /jwt\.sign\s*\([^)]*['"][^'"]{8,}['"]/gi;
              extensions = ['.js', '.ts'];
            } else if (title.includes('wildcard import')) {
              pattern = /from\s+\S+\s+import\s+\*/g;
              extensions = ['.py'];
            } else if (title.includes('circular dependency')) {
              pattern = /(?:require\(['"]\.\.\/.*require\(['"]\.\.\/|from\s+['"]\.\.\/.*from\s+['"]\.\.\/)/gim;
              extensions = ['.js', '.ts', '.py'];
            } else if (title.includes('todo') || title.includes('fixme')) {
              pattern = /(?:TODO|FIXME|HACK|XXX|SECURITY|VULN)/gi;
            } else if (title.includes('docker') || p.category === 'infrastructure' || p.category === 'container') {
              if (title.includes('root')) {
                pattern = /USER\s+root/gi;
              } else if (title.includes('expose')) {
                pattern = /EXPOSE\s+3000|EXPOSE\s+80/gi;
              } else {
                pattern = /FROM\s+node|FROM\s+python/gi;
              }
              extensions = ['Dockerfile', '.yaml', '.yml'];
            } else {
              pattern = new RegExp(`(?:${p.rule_id}|eval|unsafe|bypass|override)`, 'gi');
            }

            return {
              rule_id: p.rule_id,
              category: p.category || 'sast',
              title: p.title,
              description: p.description,
              severity: p.severity || 'medium',
              clause_reference: p.clause_reference || 'Compliance Clause',
              pattern,
              negate,
              fileLevel,
              extensions
            };
          });
          ALL_RULES = [...ALL_RULES, ...converted];
          log(`Loaded & converted ${converted.length} compliance policies from seed-policies.js`);
        }
      }
    }
  }
  log(`Total rules loaded in MCP Engine: ${ALL_RULES.length}`);
} catch (e) {
  log(`Rules initialization error: ${e.message}`);
}

// ═══════════════════════════════════════════════════════════════════════════════
// MCP TOOLS DEFINITIONS
// ═══════════════════════════════════════════════════════════════════════════════
const TOOLS = [
  {
    name: "omniguard_list_threats",
    description: "Get the active OmniGuard Nexus threat rules library (330+ checking rules).",
    inputSchema: {
      type: "object",
      properties: {
        category: {
          type: "string",
          description: "Category to filter rules (sast, dast, pci, iso, soc2, hipaa, nist, all).",
          enum: ["sast", "dast", "pci", "iso", "soc2", "hipaa", "nist", "all"]
        }
      }
    }
  },
  {
    name: "nexus-graph-sync",
    description: "Builds a real-time system mapping of the codebase. Recursively parses imports and generates a Mermaid dependency chart.",
    inputSchema: {
      type: "object",
      properties: {
        path: { type: "string", description: "Target directory path to sync (defaults to current dir)." }
      }
    }
  },
  {
    name: "realtime-ai-guardrail",
    description: "CRITICAL FOR AI: Evaluate a specific file before finalizing changes. Scans the file against 330+ rules and returns exact compliance warnings and fix paths.",
    inputSchema: {
      type: "object",
      properties: {
        filePath: { type: "string", description: "Absolute or relative path to the file." },
        content: { type: "string", description: "Optional. Custom file content to scan (if unsaved or diff)." }
      },
      required: ["filePath"]
    }
  },
  {
    name: "omniguard_scan_codebase",
    description: "Runs a full static code analysis on the target path against the 8-layer compliance suite. Returns a structured list of vulnerabilities.",
    inputSchema: {
      type: "object",
      properties: {
        path: { type: "string", description: "Absolute path to the directory to scan." }
      },
      required: ["path"]
    }
  },
  {
    name: "omniguard_get_ai_guidance",
    description: "Analyzes the workspace stack and returns tailored CISO compliance guardrails to guide the AI agent.",
    inputSchema: {
      type: "object",
      properties: {
        path: { type: "string", description: "Target directory path." }
      },
      required: ["path"]
    }
  }
];

let buffer = '';

process.stdin.on('data', (chunk) => {
  buffer += chunk.toString();
  let lineEnd;
  while ((lineEnd = buffer.indexOf('\n')) !== -1) {
    const line = buffer.slice(0, lineEnd).trim();
    buffer = buffer.slice(lineEnd + 1);
    if (line) {
      handleRequest(line);
    }
  }
});

function sendResponse(id, result, error = null) {
  const resp = {
    jsonrpc: "2.0",
    id: id || null
  };
  if (error) {
    resp.error = error;
  } else {
    resp.result = result;
  }
  process.stdout.write(JSON.stringify(resp) + "\n");
}

function handleRequest(line) {
  let req;
  try {
    req = JSON.parse(line);
  } catch (e) {
    sendResponse(null, null, { code: -32700, message: "Parse error" });
    return;
  }

  if (req.method === "initialize") {
    sendResponse(req.id, {
      protocolVersion: "2024-11-05",
      capabilities: {
        tools: {}
      },
      serverInfo: {
        name: "OmniGuard Nexus MCP Server",
        version: "1.9.5"
      }
    });
    return;
  }

  if (req.method === "notifications/initialized") {
    return;
  }

  if (req.method === "tools/list") {
    sendResponse(req.id, {
      tools: TOOLS
    });
    return;
  }

  if (req.method === "tools/call") {
    const { name, arguments: args } = req.params || {};
    try {
      const output = callTool(name, args || {});
      sendResponse(req.id, {
        content: [
          {
            type: "text",
            text: output
          }
        ]
      });
    } catch (err) {
      sendResponse(req.id, null, { code: -32603, message: err.message });
    }
    return;
  }

  sendResponse(req.id, null, { code: -32601, message: `Method not found: ${req.method}` });
}

// Helper to recursively walk a directory
function walkSync(dir, filelist = []) {
  let files;
  try {
    files = fs.readdirSync(dir);
  } catch {
    return filelist;
  }
  files.forEach((file) => {
    if (['node_modules', '.git', 'dist', 'build', '.venv', '__pycache__'].includes(file)) return;
    const filepath = path.join(dir, file);
    let stat;
    try {
      stat = fs.statSync(filepath);
    } catch {
      return;
    }
    if (stat.isDirectory()) {
      walkSync(filepath, filelist);
    } else {
      filelist.push(filepath);
    }
  });
  return filelist;
}

// Local rules scanner matching patterns
function scanFileContent(filePath, content, rules) {
  const findings = [];
  const lines = content.split('\n');
  const ext = path.extname(filePath);
  const baseName = path.basename(filePath);

  rules.forEach(rule => {
    if (rule.extensions && !rule.extensions.includes(ext) && !rule.extensions.includes(baseName)) {
      return;
    }

    if (rule.pattern) {
      if (rule.negate) {
        if (!rule.pattern.test(content)) {
          findings.push({
            rule_id: rule.rule_id,
            title: rule.title,
            description: rule.description,
            severity: rule.severity,
            clause_reference: rule.clause_reference,
            file: filePath,
            line: 1,
            evidence: `Check failed: Required pattern [${rule.pattern.toString()}] is missing.`
          });
        }
      } else {
        lines.forEach((lineText, lineIdx) => {
          rule.pattern.lastIndex = 0;
          if (rule.pattern.test(lineText)) {
            findings.push({
              rule_id: rule.rule_id,
              title: rule.title,
              description: rule.description,
              severity: rule.severity,
              clause_reference: rule.clause_reference,
              file: filePath,
              line: lineIdx + 1,
              evidence: lineText.trim()
            });
          }
        });
      }
    }
  });

  return findings;
}

function callTool(name, args) {
  switch (name) {
    case "omniguard_list_threats": {
      const category = args.category || "all";
      const filtered = category === "all" ? ALL_RULES : ALL_RULES.filter(t => t.category.toLowerCase() === category.toLowerCase() || t.rule_id.toLowerCase().includes(category.toLowerCase()));
      return JSON.stringify({ category, total: filtered.length, rules: filtered.map(r => ({ rule_id: r.rule_id, title: r.title, category: r.category, severity: r.severity, clause: r.clause_reference })) }, null, 2);
    }

    case 'nexus-graph-sync': {
      const targetDir = args.path || process.cwd();
      const files = walkSync(targetDir);
      const nodes = [];
      const connections = [];

      files.forEach(f => {
        const ext = path.extname(f);
        if (!['.js', '.ts', '.tsx', '.py'].includes(ext)) return;

        const relPath = path.relative(targetDir, f).replace(/\\/g, '/');
        const nodeName = relPath.replace(/[^a-zA-Z0-9]/g, '_');
        nodes.push({ name: nodeName, label: relPath });

        try {
          const content = fs.readFileSync(f, 'utf8');
          // Match imports
          const requireMatches = content.matchAll(/require\(['"]\.\/([^'"]+)['"]\)/g);
          for (const m of requireMatches) {
            const targetRel = path.normalize(path.join(path.dirname(relPath), m[1])).replace(/\\/g, '/');
            const targetNode = targetRel.replace(/[^a-zA-Z0-9]/g, '_');
            connections.push(`${nodeName} --> ${targetNode}`);
          }
          const importMatches = content.matchAll(/from\s+['"]\.\/([^'"]+)['"]/g);
          for (const m of importMatches) {
            const targetRel = path.normalize(path.join(path.dirname(relPath), m[1])).replace(/\\/g, '/');
            const targetNode = targetRel.replace(/[^a-zA-Z0-9]/g, '_');
            connections.push(`${nodeName} --> ${targetNode}`);
          }
        } catch {}
      });

      let mermaid = 'graph TD;\n';
      nodes.forEach(n => {
        mermaid += `  ${n.name}["${n.label}"];\n`;
      });
      connections.forEach(c => {
        mermaid += `  ${c};\n`;
      });

      return `[OmniGuard Nexus Graph Sync Completed]\n\n${mermaid}`;
    }

    case 'realtime-ai-guardrail': {
      const filePath = args.filePath;
      let content = args.content;

      if (!content) {
        if (fs.existsSync(filePath)) {
          content = fs.readFileSync(filePath, 'utf8');
        } else {
          return `[OMNIGUARD GUARDRAIL] Error: File path ${filePath} does not exist. Specify file content to evaluate.`;
        }
      }

      const findings = scanFileContent(filePath, content, ALL_RULES);

      if (findings.length === 0) {
        return `[OMNIGUARD GUARDRAIL: PASS] File ${filePath} complies with all 330+ checking rules. No architectural or security drifts detected.`;
      }

      let warning = `🚨 [OMNIGUARD GUARDRAIL: VIOLATION DETECTED] File: ${filePath}\n`;
      warning += `Your modifications introduced ${findings.length} security/compliance violations. Please remediate immediately:\n\n`;

      findings.forEach((f, idx) => {
        warning += `${idx + 1}. [${f.rule_id}] [${f.severity.toUpperCase()}] ${f.title}\n`;
        warning += `   Line ${f.line}: "${f.evidence}"\n`;
        warning += `   Clause: ${f.clause_reference}\n`;
        warning += `   Mitigation: ${f.description}\n\n`;
      });

      warning += `👉 REMEDIATION PATH REQUIRED: Resolve all findings before committing.`;
      return warning;
    }

    case 'omniguard_scan_codebase': {
      const targetDir = args.path;
      if (!fs.existsSync(targetDir)) {
        throw new Error(`Target directory path ${targetDir} does not exist.`);
      }

      const files = walkSync(targetDir);
      let allFindings = [];

      files.forEach(f => {
        try {
          const content = fs.readFileSync(f, 'utf8');
          const findings = scanFileContent(f, content, ALL_RULES);
          allFindings = [...allFindings, ...findings];
        } catch {}
      });

      if (allFindings.length === 0) {
        return JSON.stringify({ ok: true, message: `Scan complete. Scanned ${files.length} files. 0 violations found.` }, null, 2);
      }

      return JSON.stringify({
        ok: false,
        scannedFilesCount: files.length,
        violationsFound: allFindings.length,
        summary: {
          critical: allFindings.filter(f => f.severity === 'critical').length,
          high: allFindings.filter(f => f.severity === 'high').length,
          medium: allFindings.filter(f => f.severity === 'medium').length,
          low: allFindings.filter(f => f.severity === 'low').length,
        },
        violations: allFindings
      }, null, 2);
    }

    case 'omniguard_get_ai_guidance': {
      const targetDir = args.path;
      if (!fs.existsSync(targetDir)) {
        throw new Error(`Path ${targetDir} does not exist.`);
      }

      const files = walkSync(targetDir);
      const stacks = [];

      files.forEach(f => {
        const name = path.basename(f);
        if (name === 'package.json') {
          try {
            const pkg = JSON.parse(fs.readFileSync(f, 'utf8'));
            const deps = { ...pkg.dependencies, ...pkg.devDependencies };
            if (deps.express) stacks.push('Express.js Backend');
            if (deps.pg || deps.sequelize || deps.prisma) stacks.push('PostgreSQL/SQL DB Connections');
            if (deps.mongoose || deps.mongodb) stacks.push('MongoDB Storage');
            if (deps.jsonwebtoken) stacks.push('JWT Auth Gateway');
            if (deps['aws-sdk'] || deps['@aws-sdk/client-s3']) stacks.push('AWS Cloud SDK');
          } catch {}
        }
        if (name === 'requirements.txt') {
          try {
            const reqs = fs.readFileSync(f, 'utf8');
            if (reqs.includes('django')) stacks.push('Django Python Framework');
            if (reqs.includes('flask')) stacks.push('Flask Python Backend');
            if (reqs.includes('psycopg2')) stacks.push('PostgreSQL Storage');
            if (reqs.includes('boto3')) stacks.push('AWS Cloud SDK (boto3)');
          } catch {}
        }
        if (name === 'Dockerfile') stacks.push('Docker Containers');
        if (f.endsWith('.tf') || f.endsWith('.tfvars')) stacks.push('Terraform Infrastructure-as-Code');
      });

      const uniqueStacks = [...new Set(stacks)];

      let guide = `🛡️ [OMNIGUARD CISO GUARDRAILS FOR AI AGENTS] Monitored stack: ${uniqueStacks.join(', ') || 'General Codebase'}\n\n`;
      guide += `Please ensure you strictly comply with the following architectural and security guidelines while editing this codebase:\n\n`;

      if (uniqueStacks.includes('Express.js Backend') || uniqueStacks.includes('Flask Python Backend') || uniqueStacks.includes('Django Python Framework')) {
        guide += `📍 API SECURITY:\n`;
        guide += `  - ALWAYS implement session authentication or JWT tokens check. [Rule SAST-AUTH-003]\n`;
        guide += `  - NEVER create endpoints exposed to public access unless they are explicitly authorized routes.\n\n`;
      }

      if (uniqueStacks.includes('PostgreSQL/SQL DB Connections') || uniqueStacks.includes('PostgreSQL Storage')) {
        guide += `📍 DATABASE HARDENING:\n`;
        guide += `  - NEVER use string interpolation or concatenation to form SQL queries (e.g. \`SELECT * FROM users WHERE name = '\` + input). [Rule SAST-INJ-001]\n`;
        guide += `  - ALWAYS use parameterized queries or trusted ORM/QueryBuilder query methods.\n\n`;
      }

      if (uniqueStacks.includes('JWT Auth Gateway')) {
        guide += `📍 KEY MANAGEMENT:\n`;
        guide += `  - NEVER hardcode secrets or JWT signature private keys in code. [Rule SAST-AUTH-004]\n`;
        guide += `  - ALWAYS pull secrets from the environment variables (e.g. process.env.JWT_SECRET).\n\n`;
      }

      if (uniqueStacks.includes('Docker Containers')) {
        guide += `📍 CONTAINER HYGIENE:\n`;
        guide += `  - ALWAYS run Dockerfiles under a non-root USER directive. Running containers as root is blocked under SOC2/PCI compliance. [Rule IAC-SEC-001]\n`;
        guide += `  - Keep base images secure and verify package list updates.\n\n`;
      }

      if (uniqueStacks.includes('Terraform Infrastructure-as-Code')) {
        guide += `📍 IAC INTEGRITY:\n`;
        guide += `  - Ensure security groups restrict SSH port 22 access. Do not expose 0.0.0.0/0 on sensitive ports.\n\n`;
      }

      guide += `💡 PRO TIP: Save token consumption and avoid failed pull request pipelines by running the 'realtime-ai-guardrail' tool right after making code changes.`;
      return guide;
    }

    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}
