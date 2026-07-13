require('dotenv').config({ path: '.env' });

async function init() {
  const url = process.env.SUPABASE_URL || 'http://localhost:54321';
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || 'dummy';

  const res = await fetch(`${url}/rest/v1/rpc/exec_sql`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${key}`,
      'apikey': key
    },
    body: JSON.stringify({
      query: `
        CREATE TABLE IF NOT EXISTS compliance_rules (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          rule_id TEXT NOT NULL,
          category TEXT NOT NULL,
          title TEXT NOT NULL,
          description TEXT NOT NULL,
          severity TEXT NOT NULL,
          clause_reference TEXT,
          created_at TIMESTAMPTZ DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS organization_integrations (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          organization_id UUID NOT NULL,
          provider TEXT NOT NULL,
          status TEXT NOT NULL,
          credentials JSONB,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          UNIQUE(organization_id, provider)
        );

        CREATE TABLE IF NOT EXISTS scan_logs (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          scan_id UUID NOT NULL,
          organization_id UUID NOT NULL,
          message TEXT NOT NULL,
          progress INT NOT NULL DEFAULT 0,
          created_at TIMESTAMPTZ DEFAULT NOW()
        );
      `
    })
  });
  console.log(await res.text());
}
init();
