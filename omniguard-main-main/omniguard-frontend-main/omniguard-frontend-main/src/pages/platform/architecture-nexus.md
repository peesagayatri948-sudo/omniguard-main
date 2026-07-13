# Architecture Nexus

Understand how the Architecture Nexus is built, queried, and maintained.

## Graph Overview
The flagship differentiator of OmniGuard is the Architecture Nexus. While traditional tools scan isolated lines of code, OmniGuard understands the relationships between components.

## Graph Schema
The graph maps:
- **Trust Boundaries**: Public Internet, Corporate VPC, Edge Devices.
- **Components**: Databases, APIs, S3 buckets, Identity Providers.
- **Data Flows**: Protocol pathways (HTTPS, TLS) and their authentication state.

## Graph Queries
Query the graph to find structural architecture flaws (the "missing" controls).
```bash
omniguard nexus check --query "find databases missing encryption"
```

## Drift Detection
Run continuous agents that snapshot the Architecture Nexus weekly. If a developer accidentally exposes a new untrusted data flow, an immediate alert is triggered.
