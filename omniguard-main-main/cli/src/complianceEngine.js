'use strict';
const eventBus = require('./eventBus');

/**
 * ComplianceEngine — Maps scan findings to regulatory compliance frameworks.
 * Integrates with eventBus to recalculate compliance scores on findings.
 * Frameworks: NIST CSF, ISO 27001:2022, SOC 2, PCI DSS v4, HIPAA, GDPR, CIS.
 */
class ComplianceEngine {
  constructor() {
    this.policies = new Map();
    this.frameworks = ['NIST CSF', 'ISO 27001', 'SOC 2', 'PCI DSS', 'HIPAA', 'GDPR', 'CIS'];
    this.loadBuiltInPolicies();
    this._listenToEvents();
  }

  loadBuiltInPolicies() {
    const builtIn = [
      // NIST CSF
      { id: 'NIST-PR.IP-1',  framework: 'NIST CSF',   description: 'Baseline configuration of IT/OT systems' },
      { id: 'NIST-PR.IP-3',  framework: 'NIST CSF',   description: 'Configuration change control processes' },
      { id: 'NIST-PR.DS-5',  framework: 'NIST CSF',   description: 'Protections against data leaks' },
      { id: 'NIST-DE.CM-1',  framework: 'NIST CSF',   description: 'The network is monitored to detect potential cybersecurity events' },
      { id: 'NIST-RS.MI-2',  framework: 'NIST CSF',   description: 'Incidents are mitigated' },
      // ISO 27001:2022
      { id: 'ISO-A.8.5',    framework: 'ISO 27001',   description: 'Secure authentication' },
      { id: 'ISO-A.8.9',    framework: 'ISO 27001',   description: 'Configuration management' },
      { id: 'ISO-A.8.24',   framework: 'ISO 27001',   description: 'Use of cryptography' },
      { id: 'ISO-A.8.25',   framework: 'ISO 27001',   description: 'Secure development life cycle' },
      { id: 'ISO-A.8.26',   framework: 'ISO 27001',   description: 'Application security requirements' },
      { id: 'ISO-A.8.28',   framework: 'ISO 27001',   description: 'Secure coding' },
      { id: 'ISO-A.8.29',   framework: 'ISO 27001',   description: 'Security testing in development and acceptance' },
      // SOC 2
      { id: 'SOC2-CC6.1',   framework: 'SOC 2',       description: 'Logical and physical access controls' },
      { id: 'SOC2-CC6.6',   framework: 'SOC 2',       description: 'Logical access security — external threats' },
      { id: 'SOC2-CC7.1',   framework: 'SOC 2',       description: 'Vulnerability management' },
      { id: 'SOC2-CC8.1',   framework: 'SOC 2',       description: 'Change management' },
      // PCI DSS v4.0
      { id: 'PCI-3.4.1',    framework: 'PCI DSS',     description: 'Primary account number (PAN) protection' },
      { id: 'PCI-4.2.1',    framework: 'PCI DSS',     description: 'Strong cryptography for PAN transmission' },
      { id: 'PCI-6.2.4',    framework: 'PCI DSS',     description: 'Software development practices for security' },
      { id: 'PCI-6.3.2',    framework: 'PCI DSS',     description: 'Inventory of bespoke and custom software' },
      { id: 'PCI-8.3.6',    framework: 'PCI DSS',     description: 'Password/passphrase requirements' },
      { id: 'PCI-11.3.1',   framework: 'PCI DSS',     description: 'Internal vulnerability scans performed quarterly' },
      // HIPAA
      { id: 'HIPAA-164.312.a.1', framework: 'HIPAA', description: 'Access control for ePHI systems' },
      { id: 'HIPAA-164.312.a.2', framework: 'HIPAA', description: 'Automatic logoff' },
      { id: 'HIPAA-164.312.e.1', framework: 'HIPAA', description: 'Transmission security' },
      { id: 'HIPAA-164.312.e.2', framework: 'HIPAA', description: 'Encryption/decryption of ePHI in transit' },
      // GDPR
      { id: 'GDPR-Art.25',  framework: 'GDPR',        description: 'Data protection by design and by default' },
      { id: 'GDPR-Art.32',  framework: 'GDPR',        description: 'Security of processing — appropriate technical measures' },
      // CIS Benchmarks
      { id: 'CIS-AWS-1.1',  framework: 'CIS',         description: 'Avoid the use of the root account' },
      { id: 'CIS-AWS-2.1',  framework: 'CIS',         description: 'Ensure CloudTrail is enabled in all regions' },
      { id: 'CIS-K8S-4.1',  framework: 'CIS',         description: 'Worker Node Configuration Files permissions' },
      { id: 'CIS-DOCKER-4', framework: 'CIS',         description: 'Container images and build file' }
    ];

    for (const policy of builtIn) {
      this.policies.set(policy.id, policy);
    }
  }

  _listenToEvents() {
    // When a finding is created, emit a recalculated compliance score
    eventBus.on(eventBus.Events.FINDING_CREATED, (finding) => {
      try {
        const mappedControls = this.mapFindingToFrameworks(finding);
        if (mappedControls.length > 0) {
          eventBus.emit(eventBus.Events.COMPLIANCE_RECALCULATED, {
            findingId: finding.rule_id,
            affectedControls: mappedControls,
            finding
          });
        }
      } catch (e) {
        // Non-fatal
      }
    });
  }

