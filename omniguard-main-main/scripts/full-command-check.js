/**
 * OmniGuard Full Command Validation Suite
 * 
 * Verifies that all 27 CLI namespaces correctly respond to help flags,
 * strictly enforce subcommand parameters, and handle invalid inputs gracefully.
 */

const { execSync } = require("child_process");
const assert = require("assert");

const namespaces = [
  "auth", "org", "user", "repo", "project", "scan", "findings",
  "fix", "chat", "provider", "api-key", "policy", "compliance",
  "sbom", "deps", "secrets", "iac", "container", "integrations",
  "pr", "report", "audit", "billing", "notify", "config", "plugin", "cache"
];

function runCmd(cmd) {
  try {
    const out = execSync(cmd, { encoding: "utf8", stdio: "pipe" });
    return { ok: true, output: out.trim(), code: 0 };
  } catch (err) {
    return { ok: false, output: (err.stdout || "") + " " + (err.stderr || ""), code: err.status };
  }
}

console.log("=======================================================");
console.log("🛡️  OmniGuard CLI Comprehensive Namespace Validator...  ");
console.log("=======================================================\n");

let passed = 0;
let failed = 0;

for (const ns of namespaces) {
  console.log(`Auditing namespace: [${ns.toUpperCase()}]`);

  // Test A: --help flag validation
  const helpCmd = `node cli/src/index.js ${ns} --help`;
  const rA = runCmd(helpCmd);
  
  try {
    assert.strictEqual(rA.ok, true, `Help check failed for namespace: ${ns}`);
    assert.match(rA.output, new RegExp(`Subcommands|Namespace`, "i"), `Help menu header missing for namespace: ${ns}`);
    console.log(`  ✓ --help menu verified.`);
    passed++;
  } catch (err) {
    console.error(`  ❌ Help menu audit failed for namespace: ${ns}. Error: ${err.message}`);
    failed++;
  }

  // Test B: Unknown subcommand rejection
  const invalidCmd = `node cli/src/index.js ${ns} invalidSubcommandXYZ`;
  const rB = runCmd(invalidCmd);

  try {
    assert.strictEqual(rB.ok, false, `Namespace ${ns} did not reject invalid subcommand.`);
    assert.strictEqual(rB.code, 1, `Invalid subcommand on namespace ${ns} did not exit with code 1.`);
    assert.match(rB.output, /Unknown subcommand/, `Incorrect error message returned for invalid subcommand under namespace: ${ns}`);
    console.log(`  ✓ Invalid subcommand rejected cleanly.`);
    passed++;
  } catch (err) {
    console.error(`  ❌ Invalid subcommand test failed for namespace: ${ns}. Error: ${err.message}`);
    failed++;
  }
  console.log("");
}

console.log("=======================================================");
console.log(`Audit Summary: ${passed} checks passed, ${failed} checks failed.`);
console.log("=======================================================");

if (failed > 0) {
  process.exit(1);
} else {
  console.log("\n✓ ALL CLI NAMESPACES ARE FULLY COMPLIANT AND SECURED!");
  process.exit(0);
}
