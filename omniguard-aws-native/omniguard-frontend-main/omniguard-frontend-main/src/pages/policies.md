# Policies

Write, test, and enforce security policies across your environment.

## Policy Engine Overview
The OmniGuard Policy Engine allows you to define custom rules using WebAssembly (Wasm) or YAML to enforce organizational security standards.

## Writing Policies
Policies can be written to evaluate the state of the Architecture Nexus or individual file scans.

## Policy Testing
Test policies locally before deploying them:
```bash
omniguard policy test --rule my-custom-rule.yaml
```

## Policy Reference
- `omniguard policy install`
- `omniguard policy validate`
- `omniguard policy diff`
