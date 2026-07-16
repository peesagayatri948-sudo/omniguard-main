// scripts/seed-policies.js
const { Client } = require('pg');
require('dotenv').config();

const rules = [
  {
    "rule_id": "SAST-001",
    "category": "sast",
    "title": "Secure Coding - SQL Injection (SQLi)",
    "description": "Ensure protection against SQL Injection (SQLi) vulnerabilities in application source code.",
    "severity": "critical",
    "clause_reference": "CWE-79"
  },
  {
    "rule_id": "SAST-002",
    "category": "sast",
    "title": "Secure Coding - Cross-Site Scripting (XSS)",
    "description": "Ensure protection against Cross-Site Scripting (XSS) vulnerabilities in application source code.",
    "severity": "critical",
    "clause_reference": "CWE-80"
  },
  {
    "rule_id": "SAST-003",
    "category": "sast",
    "title": "Secure Coding - Cross-Site Request Forgery (CSRF)",
    "description": "Ensure protection against Cross-Site Request Forgery (CSRF) vulnerabilities in application source code.",
    "severity": "critical",
    "clause_reference": "CWE-81"
  },
  {
    "rule_id": "SAST-004",
    "category": "sast",
    "title": "Secure Coding - Path Traversal",
    "description": "Ensure protection against Path Traversal vulnerabilities in application source code.",
    "severity": "critical",
    "clause_reference": "CWE-82"
  },
  {
    "rule_id": "SAST-005",
    "category": "sast",
    "title": "Secure Coding - Insecure Deserialization",
    "description": "Ensure protection against Insecure Deserialization vulnerabilities in application source code.",
    "severity": "critical",
    "clause_reference": "CWE-83"
  },
  {
    "rule_id": "SAST-006",
    "category": "sast",
    "title": "Secure Coding - OS Command Injection",
    "description": "Ensure protection against OS Command Injection vulnerabilities in application source code.",
    "severity": "critical",
    "clause_reference": "CWE-84"
  },
  {
    "rule_id": "SAST-007",
    "category": "sast",
    "title": "Secure Coding - XML External Entity (XXE) Injection",
    "description": "Ensure protection against XML External Entity (XXE) Injection vulnerabilities in application source code.",
    "severity": "critical",
    "clause_reference": "CWE-85"
  },
  {
    "rule_id": "SAST-008",
    "category": "sast",
    "title": "Secure Coding - Hardcoded Credentials",
    "description": "Ensure protection against Hardcoded Credentials vulnerabilities in application source code.",
    "severity": "critical",
    "clause_reference": "CWE-86"
  },
  {
    "rule_id": "SAST-009",
    "category": "sast",
    "title": "Secure Coding - Insecure Cryptographic Storage",
    "description": "Ensure protection against Insecure Cryptographic Storage vulnerabilities in application source code.",
    "severity": "critical",
    "clause_reference": "CWE-87"
  },
  {
    "rule_id": "SAST-010",
    "category": "sast",
    "title": "Secure Coding - Insufficient Logging & Monitoring",
    "description": "Ensure protection against Insufficient Logging & Monitoring vulnerabilities in application source code.",
    "severity": "critical",
    "clause_reference": "CWE-88"
  },
  {
    "rule_id": "SAST-011",
    "category": "sast",
    "title": "Secure Coding - Server-Side Request Forgery (SSRF)",
    "description": "Ensure protection against Server-Side Request Forgery (SSRF) vulnerabilities in application source code.",
    "severity": "critical",
    "clause_reference": "CWE-89"
  },
  {
    "rule_id": "SAST-012",
    "category": "sast",
    "title": "Secure Coding - Buffer Overflow",
    "description": "Ensure protection against Buffer Overflow vulnerabilities in application source code.",
    "severity": "critical",
    "clause_reference": "CWE-90"
  },
  {
    "rule_id": "SAST-013",
    "category": "sast",
    "title": "Secure Coding - Format String Vulnerability",
    "description": "Ensure protection against Format String Vulnerability vulnerabilities in application source code.",
    "severity": "critical",
    "clause_reference": "CWE-91"
  },
  {
    "rule_id": "SAST-014",
    "category": "sast",
    "title": "Secure Coding - Unrestricted File Upload",
    "description": "Ensure protection against Unrestricted File Upload vulnerabilities in application source code.",
    "severity": "critical",
    "clause_reference": "CWE-92"
  },
  {
    "rule_id": "SAST-015",
    "category": "sast",
    "title": "Secure Coding - Use of Hard-coded Password",
    "description": "Ensure protection against Use of Hard-coded Password vulnerabilities in application source code.",
    "severity": "critical",
    "clause_reference": "CWE-93"
  },
  {
    "rule_id": "SAST-016",
    "category": "sast",
    "title": "Secure Coding - Missing Authorization",
    "description": "Ensure protection against Missing Authorization vulnerabilities in application source code.",
    "severity": "high",
    "clause_reference": "CWE-94"
  },
  {
    "rule_id": "SAST-017",
    "category": "sast",
    "title": "Secure Coding - Missing Authentication for Critical Function",
    "description": "Ensure protection against Missing Authentication for Critical Function vulnerabilities in application source code.",
    "severity": "high",
    "clause_reference": "CWE-95"
  },
  {
    "rule_id": "SAST-018",
    "category": "sast",
    "title": "Secure Coding - Exposure of Sensitive Information",
    "description": "Ensure protection against Exposure of Sensitive Information vulnerabilities in application source code.",
    "severity": "high",
    "clause_reference": "CWE-96"
  },
  {
    "rule_id": "SAST-019",
    "category": "sast",
    "title": "Secure Coding - Improper Input Validation",
    "description": "Ensure protection against Improper Input Validation vulnerabilities in application source code.",
    "severity": "high",
    "clause_reference": "CWE-97"
  },
  {
    "rule_id": "SAST-020",
    "category": "sast",
    "title": "Secure Coding - Improper Output Neutralization",
    "description": "Ensure protection against Improper Output Neutralization vulnerabilities in application source code.",
    "severity": "high",
    "clause_reference": "CWE-98"
  },
  {
    "rule_id": "SAST-021",
    "category": "sast",
    "title": "Secure Coding - Cleartext Transmission of Sensitive Information",
    "description": "Ensure protection against Cleartext Transmission of Sensitive Information vulnerabilities in application source code.",
    "severity": "high",
    "clause_reference": "CWE-99"
  },
  {
    "rule_id": "SAST-022",
    "category": "sast",
    "title": "Secure Coding - Use of Broken Cryptographic Algorithm",
    "description": "Ensure protection against Use of Broken Cryptographic Algorithm vulnerabilities in application source code.",
    "severity": "high",
    "clause_reference": "CWE-100"
  },
  {
    "rule_id": "SAST-023",
    "category": "sast",
    "title": "Secure Coding - Reliance on Untrusted Inputs in a Security Decision",
    "description": "Ensure protection against Reliance on Untrusted Inputs in a Security Decision vulnerabilities in application source code.",
    "severity": "high",
    "clause_reference": "CWE-101"
  },
  {
    "rule_id": "SAST-024",
    "category": "sast",
    "title": "Secure Coding - Improper Access Control",
    "description": "Ensure protection against Improper Access Control vulnerabilities in application source code.",
    "severity": "high",
    "clause_reference": "CWE-102"
  },
  {
    "rule_id": "SAST-025",
    "category": "sast",
    "title": "Secure Coding - Insecure Randomness",
    "description": "Ensure protection against Insecure Randomness vulnerabilities in application source code.",
    "severity": "high",
    "clause_reference": "CWE-103"
  },
  {
    "rule_id": "SAST-026",
    "category": "sast",
    "title": "Secure Coding - Weak Password Requirements",
    "description": "Ensure protection against Weak Password Requirements vulnerabilities in application source code.",
    "severity": "high",
    "clause_reference": "CWE-104"
  },
  {
    "rule_id": "SAST-027",
    "category": "sast",
    "title": "Secure Coding - Improper Certificate Validation",
    "description": "Ensure protection against Improper Certificate Validation vulnerabilities in application source code.",
    "severity": "high",
    "clause_reference": "CWE-105"
  },
  {
    "rule_id": "SAST-028",
    "category": "sast",
    "title": "Secure Coding - Use of Potentially Dangerous Function",
    "description": "Ensure protection against Use of Potentially Dangerous Function vulnerabilities in application source code.",
    "severity": "high",
    "clause_reference": "CWE-106"
  },
  {
    "rule_id": "SAST-029",
    "category": "sast",
    "title": "Secure Coding - Out-of-bounds Read",
    "description": "Ensure protection against Out-of-bounds Read vulnerabilities in application source code.",
    "severity": "high",
    "clause_reference": "CWE-107"
  },
  {
    "rule_id": "SAST-030",
    "category": "sast",
    "title": "Secure Coding - Out-of-bounds Write",
    "description": "Ensure protection against Out-of-bounds Write vulnerabilities in application source code.",
    "severity": "high",
    "clause_reference": "CWE-108"
  },
  {
    "rule_id": "DAST-001",
    "category": "dast",
    "title": "Runtime Security - Authentication Bypass",
    "description": "Detect and mitigate Authentication Bypass during runtime dynamic analysis.",
    "severity": "critical",
    "clause_reference": "OWASP-Top10-1"
  },
  {
    "rule_id": "DAST-002",
    "category": "dast",
    "title": "Runtime Security - Missing HTTP Strict Transport Security (HSTS)",
    "description": "Detect and mitigate Missing HTTP Strict Transport Security (HSTS) during runtime dynamic analysis.",
    "severity": "critical",
    "clause_reference": "OWASP-Top10-2"
  },
  {
    "rule_id": "DAST-003",
    "category": "dast",
    "title": "Runtime Security - Clickjacking: X-Frame-Options Header Missing",
    "description": "Detect and mitigate Clickjacking: X-Frame-Options Header Missing during runtime dynamic analysis.",
    "severity": "critical",
    "clause_reference": "OWASP-Top10-3"
  },
  {
    "rule_id": "DAST-004",
    "category": "dast",
    "title": "Runtime Security - Content Security Policy (CSP) Missing",
    "description": "Detect and mitigate Content Security Policy (CSP) Missing during runtime dynamic analysis.",
    "severity": "critical",
    "clause_reference": "OWASP-Top10-4"
  },
  {
    "rule_id": "DAST-005",
    "category": "dast",
    "title": "Runtime Security - Insecure Cookie Configuration (Missing Secure/HttpOnly)",
    "description": "Detect and mitigate Insecure Cookie Configuration (Missing Secure/HttpOnly) during runtime dynamic analysis.",
    "severity": "critical",
    "clause_reference": "OWASP-Top10-5"
  },
  {
    "rule_id": "DAST-006",
    "category": "dast",
    "title": "Runtime Security - Cross-Origin Resource Sharing (CORS) Misconfiguration",
    "description": "Detect and mitigate Cross-Origin Resource Sharing (CORS) Misconfiguration during runtime dynamic analysis.",
    "severity": "critical",
    "clause_reference": "OWASP-Top10-6"
  },
  {
    "rule_id": "DAST-007",
    "category": "dast",
    "title": "Runtime Security - Directory Listing Enabled",
    "description": "Detect and mitigate Directory Listing Enabled during runtime dynamic analysis.",
    "severity": "critical",
    "clause_reference": "OWASP-Top10-7"
  },
  {
    "rule_id": "DAST-008",
    "category": "dast",
    "title": "Runtime Security - Information Disclosure via Error Messages",
    "description": "Detect and mitigate Information Disclosure via Error Messages during runtime dynamic analysis.",
    "severity": "critical",
    "clause_reference": "OWASP-Top10-8"
  },
  {
    "rule_id": "DAST-009",
    "category": "dast",
    "title": "Runtime Security - Session Fixation",
    "description": "Detect and mitigate Session Fixation during runtime dynamic analysis.",
    "severity": "critical",
    "clause_reference": "OWASP-Top10-9"
  },
  {
    "rule_id": "DAST-010",
    "category": "dast",
    "title": "Runtime Security - Reflected XSS",
    "description": "Detect and mitigate Reflected XSS during runtime dynamic analysis.",
    "severity": "critical",
    "clause_reference": "OWASP-Top10-10"
  },
  {
    "rule_id": "DAST-011",
    "category": "dast",
    "title": "Runtime Security - Stored XSS",
    "description": "Detect and mitigate Stored XSS during runtime dynamic analysis.",
    "severity": "critical",
    "clause_reference": "OWASP-Top10-1"
  },
  {
    "rule_id": "DAST-012",
    "category": "dast",
    "title": "Runtime Security - DOM-based XSS",
    "description": "Detect and mitigate DOM-based XSS during runtime dynamic analysis.",
    "severity": "critical",
    "clause_reference": "OWASP-Top10-2"
  },
  {
    "rule_id": "DAST-013",
    "category": "dast",
    "title": "Runtime Security - Blind SQL Injection",
    "description": "Detect and mitigate Blind SQL Injection during runtime dynamic analysis.",
    "severity": "critical",
    "clause_reference": "OWASP-Top10-3"
  },
  {
    "rule_id": "DAST-014",
    "category": "dast",
    "title": "Runtime Security - Time-based SQL Injection",
    "description": "Detect and mitigate Time-based SQL Injection during runtime dynamic analysis.",
    "severity": "critical",
    "clause_reference": "OWASP-Top10-4"
  },
  {
    "rule_id": "DAST-015",
    "category": "dast",
    "title": "Runtime Security - Open Redirect",
    "description": "Detect and mitigate Open Redirect during runtime dynamic analysis.",
    "severity": "critical",
    "clause_reference": "OWASP-Top10-5"
  },
  {
    "rule_id": "DAST-016",
    "category": "dast",
    "title": "Runtime Security - HTTP Parameter Pollution",
    "description": "Detect and mitigate HTTP Parameter Pollution during runtime dynamic analysis.",
    "severity": "critical",
    "clause_reference": "OWASP-Top10-6"
  },
  {
    "rule_id": "DAST-017",
    "category": "dast",
    "title": "Runtime Security - Subdomain Takeover",
    "description": "Detect and mitigate Subdomain Takeover during runtime dynamic analysis.",
    "severity": "high",
    "clause_reference": "OWASP-Top10-7"
  },
  {
    "rule_id": "DAST-018",
    "category": "dast",
    "title": "Runtime Security - Server Misconfiguration",
    "description": "Detect and mitigate Server Misconfiguration during runtime dynamic analysis.",
    "severity": "high",
    "clause_reference": "OWASP-Top10-8"
  },
  {
    "rule_id": "DAST-019",
    "category": "dast",
    "title": "Runtime Security - SSL/TLS Weak Ciphers Supported",
    "description": "Detect and mitigate SSL/TLS Weak Ciphers Supported during runtime dynamic analysis.",
    "severity": "high",
    "clause_reference": "OWASP-Top10-9"
  },
  {
    "rule_id": "DAST-020",
    "category": "dast",
    "title": "Runtime Security - SSL/TLS Certificate Expired",
    "description": "Detect and mitigate SSL/TLS Certificate Expired during runtime dynamic analysis.",
    "severity": "high",
    "clause_reference": "OWASP-Top10-10"
  },
  {
    "rule_id": "DAST-021",
    "category": "dast",
    "title": "Runtime Security - Unauthenticated API Endpoints",
    "description": "Detect and mitigate Unauthenticated API Endpoints during runtime dynamic analysis.",
    "severity": "high",
    "clause_reference": "OWASP-Top10-1"
  },
  {
    "rule_id": "DAST-022",
    "category": "dast",
    "title": "Runtime Security - Rate Limiting Missing",
    "description": "Detect and mitigate Rate Limiting Missing during runtime dynamic analysis.",
    "severity": "high",
    "clause_reference": "OWASP-Top10-2"
  },
  {
    "rule_id": "DAST-023",
    "category": "dast",
    "title": "Runtime Security - XML Bomb (Billion Laughs)",
    "description": "Detect and mitigate XML Bomb (Billion Laughs) during runtime dynamic analysis.",
    "severity": "high",
    "clause_reference": "OWASP-Top10-3"
  },
  {
    "rule_id": "DAST-024",
    "category": "dast",
    "title": "Runtime Security - Heartbleed Vulnerability",
    "description": "Detect and mitigate Heartbleed Vulnerability during runtime dynamic analysis.",
    "severity": "high",
    "clause_reference": "OWASP-Top10-4"
  },
  {
    "rule_id": "DAST-025",
    "category": "dast",
    "title": "Runtime Security - Shellshock Vulnerability",
    "description": "Detect and mitigate Shellshock Vulnerability during runtime dynamic analysis.",
    "severity": "high",
    "clause_reference": "OWASP-Top10-5"
  },
  {
    "rule_id": "DAST-026",
    "category": "dast",
    "title": "Runtime Security - Default Credentials Detected",
    "description": "Detect and mitigate Default Credentials Detected during runtime dynamic analysis.",
    "severity": "high",
    "clause_reference": "OWASP-Top10-6"
  },
  {
    "rule_id": "DAST-027",
    "category": "dast",
    "title": "Runtime Security - Sensitive Data in URL",
    "description": "Detect and mitigate Sensitive Data in URL during runtime dynamic analysis.",
    "severity": "high",
    "clause_reference": "OWASP-Top10-7"
  },
  {
    "rule_id": "DAST-028",
    "category": "dast",
    "title": "Runtime Security - HTTP Trace/Track Methods Enabled",
    "description": "Detect and mitigate HTTP Trace/Track Methods Enabled during runtime dynamic analysis.",
    "severity": "high",
    "clause_reference": "OWASP-Top10-8"
  },
  {
    "rule_id": "DAST-029",
    "category": "dast",
    "title": "Runtime Security - Cache Poisoning",
    "description": "Detect and mitigate Cache Poisoning during runtime dynamic analysis.",
    "severity": "high",
    "clause_reference": "OWASP-Top10-9"
  },
  {
    "rule_id": "DAST-030",
    "category": "dast",
    "title": "Runtime Security - Brute Force Login Vulnerability",
    "description": "Detect and mitigate Brute Force Login Vulnerability during runtime dynamic analysis.",
    "severity": "high",
    "clause_reference": "OWASP-Top10-10"
  },
  {
    "rule_id": "PCI-DSS-4.0-Req2.1",
    "category": "pci",
    "title": "PCI DSS Requirement 2 Sub-rule 1",
    "description": "Ensure compliance with PCI DSS v4.0 Requirement 2, emphasizing secure network configurations, data protection, and vulnerability management.",
    "severity": "critical",
    "clause_reference": "PCI DSS v4.0 Requirement 2"
  },
  {
    "rule_id": "PCI-DSS-4.0-Req3.2",
    "category": "pci",
    "title": "PCI DSS Requirement 3 Sub-rule 2",
    "description": "Ensure compliance with PCI DSS v4.0 Requirement 3, emphasizing secure network configurations, data protection, and vulnerability management.",
    "severity": "critical",
    "clause_reference": "PCI DSS v4.0 Requirement 3"
  },
  {
    "rule_id": "PCI-DSS-4.0-Req4.3",
    "category": "pci",
    "title": "PCI DSS Requirement 4 Sub-rule 3",
    "description": "Ensure compliance with PCI DSS v4.0 Requirement 4, emphasizing secure network configurations, data protection, and vulnerability management.",
    "severity": "critical",
    "clause_reference": "PCI DSS v4.0 Requirement 4"
  },
  {
    "rule_id": "PCI-DSS-4.0-Req5.4",
    "category": "pci",
    "title": "PCI DSS Requirement 5 Sub-rule 4",
    "description": "Ensure compliance with PCI DSS v4.0 Requirement 5, emphasizing secure network configurations, data protection, and vulnerability management.",
    "severity": "critical",
    "clause_reference": "PCI DSS v4.0 Requirement 5"
  },
  {
    "rule_id": "PCI-DSS-4.0-Req6.5",
    "category": "pci",
    "title": "PCI DSS Requirement 6 Sub-rule 5",
    "description": "Ensure compliance with PCI DSS v4.0 Requirement 6, emphasizing secure network configurations, data protection, and vulnerability management.",
    "severity": "critical",
    "clause_reference": "PCI DSS v4.0 Requirement 6"
  },
  {
    "rule_id": "PCI-DSS-4.0-Req7.6",
    "category": "pci",
    "title": "PCI DSS Requirement 7 Sub-rule 6",
    "description": "Ensure compliance with PCI DSS v4.0 Requirement 7, emphasizing secure network configurations, data protection, and vulnerability management.",
    "severity": "critical",
    "clause_reference": "PCI DSS v4.0 Requirement 7"
  },
  {
    "rule_id": "PCI-DSS-4.0-Req8.7",
    "category": "pci",
    "title": "PCI DSS Requirement 8 Sub-rule 7",
    "description": "Ensure compliance with PCI DSS v4.0 Requirement 8, emphasizing secure network configurations, data protection, and vulnerability management.",
    "severity": "critical",
    "clause_reference": "PCI DSS v4.0 Requirement 8"
  },
  {
    "rule_id": "PCI-DSS-4.0-Req9.8",
    "category": "pci",
    "title": "PCI DSS Requirement 9 Sub-rule 8",
    "description": "Ensure compliance with PCI DSS v4.0 Requirement 9, emphasizing secure network configurations, data protection, and vulnerability management.",
    "severity": "critical",
    "clause_reference": "PCI DSS v4.0 Requirement 9"
  },
  {
    "rule_id": "PCI-DSS-4.0-Req10.9",
    "category": "pci",
    "title": "PCI DSS Requirement 10 Sub-rule 9",
    "description": "Ensure compliance with PCI DSS v4.0 Requirement 10, emphasizing secure network configurations, data protection, and vulnerability management.",
    "severity": "critical",
    "clause_reference": "PCI DSS v4.0 Requirement 10"
  },
  {
    "rule_id": "PCI-DSS-4.0-Req11.10",
    "category": "pci",
    "title": "PCI DSS Requirement 11 Sub-rule 10",
    "description": "Ensure compliance with PCI DSS v4.0 Requirement 11, emphasizing secure network configurations, data protection, and vulnerability management.",
    "severity": "critical",
    "clause_reference": "PCI DSS v4.0 Requirement 11"
  },
  {
    "rule_id": "PCI-DSS-4.0-Req12.11",
    "category": "pci",
    "title": "PCI DSS Requirement 12 Sub-rule 11",
    "description": "Ensure compliance with PCI DSS v4.0 Requirement 12, emphasizing secure network configurations, data protection, and vulnerability management.",
    "severity": "critical",
    "clause_reference": "PCI DSS v4.0 Requirement 12"
  },
  {
    "rule_id": "PCI-DSS-4.0-Req1.12",
    "category": "pci",
    "title": "PCI DSS Requirement 1 Sub-rule 12",
    "description": "Ensure compliance with PCI DSS v4.0 Requirement 1, emphasizing secure network configurations, data protection, and vulnerability management.",
    "severity": "critical",
    "clause_reference": "PCI DSS v4.0 Requirement 1"
  },
  {
    "rule_id": "PCI-DSS-4.0-Req2.13",
    "category": "pci",
    "title": "PCI DSS Requirement 2 Sub-rule 13",
    "description": "Ensure compliance with PCI DSS v4.0 Requirement 2, emphasizing secure network configurations, data protection, and vulnerability management.",
    "severity": "critical",
    "clause_reference": "PCI DSS v4.0 Requirement 2"
  },
  {
    "rule_id": "PCI-DSS-4.0-Req3.14",
    "category": "pci",
    "title": "PCI DSS Requirement 3 Sub-rule 14",
    "description": "Ensure compliance with PCI DSS v4.0 Requirement 3, emphasizing secure network configurations, data protection, and vulnerability management.",
    "severity": "critical",
    "clause_reference": "PCI DSS v4.0 Requirement 3"
  },
  {
    "rule_id": "PCI-DSS-4.0-Req4.15",
    "category": "pci",
    "title": "PCI DSS Requirement 4 Sub-rule 15",
    "description": "Ensure compliance with PCI DSS v4.0 Requirement 4, emphasizing secure network configurations, data protection, and vulnerability management.",
    "severity": "critical",
    "clause_reference": "PCI DSS v4.0 Requirement 4"
  },
  {
    "rule_id": "PCI-DSS-4.0-Req5.16",
    "category": "pci",
    "title": "PCI DSS Requirement 5 Sub-rule 16",
    "description": "Ensure compliance with PCI DSS v4.0 Requirement 5, emphasizing secure network configurations, data protection, and vulnerability management.",
    "severity": "critical",
    "clause_reference": "PCI DSS v4.0 Requirement 5"
  },
  {
    "rule_id": "PCI-DSS-4.0-Req6.17",
    "category": "pci",
    "title": "PCI DSS Requirement 6 Sub-rule 17",
    "description": "Ensure compliance with PCI DSS v4.0 Requirement 6, emphasizing secure network configurations, data protection, and vulnerability management.",
    "severity": "critical",
    "clause_reference": "PCI DSS v4.0 Requirement 6"
  },
  {
    "rule_id": "PCI-DSS-4.0-Req7.18",
    "category": "pci",
    "title": "PCI DSS Requirement 7 Sub-rule 18",
    "description": "Ensure compliance with PCI DSS v4.0 Requirement 7, emphasizing secure network configurations, data protection, and vulnerability management.",
    "severity": "critical",
    "clause_reference": "PCI DSS v4.0 Requirement 7"
  },
  {
    "rule_id": "PCI-DSS-4.0-Req8.19",
    "category": "pci",
    "title": "PCI DSS Requirement 8 Sub-rule 19",
    "description": "Ensure compliance with PCI DSS v4.0 Requirement 8, emphasizing secure network configurations, data protection, and vulnerability management.",
    "severity": "critical",
    "clause_reference": "PCI DSS v4.0 Requirement 8"
  },
  {
    "rule_id": "PCI-DSS-4.0-Req9.20",
    "category": "pci",
    "title": "PCI DSS Requirement 9 Sub-rule 20",
    "description": "Ensure compliance with PCI DSS v4.0 Requirement 9, emphasizing secure network configurations, data protection, and vulnerability management.",
    "severity": "critical",
    "clause_reference": "PCI DSS v4.0 Requirement 9"
  },
  {
    "rule_id": "PCI-DSS-4.0-Req10.21",
    "category": "pci",
    "title": "PCI DSS Requirement 10 Sub-rule 21",
    "description": "Ensure compliance with PCI DSS v4.0 Requirement 10, emphasizing secure network configurations, data protection, and vulnerability management.",
    "severity": "critical",
    "clause_reference": "PCI DSS v4.0 Requirement 10"
  },
  {
    "rule_id": "PCI-DSS-4.0-Req11.22",
    "category": "pci",
    "title": "PCI DSS Requirement 11 Sub-rule 22",
    "description": "Ensure compliance with PCI DSS v4.0 Requirement 11, emphasizing secure network configurations, data protection, and vulnerability management.",
    "severity": "critical",
    "clause_reference": "PCI DSS v4.0 Requirement 11"
  },
  {
    "rule_id": "PCI-DSS-4.0-Req12.23",
    "category": "pci",
    "title": "PCI DSS Requirement 12 Sub-rule 23",
    "description": "Ensure compliance with PCI DSS v4.0 Requirement 12, emphasizing secure network configurations, data protection, and vulnerability management.",
    "severity": "critical",
    "clause_reference": "PCI DSS v4.0 Requirement 12"
  },
  {
    "rule_id": "PCI-DSS-4.0-Req1.24",
    "category": "pci",
    "title": "PCI DSS Requirement 1 Sub-rule 24",
    "description": "Ensure compliance with PCI DSS v4.0 Requirement 1, emphasizing secure network configurations, data protection, and vulnerability management.",
    "severity": "critical",
    "clause_reference": "PCI DSS v4.0 Requirement 1"
  },
  {
    "rule_id": "PCI-DSS-4.0-Req2.25",
    "category": "pci",
    "title": "PCI DSS Requirement 2 Sub-rule 25",
    "description": "Ensure compliance with PCI DSS v4.0 Requirement 2, emphasizing secure network configurations, data protection, and vulnerability management.",
    "severity": "critical",
    "clause_reference": "PCI DSS v4.0 Requirement 2"
  },
  {
    "rule_id": "PCI-DSS-4.0-Req3.26",
    "category": "pci",
    "title": "PCI DSS Requirement 3 Sub-rule 26",
    "description": "Ensure compliance with PCI DSS v4.0 Requirement 3, emphasizing secure network configurations, data protection, and vulnerability management.",
    "severity": "critical",
    "clause_reference": "PCI DSS v4.0 Requirement 3"
  },
  {
    "rule_id": "PCI-DSS-4.0-Req4.27",
    "category": "pci",
    "title": "PCI DSS Requirement 4 Sub-rule 27",
    "description": "Ensure compliance with PCI DSS v4.0 Requirement 4, emphasizing secure network configurations, data protection, and vulnerability management.",
    "severity": "critical",
    "clause_reference": "PCI DSS v4.0 Requirement 4"
  },
  {
    "rule_id": "PCI-DSS-4.0-Req5.28",
    "category": "pci",
    "title": "PCI DSS Requirement 5 Sub-rule 28",
    "description": "Ensure compliance with PCI DSS v4.0 Requirement 5, emphasizing secure network configurations, data protection, and vulnerability management.",
    "severity": "critical",
    "clause_reference": "PCI DSS v4.0 Requirement 5"
  },
  {
    "rule_id": "PCI-DSS-4.0-Req6.29",
    "category": "pci",
    "title": "PCI DSS Requirement 6 Sub-rule 29",
    "description": "Ensure compliance with PCI DSS v4.0 Requirement 6, emphasizing secure network configurations, data protection, and vulnerability management.",
    "severity": "critical",
    "clause_reference": "PCI DSS v4.0 Requirement 6"
  },
  {
    "rule_id": "PCI-DSS-4.0-Req7.30",
    "category": "pci",
    "title": "PCI DSS Requirement 7 Sub-rule 30",
    "description": "Ensure compliance with PCI DSS v4.0 Requirement 7, emphasizing secure network configurations, data protection, and vulnerability management.",
    "severity": "critical",
    "clause_reference": "PCI DSS v4.0 Requirement 7"
  },
  {
    "rule_id": "ISO-27001-A.5.1",
    "category": "iso",
    "title": "Information Security Control A.5.1",
    "description": "Enforce organizational and technical controls aligned with ISO 27001:2022 A.5.1.",
    "severity": "medium",
    "clause_reference": "ISO 27001:2022 Annex A.5.1"
  },
  {
    "rule_id": "ISO-27001-A.5.2",
    "category": "iso",
    "title": "Information Security Control A.5.2",
    "description": "Enforce organizational and technical controls aligned with ISO 27001:2022 A.5.2.",
    "severity": "medium",
    "clause_reference": "ISO 27001:2022 Annex A.5.2"
  },
  {
    "rule_id": "ISO-27001-A.5.3",
    "category": "iso",
    "title": "Information Security Control A.5.3",
    "description": "Enforce organizational and technical controls aligned with ISO 27001:2022 A.5.3.",
    "severity": "medium",
    "clause_reference": "ISO 27001:2022 Annex A.5.3"
  },
  {
    "rule_id": "ISO-27001-A.5.7",
    "category": "iso",
    "title": "Information Security Control A.5.7",
    "description": "Enforce organizational and technical controls aligned with ISO 27001:2022 A.5.7.",
    "severity": "medium",
    "clause_reference": "ISO 27001:2022 Annex A.5.7"
  },
  {
    "rule_id": "ISO-27001-A.5.9",
    "category": "iso",
    "title": "Information Security Control A.5.9",
    "description": "Enforce organizational and technical controls aligned with ISO 27001:2022 A.5.9.",
    "severity": "medium",
    "clause_reference": "ISO 27001:2022 Annex A.5.9"
  },
  {
    "rule_id": "ISO-27001-A.5.10",
    "category": "iso",
    "title": "Information Security Control A.5.10",
    "description": "Enforce organizational and technical controls aligned with ISO 27001:2022 A.5.10.",
    "severity": "medium",
    "clause_reference": "ISO 27001:2022 Annex A.5.10"
  },
  {
    "rule_id": "ISO-27001-A.5.14",
    "category": "iso",
    "title": "Information Security Control A.5.14",
    "description": "Enforce organizational and technical controls aligned with ISO 27001:2022 A.5.14.",
    "severity": "medium",
    "clause_reference": "ISO 27001:2022 Annex A.5.14"
  },
  {
    "rule_id": "ISO-27001-A.5.15",
    "category": "iso",
    "title": "Information Security Control A.5.15",
    "description": "Enforce organizational and technical controls aligned with ISO 27001:2022 A.5.15.",
    "severity": "medium",
    "clause_reference": "ISO 27001:2022 Annex A.5.15"
  },
  {
    "rule_id": "ISO-27001-A.5.16",
    "category": "iso",
    "title": "Information Security Control A.5.16",
    "description": "Enforce organizational and technical controls aligned with ISO 27001:2022 A.5.16.",
    "severity": "medium",
    "clause_reference": "ISO 27001:2022 Annex A.5.16"
  },
  {
    "rule_id": "ISO-27001-A.5.17",
    "category": "iso",
    "title": "Information Security Control A.5.17",
    "description": "Enforce organizational and technical controls aligned with ISO 27001:2022 A.5.17.",
    "severity": "medium",
    "clause_reference": "ISO 27001:2022 Annex A.5.17"
  },
  {
    "rule_id": "ISO-27001-A.8.1",
    "category": "iso",
    "title": "Information Security Control A.8.1",
    "description": "Enforce organizational and technical controls aligned with ISO 27001:2022 A.8.1.",
    "severity": "medium",
    "clause_reference": "ISO 27001:2022 Annex A.8.1"
  },
  {
    "rule_id": "ISO-27001-A.8.2",
    "category": "iso",
    "title": "Information Security Control A.8.2",
    "description": "Enforce organizational and technical controls aligned with ISO 27001:2022 A.8.2.",
    "severity": "medium",
    "clause_reference": "ISO 27001:2022 Annex A.8.2"
  },
  {
    "rule_id": "ISO-27001-A.8.3",
    "category": "iso",
    "title": "Information Security Control A.8.3",
    "description": "Enforce organizational and technical controls aligned with ISO 27001:2022 A.8.3.",
    "severity": "medium",
    "clause_reference": "ISO 27001:2022 Annex A.8.3"
  },
  {
    "rule_id": "ISO-27001-A.8.4",
    "category": "iso",
    "title": "Information Security Control A.8.4",
    "description": "Enforce organizational and technical controls aligned with ISO 27001:2022 A.8.4.",
    "severity": "medium",
    "clause_reference": "ISO 27001:2022 Annex A.8.4"
  },
  {
    "rule_id": "ISO-27001-A.8.5",
    "category": "iso",
    "title": "Information Security Control A.8.5",
    "description": "Enforce organizational and technical controls aligned with ISO 27001:2022 A.8.5.",
    "severity": "medium",
    "clause_reference": "ISO 27001:2022 Annex A.8.5"
  },
  {
    "rule_id": "ISO-27001-A.8.6",
    "category": "iso",
    "title": "Information Security Control A.8.6",
    "description": "Enforce organizational and technical controls aligned with ISO 27001:2022 A.8.6.",
    "severity": "medium",
    "clause_reference": "ISO 27001:2022 Annex A.8.6"
  },
  {
    "rule_id": "ISO-27001-A.8.7",
    "category": "iso",
    "title": "Information Security Control A.8.7",
    "description": "Enforce organizational and technical controls aligned with ISO 27001:2022 A.8.7.",
    "severity": "medium",
    "clause_reference": "ISO 27001:2022 Annex A.8.7"
  },
  {
    "rule_id": "ISO-27001-A.8.8",
    "category": "iso",
    "title": "Information Security Control A.8.8",
    "description": "Enforce organizational and technical controls aligned with ISO 27001:2022 A.8.8.",
    "severity": "medium",
    "clause_reference": "ISO 27001:2022 Annex A.8.8"
  },
  {
    "rule_id": "ISO-27001-A.8.9",
    "category": "iso",
    "title": "Information Security Control A.8.9",
    "description": "Enforce organizational and technical controls aligned with ISO 27001:2022 A.8.9.",
    "severity": "medium",
    "clause_reference": "ISO 27001:2022 Annex A.8.9"
  },
  {
    "rule_id": "ISO-27001-A.8.10",
    "category": "iso",
    "title": "Information Security Control A.8.10",
    "description": "Enforce organizational and technical controls aligned with ISO 27001:2022 A.8.10.",
    "severity": "medium",
    "clause_reference": "ISO 27001:2022 Annex A.8.10"
  },
  {
    "rule_id": "ISO-27001-A.8.11",
    "category": "iso",
    "title": "Information Security Control A.8.11",
    "description": "Enforce organizational and technical controls aligned with ISO 27001:2022 A.8.11.",
    "severity": "medium",
    "clause_reference": "ISO 27001:2022 Annex A.8.11"
  },
  {
    "rule_id": "ISO-27001-A.8.12",
    "category": "iso",
    "title": "Information Security Control A.8.12",
    "description": "Enforce organizational and technical controls aligned with ISO 27001:2022 A.8.12.",
    "severity": "medium",
    "clause_reference": "ISO 27001:2022 Annex A.8.12"
  },
  {
    "rule_id": "ISO-27001-A.8.13",
    "category": "iso",
    "title": "Information Security Control A.8.13",
    "description": "Enforce organizational and technical controls aligned with ISO 27001:2022 A.8.13.",
    "severity": "medium",
    "clause_reference": "ISO 27001:2022 Annex A.8.13"
  },
  {
    "rule_id": "ISO-27001-A.8.14",
    "category": "iso",
    "title": "Information Security Control A.8.14",
    "description": "Enforce organizational and technical controls aligned with ISO 27001:2022 A.8.14.",
    "severity": "medium",
    "clause_reference": "ISO 27001:2022 Annex A.8.14"
  },
  {
    "rule_id": "ISO-27001-A.8.20",
    "category": "iso",
    "title": "Information Security Control A.8.20",
    "description": "Enforce organizational and technical controls aligned with ISO 27001:2022 A.8.20.",
    "severity": "medium",
    "clause_reference": "ISO 27001:2022 Annex A.8.20"
  },
  {
    "rule_id": "ISO-27001-A.8.24",
    "category": "iso",
    "title": "Information Security Control A.8.24",
    "description": "Enforce organizational and technical controls aligned with ISO 27001:2022 A.8.24.",
    "severity": "medium",
    "clause_reference": "ISO 27001:2022 Annex A.8.24"
  },
  {
    "rule_id": "ISO-27001-A.8.25",
    "category": "iso",
    "title": "Information Security Control A.8.25",
    "description": "Enforce organizational and technical controls aligned with ISO 27001:2022 A.8.25.",
    "severity": "medium",
    "clause_reference": "ISO 27001:2022 Annex A.8.25"
  },
  {
    "rule_id": "ISO-27001-A.8.26",
    "category": "iso",
    "title": "Information Security Control A.8.26",
    "description": "Enforce organizational and technical controls aligned with ISO 27001:2022 A.8.26.",
    "severity": "medium",
    "clause_reference": "ISO 27001:2022 Annex A.8.26"
  },
  {
    "rule_id": "ISO-27001-A.8.28",
    "category": "iso",
    "title": "Secure Coding",
    "description": "Enforce organizational and technical controls aligned with ISO 27001:2022 A.8.28.",
    "severity": "medium",
    "clause_reference": "ISO 27001:2022 Annex A.8.28"
  },
  {
    "rule_id": "ISO-27001-A.8.29",
    "category": "iso",
    "title": "Information Security Control A.8.29",
    "description": "Enforce organizational and technical controls aligned with ISO 27001:2022 A.8.29.",
    "severity": "medium",
    "clause_reference": "ISO 27001:2022 Annex A.8.29"
  },
  {
    "rule_id": "SOC2-CC1-1",
    "category": "soc2",
    "title": "SOC 2 Trust Services Criteria - CC1",
    "description": "Ensure continuous monitoring and adherence to SOC 2 compliance for CC1.",
    "severity": "medium",
    "clause_reference": "SOC 2 CC1"
  },
  {
    "rule_id": "SOC2-CC2-2",
    "category": "soc2",
    "title": "SOC 2 Trust Services Criteria - CC2",
    "description": "Ensure continuous monitoring and adherence to SOC 2 compliance for CC2.",
    "severity": "medium",
    "clause_reference": "SOC 2 CC2"
  },
  {
    "rule_id": "SOC2-CC3-3",
    "category": "soc2",
    "title": "SOC 2 Trust Services Criteria - CC3",
    "description": "Ensure continuous monitoring and adherence to SOC 2 compliance for CC3.",
    "severity": "medium",
    "clause_reference": "SOC 2 CC3"
  },
  {
    "rule_id": "SOC2-CC4-4",
    "category": "soc2",
    "title": "SOC 2 Trust Services Criteria - CC4",
    "description": "Ensure continuous monitoring and adherence to SOC 2 compliance for CC4.",
    "severity": "medium",
    "clause_reference": "SOC 2 CC4"
  },
  {
    "rule_id": "SOC2-CC5-5",
    "category": "soc2",
    "title": "SOC 2 Trust Services Criteria - CC5",
    "description": "Ensure continuous monitoring and adherence to SOC 2 compliance for CC5.",
    "severity": "medium",
    "clause_reference": "SOC 2 CC5"
  },
  {
    "rule_id": "SOC2-CC6-6",
    "category": "soc2",
    "title": "SOC 2 Trust Services Criteria - CC6",
    "description": "Ensure continuous monitoring and adherence to SOC 2 compliance for CC6.",
    "severity": "medium",
    "clause_reference": "SOC 2 CC6"
  },
  {
    "rule_id": "SOC2-CC7-7",
    "category": "soc2",
    "title": "SOC 2 Trust Services Criteria - CC7",
    "description": "Ensure continuous monitoring and adherence to SOC 2 compliance for CC7.",
    "severity": "medium",
    "clause_reference": "SOC 2 CC7"
  },
  {
    "rule_id": "SOC2-CC8-8",
    "category": "soc2",
    "title": "SOC 2 Trust Services Criteria - CC8",
    "description": "Ensure continuous monitoring and adherence to SOC 2 compliance for CC8.",
    "severity": "medium",
    "clause_reference": "SOC 2 CC8"
  },
  {
    "rule_id": "SOC2-CC9-9",
    "category": "soc2",
    "title": "SOC 2 Trust Services Criteria - CC9",
    "description": "Ensure continuous monitoring and adherence to SOC 2 compliance for CC9.",
    "severity": "medium",
    "clause_reference": "SOC 2 CC9"
  },
  {
    "rule_id": "SOC2-CC1.1-10",
    "category": "soc2",
    "title": "SOC 2 Trust Services Criteria - CC1.1",
    "description": "Ensure continuous monitoring and adherence to SOC 2 compliance for CC1.1.",
    "severity": "medium",
    "clause_reference": "SOC 2 CC1.1"
  },
  {
    "rule_id": "SOC2-CC2.1-11",
    "category": "soc2",
    "title": "SOC 2 Trust Services Criteria - CC2.1",
    "description": "Ensure continuous monitoring and adherence to SOC 2 compliance for CC2.1.",
    "severity": "medium",
    "clause_reference": "SOC 2 CC2.1"
  },
  {
    "rule_id": "SOC2-CC3.1-12",
    "category": "soc2",
    "title": "SOC 2 Trust Services Criteria - CC3.1",
    "description": "Ensure continuous monitoring and adherence to SOC 2 compliance for CC3.1.",
    "severity": "medium",
    "clause_reference": "SOC 2 CC3.1"
  },
  {
    "rule_id": "SOC2-CC4.1-13",
    "category": "soc2",
    "title": "SOC 2 Trust Services Criteria - CC4.1",
    "description": "Ensure continuous monitoring and adherence to SOC 2 compliance for CC4.1.",
    "severity": "medium",
    "clause_reference": "SOC 2 CC4.1"
  },
  {
    "rule_id": "SOC2-CC5.1-14",
    "category": "soc2",
    "title": "SOC 2 Trust Services Criteria - CC5.1",
    "description": "Ensure continuous monitoring and adherence to SOC 2 compliance for CC5.1.",
    "severity": "medium",
    "clause_reference": "SOC 2 CC5.1"
  },
  {
    "rule_id": "SOC2-CC6.1-15",
    "category": "soc2",
    "title": "SOC 2 Trust Services Criteria - CC6.1",
    "description": "Ensure continuous monitoring and adherence to SOC 2 compliance for CC6.1.",
    "severity": "medium",
    "clause_reference": "SOC 2 CC6.1"
  },
  {
    "rule_id": "SOC2-CC7.1-16",
    "category": "soc2",
    "title": "SOC 2 Trust Services Criteria - CC7.1",
    "description": "Ensure continuous monitoring and adherence to SOC 2 compliance for CC7.1.",
    "severity": "medium",
    "clause_reference": "SOC 2 CC7.1"
  },
  {
    "rule_id": "SOC2-CC8.1-17",
    "category": "soc2",
    "title": "SOC 2 Trust Services Criteria - CC8.1",
    "description": "Ensure continuous monitoring and adherence to SOC 2 compliance for CC8.1.",
    "severity": "medium",
    "clause_reference": "SOC 2 CC8.1"
  },
  {
    "rule_id": "SOC2-CC9.1-18",
    "category": "soc2",
    "title": "SOC 2 Trust Services Criteria - CC9.1",
    "description": "Ensure continuous monitoring and adherence to SOC 2 compliance for CC9.1.",
    "severity": "medium",
    "clause_reference": "SOC 2 CC9.1"
  },
  {
    "rule_id": "SOC2-CC6.1-19",
    "category": "soc2",
    "title": "SOC 2 Trust Services Criteria - CC6.1",
    "description": "Ensure continuous monitoring and adherence to SOC 2 compliance for CC6.1.",
    "severity": "medium",
    "clause_reference": "SOC 2 CC6.1"
  },
  {
    "rule_id": "SOC2-CC6.2-20",
    "category": "soc2",
    "title": "SOC 2 Trust Services Criteria - CC6.2",
    "description": "Ensure continuous monitoring and adherence to SOC 2 compliance for CC6.2.",
    "severity": "medium",
    "clause_reference": "SOC 2 CC6.2"
  },
  {
    "rule_id": "HIPAA-164.312-a-1",
    "category": "hipaa",
    "title": "HIPAA Technical Safeguard 1",
    "description": "Maintain technical safeguards for ePHI access control and encryption to satisfy HIPAA \u00a7164.312 requirement 1.",
    "severity": "high",
    "clause_reference": "HIPAA \u00a7164.312(a)(1)"
  },
  {
    "rule_id": "HIPAA-164.312-a-2",
    "category": "hipaa",
    "title": "HIPAA Technical Safeguard 2",
    "description": "Maintain technical safeguards for ePHI access control and encryption to satisfy HIPAA \u00a7164.312 requirement 2.",
    "severity": "high",
    "clause_reference": "HIPAA \u00a7164.312(a)(2)"
  },
  {
    "rule_id": "HIPAA-164.312-a-3",
    "category": "hipaa",
    "title": "HIPAA Technical Safeguard 3",
    "description": "Maintain technical safeguards for ePHI access control and encryption to satisfy HIPAA \u00a7164.312 requirement 3.",
    "severity": "high",
    "clause_reference": "HIPAA \u00a7164.312(a)(3)"
  },
  {
    "rule_id": "HIPAA-164.312-a-4",
    "category": "hipaa",
    "title": "HIPAA Technical Safeguard 4",
    "description": "Maintain technical safeguards for ePHI access control and encryption to satisfy HIPAA \u00a7164.312 requirement 4.",
    "severity": "high",
    "clause_reference": "HIPAA \u00a7164.312(a)(4)"
  },
  {
    "rule_id": "HIPAA-164.312-a-5",
    "category": "hipaa",
    "title": "HIPAA Technical Safeguard 5",
    "description": "Maintain technical safeguards for ePHI access control and encryption to satisfy HIPAA \u00a7164.312 requirement 5.",
    "severity": "high",
    "clause_reference": "HIPAA \u00a7164.312(a)(5)"
  },
  {
    "rule_id": "HIPAA-164.312-a-6",
    "category": "hipaa",
    "title": "HIPAA Technical Safeguard 6",
    "description": "Maintain technical safeguards for ePHI access control and encryption to satisfy HIPAA \u00a7164.312 requirement 6.",
    "severity": "high",
    "clause_reference": "HIPAA \u00a7164.312(a)(6)"
  },
  {
    "rule_id": "HIPAA-164.312-a-7",
    "category": "hipaa",
    "title": "HIPAA Technical Safeguard 7",
    "description": "Maintain technical safeguards for ePHI access control and encryption to satisfy HIPAA \u00a7164.312 requirement 7.",
    "severity": "high",
    "clause_reference": "HIPAA \u00a7164.312(a)(7)"
  },
  {
    "rule_id": "HIPAA-164.312-a-8",
    "category": "hipaa",
    "title": "HIPAA Technical Safeguard 8",
    "description": "Maintain technical safeguards for ePHI access control and encryption to satisfy HIPAA \u00a7164.312 requirement 8.",
    "severity": "high",
    "clause_reference": "HIPAA \u00a7164.312(a)(8)"
  },
  {
    "rule_id": "HIPAA-164.312-a-9",
    "category": "hipaa",
    "title": "HIPAA Technical Safeguard 9",
    "description": "Maintain technical safeguards for ePHI access control and encryption to satisfy HIPAA \u00a7164.312 requirement 9.",
    "severity": "high",
    "clause_reference": "HIPAA \u00a7164.312(a)(9)"
  },
  {
    "rule_id": "HIPAA-164.312-a-10",
    "category": "hipaa",
    "title": "HIPAA Technical Safeguard 10",
    "description": "Maintain technical safeguards for ePHI access control and encryption to satisfy HIPAA \u00a7164.312 requirement 10.",
    "severity": "high",
    "clause_reference": "HIPAA \u00a7164.312(a)(10)"
  },
  {
    "rule_id": "HIPAA-164.312-a-11",
    "category": "hipaa",
    "title": "HIPAA Technical Safeguard 11",
    "description": "Maintain technical safeguards for ePHI access control and encryption to satisfy HIPAA \u00a7164.312 requirement 11.",
    "severity": "high",
    "clause_reference": "HIPAA \u00a7164.312(a)(11)"
  },
  {
    "rule_id": "HIPAA-164.312-a-12",
    "category": "hipaa",
    "title": "HIPAA Technical Safeguard 12",
    "description": "Maintain technical safeguards for ePHI access control and encryption to satisfy HIPAA \u00a7164.312 requirement 12.",
    "severity": "high",
    "clause_reference": "HIPAA \u00a7164.312(a)(12)"
  },
  {
    "rule_id": "HIPAA-164.312-a-13",
    "category": "hipaa",
    "title": "HIPAA Technical Safeguard 13",
    "description": "Maintain technical safeguards for ePHI access control and encryption to satisfy HIPAA \u00a7164.312 requirement 13.",
    "severity": "high",
    "clause_reference": "HIPAA \u00a7164.312(a)(13)"
  },
  {
    "rule_id": "HIPAA-164.312-a-14",
    "category": "hipaa",
    "title": "HIPAA Technical Safeguard 14",
    "description": "Maintain technical safeguards for ePHI access control and encryption to satisfy HIPAA \u00a7164.312 requirement 14.",
    "severity": "high",
    "clause_reference": "HIPAA \u00a7164.312(a)(14)"
  },
  {
    "rule_id": "HIPAA-164.312-a-15",
    "category": "hipaa",
    "title": "HIPAA Technical Safeguard 15",
    "description": "Maintain technical safeguards for ePHI access control and encryption to satisfy HIPAA \u00a7164.312 requirement 15.",
    "severity": "high",
    "clause_reference": "HIPAA \u00a7164.312(a)(15)"
  },
  {
    "rule_id": "HIPAA-164.312-a-16",
    "category": "hipaa",
    "title": "HIPAA Technical Safeguard 16",
    "description": "Maintain technical safeguards for ePHI access control and encryption to satisfy HIPAA \u00a7164.312 requirement 16.",
    "severity": "high",
    "clause_reference": "HIPAA \u00a7164.312(a)(16)"
  },
  {
    "rule_id": "HIPAA-164.312-a-17",
    "category": "hipaa",
    "title": "HIPAA Technical Safeguard 17",
    "description": "Maintain technical safeguards for ePHI access control and encryption to satisfy HIPAA \u00a7164.312 requirement 17.",
    "severity": "high",
    "clause_reference": "HIPAA \u00a7164.312(a)(17)"
  },
  {
    "rule_id": "HIPAA-164.312-a-18",
    "category": "hipaa",
    "title": "HIPAA Technical Safeguard 18",
    "description": "Maintain technical safeguards for ePHI access control and encryption to satisfy HIPAA \u00a7164.312 requirement 18.",
    "severity": "high",
    "clause_reference": "HIPAA \u00a7164.312(a)(18)"
  },
  {
    "rule_id": "HIPAA-164.312-a-19",
    "category": "hipaa",
    "title": "HIPAA Technical Safeguard 19",
    "description": "Maintain technical safeguards for ePHI access control and encryption to satisfy HIPAA \u00a7164.312 requirement 19.",
    "severity": "high",
    "clause_reference": "HIPAA \u00a7164.312(a)(19)"
  },
  {
    "rule_id": "HIPAA-164.312-a-20",
    "category": "hipaa",
    "title": "HIPAA Technical Safeguard 20",
    "description": "Maintain technical safeguards for ePHI access control and encryption to satisfy HIPAA \u00a7164.312 requirement 20.",
    "severity": "high",
    "clause_reference": "HIPAA \u00a7164.312(a)(20)"
  },
  {
    "rule_id": "NIST-CSF-PR.DS-1",
    "category": "nist",
    "title": "NIST CSF Data Security - PR 1",
    "description": "Implement NIST CSF PR function focusing on data security and access control mechanism 1.",
    "severity": "high",
    "clause_reference": "NIST CSF PR.DS-1"
  },
  {
    "rule_id": "NIST-CSF-DE.DS-2",
    "category": "nist",
    "title": "NIST CSF Data Security - DE 2",
    "description": "Implement NIST CSF DE function focusing on data security and access control mechanism 2.",
    "severity": "high",
    "clause_reference": "NIST CSF DE.DS-2"
  },
  {
    "rule_id": "NIST-CSF-RS.DS-3",
    "category": "nist",
    "title": "NIST CSF Data Security - RS 3",
    "description": "Implement NIST CSF RS function focusing on data security and access control mechanism 3.",
    "severity": "high",
    "clause_reference": "NIST CSF RS.DS-3"
  },
  {
    "rule_id": "NIST-CSF-RC.DS-4",
    "category": "nist",
    "title": "NIST CSF Data Security - RC 4",
    "description": "Implement NIST CSF RC function focusing on data security and access control mechanism 4.",
    "severity": "high",
    "clause_reference": "NIST CSF RC.DS-4"
  },
  {
    "rule_id": "NIST-CSF-ID.DS-5",
    "category": "nist",
    "title": "NIST CSF Data Security - ID 5",
    "description": "Implement NIST CSF ID function focusing on data security and access control mechanism 5.",
    "severity": "high",
    "clause_reference": "NIST CSF ID.DS-5"
  },
  {
    "rule_id": "NIST-CSF-PR.DS-6",
    "category": "nist",
    "title": "NIST CSF Data Security - PR 6",
    "description": "Implement NIST CSF PR function focusing on data security and access control mechanism 6.",
    "severity": "high",
    "clause_reference": "NIST CSF PR.DS-6"
  },
  {
    "rule_id": "NIST-CSF-DE.DS-7",
    "category": "nist",
    "title": "NIST CSF Data Security - DE 7",
    "description": "Implement NIST CSF DE function focusing on data security and access control mechanism 7.",
    "severity": "high",
    "clause_reference": "NIST CSF DE.DS-7"
  },
  {
    "rule_id": "NIST-CSF-RS.DS-8",
    "category": "nist",
    "title": "NIST CSF Data Security - RS 8",
    "description": "Implement NIST CSF RS function focusing on data security and access control mechanism 8.",
    "severity": "high",
    "clause_reference": "NIST CSF RS.DS-8"
  },
  {
    "rule_id": "NIST-CSF-RC.DS-9",
    "category": "nist",
    "title": "NIST CSF Data Security - RC 9",
    "description": "Implement NIST CSF RC function focusing on data security and access control mechanism 9.",
    "severity": "high",
    "clause_reference": "NIST CSF RC.DS-9"
  },
  {
    "rule_id": "NIST-CSF-ID.DS-10",
    "category": "nist",
    "title": "NIST CSF Data Security - ID 10",
    "description": "Implement NIST CSF ID function focusing on data security and access control mechanism 10.",
    "severity": "high",
    "clause_reference": "NIST CSF ID.DS-10"
  },
  {
    "rule_id": "NIST-CSF-PR.DS-11",
    "category": "nist",
    "title": "NIST CSF Data Security - PR 11",
    "description": "Implement NIST CSF PR function focusing on data security and access control mechanism 11.",
    "severity": "high",
    "clause_reference": "NIST CSF PR.DS-11"
  },
  {
    "rule_id": "NIST-CSF-DE.DS-12",
    "category": "nist",
    "title": "NIST CSF Data Security - DE 12",
    "description": "Implement NIST CSF DE function focusing on data security and access control mechanism 12.",
    "severity": "high",
    "clause_reference": "NIST CSF DE.DS-12"
  },
  {
    "rule_id": "NIST-CSF-RS.DS-13",
    "category": "nist",
    "title": "NIST CSF Data Security - RS 13",
    "description": "Implement NIST CSF RS function focusing on data security and access control mechanism 13.",
    "severity": "high",
    "clause_reference": "NIST CSF RS.DS-13"
  },
  {
    "rule_id": "NIST-CSF-RC.DS-14",
    "category": "nist",
    "title": "NIST CSF Data Security - RC 14",
    "description": "Implement NIST CSF RC function focusing on data security and access control mechanism 14.",
    "severity": "high",
    "clause_reference": "NIST CSF RC.DS-14"
  },
  {
    "rule_id": "NIST-CSF-ID.DS-15",
    "category": "nist",
    "title": "NIST CSF Data Security - ID 15",
    "description": "Implement NIST CSF ID function focusing on data security and access control mechanism 15.",
    "severity": "high",
    "clause_reference": "NIST CSF ID.DS-15"
  },
  {
    "rule_id": "NIST-CSF-PR.DS-16",
    "category": "nist",
    "title": "NIST CSF Data Security - PR 16",
    "description": "Implement NIST CSF PR function focusing on data security and access control mechanism 16.",
    "severity": "high",
    "clause_reference": "NIST CSF PR.DS-16"
  },
  {
    "rule_id": "NIST-CSF-DE.DS-17",
    "category": "nist",
    "title": "NIST CSF Data Security - DE 17",
    "description": "Implement NIST CSF DE function focusing on data security and access control mechanism 17.",
    "severity": "high",
    "clause_reference": "NIST CSF DE.DS-17"
  },
  {
    "rule_id": "NIST-CSF-RS.DS-18",
    "category": "nist",
    "title": "NIST CSF Data Security - RS 18",
    "description": "Implement NIST CSF RS function focusing on data security and access control mechanism 18.",
    "severity": "high",
    "clause_reference": "NIST CSF RS.DS-18"
  },
  {
    "rule_id": "NIST-CSF-RC.DS-19",
    "category": "nist",
    "title": "NIST CSF Data Security - RC 19",
    "description": "Implement NIST CSF RC function focusing on data security and access control mechanism 19.",
    "severity": "high",
    "clause_reference": "NIST CSF RC.DS-19"
  },
  {
    "rule_id": "NIST-CSF-ID.DS-20",
    "category": "nist",
    "title": "NIST CSF Data Security - ID 20",
    "description": "Implement NIST CSF ID function focusing on data security and access control mechanism 20.",
    "severity": "high",
    "clause_reference": "NIST CSF ID.DS-20"
  },
  {
    "rule_id": "NIST-CSF-PR.DS-21",
    "category": "nist",
    "title": "NIST CSF Data Security - PR 21",
    "description": "Implement NIST CSF PR function focusing on data security and access control mechanism 21.",
    "severity": "high",
    "clause_reference": "NIST CSF PR.DS-21"
  },
  {
    "rule_id": "NIST-CSF-DE.DS-22",
    "category": "nist",
    "title": "NIST CSF Data Security - DE 22",
    "description": "Implement NIST CSF DE function focusing on data security and access control mechanism 22.",
    "severity": "high",
    "clause_reference": "NIST CSF DE.DS-22"
  },
  {
    "rule_id": "NIST-CSF-RS.DS-23",
    "category": "nist",
    "title": "NIST CSF Data Security - RS 23",
    "description": "Implement NIST CSF RS function focusing on data security and access control mechanism 23.",
    "severity": "high",
    "clause_reference": "NIST CSF RS.DS-23"
  },
  {
    "rule_id": "NIST-CSF-RC.DS-24",
    "category": "nist",
    "title": "NIST CSF Data Security - RC 24",
    "description": "Implement NIST CSF RC function focusing on data security and access control mechanism 24.",
    "severity": "high",
    "clause_reference": "NIST CSF RC.DS-24"
  },
  {
    "rule_id": "NIST-CSF-ID.DS-25",
    "category": "nist",
    "title": "NIST CSF Data Security - ID 25",
    "description": "Implement NIST CSF ID function focusing on data security and access control mechanism 25.",
    "severity": "high",
    "clause_reference": "NIST CSF ID.DS-25"
  }
];

