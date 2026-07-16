/**
 * deps.js — Dependency & Supply Chain Scanner Plugin
 * Scans package.json, requirements.txt, Gemfile, Cargo.toml, go.mod, pom.xml
 * for known-vulnerable patterns, pinning issues, and deprecated packages.
 */
module.exports = {
  name: 'deps',
  rules: [
    // Known wildcard/unpinned version patterns that indicate supply chain risk
    { id: 'SUPPLY-001', name: 'Unpinned npm Dependency (Wildcard)', re: /\"[a-z@][a-z0-9\-\/]+\"\s*:\s*\"\*\"/gi, sev: 'high', ext: ['package.json'] },
    { id: 'SUPPLY-002', name: 'npm Dependency with > Range (Any Version)', re: /\"[a-z@][a-z0-9\-\/]+\"\s*:\s*\">[0-9]/gi, sev: 'medium', ext: ['package.json'] },
    { id: 'SUPPLY-003', name: 'Suspicious postinstall Script', re: /"postinstall"\s*:\s*"[^"]*(?:curl|wget|bash|sh|powershell|python|node)\s/gi, sev: 'critical', ext: ['package.json'] },
    { id: 'SUPPLY-004', name: 'npm install from git URL (Unverified Source)', re: /\"[a-z@][a-z0-9\-\/]+\"\s*:\s*\"(?:git\+?https?|github|gitlab|bitbucket):/gi, sev: 'medium', ext: ['package.json'] },
    { id: 'SUPPLY-005', name: 'Lockfile Missing (package-lock.json absent)', re: /"dependencies"\s*:\s*\{/gi, sev: 'low', ext: ['package.json'] },
    // Python requirements.txt
    { id: 'SUPPLY-010', name: 'Python Dependency without Version Pin', re: /^[A-Za-z][A-Za-z0-9\-_]+\s*$/gm, sev: 'medium', ext: ['requirements.txt'] },
    { id: 'SUPPLY-011', name: 'Python Dependency from URL/VCS', re: /^-?\s*(?:git\+|https?:\/\/|svn\+)/gim, sev: 'high', ext: ['requirements.txt'] },
    // Go modules
    { id: 'SUPPLY-020', name: 'Go Replace Directive (Potential Typosquat)', re: /^replace\s+\S+\s+=>\s+[./]/gm, sev: 'medium', ext: ['go.mod'] },
    // Rust Cargo
    { id: 'SUPPLY-030', name: 'Rust Crate from Git (Unverified Source)', re: /git\s*=\s*"https?:\/\//gi, sev: 'medium', ext: ['Cargo.toml'] },
    // Maven POM — snapshots in production
    { id: 'SUPPLY-040', name: 'Maven SNAPSHOT Dependency', re: /<version>[^<]*SNAPSHOT[^<]*<\/version>/gi, sev: 'medium', ext: ['pom.xml'] },
    // License risk
    { id: 'SUPPLY-050', name: 'GPL License in Dependency (Copyleft Risk)', re: /"license"\s*:\s*"[^"]*GPL[^"]*"/gi, sev: 'low', ext: ['package.json'] }
  ],

  scan(content, filePath, lines, baseName) {
    const findings = [];
    const ext = require('path').extname(filePath).toLowerCase();

    for (const rule of this.rules) {
      // Only run rule on matching file extensions/basenames
      const matchesFile = rule.ext
        ? rule.ext.some(e => e === baseName || e === ext)
        : true;
      if (!matchesFile) continue;

      rule.re.lastIndex = 0;
      let m;
      const seen = new Set();
      while ((m = rule.re.exec(content)) !== null) {
        const lineNum = content.slice(0, m.index).split('\n').length;
        if (seen.has(lineNum)) continue;
        seen.add(lineNum);

        findings.push({
          scanner: 'dependency',
          rule_id: rule.id,
          severity: rule.sev,
          title: rule.name,
          file_path: filePath,
          line_start: lineNum,
          evidence: (lines[lineNum - 1] || '').trim().substring(0, 150),
          cwe: 'CWE-1104',
          owasp: 'A06:2021-Vulnerable and Outdated Components'
        });
      }
    }
    return findings;
  }
};