  /**
   * Parse a policy document text (e.g. user-uploaded compliance document)
   * and extract actionable rules containing mandatory language.
   */
  parsePolicyDocument(content, type) {
    const extracted = [];
    const lines = content.split('\n');
    lines.forEach(line => {
      const upper = line.toUpperCase();
      if (upper.includes('MUST') || upper.includes('SHALL') || upper.includes('REQUIRE')) {
        extracted.push({
          source: type,
          rule: line.trim(),
          mapping: this.inferMapping(line)
        });
      }
    });
    return extracted;
  }

  /**
   * Infer the compliance control mapping from a free-text policy line.
   */
  inferMapping(text) {
    const t = text.toLowerCase();
    if (t.includes('encrypt') || t.includes('kms') || t.includes('cryptograph')) return 'ISO-A.8.24';
    if (t.includes('access') || t.includes('password') || t.includes('authenticat')) return 'SOC2-CC6.1';
    if (t.includes('log') || t.includes('audit') || t.includes('monitor')) return 'NIST-DE.CM-1';
    if (t.includes('pii') || t.includes('personal') || t.includes('gdpr')) return 'GDPR-Art.32';
    if (t.includes('phi') || t.includes('patient') || t.includes('hipaa')) return 'HIPAA-164.312.e.1';
    if (t.includes('cardholder') || t.includes('pci') || t.includes('payment')) return 'PCI-6.2.4';
    return 'ISO-A.8.28'; // general fallback
  }

  /**
   * Map a finding's rule_id/severity/title to relevant compliance control IDs.
   */
  mapFindingToFrameworks(finding) {
    const mapped = [];
    const t = (finding.title || finding.rule_id || '').toLowerCase();
    const ruleId = finding.rule_id || '';
    const ref = finding.clause_reference || '';

    // Derive frameworks from clause_reference when available (most authoritative)
    if (ref.includes('PCI') || ruleId.startsWith('PCI-')) mapped.push('PCI-6.2.4');
    if (ref.includes('ISO') || ruleId.startsWith('ISO-')) mapped.push('ISO-A.8.28');
    if (ref.includes('SOC2') || ref.includes('SOC 2') || ruleId.startsWith('SOC2-')) mapped.push('SOC2-CC6.1');
    if (ref.includes('HIPAA') || ruleId.startsWith('HIPAA-')) mapped.push('HIPAA-164.312.a.1');
    if (ref.includes('NIST') || ruleId.startsWith('NIST-')) mapped.push('NIST-PR.DS-5');
    if (ref.includes('GDPR')) mapped.push('GDPR-Art.32');
    if (ref.includes('CIS') || ruleId.startsWith('CIS-')) mapped.push('CIS-AWS-2.1');

    // Derive from semantic content
    if (t.includes('inject') || t.includes('sql') || t.includes('xss') || t.includes('script')) {
      mapped.push('PCI-6.2.4', 'ISO-A.8.28', 'SOC2-CC6.1');
    }
    if (t.includes('encrypt') || t.includes('crypto') || t.includes('md5') || t.includes('sha1')) {
      mapped.push('ISO-A.8.24', 'PCI-4.2.1', 'NIST-PR.DS-5');
    }
    if (t.includes('password') || t.includes('secret') || t.includes('credential') || t.includes('token')) {
      mapped.push('PCI-8.3.6', 'SOC2-CC6.1', 'ISO-A.8.5');
    }
    if (t.includes('deserialization') || t.includes('pickle') || t.includes('yaml')) {
      mapped.push('OWASP A08', 'ISO-A.8.26');
    }
    if (t.includes('tls') || t.includes('ssl') || t.includes('certificate')) {
      mapped.push('PCI-4.2.1', 'HIPAA-164.312.e.1', 'ISO-A.8.24');
    }
    if (finding.severity === 'critical') {
      if (!mapped.includes('SOC2-CC6.1')) mapped.push('SOC2-CC6.1');
    }

    // Deduplicate
    return [...new Set(mapped)];
  }

  /**
   * Calculate compliance coverage score for a given list of open findings.
   * Returns a per-framework breakdown + overall score.
   */
  calculateComplianceScore(openFindings = []) {
    const violatedControls = new Set();
    for (const finding of openFindings) {
      const controls = this.mapFindingToFrameworks(finding);
      controls.forEach(c => violatedControls.add(c));
    }

    const totalControls = this.policies.size;
    const passedControls = totalControls - violatedControls.size;
    const overallScore = totalControls > 0 ? Math.round((passedControls / totalControls) * 100) : 100;

    // Per-framework scores
    const frameworkScores = {};
    for (const framework of this.frameworks) {
      const frameworkControls = [...this.policies.values()].filter(p => p.framework === framework);
      const frameworkViolated = frameworkControls.filter(p => violatedControls.has(p.id));
      const count = frameworkControls.length;
      frameworkScores[framework] = {
        total: count,
        violated: frameworkViolated.length,
        passed: count - frameworkViolated.length,
        score: count > 0 ? Math.round(((count - frameworkViolated.length) / count) * 100) : 100
      };
    }

    return {
      overall_score: overallScore,
      total_controls: totalControls,
      violated_controls: violatedControls.size,
      passed_controls: passedControls,
      framework_scores: frameworkScores
    };
  }
}

module.exports = new ComplianceEngine();
