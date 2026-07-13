# OmniGuard Enterprise CISO Security Report
Generated on: 10/7/2026
Target Directory: E:\omniguard-enterprise\omniguard-main-main

## Executive Summary
OmniGuard has completed an automated security scan of the codebase and compiled this CISO-level security posture summary.

| Metric | Value |
|--------|-------|
| Total Files Scanned | 154 |
| Total Vulnerabilities | 92 |
| Critical Severity | 4 |
| High Severity | 88 |
| Medium Severity | 0 |
| Low/Info Severity | 0 |

### 🔴 High Risk Warning
Critical severity vulnerabilities were detected. Immediate remediation is required before this codebase is deployed to production.

## Vulnerability Breakdown

### 1. [HIGH] JWT Token detected
- **Rule ID**: SECRET-JWT-001
- **Scanner**: secret
- **Location**: `E:\omniguard-enterprise\omniguard-main-main\docker-compose.yml:10`
- **Evidence**: `eyJh...(208)...HBVE`

### 2. [HIGH] JWT Token detected
- **Rule ID**: SECRET-JWT-001
- **Scanner**: secret
- **Location**: `E:\omniguard-enterprise\omniguard-main-main\docker-compose.yml:17`
- **Evidence**: `eyJh...(208)...HBVE`

### 3. [HIGH] Path Traversal detected
- **Rule ID**: SAST-PATH-001
- **Scanner**: sast
- **Location**: `E:\omniguard-enterprise\omniguard-main-main\vscode-extension\publish.ps1:15`
- **Evidence**: `../`

### 4. [HIGH] Path Traversal detected
- **Rule ID**: SAST-PATH-001
- **Scanner**: sast
- **Location**: `E:\omniguard-enterprise\omniguard-main-main\vscode-extension\publish.ps1:20`
- **Evidence**: `../`

### 5. [HIGH] Path Traversal detected
- **Rule ID**: SAST-PATH-001
- **Scanner**: sast
- **Location**: `E:\omniguard-enterprise\omniguard-main-main\vscode-extension\publish.sh:18`
- **Evidence**: `../`

### 6. [HIGH] Path Traversal detected
- **Rule ID**: SAST-PATH-001
- **Scanner**: sast
- **Location**: `E:\omniguard-enterprise\omniguard-main-main\vscode-extension\publish.sh:25`
- **Evidence**: `../`

### 7. [HIGH] eval() Usage detected
- **Rule ID**: SAST-EVAL-001
- **Scanner**: sast
- **Location**: `E:\omniguard-enterprise\omniguard-main-main\supabase\functions\scan-worker\index.ts:56`
- **Evidence**: `eval(`

### 8. [HIGH] Path Traversal detected
- **Rule ID**: SAST-PATH-001
- **Scanner**: sast
- **Location**: `E:\omniguard-enterprise\omniguard-main-main\supabase\functions\scan-worker\index.ts:3`
- **Evidence**: `../`

### 9. [HIGH] eval() Usage detected
- **Rule ID**: SAST-EVAL-001
- **Scanner**: sast
- **Location**: `E:\omniguard-enterprise\omniguard-main-main\supabase\functions\scan-quick\index.ts:39`
- **Evidence**: `eval(`

### 10. [HIGH] Path Traversal detected
- **Rule ID**: SAST-PATH-001
- **Scanner**: sast
- **Location**: `E:\omniguard-enterprise\omniguard-main-main\supabase\functions\scan-quick\index.ts:3`
- **Evidence**: `../`

### 11. [HIGH] Path Traversal detected
- **Rule ID**: SAST-PATH-001
- **Scanner**: sast
- **Location**: `E:\omniguard-enterprise\omniguard-main-main\supabase\functions\policy-ingest\index.ts:3`
- **Evidence**: `../`

