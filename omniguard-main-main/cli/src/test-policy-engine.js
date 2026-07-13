'use strict';

// Set test environment flag so policy engine reloads repo policies dynamically
process.env.OMNIGUARD_TEST = 'true';

const policyEngine = require('./policyEngine');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('==================================================');
console.log('OMNIGUARD POLICY ENGINE DEEP AUTOMATED VALIDATION');
console.log('==================================================\n');

let passCount = 0;
let failCount = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  [PASS] ${message}`);
    passCount++;
  } else {
    console.error(`  [FAIL] ${message}`);
    failCount++;
  }
}

// ─── 1. TEST CASES: PARSING & VALIDATION ──────────────────────────────────────────

console.log('--- 1. Testing Policy Ingestion & Parsing ---');

// Test Case 1.1: Valid Policy Ingestion
try {
  const validYaml = `
rules:
  - id: RULES-TEST-001
    severity: high
    language:
      - javascript
    pattern:
      regex: "crypto\\\\.createHash\\\\(['\\"]md5['\\"]\\\\)"
    remediation: "Replace with SHA256"
    metadata:
      category: security
      framework:
        - OWASP
`;
  policyEngine.parseYamlPolicy(validYaml);
  assert(policyEngine.customPolicies.length === 1, 'Valid policy parsing length');
  assert(policyEngine.customPolicies[0].id === 'RULES-TEST-001', 'Valid policy id extraction');
  assert(policyEngine.customPolicies[0].severity === 'high', 'Valid policy severity extraction');
  assert(policyEngine.customPolicies[0].language[0] === 'javascript', 'Valid policy language list extraction');
  assert(policyEngine.customPolicies[0].remediation === 'Replace with SHA256', 'Valid policy remediation extraction');
  assert(policyEngine.customPolicies[0].metadata.category === 'security', 'Valid policy metadata category extraction');
} catch (e) {
  assert(false, `Valid policy parsing threw unexpected error: ${e.message}`);
}

// Test Case 1.2: Invalid YAML syntax
try {
  const invalidYaml = `
rules:
  - id: BAD-YAML
    severity: high
  - indented: incorrect: value
`;
  policyEngine.parseYamlPolicy(invalidYaml);
  assert(false, 'Invalid YAML parsing should have thrown');
} catch (e) {
  assert(e.message.includes('bad indentation') || e.message.includes('mapping values are not allowed'), `Invalid YAML parsed failed gracefully: ${e.message}`);
}

// Test Case 1.3: Invalid Schema (missing ID)
try {
  const missingIdYaml = `
rules:
  - severity: high
    pattern: test_regex
`;
  policyEngine.parseYamlPolicy(missingIdYaml);
  assert(false, 'Missing ID should have thrown schema validation error');
} catch (e) {
  assert(e.message.includes('missing required field "id"'), `Missing ID validation failed: ${e.message}`);
}

// Test Case 1.4: Duplicate IDs (Should report line number)
try {
  const duplicateIdYaml = `
rules:
  - id: DUP-001
    pattern: pat1
  - id: DUP-002
    pattern: pat2
  - id: DUP-001
    pattern: pat3
`;
  policyEngine.parseYamlPolicy(duplicateIdYaml);
  assert(false, 'Duplicate ID should have thrown validation error');
} catch (e) {
  assert(e.message.includes('Duplicate rule ID') && e.message.includes('DUP-001') && e.message.includes('line 7'), `Duplicate ID validation block with line numbers: ${e.message.replace(/\n/g, ' ')}`);
}

// Test Case 1.5: Malformed Regular Expression
try {
  const malformedRegexYaml = `
rules:
  - id: BAD-REGEX
    pattern: "(unclosed-parenthesis"
`;
  policyEngine.parseYamlPolicy(malformedRegexYaml);
  assert(false, 'Malformed regex pattern should have thrown compile error');
} catch (e) {
  assert(e.message.includes('Invalid regular expression'), `Malformed regex compile error handling: ${e.message}`);
}

// ─── 2. TEST CASES: SCANS & METADATA EVALUATION ──────────────────────────────────

console.log('\n--- 2. Testing Scan Evaluation & Metadata Extraction ---');

const testCode = `
  const crypto = require('crypto');
  const hash = crypto.createHash('md5').digest('hex');
`;

// Test Case 2.1: Evaluation matching & line offsets
try {
  const evaluateYaml = `
rules:
  - id: EVAL-TEST-001
    severity: critical
    language:
      - javascript
    pattern:
      regex: "createHash\\\\(['\\"]md5['\\"]\\\\)"
    remediation: "Use SHA-256 instead."
    metadata:
      category: cryptography
    references:
      - https://owasp.org/www-community/vulnerabilities/Weak_Cryptographic_Algorithms
`;
  policyEngine.parseYamlPolicy(evaluateYaml);
  const findings = policyEngine.evaluate('test.js', testCode);
  
  assert(findings.length === 1, 'Evaluation matched exactly one finding');
  const f = findings[0];
  assert(f.scanner === 'policy', 'Finding scanner field is "policy"');
  assert(f.rule_id === 'EVAL-TEST-001', 'Finding rule_id is correct');
  assert(f.severity === 'critical', 'Finding severity is correct');
  assert(f.title === 'Custom Policy Violation: EVAL-TEST-001', 'Finding title is correct');
  assert(f.file_path === 'test.js', 'Finding file_path is correct');
  assert(f.line_start === 3, 'Finding line_start is correct');
  assert(f.line_end === 3, 'Finding line_end is correct');
  assert(f.remediation === 'Use SHA-256 instead.', 'Finding remediation is correct');
  assert(f.metadata.category === 'cryptography', 'Finding metadata category is correct');
  assert(f.references[0].includes('owasp'), 'Finding references array is correct');
} catch (e) {
  assert(false, `Evaluation threw unexpected error: ${e.message}`);
}

// Test Case 2.2: Language filter validation
try {
  const pythonCode = `
import hashlib
hash = hashlib.md5(b"data").hexdigest()
`;
  // EVAL-TEST-001 language is JavaScript, so it should NOT match on Python files!
  const pythonFindings = policyEngine.evaluate('test.py', pythonCode);
  assert(pythonFindings.length === 0, 'Language filter correctly ignores files of other languages');
} catch (e) {
  assert(false, `Language filter check threw unexpected error: ${e.message}`);
}

// ─── 3. TEST CASES: ENFORCEMENT MODES ───────────────────────────────────────────

console.log('\n--- 3. Testing Enforcement Modes ---');

// Test Case 3.1: Audit mode
try {
  const auditYaml = `
enforcement:
  mode: audit
rules:
  - id: AUDIT-RULE
    severity: critical
    pattern: "md5"
`;
  policyEngine.parseYamlPolicy(auditYaml);
  const findings = policyEngine.evaluate('test.js', testCode);
  const enforce = policyEngine.checkEnforcement(findings);
  assert(enforce.block === false, 'Audit mode does not block');
} catch (e) {
  assert(false, `Audit enforcement check failed: ${e.message}`);
}

// Test Case 3.2: Warn mode
try {
  const warnYaml = `
enforcement:
  mode: warn
rules:
  - id: WARN-RULE
    severity: high
    pattern: "md5"
`;
  policyEngine.parseYamlPolicy(warnYaml);
  const findings = policyEngine.evaluate('test.js', testCode);
  const enforce = policyEngine.checkEnforcement(findings);
  assert(enforce.block === false, 'Warn mode does not block');
} catch (e) {
  assert(false, `Warn enforcement check failed: ${e.message}`);
}

// Test Case 3.3: Block mode
try {
  const blockYaml = `
enforcement:
  mode: block
  minimum_severity: high
rules:
  - id: BLOCK-RULE
    severity: critical
    pattern: "md5"
`;
  policyEngine.parseYamlPolicy(blockYaml);
  const findings = policyEngine.evaluate('test.js', testCode);
  const enforce = policyEngine.checkEnforcement(findings);
  assert(enforce.block === true, 'Block mode correctly blocks when finding severity >= threshold');
  assert(enforce.reason.includes('BLOCK-RULE'), 'Block reason correctly identifies the offending rule');
} catch (e) {
  assert(false, `Block enforcement check failed: ${e.message}`);
}

// Test Case 3.4: Block mode below severity threshold
try {
  const blockLowYaml = `
enforcement:
  mode: block
  minimum_severity: critical
rules:
  - id: BLOCK-LOW-RULE
    severity: low
    pattern: "md5"
`;
  policyEngine.parseYamlPolicy(blockLowYaml);
  const findings = policyEngine.evaluate('test.js', testCode);
  const enforce = policyEngine.checkEnforcement(findings);
  assert(enforce.block === false, 'Block mode does not block when finding severity < threshold');
} catch (e) {
  assert(false, `Threshold block check failed: ${e.message}`);
}

// ─── 4. BENCHMARKS: PARSER & SCAN EXECUTION ──────────────────────────────────────

console.log('\n--- 4. Benchmarks & Performance Metrics ---');

// Build 1000-rule policy for benchmarking
let largeYaml = `
rules:
`;
for (let i = 0; i < 1000; i++) {
  largeYaml += `  - id: BENCH-RULE-${i}
    severity: medium
    language:
      - javascript
    pattern:
      regex: "bench_regex_pattern_${i}"
    remediation: "Fix rule ${i}"
`;
}

// Benchmark Ingestion/Parse
const startParse = performance.now();
const heapBeforeParse = process.memoryUsage().heapUsed;
policyEngine.parseYamlPolicy(largeYaml);
const heapAfterParse = process.memoryUsage().heapUsed;
const endParse = performance.now();

const parseTimeMs = endParse - startParse;
const parseMemMb = (heapAfterParse - heapBeforeParse) / 1024 / 1024;
console.log(`  - 1000-Rule Policy Parse Time:   ${parseTimeMs.toFixed(4)} ms`);
console.log(`  - 1000-Rule Policy Memory Delta:  ${parseMemMb.toFixed(4)} MB`);

assert(parseTimeMs < 100, 'Parser speed is under 100ms for 1000 rules');

// Benchmark Scan/Evaluation on 1000 rules
const largeCodeFile = testCode.repeat(100); // 300 lines of code

const startEval = performance.now();
const evalFindings = policyEngine.evaluate('app.js', largeCodeFile);
const endEval = performance.now();

const evalTimeMs = endEval - startEval;
console.log(`  - 1000-Rule Scan Evaluation Time: ${evalTimeMs.toFixed(4)} ms (scanned 300 lines of code)`);

assert(evalTimeMs < 200, 'Scan evaluation speed is under 200ms for 1000 rules');

// ─── 5. INTEGRATION & CLI COMMAND TESTING ────────────────────────────────────────

console.log('\n--- 5. Testing CLI Commands & Integration ---');

const tempYml = path.join(process.cwd(), '.omniguard.yml');
const indexPath = path.join(__dirname, 'index.js');
try {
  // Test: policy install
  if (fs.existsSync(tempYml)) fs.unlinkSync(tempYml);
  execSync(`node "${indexPath}" policy install soc2`);
  assert(fs.existsSync(tempYml), 'policy install created .omniguard.yml');
  
  // Test: policy validate
  const validateOut = execSync(`node "${indexPath}" policy validate`).toString();
  assert(validateOut.includes('Policy validation: OK'), 'policy validate outputs success');
  
  // Test: policy parse
  const parseOut = execSync(`node "${indexPath}" policy parse`).toString();
  assert(parseOut.includes('Parsed policy rules'), 'policy parse outputs rules details');
  
  // Test: policy remove
  execSync(`node "${indexPath}" policy remove`);
  assert(!fs.existsSync(tempYml), 'policy remove deleted .omniguard.yml');
  
} catch (e) {
  assert(false, `CLI commands integration test failed: ${e.message}\nStderr: ${e.stderr ? e.stderr.toString() : ''}`);
}

console.log('\n==================================================');
console.log(`AUTOMATED TESTS COMPLETED. PASS: ${passCount}, FAIL: ${failCount}`);
console.log('==================================================');

if (failCount > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
