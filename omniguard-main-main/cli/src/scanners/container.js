module.exports = {
  name: 'container',
  rules: [
    { id: 'DOCKER-LINT-001', name: 'Missing USER specification (Running as Root)', re: /FROM\s+\S+(?:[\s\S](?!USER))*$/gi, sev: 'high' },
    { id: 'DOCKER-LINT-002', name: 'Using latest tag', re: /FROM\s+\S+:latest/gi, sev: 'medium' },
    { id: 'DOCKER-LINT-003', name: 'Secrets Leaked in ENV', re: /ENV\s+(?:AWS_|API_KEY|PASSWORD|TOKEN|SECRET)\S*\s*=/gi, sev: 'critical' }
  ],
  scan(content, filePath, lines, baseName) {
    const findings = [];
    if (baseName.toLowerCase() !== 'dockerfile') return findings;
    
    for (const rule of this.rules) {
      rule.re.lastIndex = 0;
      let m;
      while ((m = rule.re.exec(content)) !== null) {
        const lineNum = content.slice(0, m.index).split('\n').length;
        findings.push({
          scanner: 'container',
          rule_id: rule.id,
          severity: rule.sev,
          title: rule.name,
          file_path: filePath,
          line_start: lineNum,
          cwe: 'CWE-250',
          owasp: 'A05:2021-Security Misconfiguration'
        });
      }
    }
    return findings;
  }
};