### 12. [HIGH] Path Traversal detected
- **Rule ID**: SAST-PATH-001
- **Scanner**: sast
- **Location**: `E:\omniguard-enterprise\omniguard-main-main\supabase\functions\api-v1-findings\index.ts:3`
- **Evidence**: `../`

### 13. [CRITICAL] Database URL detected
- **Rule ID**: SECRET-DB-001
- **Scanner**: secret
- **Location**: `E:\omniguard-enterprise\omniguard-main-main\scripts\run-e2e-tests.js:199`
- **Evidence**: `post...(55)...d_db`

### 14. [HIGH] Hardcoded Password detected
- **Rule ID**: SECRET-PASS-001
- **Scanner**: secret
- **Location**: `E:\omniguard-enterprise\omniguard-main-main\scripts\run-e2e-tests.js:91`
- **Evidence**: `Pass...(41)...26!"`

### 15. [HIGH] Path Traversal detected
- **Rule ID**: SAST-PATH-001
- **Scanner**: sast
- **Location**: `E:\omniguard-enterprise\omniguard-main-main\scripts\run-e2e-tests.js:12`
- **Evidence**: `../`

### 16. [HIGH] Path Traversal detected
- **Rule ID**: SAST-PATH-001
- **Scanner**: sast
- **Location**: `E:\omniguard-enterprise\omniguard-main-main\scripts\run-e2e-tests.js:191`
- **Evidence**: `../`

### 17. [HIGH] Path Traversal detected
- **Rule ID**: SAST-PATH-001
- **Scanner**: sast
- **Location**: `E:\omniguard-enterprise\omniguard-main-main\scripts\run-e2e-tests.js:208`
- **Evidence**: `path.join(__dirname, req.`

### 18. [HIGH] Path Traversal detected
- **Rule ID**: SAST-PATH-001
- **Scanner**: sast
- **Location**: `E:\omniguard-enterprise\omniguard-main-main\scripts\run-e2e-tests.js:241`
- **Evidence**: `../`

### 19. [HIGH] Path Traversal detected
- **Rule ID**: SAST-PATH-001
- **Scanner**: sast
- **Location**: `E:\omniguard-enterprise\omniguard-main-main\scripts\validate-marketplace-bundle.js:8`
- **Evidence**: `../`

### 20. [HIGH] Path Traversal detected
- **Rule ID**: SAST-PATH-001
- **Scanner**: sast
- **Location**: `E:\omniguard-enterprise\omniguard-main-main\scripts\verify-enterprise.js:8`
- **Evidence**: `../`

### 21. [HIGH] Path Traversal detected
- **Rule ID**: SAST-PATH-001
- **Scanner**: sast
- **Location**: `E:\omniguard-enterprise\omniguard-main-main\scripts\verify-enterprise.js:9`
- **Evidence**: `../`

### 22. [HIGH] Path Traversal detected
- **Rule ID**: SAST-PATH-001
- **Scanner**: sast
- **Location**: `E:\omniguard-enterprise\omniguard-main-main\scripts\verify-enterprise.js:10`
- **Evidence**: `../`

### 23. [HIGH] Path Traversal detected
- **Rule ID**: SAST-PATH-001
- **Scanner**: sast
- **Location**: `E:\omniguard-enterprise\omniguard-main-main\scripts\verify-enterprise.js:11`
- **Evidence**: `../`

### 24. [HIGH] Path Traversal detected
- **Rule ID**: SAST-PATH-001
- **Scanner**: sast
- **Location**: `E:\omniguard-enterprise\omniguard-main-main\scripts\verify-enterprise.js:83`
- **Evidence**: `../`

### 25. [HIGH] Path Traversal detected
- **Rule ID**: SAST-PATH-001
- **Scanner**: sast
- **Location**: `E:\omniguard-enterprise\omniguard-main-main\scripts\verify-enterprise.js:84`
- **Evidence**: `../`

