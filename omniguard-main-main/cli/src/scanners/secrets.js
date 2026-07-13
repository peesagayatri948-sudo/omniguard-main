module.exports = {
  name: 'secrets',
  rules: [
    { id: 'SECRET-AWS-001', name: 'AWS Access Key', re: /(?:A3T[A-Z0-9]|AKIA|AGPA|AIDA|AROA|AIPA|ANPA|ANVA|ASIA)[A-Z0-9]{16}/g, sev: 'critical' },
    { id: 'SECRET-GH-001', name: 'GitHub PAT', re: /gh[pousr]_[A-Za-z0-9_]{36,}/g, sev: 'critical' },
    { id: 'SECRET-OPENAI-001', name: 'OpenAI Key', re: /sk-[A-Za-z0-9]{20}T3BlbkFJ[A-Za-z0-9]{20}/g, sev: 'critical' },
    { id: 'SECRET-ANTHROPIC-001', name: 'Anthropic Key', re: /sk-ant-[A-Za-z0-9\-_]{95,}/g, sev: 'critical' },
    { id: 'SECRET-DB-001', name: 'Database URL', re: /(postgres|mysql|mongodb|redis|mssql):\/\/[^:\s]+:[^@\s]+@[^\s'"]{5,}/gi, sev: 'critical' },
    { id: 'SECRET-PASS-001', name: 'Hardcoded Password', re: /(?:password|passwd|pwd)\s*[:=]\s*["']([^"'\s]{8,})["']/gim, sev: 'high' }
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
          scanner: 'secret',
          rule_id: rule.id,
          severity: rule.sev,
          title: `${rule.name} detected`,
          evidence: m[0].length <= 8 ? '****' : `${m[0].slice(0, 4)}...(${m[0].length})...${m[0].slice(-4)}`,
          file_path: filePath,
          line_start: lineNum,
          cwe: 'CWE-798',
          owasp: 'A07:2021-Identification and Authentication Failures'
        });
      }
    }
    return findings;
  }
};
