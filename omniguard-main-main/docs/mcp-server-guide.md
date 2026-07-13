# Model Context Protocol (MCP) Server Guide

OmniGuard Nexus includes a native stdio-based **Model Context Protocol (MCP)** server daemon. This allows AI code assistants (like Claude, Gemini, and Cursor) to query your architecture's Architecture Nexus directly from within the editor, automatically mapping threats and generating required controls as inline comments.

---

## Exposed MCP Tools

The daemon registers the following tools:

1. **`omniguard_list_threats`**
   - **Purpose:** Fetches the threat library rules database.
   - **Arguments:** `environment` (optional, filters by 'cloud', 'edge', or 'on-premises').

2. **`omniguard_nexus_mapping`**
   - **Purpose:** Triggers the System Mapping Agent to inspect code schemas and return an inferred map.
   - **Arguments:** `path` (absolute codebase path to audit).

3. **`omniguard_nexus_drift`**
   - **Purpose:** Triggers the Graph Agent to evaluate IaC manifest content for configuration drift risks.
   - **Arguments:** `content` (raw IaC manifest string).

4. **`omniguard_nexus_evidence`**
   - **Purpose:** Generates compliance mapping records for regulatory audits.
   - **Arguments:** `framework` (optional, e.g. 'NIST-CSF', 'PCI-DSS', 'ISO-27001').

---

## Client Integration

### 1. Claude Desktop Setup
Add the server configuration block to your `claude_desktop_config.json`:
```json
{
  "mcpServers": {
    "omniguard-nexus": {
      "command": "node",
      "args": ["E:/omniguard-enterprise/omniguard-main-main/cli/src/mcp-server.js"]
    }
  }
}
```

### 2. Cursor / Windsurf Configuration
Navigate to **Cursor Settings → Models → MCP** and add a new MCP server:
- **Name:** `omniguard-nexus`
- **Type:** `stdio`
- **Command:** `node E:/omniguard-enterprise/omniguard-main-main/cli/src/mcp-server.js`

Once registered, your editor AI assistant can immediately call these mapping and drift tools to help you design secure architectures.
