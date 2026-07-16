'use strict'

/**
 * Audit Clause Mapper — v2.2.5
 * Deterministic mapping of detected weaknesses to exact compliance clauses.
 * Supports: OWASP ASVS, PCI DSS, NIST 800-53, ISO 27001, CIS, FIPS 140-2, SOC 2
 */

const crypto = require('crypto')

// Master clause database — each weakness maps to specific, citable clauses
const CLAUSE_DATABASE = {
  // ── Injection ──
  sql_injection: {
    owasp: 'A03:2021-Injection',
    cwe: 'CWE-89',
    clauses: [
      { framework: 'OWASP_ASVS', clause_id: 'V5.3.1', clause_title: 'SQL Injection Prevention', clause_text: 'Verify that the application uses parameterized queries or ORM frameworks that prevent SQL injection for all database calls.', clause_section: 'V5.3 - Output Encoding and Injection Prevention' },
      { framework: 'OWASP_ASVS', clause_id: 'V5.3.2', clause_title: 'Dynamic Query Prevention', clause_text: 'Verify that the application does not construct dynamic database queries using string concatenation.', clause_section: 'V5.3' },
      { framework: 'PCI_DSS', clause_id: '6.5.1', clause_title: 'Injection Flaws', clause_text: 'Address commonly accepted vulnerabilities including injection flaws, particularly SQL injection.', clause_section: 'Requirement 6 - Develop and Maintain Secure Systems' },
      { framework: 'NIST_800_53', clause_id: 'SI-10', clause_title: 'Information Input Validation', clause_text: 'The information system checks the validity of information inputs to ensure accuracy, completeness, validity, and verifiability.', clause_section: 'SI - System and Information Integrity' },
      { framework: 'ISO_27001', clause_id: 'A.14.2.5', clause_title: 'Secure System Engineering Principles', clause_text: 'Principles for engineering secure systems shall be applied to the development of all information systems.', clause_section: 'A.14 - System Acquisition, Development and Maintenance' },
      { framework: 'SOC2', clause_id: 'CC6.1', clause_title: 'Logical and Physical Access Controls', clause_text: 'The entity implements logical access controls to protect against threats to system security.', clause_section: 'CC6 - Logical and Physical Access' },
    ]
  },
  xss: {
    owasp: 'A03:2021-Injection',
    cwe: 'CWE-79',
    clauses: [
      { framework: 'OWASP_ASVS', clause_id: 'V5.3.3', clause_title: 'XSS Prevention', clause_text: 'Verify that output encoding is applied to prevent reflected, stored, and DOM-based XSS attacks.', clause_section: 'V5.3' },
      { framework: 'PCI_DSS', clause_id: '6.5.7', clause_title: 'Cross-Site Scripting', clause_text: 'Address cross-site scripting (XSS) flaws.', clause_section: 'Requirement 6' },
      { framework: 'NIST_800_53', clause_id: 'SI-10', clause_title: 'Information Input Validation', clause_text: 'The information system checks the validity of information inputs.', clause_section: 'SI' },
      { framework: 'SOC2', clause_id: 'CC6.1', clause_title: 'Logical and Physical Access Controls', clause_text: 'The entity implements logical access controls.', clause_section: 'CC6' },
    ]
  },
  // ── Access Control ──
  path_traversal: {
    owasp: 'A01:2021-Broken Access Control',
    cwe: 'CWE-22',
    clauses: [
      { framework: 'OWASP_ASVS', clause_id: 'V4.2.1', clause_title: 'Path Traversal Prevention', clause_text: 'Verify that the application canonicalizes path names before checking access control.', clause_section: 'V4.2 - Access Control Design' },
      { framework: 'NIST_800_53', clause_id: 'AC-3', clause_title: 'Access Enforcement', clause_text: 'The information system enforces approved authorizations for logical access to information and system resources.', clause_section: 'AC - Access Control' },
      { framework: 'ISO_27001', clause_id: 'A.9.4.4', clause_title: 'Use of Privileged Utility Programs', clause_text: 'Restriction of access to utility programs is enforced.', clause_section: 'A.9 - Access Control' },
      { framework: 'CIS', clause_id: 'CIS-14.6', clause_title: 'Protect Information in Transit', clause_text: 'Ensure file system access is restricted and validated.', clause_section: 'CIS Control 14' },
    ]
  },
  missing_auth: {
    owasp: 'A01:2021-Broken Access Control',
    cwe: 'CWE-862',
    clauses: [
      { framework: 'OWASP_ASVS', clause_id: 'V4.1.1', clause_title: 'Authentication Enforcement', clause_text: 'Verify that the application enforces authentication on all application components.', clause_section: 'V4.1 - Access Control Architecture' },
      { framework: 'NIST_800_53', clause_id: 'AC-2', clause_title: 'Account Management', clause_text: 'The organization manages information system accounts, including establishing, activating, deactivating, and reviewing accounts.', clause_section: 'AC' },
      { framework: 'ISO_27001', clause_id: 'A.9.4.2', clause_title: 'Secure Log-on Procedures', clause_text: 'Access to all systems, application programs and data shall be controlled by a secure log-on procedure.', clause_section: 'A.9.4 - User Identity Management' },
      { framework: 'SOC2', clause_id: 'CC6.1', clause_title: 'Logical and Physical Access Controls', clause_text: 'The entity implements logical access security software, infrastructure, and architectures over secured assets.', clause_section: 'CC6' },
      { framework: 'PCI_DSS', clause_id: '7.1', clause_title: 'Restrict Access to Cardholder Data', clause_text: 'Limit access to system components and cardholder data to only those individuals whose job requires such access.', clause_section: 'Requirement 7' },
    ]
  },
  // ── Cryptography ──
  hardcoded_secret: {
    owasp: 'A02:2021-Cryptographic Failures',
    cwe: 'CWE-798',
    clauses: [
      { framework: 'OWASP_ASVS', clause_id: 'V6.2.1', clause_title: 'Secrets Management', clause_text: 'Verify that secrets are not hardcoded in source code and are stored in a secure vault.', clause_section: 'V6.2 - Cryptography' },
      { framework: 'PCI_DSS', clause_id: '3.5', clause_title: 'Secure Authentication Credentials', clause_text: 'Protect authentication credentials used to access payment card data.', clause_section: 'Requirement 3' },
      { framework: 'NIST_800_53', clause_id: 'IA-5', clause_title: 'Authenticator Management', clause_text: 'The organization protects authenticators commensurate with the security category of the information.', clause_section: 'IA - Identification and Authentication' },
      { framework: 'ISO_27001', clause_id: 'A.10.1.2', clause_title: 'Key Management', clause_text: 'A policy on the use, protection and lifetime of cryptographic keys shall be developed and implemented.', clause_section: 'A.10 - Cryptography' },
      { framework: 'FIPS_140_2', clause_id: '4.9.1', clause_title: 'Key Management', clause_text: 'Cryptographic keys shall be managed throughout their lifecycle using automated mechanisms.', clause_section: 'Section 4 - Roles, Services and Authentication' },
      { framework: 'SOC2', clause_id: 'CC6.7', clause_title: 'Restrict Access to Sensitive Data', clause_text: 'The entity restricts access to sensitive information to authorized users.', clause_section: 'CC6' },
    ]
  },
  weak_crypto: {
    owasp: 'A02:2021-Cryptographic Failures',
    cwe: 'CWE-327',
    clauses: [
      { framework: 'OWASP_ASVS', clause_id: 'V6.2.3', clause_title: 'Weak Algorithm Prevention', clause_text: 'Verify that deprecated or weak cryptographic algorithms are not used for any security controls.', clause_section: 'V6.2' },
      { framework: 'PCI_DSS', clause_id: '4.1', clause_title: 'Strong Cryptography', clause_text: 'Use strong cryptography and security protocols to safeguard cardholder data during transmission over open, public networks.', clause_section: 'Requirement 4' },
      { framework: 'NIST_800_53', clause_id: 'SC-13', clause_title: 'Cryptographic Protection', clause_text: 'The information system implements FIPS-validated cryptographic modules for security functions.', clause_section: 'SC - System and Communications Protection' },
      { framework: 'FIPS_140_2', clause_id: 'Annex_A', clause_title: 'Approved Cryptographic Algorithms', clause_text: 'Only NIST-approved cryptographic algorithms shall be used for cryptographic protection.', clause_section: 'Annex A - Approved Cryptographic Algorithms' },
    ]
  },
  // ── SSRF ──
  ssrf: {
    owasp: 'A10:2021-SSRF',
    cwe: 'CWE-918',
    clauses: [
      { framework: 'OWASP_ASVS', clause_id: 'V12.6.1', clause_title: 'SSRF Prevention', clause_text: 'Verify that the application validates and restricts outbound HTTP requests to prevent SSRF.', clause_section: 'V12 - Files and Resources' },
      { framework: 'NIST_800_53', clause_id: 'SC-7', clause_title: 'Boundary Protection', clause_text: 'The information system monitors and controls communications at external boundaries and key internal boundaries.', clause_section: 'SC' },
      { framework: 'ISO_27001', clause_id: 'A.13.1.1', clause_title: 'Network Controls', clause_text: 'Controls shall be implemented to provide security for information transferred within and outside the organization.', clause_section: 'A.13 - Communications Security' },
    ]
  },
  // ── Deserialization ──
  deserialization: {
    owasp: 'A08:2021-Software and Data Integrity Failures',
    cwe: 'CWE-502',
    clauses: [
      { framework: 'OWASP_ASVS', clause_id: 'V5.5.1', clause_title: 'Deserialization Prevention', clause_text: 'Verify that untrusted data is not deserialized without integrity checks and type constraints.', clause_section: 'V5.5 - Deserialization' },
      { framework: 'NIST_800_53', clause_id: 'SI-7', clause_title: 'Software, Firmware, and Information Integrity', clause_text: 'The information system detects and protects against unauthorized software and data integrity violations.', clause_section: 'SI' },
      { framework: 'ISO_27001', clause_id: 'A.14.2.6', clause_title: 'Secure Development Environment', clause_text: 'Development environments shall be secured and protected from attack.', clause_section: 'A.14.2' },
    ]
  },
  // ── Configuration ──
  cors_misconfig: {
    owasp: 'A05:2021-Security Misconfiguration',
    cwe: 'CWE-942',
    clauses: [
      { framework: 'OWASP_ASVS', clause_id: 'V14.5.1', clause_title: 'CORS Configuration', clause_text: 'Verify that CORS policies are restrictive and do not allow wildcard origins in production.', clause_section: 'V14 - Configuration' },
      { framework: 'NIST_800_53', clause_id: 'AC-4', clause_title: 'Information Flow Enforcement', clause_text: 'The information system enforces approved authorizations for controlling information flows.', clause_section: 'AC' },
      { framework: 'ISO_27001', clause_id: 'A.13.1.3', clause_title: 'Security of Network Services', clause_text: 'Security mechanisms, service levels and management requirements of all network services shall be identified and documented.', clause_section: 'A.13' },
    ]
  },
  // ── Availability ──
  rate_limiting: {
    owasp: 'A04:2021-Insecure Design',
    cwe: 'CWE-770',
    clauses: [
      { framework: 'OWASP_ASVS', clause_id: 'V11.1.1', clause_title: 'Rate Limiting', clause_text: 'Verify that rate limiting is enforced on all API endpoints to prevent brute force and DoS attacks.', clause_section: 'V11 - Business Logic' },
      { framework: 'NIST_800_53', clause_id: 'SC-5', clause_title: 'Denial of Service Protection', clause_text: 'The information system restricts the ability of users to launch denial of service attacks.', clause_section: 'SC' },
    ]
  },
}

