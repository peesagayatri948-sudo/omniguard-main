#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const http = require('http');

// Simple MCP Server (Model Context Protocol) implementation for OmniGuard
// Provides tool access to the background daemon and git context

const tools = [
  {
    name: "get_enterprise_context",
    description: "Fetch comprehensive enterprise compliance and architecture context for the repo.",
    inputSchema: {
      type: "object",
      properties: {
        repoName: { type: "string" }
      },
      required: ["repoName"]
    }
  },
  {
    name: "get_vulnerabilities",
    description: "Fetch all open vulnerabilities for the repository. Call this first to know what needs fixing.",
    inputSchema: {
      type: "object",
      properties: {
        repoName: { type: "string" }
      },
      required: ["repoName"]
    }
  },
  {
    name: "approve_modifications",
    description: "Call this tool after you have fixed all vulnerabilities. This triggers Git pre/post hooks, commits the code, creates a PR, runs the prod scanner, generates CISO reports, and notifies the human.",
    inputSchema: {
      type: "object",
      properties: {
        repoName: { type: "string" },
        commitMessage: { type: "string" }
      },
      required: ["repoName", "commitMessage"]
    }
  }
];

function handleCallTool(name, args) {
  if (name === "get_enterprise_context") {
    const { repoName } = args;
    return new Promise((resolve) => {
      const options = {
        hostname: '127.0.0.1',
        port: 5175,
        path: '/orchestrator/context?repoName=' + encodeURIComponent(args.repoName),
        method: 'GET'
      };
      const req = http.request(options, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            resolve([{ type: 'text', text: JSON.stringify(JSON.parse(data), null, 2) }]);
          } catch(e) {
            resolve([{ type: 'text', text: 'Error parsing context: ' + e.message }]);
          }
        });
      });
      req.on('error', (e) => resolve([{ type: 'text', text: 'Failed to fetch context: ' + e.message }]));
      req.end();
    });
  }

  if (name === "get_vulnerabilities") {
    // Send request to Daemon
    const options = {
      hostname: '127.0.0.1',
      port: 5175,
      path: '/orchestrator/vulnerabilities?repoName=' + encodeURIComponent(args.repoName),
      method: 'GET'
    };

    return new Promise((resolve) => {
      const req = http.request(options, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            const vulnerabilities = JSON.parse(data);
            if (vulnerabilities.length === 0) {
              resolve([{ type: "text", text: `[OmniGuard MCP Server] No vulnerabilities found! You may now call 'approve_modifications'.` }]);
            } else {
              let prompt = `[OmniGuard MCP Server - 2nd AI Active Feedback]\n`;
              prompt += `I have scanned the local repository. I found ${vulnerabilities.length} vulnerabilities that you must fix.\n\n`;
              prompt += `WARNING: Do NOT modify any existing architecture, reverse functional behavior, or break design patterns. Do not introduce unsafe hacks to bypass these rules.\n\n`;
              prompt += `Here are the vulnerabilities you must resolve:\n`;
              prompt += JSON.stringify(vulnerabilities, null, 2);
              prompt += `\n\nPlease fix these files locally, then test your changes. Once you are confident they are resolved, call 'approve_modifications' to submit them back to me for re-scanning.`;
              resolve([{ type: "text", text: prompt }]);
            }
          } catch (e) {
            resolve([{ type: "text", text: `Error parsing vulnerabilities: ${e.message}` }]);
          }
        });
      });
      req.on('error', (e) => {
        resolve([{ type: "text", text: `Failed to fetch vulnerabilities: ${e.message}` }]);
      });
      req.end();
    });
  }
  
  if (name === "approve_modifications") {
    const data = JSON.stringify(args);
    const options = {
      hostname: '127.0.0.1',
      port: 5175,
      path: '/orchestrator/approve',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
      }
    };

    return new Promise((resolve) => {
      const req = http.request(options, (res) => {
        let responseData = '';
        res.on('data', chunk => responseData += chunk);
        res.on('end', () => {
          resolve([{ type: "text", text: `Modifications approved. System has applied git hooks, scanned, committed, and generated CISO reports. Response: ${responseData}` }]);
        });
      });
      req.on('error', (e) => {
        resolve([{ type: "text", text: `Approval failed: ${e.message}` }]);
      });
      req.write(data);
      req.end();
    });
  }

  return Promise.resolve([{ type: "text", text: `Tool ${name} not found.` }]);
}

// Stdio JSON-RPC server loop
const readline = require('readline');
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: false
});

rl.on('line', async (line) => {
  if (!line.trim()) return;
  try {
    const msg = JSON.parse(line);
    
    if (msg.method === "initialize") {
      console.log(JSON.stringify({
        jsonrpc: "2.0",
        id: msg.id,
        result: {
          protocolVersion: "2024-11-05",
          capabilities: { tools: {} },
          serverInfo: { name: "omniguard-mcp", version: "1.9.8" }
        }
      }));
    } else if (msg.method === "tools/list") {
      console.log(JSON.stringify({
        jsonrpc: "2.0",
        id: msg.id,
        result: { tools }
      }));
    } else if (msg.method === "tools/call") {
      const { name, arguments: args } = msg.params;
      const result = await handleCallTool(name, args);
      console.log(JSON.stringify({
        jsonrpc: "2.0",
        id: msg.id,
        result: { content: result }
      }));
    } else {
      // Ignored / Not supported
      if (msg.id) {
        console.log(JSON.stringify({
          jsonrpc: "2.0",
          id: msg.id,
          error: { code: -32601, message: "Method not found" }
        }));
      }
    }
  } catch (err) {}
});
