# Organizations

Manage organizations, workspaces, teams, and multi-tenant deployments.

## Organizations Overview
OmniGuard Enterprise provides robust multi-tenant capabilities, allowing you to segment your deployment across different business units.

## Creating Workspaces
```bash
omniguard project create "Finance App"
```

## Team Management
Invite members using secure, HMAC-signed, time-limited tokens:
```bash
omniguard org invite dev@company.com --role developer
```

## RBAC Reference
OmniGuard enforces strict Role-Based Access Control (RBAC). 
Roles include:
- **Owner**: Full access, billing, and org deletion.
- **Admin**: Policy management, team management.
- **Member**: Can run scans and view the Architecture Nexus.
- **Viewer**: Read-only access to reports.
