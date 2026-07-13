# MCP Server

Use OmniGuard Nexus as a Model Context Protocol server for AI-assisted security workflows.

## MCP Overview
OmniGuard provides a Model Context Protocol (MCP) server, allowing you to seamlessly integrate the Architecture Nexus into Claude Desktop or other MCP-compatible AI clients.

## Configuration
To start the MCP server:
```bash
omniguard mcp start
```

## Available Tools
The MCP server exposes several tools to the AI:
- `nexus-graph`: Retrieve the current Architecture Nexus state.
- `nexus-trace`: Trace security controls and data flows.
- `scan-code`: Request a vulnerability scan on a specific path.

## Claude Desktop Setup
Add the following to your `claude_desktop_config.json`:
```json
{
  "mcpServers": {
    "omniguard": {
      "command": "omniguard",
      "args": ["mcp", "start"]
    }
  }
}
```