### 26. [HIGH] Path Traversal detected
- **Rule ID**: SAST-PATH-001
- **Scanner**: sast
- **Location**: `E:\omniguard-enterprise\omniguard-main-main\scripts\verify-supabase-env.js:6`
- **Evidence**: `../`

### 27. [HIGH] Path Traversal detected
- **Rule ID**: SAST-PATH-001
- **Scanner**: sast
- **Location**: `E:\omniguard-enterprise\omniguard-main-main\omniguard-main\scanner\src\scanners\base.ts:2`
- **Evidence**: `../`

### 28. [HIGH] Path Traversal detected
- **Rule ID**: SAST-PATH-001
- **Scanner**: sast
- **Location**: `E:\omniguard-enterprise\omniguard-main-main\omniguard-main\scanner\src\scanners\base.ts:7`
- **Evidence**: `../`

### 29. [HIGH] Path Traversal detected
- **Rule ID**: SAST-PATH-001
- **Scanner**: sast
- **Location**: `E:\omniguard-enterprise\omniguard-main-main\omniguard-main\scanner\src\scanners\base.ts:49`
- **Evidence**: `../`

### 30. [HIGH] Path Traversal detected
- **Rule ID**: SAST-PATH-001
- **Scanner**: sast
- **Location**: `E:\omniguard-enterprise\omniguard-main-main\omniguard-main\scanner\src\scanners\dependency-scanner.ts:3`
- **Evidence**: `../`

### 31. [HIGH] Path Traversal detected
- **Rule ID**: SAST-PATH-001
- **Scanner**: sast
- **Location**: `E:\omniguard-enterprise\omniguard-main-main\omniguard-main\scanner\src\scanners\iac-scanner.ts:3`
- **Evidence**: `../`

### 32. [HIGH] eval() Usage detected
- **Rule ID**: SAST-EVAL-001
- **Scanner**: sast
- **Location**: `E:\omniguard-enterprise\omniguard-main-main\omniguard-main\scanner\src\scanners\sast-scanner.ts:191`
- **Evidence**: `eval(`

### 33. [HIGH] Path Traversal detected
- **Rule ID**: SAST-PATH-001
- **Scanner**: sast
- **Location**: `E:\omniguard-enterprise\omniguard-main-main\omniguard-main\scanner\src\scanners\sast-scanner.ts:3`
- **Evidence**: `../`

### 34. [HIGH] Path Traversal detected
- **Rule ID**: SAST-PATH-001
- **Scanner**: sast
- **Location**: `E:\omniguard-enterprise\omniguard-main-main\omniguard-main\scanner\src\scanners\sast-scanner.ts:474`
- **Evidence**: `../`

### 35. [HIGH] Path Traversal detected
- **Rule ID**: SAST-PATH-001
- **Scanner**: sast
- **Location**: `E:\omniguard-enterprise\omniguard-main-main\omniguard-main\scanner\src\scanners\secret-scanner.ts:3`
- **Evidence**: `../`

### 36. [HIGH] Path Traversal detected
- **Rule ID**: SAST-PATH-001
- **Scanner**: sast
- **Location**: `E:\omniguard-enterprise\omniguard-main-main\omniguard-main\scanner\src\ai\provider.ts:3`
- **Evidence**: `../`

### 37. [HIGH] Missing USER specification (Running as Root)
- **Rule ID**: DOCKER-LINT-001
- **Scanner**: container
- **Location**: `E:\omniguard-enterprise\omniguard-main-main\omniguard\Dockerfile:4`
- **Evidence**: `FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --s`

### 38. [HIGH] Path Traversal detected
- **Rule ID**: SAST-PATH-001
- **Scanner**: sast
- **Location**: `E:\omniguard-enterprise\omniguard-main-main\omniguard\supabase\functions\scan-worker\index.ts:3`
- **Evidence**: `../`

### 39. [HIGH] Path Traversal detected
- **Rule ID**: SAST-PATH-001
- **Scanner**: sast
- **Location**: `E:\omniguard-enterprise\omniguard-main-main\omniguard\supabase\functions\scan-quick\index.ts:3`
- **Evidence**: `../`

