# SDLC Security Integration

OmniGuard shifts security left by integrating directly into development workflows:

---

## 1. Secure Coding (SAST & Secrets Scanning)
The local engine runs low-latency scan checks checking against standard vulnerabilities:
- **SAST-DESER-001:** Unsafe Python pickle deserializations.
- **SAST-SQL-001:** Unvalidated SQL concatenations.
- **SAST-PATH-001:** Insecure path traversals.
- **SECRET-JWT-001:** Hardcoded credentials and active JWT key materials.
- **SECRET-DB-001:** Plaintext database connectivity strings.

```bash
# Run local scanner manually on codebase
omniguard scan folder ./src
```

---

## 2. Git Pre-Commit Hook Integration
Prevent vulnerabilities and secret leaks from ever entering the git log. The hook runs a staged-files check and returns exit code `1` to block commits if critical hazards are found.

To install pre-commit triggers automatically:
```bash
omniguard install-hooks
```
This updates `.git/hooks/pre-commit` to execute `omniguard scan --staged`.

---

## 3. Pull Request Gates (CI/CD Pipelines)
In corporate CI servers (e.g. GitHub Actions, GitLab CI), invoke the check flags to enforce build quality rules:
```bash
# Exit code 1 on failures above fail threshold
omniguard scan --json || exit 1
```

If needed, developers can push suggested AI remediation patches directly into pull request reviews:
```bash
omniguard pr review
omniguard pr fix
```