// Framework metadata for reporting
const FRAMEWORKS = {
  OWASP_ASVS: { name: 'OWASP Application Security Verification Standard', version: '4.0.3', url: 'https://owasp.org/www-project-application-security-verification-standard/' },
  PCI_DSS: { name: 'Payment Card Industry Data Security Standard', version: '4.0', url: 'https://www.pcisecuritystandards.org/document_library' },
  NIST_800_53: { name: 'NIST Special Publication 800-53', version: 'Rev 5', url: 'https://csrc.nist.gov/publications/detail/sp/800-53/rev-5/final' },
  ISO_27001: { name: 'ISO/IEC 27001 Information Security Management', version: '2022', url: 'https://www.iso.org/standard/27001' },
  CIS: { name: 'CIS Controls', version: 'v8', url: 'https://www.cisecurity.org/controls' },
  FIPS_140_2: { name: 'FIPS 140-2 Cryptographic Module Validation', version: 'Change Notice 12', url: 'https://csrc.nist.gov/publications/detail/fips/140/2/final' },
  SOC2: { name: 'SOC 2 Trust Services Criteria', version: '2017', url: 'https://www.aicpa.org/interestareas/frc/assuranceadvisoryservices/sorhome.html' },
}

function mapFindingToClauses(finding) {
  const category = finding.semantic_type || finding.category || finding.scanner
  const clauseSet = CLAUSE_DATABASE[category]

  if (!clauseSet) {
    // Default mapping for unknown categories
    return [{
      framework: 'OWASP_ASVS',
      clause_id: 'V1.1.1',
      clause_title: 'Secure Software Development Lifecycle',
      clause_text: 'Verify the use of a secure software development lifecycle that addresses security at all stages.',
      clause_section: 'V1 - Architecture, Threat Modeling and Secure Design',
      evidence_type: category,
      evidence_line_start: finding.line_start,
      evidence_line_end: finding.line_end,
      evidence_snippet: finding.evidence || finding.code_snippet || '',
      evidence_hash: hashEvidence(finding.evidence || finding.code_snippet || ''),
      mapped_severity: finding.severity || 'medium',
      remediation_priority: finding.severity === 'critical' ? 1 : finding.severity === 'high' ? 2 : 3,
      ai_verified: false,
      ai_confidence: 0.00,
    }]
  }

  return clauseSet.clauses.map(clause => ({
    framework: clause.framework,
    clause_id: clause.clause_id,
    clause_title: clause.clause_title,
    clause_text: clause.clause_text,
    clause_section: clause.clause_section,
    clause_url: FRAMEWORKS[clause.framework]?.url,
    evidence_type: category,
    evidence_line_start: finding.line_start,
    evidence_line_end: finding.line_end,
    evidence_snippet: finding.evidence || finding.code_snippet || '',
    evidence_hash: hashEvidence(finding.evidence || finding.code_snippet || finding.file_path + ':' + finding.line_start),
    mapped_severity: finding.severity || 'medium',
    remediation_priority: finding.severity === 'critical' ? 1 : finding.severity === 'high' ? 2 : finding.severity === 'medium' ? 3 : 5,
    ai_verified: (finding.confidence || 0) > 0.85,
    ai_provider: finding.ai_provider || 'deterministic',
    ai_model: finding.ai_model || 'clause-mapper-v2',
    ai_confidence: finding.confidence || 0.90,
    owasp: clauseSet.owasp,
    cwe: clauseSet.cwe,
  }))
}