### 40. [HIGH] Path Traversal detected
- **Rule ID**: SAST-PATH-001
- **Scanner**: sast
- **Location**: `E:\omniguard-enterprise\omniguard-main-main\omniguard\src\pages\AuditLogs.tsx:2`
- **Evidence**: `../`

### 41. [HIGH] Path Traversal detected
- **Rule ID**: SAST-PATH-001
- **Scanner**: sast
- **Location**: `E:\omniguard-enterprise\omniguard-main-main\omniguard\src\pages\AuditLogs.tsx:3`
- **Evidence**: `../`

### 42. [HIGH] Path Traversal detected
- **Rule ID**: SAST-PATH-001
- **Scanner**: sast
- **Location**: `E:\omniguard-enterprise\omniguard-main-main\omniguard\src\pages\Auth.tsx:3`
- **Evidence**: `../`

### 43. [HIGH] Path Traversal detected
- **Rule ID**: SAST-PATH-001
- **Scanner**: sast
- **Location**: `E:\omniguard-enterprise\omniguard-main-main\omniguard\src\pages\Auth.tsx:4`
- **Evidence**: `../`

### 44. [HIGH] Path Traversal detected
- **Rule ID**: SAST-PATH-001
- **Scanner**: sast
- **Location**: `E:\omniguard-enterprise\omniguard-main-main\omniguard\src\pages\Compliance.tsx:2`
- **Evidence**: `../`

### 45. [HIGH] Path Traversal detected
- **Rule ID**: SAST-PATH-001
- **Scanner**: sast
- **Location**: `E:\omniguard-enterprise\omniguard-main-main\omniguard\src\pages\Compliance.tsx:3`
- **Evidence**: `../`

### 46. [HIGH] Path Traversal detected
- **Rule ID**: SAST-PATH-001
- **Scanner**: sast
- **Location**: `E:\omniguard-enterprise\omniguard-main-main\omniguard\src\pages\Dashboard.tsx:1`
- **Evidence**: `../`

### 47. [HIGH] Path Traversal detected
- **Rule ID**: SAST-PATH-001
- **Scanner**: sast
- **Location**: `E:\omniguard-enterprise\omniguard-main-main\omniguard\src\pages\Dashboard.tsx:2`
- **Evidence**: `../`

### 48. [HIGH] Path Traversal detected
- **Rule ID**: SAST-PATH-001
- **Scanner**: sast
- **Location**: `E:\omniguard-enterprise\omniguard-main-main\omniguard\src\pages\Dashboard.tsx:3`
- **Evidence**: `../`

### 49. [HIGH] Path Traversal detected
- **Rule ID**: SAST-PATH-001
- **Scanner**: sast
- **Location**: `E:\omniguard-enterprise\omniguard-main-main\omniguard\src\pages\Findings.tsx:2`
- **Evidence**: `../`

### 50. [HIGH] Path Traversal detected
- **Rule ID**: SAST-PATH-001
- **Scanner**: sast
- **Location**: `E:\omniguard-enterprise\omniguard-main-main\omniguard\src\pages\Findings.tsx:3`
- **Evidence**: `../`

### 51. [HIGH] Path Traversal detected
- **Rule ID**: SAST-PATH-001
- **Scanner**: sast
- **Location**: `E:\omniguard-enterprise\omniguard-main-main\omniguard\src\pages\MarketingSite.tsx:26`
- **Evidence**: `../`

### 52. [HIGH] Path Traversal detected
- **Rule ID**: SAST-PATH-001
- **Scanner**: sast
- **Location**: `E:\omniguard-enterprise\omniguard-main-main\omniguard\src\pages\ModulePage.tsx:2`
- **Evidence**: `../`

