/**
 * OmniGuard AWS Lambda-based Serverless MCP Server
 * Emulates the Model Context Protocol (MCP) JSON-RPC API serverlessly.
 * Accessible via AWS API Gateway to provide Bedrock/Claude agents direct database integration.
 */

const https = require('https');

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

function supabaseCall(method, endpoint, body = null) {
  return new Promise((resolve, reject) => {
    const url = `${SUPABASE_URL}/rest/v1/${endpoint}`;
    const urlObj = new URL(url);
    
    const headers = {
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json'
    };

    const req = https.request({
      hostname: urlObj.hostname,
      path: urlObj.pathname + urlObj.search,
      port: 443,
      method: method,
      headers: headers
    }, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch {
          resolve([]);
        }
      });
    });

    req.on('error', reject);
    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

exports.handler = async (event) => {
  try {
    const body = typeof event.body === 'string' ? JSON.parse(event.body) : event.body;
    const { method, params, id } = body || {};

    if (method !== 'tools/call') {
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: id || 1,
          result: {
            tools: [
              {
                name: 'get_vulnerabilities',
                description: 'Fetch security scan findings and compliance posture from the active repository.',
                inputSchema: {
                  type: 'object',
                  properties: {
                    repoName: { type: 'string', description: 'Name of the repository.' }
                  },
                  required: ['repoName']
                }
              },
              {
                name: 'approve_modifications',
                description: 'Record an AI-generated secure code fix and update the compliance status.',
                inputSchema: {
                  type: 'object',
                  properties: {
                    findingId: { type: 'string', description: 'Vulnerability finding ID.' },
                    patchContent: { type: 'string', description: 'Diff patch content applied.' }
                  },
                  required: ['findingId', 'patchContent']
                }
              }
            ]
          }
        })
      };
    }

    const toolName = params?.name;
    const toolArgs = params?.arguments || {};

    if (toolName === 'get_vulnerabilities') {
      const repoName = toolArgs.repoName || 'omniguard-enterprise';
      
      // Query repositories to get the ID
      const repos = await supabaseCall('GET', `repositories?name=eq.${encodeURIComponent(repoName)}`);
      if (!repos || repos.length === 0) {
        return {
          statusCode: 200,
          body: JSON.stringify({
            jsonrpc: '2.0',
            id,
            result: {
              content: [{ type: 'text', text: `Error: Repository "${repoName}" not found.` }]
            }
          })
        };
      }

      const findings = await supabaseCall('GET', `findings?repository_id=eq.${repos[0].id}&status=eq.open`);
      return {
        statusCode: 200,
        body: JSON.stringify({
          jsonrpc: '2.0',
          id,
          result: {
            content: [{ type: 'text', text: JSON.stringify(findings, null, 2) }]
          }
        })
      };
    }

    if (toolName === 'approve_modifications') {
      const { findingId, patchContent } = toolArgs;
      await supabaseCall('PATCH', `findings?id=eq.${findingId}`, {
        status: 'resolved',
        ai_remediation: patchContent
      });

      return {
        statusCode: 200,
        body: JSON.stringify({
          jsonrpc: '2.0',
          id,
          result: {
            content: [{ type: 'text', text: `Success: Finding ${findingId} marked as resolved via serverless API.` }]
          }
        })
      };
    }

    return {
      statusCode: 400,
      body: JSON.stringify({ error: `Unknown tool: ${toolName}` })
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message })
    };
  }
};