function hashEvidence(evidence) {
  return crypto.createHash('sha256').update(evidence).digest('hex').slice(0, 16)
}

function generateComplianceReport(findings, options = {}) {
  const { format = 'json', groupBy = 'framework' } = options
  const allClauses = findings.map(mapFindingToClauses).flat()

  if (groupBy === 'framework') {
    const grouped = {}
    for (const clause of allClauses) {
      if (!grouped[clause.framework]) {
        grouped[clause.framework] = {
          name: FRAMEWORKS[clause.framework]?.name || clause.framework,
          version: FRAMEWORKS[clause.framework]?.version || '',
          url: FRAMEWORKS[clause.framework]?.url || '',
          clauses: {},
        }
      }
      if (!grouped[clause.framework].clauses[clause.clause_id]) {
        grouped[clause.framework].clauses[clause.clause_id] = {
          clause_id: clause.clause_id,
          clause_title: clause.clause_title,
          clause_text: clause.clause_text,
          clause_section: clause.clause_section,
          findings: [],
        }
      }
      grouped[clause.framework].clauses[clause.clause_id].findings.push({
        evidence_type: clause.evidence_type,
        evidence_line_start: clause.evidence_line_start,
        evidence_line_end: clause.evidence_line_end,
        evidence_snippet: clause.evidence_snippet,
        evidence_hash: clause.evidence_hash,
        mapped_severity: clause.mapped_severity,
        remediation_priority: clause.remediation_priority,
        ai_verified: clause.ai_verified,
        ai_confidence: clause.ai_confidence,
      })
    }
    // Calculate compliance status per framework
    for (const fw of Object.values(grouped)) {
      let total = 0, critical = 0, high = 0
      for (const clause of Object.values(fw.clauses)) {
        total += clause.findings.length
        critical += clause.findings.filter(f => f.mapped_severity === 'critical').length
        high += clause.findings.filter(f => f.mapped_severity === 'high').length
      }
      fw.summary = {
        total_clauses_violated: Object.keys(fw.clauses).length,
        total_findings: total,
        critical_findings: critical,
        high_findings: high,
        compliance_status: critical > 0 ? 'non_compliant' : high > 0 ? 'partially_compliant' : 'needs_review',
      }
    }
    return grouped
  }

  return allClauses
}

module.exports = {
  CLAUSE_DATABASE,
  FRAMEWORKS,
  mapFindingToClauses,
  generateComplianceReport,
  hashEvidence,
}