### 53. [HIGH] Path Traversal detected
- **Rule ID**: SAST-PATH-001
- **Scanner**: sast
- **Location**: `E:\omniguard-enterprise\omniguard-main-main\omniguard\src\pages\ModulePage.tsx:3`
- **Evidence**: `../`

### 54. [HIGH] Path Traversal detected
- **Rule ID**: SAST-PATH-001
- **Scanner**: sast
- **Location**: `E:\omniguard-enterprise\omniguard-main-main\omniguard\src\pages\Notifications.tsx:2`
- **Evidence**: `../`

### 55. [HIGH] Path Traversal detected
- **Rule ID**: SAST-PATH-001
- **Scanner**: sast
- **Location**: `E:\omniguard-enterprise\omniguard-main-main\omniguard\src\pages\Notifications.tsx:3`
- **Evidence**: `../`

### 56. [HIGH] Path Traversal detected
- **Rule ID**: SAST-PATH-001
- **Scanner**: sast
- **Location**: `E:\omniguard-enterprise\omniguard-main-main\omniguard\src\pages\Organizations.tsx:2`
- **Evidence**: `../`

### 57. [HIGH] Path Traversal detected
- **Rule ID**: SAST-PATH-001
- **Scanner**: sast
- **Location**: `E:\omniguard-enterprise\omniguard-main-main\omniguard\src\pages\Organizations.tsx:3`
- **Evidence**: `../`

### 58. [HIGH] Path Traversal detected
- **Rule ID**: SAST-PATH-001
- **Scanner**: sast
- **Location**: `E:\omniguard-enterprise\omniguard-main-main\omniguard\src\pages\Policies.tsx:2`
- **Evidence**: `../`

### 59. [HIGH] Path Traversal detected
- **Rule ID**: SAST-PATH-001
- **Scanner**: sast
- **Location**: `E:\omniguard-enterprise\omniguard-main-main\omniguard\src\pages\Policies.tsx:3`
- **Evidence**: `../`

### 60. [HIGH] Path Traversal detected
- **Rule ID**: SAST-PATH-001
- **Scanner**: sast
- **Location**: `E:\omniguard-enterprise\omniguard-main-main\omniguard\src\pages\Reports.tsx:2`
- **Evidence**: `../`

### 61. [HIGH] Path Traversal detected
- **Rule ID**: SAST-PATH-001
- **Scanner**: sast
- **Location**: `E:\omniguard-enterprise\omniguard-main-main\omniguard\src\pages\Reports.tsx:3`
- **Evidence**: `../`

### 62. [HIGH] Path Traversal detected
- **Rule ID**: SAST-PATH-001
- **Scanner**: sast
- **Location**: `E:\omniguard-enterprise\omniguard-main-main\omniguard\src\pages\Repositories.tsx:2`
- **Evidence**: `../`

### 63. [HIGH] Path Traversal detected
- **Rule ID**: SAST-PATH-001
- **Scanner**: sast
- **Location**: `E:\omniguard-enterprise\omniguard-main-main\omniguard\src\pages\Repositories.tsx:3`
- **Evidence**: `../`

### 64. [HIGH] Path Traversal detected
- **Rule ID**: SAST-PATH-001
- **Scanner**: sast
- **Location**: `E:\omniguard-enterprise\omniguard-main-main\omniguard\src\pages\Scans.tsx:2`
- **Evidence**: `../`

### 65. [HIGH] Path Traversal detected
- **Rule ID**: SAST-PATH-001
- **Scanner**: sast
- **Location**: `E:\omniguard-enterprise\omniguard-main-main\omniguard\src\pages\Scans.tsx:3`
- **Evidence**: `../`

### 66. [HIGH] Path Traversal detected
- **Rule ID**: SAST-PATH-001
- **Scanner**: sast
- **Location**: `E:\omniguard-enterprise\omniguard-main-main\omniguard\src\pages\Settings.tsx:2`
- **Evidence**: `../`

