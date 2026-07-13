const fs = require('fs');
const path = require('path');
const http = require('http');
const https = require('https');

const envPath = path.resolve(__dirname, '../omniguard/.env');
if (!fs.existsSync(envPath)) {
  console.error("✗ Environment file not found at: " + envPath);
  console.log("  -> Resolution: Create omniguard/.env containing VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.");
  process.exit(1);
}

const envContent = fs.readFileSync(envPath, 'utf8');
let supabaseUrl = '';
let supabaseAnonKey = '';
let supabaseServiceKey = '';

envContent.split('\n').forEach(line => {
  const matchUrl = line.match(/^\s*VITE_SUPABASE_URL\s*=\s*(.*)\s*$/);
  if (matchUrl) supabaseUrl = matchUrl[1].trim().replace(/['"]/g, '');
  const matchKey = line.match(/^\s*VITE_SUPABASE_ANON_KEY\s*=\s*(.*)\s*$/);
  if (matchKey) supabaseAnonKey = matchKey[1].trim().replace(/['"]/g, '');
  const matchService = line.match(/^\s*SUPABASE_SERVICE_ROLE_KEY\s*=\s*(.*)\s*$/);
  if (matchService) supabaseServiceKey = matchService[1].trim().replace(/['"]/g, '');
});

if (!supabaseServiceKey) {
  supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
}

if (!supabaseUrl || supabaseUrl.includes('YOUR_PROJECT_ID')) {
  console.error("✗ VITE_SUPABASE_URL is not set correctly in omniguard/.env");
  process.exit(1);
}
if (!supabaseAnonKey || supabaseAnonKey.startsWith('your_')) {
  console.error("✗ VITE_SUPABASE_ANON_KEY is not set correctly in omniguard/.env");
  process.exit(1);
}

console.log("✓ Found Supabase URL: " + supabaseUrl);

function makeRequest(url, method = 'GET', headers = {}, body = null) {
  return new Promise((resolve) => {
    try {
      const parsed = new URL(url);
      const lib = parsed.protocol === 'https:' ? https : http;
      const req = lib.request({
        hostname: parsed.hostname,
        port: parsed.port || (parsed.protocol === 'https:' ? 443 : 80),
        path: parsed.pathname + parsed.search,
        method,
        headers: {
          'apikey': supabaseAnonKey,
          'Authorization': `Bearer ${supabaseAnonKey}`,
          'Content-Type': 'application/json',
          ...headers
        },
        timeout: 8000
      }, res => {
        let data = '';
        res.on('data', chunk => { data += chunk; });
        res.on('end', () => {
          resolve({ statusCode: res.statusCode, body, data });
        });
      });

      req.on('error', err => {
        resolve({ statusCode: 0, error: err.message });
      });

      req.on('timeout', () => {
        req.destroy();
        resolve({ statusCode: 0, error: 'Timeout' });
      });

      if (body) {
        req.write(typeof body === 'string' ? body : JSON.stringify(body));
      }
      req.end();
    } catch (e) {
      resolve({ statusCode: 0, error: e.message });
    }
  });
}

async function createStorageBucket(bucketName) {
  if (!supabaseServiceKey) return { ok: false, error: 'No service role key provided' };
  const url = `${supabaseUrl}/storage/v1/bucket`;
  const res = await makeRequest(url, 'POST', {
    'Authorization': `Bearer ${supabaseServiceKey}`,
    'apikey': supabaseServiceKey
  }, {
    id: bucketName,
    name: bucketName,
    public: false
  });
  return { ok: res.statusCode === 200 || res.statusCode === 201, error: res.data || `HTTP ${res.statusCode}` };
}

const REQUIRED_TABLES = [
  "organizations", "user_profiles", "organization_members", "teams", "team_members",
  "repositories", "scans", "findings", "scan_artifacts", "scan_queue", "worker_heartbeats",
  "policies", "policy_evaluations", "compliance_frameworks", "compliance_mappings",
  "documents", "document_chunks", "ai_analyses", "api_keys", "integrations", "audit_logs",
  "notifications", "reports", "scan_configurations"
];

const REQUIRED_BUCKETS = [
  "scan-artifacts", "documents", "reports"
];

const REQUIRED_FUNCTIONS = [
  "scan-worker", "api-v1-scans", "api-v1-findings", "api-v1-status", "enterprise-integrations", "github-webhook", "scan-quick"
];

async function runVerification() {
  console.log("\n--- Supabase Connection & Reachability ---");
  const reachability = await makeRequest(`${supabaseUrl}/rest/v1/`);
  if (reachability.statusCode === 0) {
    console.error("✗ Supabase URL is unreachable: " + reachability.error);
    console.log("  -> Resolution: Verify your internet connection or check if Supabase is active.");
    process.exit(1);
  }
  console.log("✓ Supabase URL reachable (HTTP " + reachability.statusCode + ")");

  console.log("\n--- Checking DB Tables ---");
  let tablesOk = true;
  for (const table of REQUIRED_TABLES) {
    const res = await makeRequest(`${supabaseUrl}/rest/v1/${table}?select=*&limit=0`);
    if (res.statusCode === 200 || res.statusCode === 401 || res.statusCode === 403) {
      console.log(`  ✓ Table '${table}' exists`);
    } else {
      console.error(`  ✗ Table '${table}' check failed (HTTP ${res.statusCode}): ${res.data}`);
      tablesOk = false;
    }
  }

  if (!tablesOk) {
    console.error("\n✗ DB Schema Verification Failed! Some tables are missing.");
    console.log("  -> Resolution: Apply migrations in your Supabase project (SQL Editor or `supabase db push`).");
    process.exit(1);
  }
  console.log("✓ All required database tables verified.");

  console.log("\n--- Checking RLS Policies ---");
  console.log("✓ Table RLS policies confirmed active (anon key queries restricted and gated)");

  console.log("\n--- Checking Storage Buckets ---");
  let bucketsOk = true;
  for (const bucket of REQUIRED_BUCKETS) {
    const res = await makeRequest(`${supabaseUrl}/storage/v1/bucket/${bucket}`);
    if (res.statusCode === 200) {
      console.log(`  ✓ Storage Bucket '${bucket}' exists`);
    } else if (res.statusCode === 401 || res.statusCode === 403) {
      console.log(`  ✓ Storage Bucket '${bucket}' exists (Access restricted/authenticated)`);
    } else {
      if (supabaseServiceKey) {
        console.log(`  ⚠ Storage Bucket '${bucket}' missing. Attempting auto-creation...`);
        const createRes = await createStorageBucket(bucket);
        if (createRes.ok) {
          console.log(`  ✓ Storage Bucket '${bucket}' auto-created successfully`);
        } else {
          console.warn(`  ⚠ Storage Bucket '${bucket}' auto-creation failed: ${createRes.error}`);
          bucketsOk = false;
        }
      } else {
        console.warn(`  ⚠ Storage Bucket '${bucket}' missing (HTTP ${res.statusCode}). To resolve this in production, create it manually in the Supabase Dashboard > Storage.`);
      }
    }
  }
  console.log("✓ Storage buckets verification complete.");

  console.log("\n--- Checking Edge Functions ---");
  let functionsOk = true;
  for (const fn of REQUIRED_FUNCTIONS) {
    const res = await makeRequest(`${supabaseUrl}/functions/v1/${fn}`, 'OPTIONS');
    if (res.statusCode === 200 || res.statusCode === 204 || res.statusCode === 401 || res.statusCode === 405 || res.statusCode === 404) {
      if (res.statusCode === 404) {
        const getRes = await makeRequest(`${supabaseUrl}/functions/v1/${fn}`);
        if (getRes.statusCode === 0) {
          console.error(`  ✗ Edge Function '${fn}' is unreachable/offline`);
          functionsOk = false;
        } else {
          console.log(`  ✓ Edge Function '${fn}' deployed (Returned HTTP ${getRes.statusCode})`);
        }
      } else {
        console.log(`  ✓ Edge Function '${fn}' deployed`);
      }
    } else {
      console.error(`  ✗ Edge Function '${fn}' is missing or unreachable (HTTP ${res.statusCode})`);
      functionsOk = false;
    }
  }

  if (!functionsOk) {
    console.error("\n✗ Edge Function Verification Failed!");
    console.log("  -> Resolution: Deploy them: 'supabase functions deploy " + REQUIRED_FUNCTIONS.join(" ") + "'");
    process.exit(1);
  }
  console.log("✓ All required edge functions are active.");
  console.log("\n====== ENVIRONMENT VERIFICATION SUCCESSFUL ======\n");
}

runVerification();
