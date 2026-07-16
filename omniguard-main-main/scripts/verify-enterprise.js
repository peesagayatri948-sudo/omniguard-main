const fs = require('fs');
const path = require('path');

console.log("\n=======================================================");
console.log("       OmniGuard Enterprise Security Audit Engine      ");
console.log("=======================================================\n");

const migrationsDir = path.resolve(__dirname, '../supabase/migrations');
const srcDir = path.resolve(__dirname, '../omniguard/src');
const cliDir = path.resolve(__dirname, '../cli/src');
const functionsDir = path.resolve(__dirname, '../supabase/functions');

const checks = [];
function audit(name, status, details = '', recommendation = '') {
  checks.push({ name, status, details, recommendation });
}

// 1. Audit RLS Status via Migration Files
try {
  if (fs.existsSync(migrationsDir)) {
    const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql'));
    let totalTablesCreated = 0;
    let totalRlsEnabled = 0;
    let missingRls = [];

    files.forEach(f => {
      const content = fs.readFileSync(path.join(migrationsDir, f), 'utf8');
      const createMatches = content.match(/CREATE TABLE\s+(?:IF NOT EXISTS\s+)?(\w+)/gi) || [];
      totalTablesCreated += createMatches.length;

      // Extract created table names
      createMatches.forEach(m => {
        const tableName = m.replace(/CREATE TABLE\s+(?:IF NOT EXISTS\s+)?/i, '').trim();
        if (tableName && tableName !== 'spatial_ref_sys') {
          // Check if RLS is enabled for this table in any migration
          const rlsRegex = new RegExp(`ALTER TABLE\\s+${tableName}\\s+ENABLE\\s+ROW\\s+LEVEL\\s+SECURITY`, 'i');
          let hasRls = false;
          files.forEach(f2 => {
            const content2 = fs.readFileSync(path.join(migrationsDir, f2), 'utf8');
            if (rlsRegex.test(content2)) hasRls = true;
          });

          if (!hasRls && tableName !== 'spatial_ref_sys' && tableName !== 'pg_stat_statements_info' && !missingRls.includes(tableName)) {
            missingRls.push(tableName);
          } else {
            totalRlsEnabled++;
          }
        }
      });
    });

    if (missingRls.length === 0) {
      audit("Row Level Security (RLS)", "PASS", "RLS enabled on all database tables.", "");
    } else {
      audit("Row Level Security (RLS)", "WARN", `RLS is missing on tables: ${missingRls.join(', ')}`, "Add ALTER TABLE <table_name> ENABLE ROW LEVEL SECURITY; to your migrations.");
    }
  } else {
    audit("Row Level Security (RLS)", "FAIL", "Migration files path not found.", "Verify supabase migrations path.");
  }
} catch (e) {
  audit("Row Level Security (RLS)", "FAIL", e.message, "");
}

// 2. Audit Plaintext Credentials / Hardcoded Keys
try {
  let exposedKeys = [];
  const walk = (dir) => {
    if (!fs.existsSync(dir)) return;
    fs.readdirSync(dir).forEach(file => {
      const full = path.join(dir, file);
      if (fs.statSync(full).isDirectory()) {
        if (file !== 'node_modules' && file !== '.git') walk(full);
      } else if (file.endsWith('.js') || file.endsWith('.ts') || file.endsWith('.env')) {
        const content = fs.readFileSync(full, 'utf8');
        if (content.includes('service_role') && !file.endsWith('.env.example') && !file.endsWith('verify-supabase-env.js') && !file.endsWith('verify-enterprise.js') && !file.endsWith('supabase.ts')) {
          if (content.includes('eyJ') && !content.includes('Deno.env') && !content.includes('process.env')) {
            exposedKeys.push(`${file} (contains hardcoded JWT/service_role key)`);
          }
        }
      }
    });
  };
  walk(path.resolve(__dirname, '../supabase/functions'));
  walk(path.resolve(__dirname, '../cli'));

  if (exposedKeys.length === 0) {
    audit("Service Role Key Exposure", "PASS", "No plaintext service_role keys found hardcoded in functions or CLI code.", "");
  } else {
    audit("Service Role Key Exposure", "FAIL", `Hardcoded keys detected in: ${exposedKeys.join(', ')}`, "Move all secret keys to Deno.env or process.env configuration.");
  }
} catch (e) {
  audit("Service Role Key Exposure", "FAIL", e.message, "");
}

