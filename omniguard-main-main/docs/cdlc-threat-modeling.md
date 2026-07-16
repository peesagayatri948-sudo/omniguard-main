# Continuous Threat Modeling (CDLC) & OmniGuard Nexus

OmniGuard Nexus leverages the **Architecture Nexus**—a living, governed representation of every system architecture—coupled with **three specialized AI Agents** to ensure threat models never go stale.

---

## 1. The Architecture Nexus

Unlike typical security linters that can only scan code for active errors, OmniGuard Nexus maps the intended architecture state. It highlights **absent controls and undefended paths**—vulnerability vectors that code scans are completely blind to.

- **Defensible by Design:** Traces every control and identified risk back to the specific threat or compliance mandate it answers.
- **Governed AI:** Runs on a deterministic ruleset, with complete role-based access controls (RBAC) and audit trails.

To view the graph:
```bash
omniguard nexus graph
```

To trace a threat control mapping:
```bash
omniguard nexus trace OG-CLOUD-002
```

---

## 2. The Specialized Threat Modeling Agents

Three autonomous agents coordinate across the graph to maintain continuous safety:

### A. System Mapping Agent
Reads diagrams, code, Infrastructure-as-Code (IaC) templates, and architecture documents, turning them into an accurate system map before code is deployed.
```bash
omniguard agent map ./infrastructure
```

### B. Graph Agent
Monitors active code repositories and deployment pipelines to identify structural configuration changes and flags drifts in live cloud infrastructure.
```bash
omniguard agent graph
```

### C. Reporting Agent
Generates compliance-ready, audit-ready evidence files mapped across 180+ global security frameworks (NIST, ISO-27001, PCI-DSS, HIPAA, GDPR).
```bash
omniguard agent report PCI-DSS
```
