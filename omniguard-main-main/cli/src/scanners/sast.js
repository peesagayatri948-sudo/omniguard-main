module.exports = {
  name: 'sast',
  rules: [
    { id: 'SAST-SQL-001', name: 'SQL Injection', re: /(?:execute|query)\s*\([^)]*(?:SELECT|INSERT|UPDATE|DELETE)[^)]*\+/gi, sev: 'critical' },
    { id: 'SAST-XSS-001', name: 'XSS via innerHTML', re: /\.innerHTML\s*[+]?=\s*[^"';\n]{1,80}(?:req\.|request\.|params\.|\$\{)/gm, sev: 'high' },
    { id: 'SAST-CMD-001', name: 'Command Injection', re: /(?:child_process\.exec|execSync|os\.system)\s*\([^)]*(?:req\.|request\.|query\.)/gi, sev: 'critical' },
    { id: 'SAST-DESER-001', name: 'Unsafe Deserialization', re: /pickle\.loads?\s*\(/g, sev: 'critical' },
    { id: 'SAST-JWT-001', name: 'JWT Algorithm None', re: /algorithm[s]?\s*[:=]\s*["']none["']/gi, sev: 'critical' },
    { id: 'SAST-CRYPTO-001', name: 'Weak Hash MD5', re: /createHash\s*\(\s*["']md5["']/gi, sev: 'high' },
    { id: 'SAST-EVAL-001', name: 'eval() Usage', re: /\beval\s*\(/g, sev: 'high' },
    { id: 'SAST-PATH-001', name: 'Path Traversal', re: /\.\.\/|path\.join\([^)]*req\.|path\.join\([^)]*params\./gi, sev: 'high' }
  ],
  scan(content, filePath, lines) {
    const findings = [];
    const SKIP_FP = /(?:test|example|sample|placeholder|changeme|your[-_]?api|xxx|<|>|\$\{|\$\(|foobar|00000000)/i;
    const SKIP_COMMENT = /^\s*(\/\/|#|\*|<!--)/;
    
    for (const rule of this.rules) {
      rule.re.lastIndex = 0;
      let m;
      const seen = new Set();
      while ((m = rule.re.exec(content)) !== null) {
        const lineNum = content.slice(0, m.index).split('\n').length;
        if (seen.has(lineNum)) continue;
        seen.add(lineNum);
        const lineText = lines[lineNum - 1] || '';
        if (SKIP_COMMENT.test(lineText) || SKIP_FP.test(m[0])) continue;
        findings.push({
          scanner: 'sast',
          rule_id: rule.id,
          severity: rule.sev,
          title: `${rule.name} detected`,
          file_path: filePath,
          line_start: lineNum,
          cwe: 'CWE-119',
          owasp: 'A03:2021-Injection'
        });
      }
    }
    return findings;
  }
};