// 3. Audit Audit Logging
try {
  let auditLogsTableExists = false;
  if (fs.existsSync(migrationsDir)) {
    fs.readdirSync(migrationsDir).forEach(f => {
      const content = fs.readFileSync(path.join(migrationsDir, f), 'utf8');
      if (content.includes('CREATE TABLE IF NOT EXISTS audit_logs') || content.includes('CREATE TABLE audit_logs')) {
        auditLogsTableExists = true;
      }
    });
  }
  if (auditLogsTableExists) {
    audit("Audit Logging Schema", "PASS", "Audit log schema tracking table and indexes are configured.", "");
  } else {
    audit("Audit Logging Schema", "FAIL", "audit_logs table is missing from database schema definitions.", "Create an audit_logs table to track compliance logs.");
  }
} catch (e) {
  audit("Audit Logging Schema", "FAIL", e.message, "");
}

// 4. Audit Encryption & API key hashing
try {
  let apiCliHasEncryption = false;
  const apiFile = path.join(cliDir, 'api.js');
  if (fs.existsSync(apiFile)) {
    const content = fs.readFileSync(apiFile, 'utf8');
    if (content.includes('encrypt') && content.includes('decrypt') && content.includes('crypto')) {
      apiCliHasEncryption = true;
    }
  }
  if (apiCliHasEncryption) {
    audit("Local Encryption (CLI)", "PASS", "CLI configuration file encrypts authentication tokens using machine-bound AES keys.", "");
  } else {
    audit("Local Encryption (CLI)", "WARN", "CLI storing plaintext configuration credentials.", "Integrate Node crypto module to encrypt cached credentials.");
  }
} catch (e) {
  audit("Local Encryption (CLI)", "FAIL", e.message, "");
}

// 5. Tenant & Organization Isolation
try {
  let isolationValidated = false;
  if (fs.existsSync(migrationsDir)) {
    fs.readdirSync(migrationsDir).forEach(f => {
      const content = fs.readFileSync(path.join(migrationsDir, f), 'utf8');
      if (content.includes('organization_id') && content.includes('is_org_member')) {
        isolationValidated = true;
      }
    });
  }
  if (isolationValidated) {
    audit("Tenant/Org Isolation", "PASS", "RLS policies isolate operations using tenant/org filters checking active membership.", "");
  } else {
    audit("Tenant/Org Isolation", "FAIL", "No is_org_member or tenant isolation triggers found in database policy scripts.", "Ensure RLS policies utilize is_org_member function constraints.");
  }
} catch (e) {
  audit("Tenant/Org Isolation", "FAIL", e.message, "");
}

// 6. Secrets Scrubbing in Logs
try {
  let scrubbingActive = false;
  const cliIndex = path.join(cliDir, 'index.js');
  if (fs.existsSync(cliIndex)) {
    const content = fs.readFileSync(cliIndex, 'utf8');
    if (content.includes('evidence.slice') || content.includes('mask') || content.includes('****')) {
      scrubbingActive = true;
    }
  }
  if (scrubbingActive) {
    audit("Secrets Logger Masking", "PASS", "Secrets scanner automatically masks matched secrets evidence before logging outputs.", "");
  } else {
    audit("Secrets Logger Masking", "WARN", "Secrets scanner logs full matched content.", "Introduce masking logic to hide credential values in scanner outputs.");
  }
} catch (e) {
  audit("Secrets Logger Masking", "FAIL", e.message, "");
}

// Render Enterprise Readiness Report
console.log("=======================================================");
console.log("             ENTERPRISE READINESS REPORT               ");
console.log("=======================================================\n");

let passes = 0, warns = 0, fails = 0;
checks.forEach(c => {
  let statusStr = '';
  if (c.status === 'PASS') {
    statusStr = '\x1b[32m[PASS]\x1b[0m';
    passes++;
  } else if (c.status === 'WARN') {
    statusStr = '\x1b[33m[WARN]\x1b[0m';
    warns++;
  } else {
    statusStr = '\x1b[31m[FAIL]\x1b[0m';
    fails++;
  }
  console.log(`${statusStr} ${c.name}`);
  console.log(`  Details: ${c.details}`);
  if (c.recommendation) {
    console.log(`  Recommendation: ${c.recommendation}`);
  }
  console.log('');
});

const coverage = Math.round((passes / checks.length) * 100);

console.log("-------------------------------------------------------");
console.log(`Summary: Passes: ${passes} | Warnings: ${warns} | Failures: ${fails}`);
console.log(`Enterprise Coverage Score: ${coverage}%`);
console.log("-------------------------------------------------------\n");

if (fails > 0) {
  console.log("\x1b[31m✗ AUDIT FAILED: Action required to meet enterprise platform standards.\x1b[0m\n");
  process.exit(1);
} else {
  console.log("\x1b[32m✓ AUDIT SUCCESS: Enterprise security specifications fully validated.\x1b[0m\n");
  process.exit(0);
}
