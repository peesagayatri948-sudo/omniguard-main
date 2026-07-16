const fs = require('fs');
const path = require('path');
const http = require('http');
const https = require('https');

const repoName = process.argv[2] || 'omniguard-enterprise';

// Load Env
const envPath = path.join(__dirname, '..', '..', '.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
      process.env[match[1]] = match[2].trim();
    }
  });
}

const baselineDir = path.join(require('os').homedir(), '.omniguard');
if (!fs.existsSync(baselineDir)) {
  fs.mkdirSync(baselineDir, { recursive: true });
}
const baselineFile = path.join(baselineDir, `${repoName}_graph_baseline.json`);

// Helper to query daemon JSON endpoints
function fetchFromJsonEndpoint(url) {
  return new Promise((resolve) => {
    http.get(url, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          resolve([]);
        }
      });
    }).on('error', () => resolve([]));
  });
}

// Fetch active Teams webhooks from integrations table in Supabase
function fetchTeamsWebhook() {
  return new Promise((resolve) => {
    const SUPABASE_URL = process.env.SUPABASE_URL;
    const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return resolve(null);

    const target = `${SUPABASE_URL}/rest/v1/integrations?provider=eq.teams&status=eq.active`;
    const urlObj = new URL(target);
    
    const req = https.request({
      hostname: urlObj.hostname,
      path: urlObj.pathname + urlObj.search,
      port: 443,
      method: 'GET',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      }
    }, res => {
      let data = '';
      res.on('data', d => data += d);
      res.on('end', () => {
        try {
          const list = JSON.parse(data);
          if (list && list.length > 0) {
            resolve(list[0].config?.webhook_url || null);
          } else {
            resolve(null);
          }
        } catch { resolve(null); }
      });
    });
    req.on('error', () => resolve(null));
    req.end();
  });
}

// Send Teams Alert card
function triggerTeamsAlert(webhookUrl, title, text) {
  return new Promise((resolve) => {
    const urlObj = new URL(webhookUrl);
    const body = JSON.stringify({
      "@type": "MessageCard",
      "@context": "https://schema.org/extensions",
      "summary": title,
      "themeColor": "FF0000",
      "title": `🛡️ OmniGuard Threat Drift Alert — ${title}`,
      "sections": [{ "text": text }]
    });

    const req = https.request({
      hostname: urlObj.hostname,
      path: urlObj.pathname + urlObj.search,
      port: 443,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': body.length
      }
    }, res => {
      resolve(res.statusCode === 200 || res.statusCode === 204);
    });
    req.on('error', () => resolve(false));
    req.write(body);
    req.end();
  });
}

async function run() {
  console.log("==========================================================");
  console.log(" OMNIGUARD THREAT DRIFT MONITORING AGENT");
  console.log("==========================================================");
  console.log(`Repository: ${repoName}`);

  // 1. Fetch current Secure Design Graph nodes
  console.log("[Drift Agent] Querying Secure Design Graph nodes from daemon...");
  const currentNodes = await fetchFromJsonEndpoint(`http://127.0.0.1:5175/orchestrator/context?repoName=${encodeURIComponent(repoName)}`);

  if (!currentNodes || currentNodes.length === 0) {
    console.log("[Drift Agent] No nodes returned. Ensure the repository has been scanned at least once.");
    return;
  }

  console.log(`[Drift Agent] Retrieved ${currentNodes.length} active node structures.`);

  // 2. Check or Initialize Baseline
  if (!fs.existsSync(baselineFile)) {
    console.log(`[Drift Agent] No baseline found. Initializing baseline snapshot for ${repoName}...`);
    fs.writeFileSync(baselineFile, JSON.stringify(currentNodes, null, 2));
    console.log(`[Drift Agent] Baseline successfully saved to ${baselineFile}`);
    return;
  }

  // 3. Load baseline and perform node-by-node diffing
  console.log("[Drift Agent] Loading baseline snapshot...");
  let baselineNodes = [];
  try {
    baselineNodes = JSON.parse(fs.readFileSync(baselineFile, 'utf8'));
  } catch (e) {
    console.error("[Drift Agent] Failed to parse baseline:", e.message);
    return;
  }

  const baselineIds = new Set(baselineNodes.map(n => n.node_id));
  const newNodes = currentNodes.filter(n => !baselineIds.has(n.node_id));

  console.log(`[Drift Agent] Comparing active graph against baseline...`);
  console.log(`[Drift Agent] New nodes detected: ${newNodes.length}`);

  let criticalDrifts = [];

  for (const node of newNodes) {
    console.log(`[Drift Agent] Inspecting new node flow: ${node.node_id} (Type: ${node.node_type})`);
    
    // Core Threat Modeling logic: flag if a new route/controller directly connects to sensitive operations
    const hasUnsafeCalls = node.imports && node.imports.some(imp => 
      imp.toLowerCase().includes('child_process') || 
      imp.toLowerCase().includes('exec') || 
      imp.toLowerCase().includes('eval') ||
      imp.toLowerCase().includes('fs.write')
    );

    const isExposedApi = node.node_type === 'file' && (
      node.node_id.includes('route') || 
      node.node_id.includes('controller') || 
      node.node_id.includes('api/')
    );

    if (isExposedApi && hasUnsafeCalls) {
      criticalDrifts.push({
        nodeId: node.node_id,
        reason: `Exposes an HTTP endpoint calling unsafe child_process/execution sinks directly.`
      });
    }
  }

  // 4. Alerting Phase
  if (criticalDrifts.length > 0) {
    console.warn(`\n[ALERT] Detected ${criticalDrifts.length} critical Secure Design Graph drifts!`);
    
    let alertText = `The weekly Secure Design Graph snapshot detected new unvalidated data flows:\n\n`;
    criticalDrifts.forEach((d, i) => {
      alertText += `${i + 1}. **Node**: \`${d.nodeId}\`\n   **Threat**: ${d.reason}\n\n`;
      console.log(` - Node: ${d.nodeId}`);
      console.log(`   Threat: ${d.reason}`);
    });

    const webhookUrl = await fetchTeamsWebhook();
    if (webhookUrl) {
      console.log("[Drift Agent] Dispatching Teams Alert notification...");
      const sent = await triggerTeamsAlert(webhookUrl, "Untrusted Code Flow Exposed", alertText);
      if (sent) console.log("[Drift Agent] Teams Alert successfully sent.");
      else console.error("[Drift Agent] Failed to deliver Teams alert card.");
    } else {
      console.log("[Drift Agent] No active Teams webhook configured. Skipping alert dispatch.");
    }
  } else {
    console.log("\n[Drift Agent] Snapshot comparison clean. No untrusted threat drifts detected.");
  }
}

run();
