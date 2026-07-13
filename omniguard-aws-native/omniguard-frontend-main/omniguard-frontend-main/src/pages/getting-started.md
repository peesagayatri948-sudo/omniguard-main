# Getting Started

Install OmniGuard Nexus, connect your first repository, and build your first Architecture Nexus.

## Quick Start Guide

### Installation
You can install the OmniGuard Enterprise CLI via npm:
```bash
npm install -g omniguard-enterprise-cli
```

### Connect a Repository
Once installed, authenticate and connect your repository:
```bash
omniguard login
omniguard repo add my-org/my-repo
```

### Your First Architecture Nexus
OmniGuard Nexus analyzes your infrastructure as code, application code, and configurations to build a comprehensive map of your security posture.
```bash
omniguard nexus graph --json
```
This command generates the deterministic truth model of your architecture.
