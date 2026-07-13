module.exports = {
  name: 'iac',
  rules: [
    { id: 'IAC-TF-001', name: 'Open SSH Access (22)', re: /ingress\s*\{[^}]*from_port\s*=\s*22[^}]*to_port\s*=\s*22[^}]*cidr_blocks\s*=\s*\[\s*["']0\.0\.0\.0\/0["']\s*\]/gi, sev: 'critical' },
    { id: 'IAC-TF-002', name: 'S3 Public Read Allowed', re: /acl\s*=\s*["']public-read["']/gi, sev: 'high' },
    { id: 'IAC-K8S-001', name: 'Privileged Container Escalation', re: /privileged:\s*true/gi, sev: 'high' },
    { id: 'IAC-K8S-002', name: 'Running as Root User', re: /runAsNonRoot:\s*false/gi, sev: 'medium' }
  ],
  scan(content, filePath, lines, baseName) {
    const findings = [];
    if (!filePath.endsWith('.tf') && !filePath.endsWith('.yaml') && !filePath.endsWith('.yml')) return findings;
    
    // For Terraform, try to use the advanced parser
    if (filePath.endsWith('.tf')) {
      try {
        const { runHclAudit } = require('../hclParser');
        const hclFindings = runHclAudit(filePath, content);
        findings.push(...hclFindings);
        return findings; // Advanced parser covers it
      } catch (e) {}
    }

    for (const rule of this.rules) {
      rule.re.lastIndex = 0;
      let m;
      while ((m = rule.re.exec(content)) !== null) {
        const lineNum = content.slice(0, m.index).split('\n').length;
        findings.push({
          scanner: 'iac',
          rule_id: rule.id,
          severity: rule.sev,
          title: rule.name,
          file_path: filePath,
          line_start: lineNum,
          cwe: 'CWE-16',
          owasp: 'A05:2021-Security Misconfiguration'
        });
      }
    }
    return findings;
  }
};
