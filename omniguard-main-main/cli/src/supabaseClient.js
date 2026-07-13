const https = require('https');

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://krnpfunshzycavskrtod.supabase.co';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtybnBmdW5zaHp5Y2F2c2tydG9kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMyNTU3NjcsImV4cCI6MjA5ODgzMTc2N30.gKqfOLzszLeP3rzlQ1MNjVqSWcNAtbP5kdeR43sHBVE';

function supabaseCall(method, table, query = '', body = null) {
  return new Promise((resolve, reject) => {
    const target = `${SUPABASE_URL}/rest/v1/${table}${query}`;
    const urlObj = new URL(target);
    const headers = {
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    };

    const req = https.request({
      hostname: urlObj.hostname,
      port: 443,
      path: urlObj.pathname + urlObj.search,
      method,
      headers
    }, res => {
      let data = '';
      res.on('data', d => { data += d; });
      res.on('end', () => {
        let parsed = data;
        try { parsed = data ? JSON.parse(data) : {}; } catch {}
        resolve({ ok: res.statusCode < 300, status: res.statusCode, body: parsed });
      });
    });

    req.on('error', reject);
    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

module.exports = {
  supabaseCall,
  SUPABASE_URL,
  SUPABASE_ANON_KEY
};
