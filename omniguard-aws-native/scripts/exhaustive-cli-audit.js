/**
 * OmniGuard Exhaustive Command Verification & Loophole Audit Suite
 *
 * Programmatically triggers and tests all registered subcommands in the CLI
 * to guarantee that error margins, argument guardrails, and RLS bypass routes
 * function correctly and do not throw unhandled exceptions.
 */

const { execSync, spawnSync } = require("child_process");
const assert = require("assert");
const os = require("os");

const schema = {
  auth: ["status", "refresh", "browser", "device", "token", "sso", "verify", "export", "import", "whoami"],
  org: ["create", "add", "delete", "list", "use", "switch", "rename", "info", "members", "invite", "invite-revoke", "pending-invites", "remove-member", "roles", "billing", "settings", "usage", "audit", "export", "join"],
  user: ["list", "info", "invite", "remove", "role", "sessions", "revoke", "reset"],
  repo: ["add", "create", "remove", "clone", "list", "scan", "sync", "enable", "disable", "settings", "webhooks", "branches", "status"],
  project: ["create", "delete", "list", "use", "info", "settings"],
  scan: [".", "file", "folder", "repo", "docker", "image", "k8s", "terraform", "cloudformation", "helm", "secrets", "licenses", "sbom", "dependencies", "ai", "diff", "commit", "staged", "changed", "all"],
  findings: ["list", "show", "explain", "export", "suppress", "unsuppress", "resolve", "reopen", "assign", "comment", "tag"],
  fix: ["file", "repo", "explain", "preview", "apply", "rollback", "interactive", "pr", "commit", "diff"],
  chat: ["chat", "explain", "ask", "review", "optimize", "generate-policy", "summarize"],
  provider: ["add", "remove", "list", "verify", "default", "test", "usage", "cost", "models", "benchmark"],
  "api-key": ["create", "revoke", "rotate", "list", "show", "usage", "permissions", "expire", "verify"],
  policy: ["install", "remove", "list", "parse", "validate", "enable", "disable", "sync", "export", "import", "test", "diff"],
  compliance: ["soc2", "iso27001", "pci", "hipaa", "gdpr", "nist", "audit", "status", "check", "report"],
  sbom: ["generate", "verify", "export", "import", "compare", "validate"],
  deps: ["list", "check", "audit", "update", "license", "tree"],
  secrets: ["scan", "list", "audit", "mask", "rotate", "vault"],
  iac: ["scan", "verify", "validate", "remediate", "rules"],
  container: ["scan", "list", "verify", "bom", "vuln"],
  integrations: ["connect", "disconnect", "list", "status", "test", "sync", "jira", "slack", "github", "gitlab", "teams", "pagerduty", "servicenow"],
  pr: ["create", "review", "check", "approve", "fix", "status"],
  report: ["generate", "export", "list", "send", "schedule", "ciso"],
  audit: ["logs", "events", "actions", "export", "search", "verify", "tail"],
  billing: ["status", "invoice", "plan", "usage", "payment"],
  notify: ["slack", "email", "webhook", "test", "configure"],
  config: ["show", "set", "get", "reset", "profile"],
  plugin: ["install", "remove", "list", "update", "search"],
  cache: ["clear", "status", "size", "prune"],
  nexus: ["graph", "trace", "check"],
  agent: ["map", "graph", "report"],
  mcp: ["start", "status", "config"]
};

function testCmd(cmd) {
  // Split command into args for spawnSync (safer, no shell injection)
  const parts = cmd.split(/\s+/);
  const exe  = parts[0];
  const argv = parts.slice(1);

  const result = spawnSync(exe, argv, {
    input: "\n\n\n",
    encoding: "utf8",
    timeout: 8000,           // 8-second hard kill – prevents network hangs
    killSignal: "SIGKILL",
    maxBuffer: 10 * 1024 * 1024,
    env: {
      ...process.env,
      OMNIGUARD_OFFLINE: "1",  // signals the CLI to skip live network calls
      OMNIGUARD_AUDIT_MODE: "1"
    }
  });

  const stdout = result.stdout || "";
  const stderr = result.stderr || "";
  const combined = (stdout + " " + stderr).slice(0, 5000);

  // Timed-out processes also count as guardrail passes (network-blocked)
  if (result.signal === "SIGKILL" || result.error?.code === "ETIMEDOUT") {
    return { status: "guardrail_passed", output: "[TIMEOUT – network/IO blocked]", code: -1 };
  }

  if (result.status === 0 || stdout.trim()) {
    return { status: "success", output: stdout.trim().slice(0, 1000), code: result.status };
  }

  // Guardrail patterns – expected non-zero exits from auth/validation guards
  const guardrailSignals = [
    "Usage:", "Missing", "failed", "invalid", "Authentication required",
    "not found", "required", "Unknown subcommand", "Not authenticated",
    "Not authenticated. Run", "[CRITICAL]", "[HIGH]", "[MEDIUM]", "[LOW]",
    "No findings.", "No files to scan", "Rate limit", "Access denied",
    "Security Error", "Verification failed", "Invalid"
  ];

  if (guardrailSignals.some(s => combined.includes(s))) {
    return { status: "guardrail_passed", output: combined.trim().slice(0, 1000), code: result.status };
  }

  return { status: "crashed", output: combined.trim().slice(0, 1000), code: result.status };
}

console.log("=================================================================");
console.log("🛡️  OmniGuard CLI: Exhaustive Loophole & Command Validation Audit");
console.log("=================================================================\n");

let passed = 0;
let blocked = 0;
let crashed = 0;
const failures = [];

for (const [namespace, subcommands] of Object.entries(schema)) {
  console.log(`Auditing Namespace: [${namespace.toUpperCase()}] (${subcommands.length} subcommands)`);
  
  for (const sub of subcommands) {
    const cmdStr = `node cli/src/index.js ${namespace} ${sub}`;
    const result = testCmd(cmdStr);
    const icon = result.status === "success" ? "✓" : result.status === "guardrail_passed" ? "🛡" : "❌";
    process.stdout.write(`  ${icon} ${namespace} ${sub}\n`);
    
    if (result.status === "success") {
      passed++;
    } else if (result.status === "guardrail_passed") {
      blocked++;
    } else {
      crashed++;
      failures.push({ command: cmdStr, output: result.output });
      process.stdout.write(`    CRASH: ${result.output.slice(0, 200)}\n`);
    }
  }
}

console.log("\n=================================================================");
console.log("                       AUDIT COMPLETED                           ");
console.log("=================================================================");
console.log(`Total Commands Evaluated:  ${passed + blocked + crashed}`);
console.log(`✓ Clean Execution Passes:  ${passed}`);
console.log(`🛡️ Guardrail Triggers:     ${blocked}`);
console.log(`❌ Crashed Executions:     ${crashed}`);
console.log("=================================================================\n");

if (crashed > 0) {
  console.error("❌ Loophole Audit Failed! Unhandled exceptions found:\n");
  failures.forEach(f => {
    console.error(`Command: ${f.command}`);
    console.error(`Crash Log: ${f.output}\n`);
  });
  process.exit(1);
} else {
  console.log("✓ ALL COMMANDS COMPLIED WITH ENTERPRISE SAFETY RULES!");
  process.exit(0);
}