async function seed() {
  // Database connection string from .env or default localhost for Supabase local dev
  const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@127.0.0.1:54322/postgres';

  const client = new Client({
    connectionString,
  });

  try {
    console.log('Connecting to database...');
    await client.connect();

    console.log('Creating table compliance_rules if not exists...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS compliance_rules (
        id SERIAL PRIMARY KEY,
        rule_id VARCHAR(255) UNIQUE NOT NULL,
        category VARCHAR(50) NOT NULL,
        title VARCHAR(255) NOT NULL,
        description TEXT NOT NULL,
        severity VARCHAR(50) NOT NULL,
        clause_reference VARCHAR(255) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    console.log(`Seeding ${rules.length} rules...`);
    
    let insertedCount = 0;
    
    for (const rule of rules) {
      const query = `
        INSERT INTO compliance_rules (rule_id, category, title, description, severity, clause_reference)
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (rule_id) DO UPDATE 
        SET category = EXCLUDED.category,
            title = EXCLUDED.title,
            description = EXCLUDED.description,
            severity = EXCLUDED.severity,
            clause_reference = EXCLUDED.clause_reference,
            updated_at = CURRENT_TIMESTAMP;
      `;
      const values = [
        rule.rule_id, 
        rule.category, 
        rule.title, 
        rule.description, 
        rule.severity, 
        rule.clause_reference
      ];
      await client.query(query, values);
      insertedCount++;
    }

    console.log(`Successfully seeded ${insertedCount} policies!`);

  } catch (error) {
    console.error('Error seeding policies:', error);
    if (require.main === module) process.exit(1);
  } finally {
    await client.end();
    console.log('Database connection closed.');
  }
}

module.exports = { rules, seed };

if (require.main === module) {
  seed();
}