### 67. [HIGH] Path Traversal detected
- **Rule ID**: SAST-PATH-001
- **Scanner**: sast
- **Location**: `E:\omniguard-enterprise\omniguard-main-main\omniguard\src\pages\Settings.tsx:3`
- **Evidence**: `../`

### 68. [HIGH] Path Traversal detected
- **Rule ID**: SAST-PATH-001
- **Scanner**: sast
- **Location**: `E:\omniguard-enterprise\omniguard-main-main\omniguard\src\pages\Teams.tsx:2`
- **Evidence**: `../`

### 69. [HIGH] Path Traversal detected
- **Rule ID**: SAST-PATH-001
- **Scanner**: sast
- **Location**: `E:\omniguard-enterprise\omniguard-main-main\omniguard\src\pages\Teams.tsx:3`
- **Evidence**: `../`

### 70. [HIGH] Path Traversal detected
- **Rule ID**: SAST-PATH-001
- **Scanner**: sast
- **Location**: `E:\omniguard-enterprise\omniguard-main-main\omniguard\src\hooks\useAuth.tsx:2`
- **Evidence**: `../`

### 71. [HIGH] Path Traversal detected
- **Rule ID**: SAST-PATH-001
- **Scanner**: sast
- **Location**: `E:\omniguard-enterprise\omniguard-main-main\omniguard\src\hooks\useRepositories.ts:2`
- **Evidence**: `../`

### 72. [HIGH] Path Traversal detected
- **Rule ID**: SAST-PATH-001
- **Scanner**: sast
- **Location**: `E:\omniguard-enterprise\omniguard-main-main\omniguard\src\components\Layout.tsx:3`
- **Evidence**: `../`

### 73. [HIGH] Path Traversal detected
- **Rule ID**: SAST-PATH-001
- **Scanner**: sast
- **Location**: `E:\omniguard-enterprise\omniguard-main-main\omniguard\src\components\Layout.tsx:4`
- **Evidence**: `../`

### 74. [HIGH] Path Traversal detected
- **Rule ID**: SAST-PATH-001
- **Scanner**: sast
- **Location**: `E:\omniguard-enterprise\omniguard-main-main\omniguard\src\components\Layout.tsx:238`
- **Evidence**: `../`

### 75. [HIGH] Path Traversal detected
- **Rule ID**: SAST-PATH-001
- **Scanner**: sast
- **Location**: `E:\omniguard-enterprise\omniguard-main-main\cli\publish.ps1:6`
- **Evidence**: `../`

### 76. [HIGH] Path Traversal detected
- **Rule ID**: SAST-PATH-001
- **Scanner**: sast
- **Location**: `E:\omniguard-enterprise\omniguard-main-main\cli\publish.ps1:7`
- **Evidence**: `../`

### 77. [HIGH] Path Traversal detected
- **Rule ID**: SAST-PATH-001
- **Scanner**: sast
- **Location**: `E:\omniguard-enterprise\omniguard-main-main\cli\publish.ps1:8`
- **Evidence**: `../`

### 78. [HIGH] Path Traversal detected
- **Rule ID**: SAST-PATH-001
- **Scanner**: sast
- **Location**: `E:\omniguard-enterprise\omniguard-main-main\cli\publish.ps1:34`
- **Evidence**: `../`

### 79. [HIGH] Path Traversal detected
- **Rule ID**: SAST-PATH-001
- **Scanner**: sast
- **Location**: `E:\omniguard-enterprise\omniguard-main-main\cli\publish.ps1:39`
- **Evidence**: `../`

### 80. [HIGH] Path Traversal detected
- **Rule ID**: SAST-PATH-001
- **Scanner**: sast
- **Location**: `E:\omniguard-enterprise\omniguard-main-main\cli\publish.sh:9`
- **Evidence**: `../`

### 81. [HIGH] Path Traversal detected
- **Rule ID**: SAST-PATH-001
- **Scanner**: sast
- **Location**: `E:\omniguard-enterprise\omniguard-main-main\cli\publish.sh:10`
- **Evidence**: `../`

