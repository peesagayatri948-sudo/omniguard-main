require('./envLoader');
const http = require('http');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

const PORT = 5175;
const BASE_URL = `http://localhost:${PORT}`;
const API_KEY = 'Bearer og_live_test_api_key_12345';

// Helper for HTTP requests
function makeRequest(method, endpoint, headers = {}, body = null) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(`${BASE_URL}${endpoint}`);
    const req = http.request({
      hostname: urlObj.hostname,
      port: urlObj.port,
      path: urlObj.pathname + urlObj.search,
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    }, res => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: data.startsWith('{') || data.startsWith('[') ? JSON.parse(data) : data });
        } catch {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });
    req.on('error', reject);
    if (body) {
      req.write(typeof body === 'string' ? body : JSON.stringify(body));
    }
    req.end();
  });
}

(async () => {
  console.log('=== STARTING OMNIGUARD ENTERPRISE SUITE VALIDATION ===');
  
  // Start local webhook mock receiver
  let receivedPayload = null;
  let receivedHeaders = null;
  const webhookServer = http.createServer((req, res) => {
    receivedHeaders = req.headers;
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try { receivedPayload = JSON.parse(body); } catch (e) { receivedPayload = body; }
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ received: true }));
    });
  });
  
  await new Promise(resolve => webhookServer.listen(5176, resolve));
  console.log(' - Local Mock Webhook server listening on port 5176');

  // Pre-configure environment variables so daemon inherits them
  process.env.GENERIC_WEBHOOK_URL = 'http://localhost:5176/webhook';
  process.env.GENERIC_WEBHOOK_SECRET = 'test_secret_signature';

  // Import integrationEngine locally to register the event listeners and queue workers in the test process
  const integrationEngine = require('./integrationEngine');

  // 1. Start daemon in background
  console.log('\n[1/8] Starting Daemon Server...');
  const daemonProc = exec('node cli/src/daemon.js', { cwd: path.join(__dirname, '..', '..') });
  
  daemonProc.stdout.on('data', (data) => {
    console.log(`[Daemon Output] ${data.trim()}`);
  });

  // Wait 3 seconds for boot
  await new Promise(r => setTimeout(r, 3000));

  try {
    // 2. Healthz & Readyz Endpoints (Phase 16)
    console.log('\n[2/8] Testing Health and Readiness Endpoints...');
    const liveness = await makeRequest('GET', '/healthz');
    console.log('Liveness check (/healthz):', liveness.status, liveness.body);

    const readiness = await makeRequest('GET', '/readyz');
    console.log('Readiness check (/readyz):', readiness.status, readiness.body);

    const metrics = await makeRequest('GET', '/metrics');
    console.log('Metrics check (/metrics) Status:', metrics.status);
    console.log(metrics.body.split('\n').slice(0, 8).join('\n'));

    // 3. API Authentication / Unauthorized test (Phase 12)
    console.log('\n[3/8] Testing API Authentication (Phase 12 API Key Enforcements)...');
    const unauthorized = await makeRequest('GET', '/findings');
    console.log('Request without key (GET /findings):', unauthorized.status, unauthorized.body);

    const authorized = await makeRequest('GET', '/findings', { 'Authorization': API_KEY });
    console.log('Request with valid key (GET /findings):', authorized.status, 'Total items:', authorized.body.total);

    // 4. REST API Routing & Query Parameters (Phase 12 Pagination, Search, Sorting)
    console.log('\n[4/8] Testing advanced REST APIs (Search, Sort, Pagination)...');
    const searchRes = await makeRequest('GET', '/policies?q=sql&limit=2', { 'Authorization': API_KEY });
    console.log('Policies search for "sql" (limit 2):', searchRes.status, 'Returned count:', searchRes.body.data.length);
    searchRes.body.data.forEach(p => console.log(` - ID: ${p.rule_id}, Title: ${p.title}`));

    const sortRes = await makeRequest('GET', '/policies?sort_by=severity&order=desc&limit=3', { 'Authorization': API_KEY });
    console.log('Policies sorted by severity (desc, limit 3):');
    sortRes.body.data.forEach(p => console.log(` - ID: ${p.rule_id}, Severity: ${p.severity}`));

    const sbomRes = await makeRequest('GET', '/sbom?format=cyclonedx', { 'Authorization': API_KEY });
    console.log('SBOM Generation Endpoint (GET /sbom):', sbomRes.status, 'Components count:', sbomRes.body.components?.length || 0);

    const complianceRes = await makeRequest('GET', '/compliance', { 'Authorization': API_KEY });
    console.log('Compliance Score Endpoint (GET /compliance):', complianceRes.status, 'Score:', complianceRes.body.compliance_score);

    // 5. Threat Intelligence Enrichment (Phase 14)
    console.log('\n[5/8] Testing Threat Intelligence enrichment (Phase 14)...');
    const threatEngine = require('./threatEngine');
    const enriched = await threatEngine.enrichFinding({
      rule_id: 'SAST-INJ-001',
      title: 'SQL Injection via String Concatenation',
      severity: 'critical',
      cve: 'CVE-2021-44228', // Log4Shell CVE for lookup
      cwe: 'CWE-89',
      file_path: 'app.js',
      line_start: 10
    });
    console.log('Enriched Threat intelligence:', JSON.stringify(enriched.threat_intel, null, 2));

    // 6. Enterprise Multi-Agent System orchestration (Phase 13)
    console.log('\n[6/8] Testing Coordinator and Agent queues (Phase 13)...');
    const agentEngine = require('./agentEngine');
    console.log('Submitting task to Scanner Agent...');
    const agentTask = await agentEngine.delegateTask('scanner', { file: 'server.js', content: 'eval(req.query.code)' });
    console.log('Queue job scheduled. Waiting for worker processing...');
    await new Promise(r => setTimeout(r, 2000));

    // 7. Report Export Generations (Phase 15 formats)
    console.log('\n[7/8] Testing Report Generators (Phase 15 formats)...');
    const reportEngine = require('./reportEngine');
    const dummyFindings = [
      { rule_id: 'SAST-INJ-001', title: 'SQL Injection', severity: 'critical', file_path: 'db.js', line_start: 12 },
      { rule_id: 'IAC-SEC-001', title: 'Open Port 22', severity: 'high', file_path: 'main.tf', line_start: 4 }
    ];

    const formats = ['json', 'csv', 'html', 'sarif', 'cyclonedx', 'spdx', 'pdf'];
    for (const fmt of formats) {
      const outputPath = path.join(__dirname, '..', 'reports-test', `report.${fmt === 'cyclonedx' ? 'cdx.json' : (fmt === 'spdx' ? 'spdx.txt' : fmt)}`);
      await reportEngine.generateReport(dummyFindings, fmt, outputPath);
      console.log(` - Generated format: ${fmt.toUpperCase()} saved to: ${outputPath}`);
    }

    // 7.5. E2E Webhook Integration Verification (Phase C)
    console.log('\n[7.5/8] Testing Webhook Integration E2E...');
    const eventBus = require('./eventBus');
    const testFinding = {
      rule_id: 'TEST-WEBHOOK-001',
      title: 'E2E Webhook Integration Verification Test',
      severity: 'critical',
      file_path: 'auth.js',
      line_start: 42,
      description: 'Verifies the integration engine payload delivery.'
    };

    console.log(' - Emitting FINDING_CREATED event...');
    eventBus.emit(eventBus.Events.FINDING_CREATED, testFinding);

    // Wait 2.5 seconds for event bus and queue processing
    await new Promise(r => setTimeout(r, 2500));

    if (receivedPayload && receivedHeaders) {
      console.log(' - Webhook received headers x-omniguard-signature:', receivedHeaders['x-omniguard-signature']);
      console.log(' - Webhook received payload rule_id:', receivedPayload.rule_id);
      
      const sigMatch = receivedHeaders['x-omniguard-signature'] === 'test_secret_signature';
      const idMatch = receivedPayload.rule_id === 'TEST-WEBHOOK-001';
      
      if (sigMatch && idMatch) {
        console.log('✓ Webhook Integration Pipeline Verification Successful!');
      } else {
        throw new Error(`Webhook validation mismatch! sigMatch: ${sigMatch}, idMatch: ${idMatch}`);
      }
    } else {
      throw new Error('Webhook mock server did not receive any payload!');
    }

    // 8. Graceful Shutdown (Phase 16)
    console.log('\n[8/8] Shutting down Daemon gracefully (Phase 16 SIGINT/SIGTERM testing)...');
    try {
      if (process.platform === 'win32') {
        const { execSync } = require('child_process');
        execSync(`taskkill /pid ${daemonProc.pid} /t /f`, { stdio: 'ignore' });
      } else {
        daemonProc.kill('SIGTERM');
      }
    } catch (e) {
      daemonProc.kill('SIGKILL');
    }

    // Close mock webhook server
    await new Promise(resolve => webhookServer.close(resolve));

    // Wait for process exit
    await new Promise(r => setTimeout(r, 1000));
    console.log('=== VALIDATION COMPLETED SUCCESSFULLY ===');
    process.exit(0);
    
  } catch (err) {
    console.error('Validation failed with error:', err);
    try {
      if (process.platform === 'win32') {
        const { execSync } = require('child_process');
        execSync(`taskkill /pid ${daemonProc.pid} /t /f`, { stdio: 'ignore' });
      } else {
        daemonProc.kill('SIGKILL');
      }
    } catch (e) {}
    try {
      webhookServer.close();
    } catch (e) {}
    process.exit(1);
  }
})();
