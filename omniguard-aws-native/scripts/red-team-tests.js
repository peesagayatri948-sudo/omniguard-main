/**
 * OmniGuard CLI Command validation and parameter guardrail verification suite
 */

const { execSync } = require("child_process");
const assert = require("assert");

function runCmd(cmd) {
  try {
    const out = execSync(cmd, { encoding: "utf8", stdio: "pipe" });
    return { ok: true, output: out.trim() };
  } catch (err) {
    return { ok: false, output: err.stdout.trim() + " " + err.stderr.trim() };
  }
}

console.log("=======================================================");
console.log("🛡️ Starting OmniGuard CLI Red-Team Parameter Audits...  ");
console.log("=======================================================\n");

// Test 1: org create without name
console.log("Test 1: Creating org without name parameter...");
const t1 = runCmd("node cli/src/index.js org create");
assert.strictEqual(t1.ok, false);
assert.match(t1.output, /Missing parameter <name>/);
console.log("✓ Correctly rejected missing org name.");

// Test 2: org create normal
console.log("\nTest 2: Creating organization 'RedTeamOrg'...");
const t2 = runCmd("node cli/src/index.js org create RedTeamOrg");
assert.strictEqual(t2.ok, true);
assert.match(t2.output, /Created Organization: RedTeamOrg/);
console.log("✓ Org successfully created.");

// Test 3: org create duplicate
console.log("\nTest 3: Creating duplicate organization 'RedTeamOrg'...");
const t3 = runCmd("node cli/src/index.js org create RedTeamOrg");
assert.strictEqual(t3.ok, false);
assert.match(t3.output, /already exists/);
console.log("✓ Correctly blocked duplicate organization creation.");

// Test 4: org use non-existent
console.log("\nTest 4: Switching to non-existent organization...");
const t4 = runCmd("node cli/src/index.js org use NonExistentOrg");
assert.strictEqual(t4.ok, false);
assert.match(t4.output, /not found/);
console.log("✓ Correctly blocked switching to non-existent organization.");

// Test 5: org use 'list' keyword blocker
console.log("\nTest 5: Switching using reserved keyword 'list'...");
const t5 = runCmd("node cli/src/index.js org use list");
assert.strictEqual(t5.ok, false);
assert.match(t5.output, /Invalid organization name: 'list'/);
console.log("✓ Correctly blocked switching to reserved name keywords.");

// Test 6: provider add without options
console.log("\nTest 6: Adding AI provider without parameters...");
const t6 = runCmd("node cli/src/index.js provider add");
assert.strictEqual(t6.ok, false);
assert.match(t6.output, /Usage: omniguard provider add/);
console.log("✓ Correctly rejected empty provider options.");

// Test 7: provider add invalid name
console.log("\nTest 7: Adding invalid AI provider name...");
const t7 = runCmd("node cli/src/index.js provider add SuperAI key=sk-abc");
assert.strictEqual(t7.ok, false);
assert.match(t7.output, /Invalid AI provider/);
console.log("✓ Correctly rejected invalid provider type.");

// Test 8: provider add missing keys
console.log("\nTest 8: Adding AI provider with missing key argument...");
const t8 = runCmd("node cli/src/index.js provider add anthropic");
assert.strictEqual(t8.ok, false);
assert.match(t8.output, /Missing configuration values/);
console.log("✓ Correctly rejected empty configuration parameters.");

// Test 9: provider add normal
console.log("\nTest 9: Adding AI provider with correct key...");
const t9 = runCmd("node cli/src/index.js provider add anthropic key=sk-ant-testkey");
assert.strictEqual(t9.ok, true);
assert.match(t9.output, /Configured AI Provider/);
console.log("✓ AI Provider successfully configured.");

console.log("\n=======================================================");
console.log("✓ ALL RED-TEAM CLI COMMAND AUDITS PASSED SUCCESSFULLY!  ");
console.log("=======================================================");