### 82. [HIGH] Path Traversal detected
- **Rule ID**: SAST-PATH-001
- **Scanner**: sast
- **Location**: `E:\omniguard-enterprise\omniguard-main-main\cli\publish.sh:11`
- **Evidence**: `../`

### 83. [HIGH] Path Traversal detected
- **Rule ID**: SAST-PATH-001
- **Scanner**: sast
- **Location**: `E:\omniguard-enterprise\omniguard-main-main\cli\publish.sh:28`
- **Evidence**: `../`

### 84. [HIGH] Path Traversal detected
- **Rule ID**: SAST-PATH-001
- **Scanner**: sast
- **Location**: `E:\omniguard-enterprise\omniguard-main-main\cli\publish.sh:35`
- **Evidence**: `../`

### 85. [HIGH] JWT Token detected
- **Rule ID**: SECRET-JWT-001
- **Scanner**: secret
- **Location**: `E:\omniguard-enterprise\omniguard-main-main\cli\src\index.js:310`
- **Evidence**: `eyJh...(208)...HBVE`

### 86. [HIGH] JWT Token detected
- **Rule ID**: SECRET-JWT-001
- **Scanner**: secret
- **Location**: `E:\omniguard-enterprise\omniguard-main-main\cli\src\index.js:405`
- **Evidence**: `eyJh...(208)...HBVE`

### 87. [HIGH] JWT Token detected
- **Rule ID**: SECRET-JWT-001
- **Scanner**: secret
- **Location**: `E:\omniguard-enterprise\omniguard-main-main\cli\src\index.js:412`
- **Evidence**: `eyJh...(208)...HBVE`

### 88. [CRITICAL] Unsafe Deserialization detected
- **Rule ID**: SAST-DESER-001
- **Scanner**: sast
- **Location**: `E:\omniguard-enterprise\omniguard-main-main\cli\src\index.js:651`
- **Evidence**: `pickle.load(`

### 89. [CRITICAL] Unsafe Deserialization detected
- **Rule ID**: SAST-DESER-001
- **Scanner**: sast
- **Location**: `E:\omniguard-enterprise\omniguard-main-main\cli\src\index.js:688`
- **Evidence**: `pickle.load(`

### 90. [HIGH] Weak Hash MD5 detected
- **Rule ID**: SAST-CRYPTO-001
- **Scanner**: sast
- **Location**: `E:\omniguard-enterprise\omniguard-main-main\cli\src\index.js:218`
- **Evidence**: `createHash('md5'`

### 91. [HIGH] eval() Usage detected
- **Rule ID**: SAST-EVAL-001
- **Scanner**: sast
- **Location**: `E:\omniguard-enterprise\omniguard-main-main\cli\src\index.js:85`
- **Evidence**: `eval(`

### 92. [CRITICAL] SQL Injection detected
- **Rule ID**: SAST-SQL-001
- **Scanner**: sast
- **Location**: `E:\omniguard-enterprise\omniguard-main-main\cli\src\tui.js:482`
- **Evidence**: `query("SELECT * FROM users WHERE id = " +`


## Compliance Frameworks Alignment
* **SOC 2 Type II**: CC6.1, CC6.2 (Access Control & Boundary Defenses) - FAIL
* **ISO 27001:2022**: A.8.12, A.8.20 (Data Encryption & Network Security) - FAIL
* **OWASP Top 10 2021**: A03:2021-Injection, A07:2021-Identification and Authentication Failures

## Action Plan & Roadmap
1. **Critical Remediations (Immediate)**: Remediate the 4 critical finding(s). Use `omniguard explain <rule-id> <file_path>` to get direct Claude fix patches.
2. **High Remediations (Within 48h)**: Address the 88 high finding(s).
3. **Regular Auditing**: Set up pre-commit hooks using `omniguard install-hooks` to prevent credentials leaking.
