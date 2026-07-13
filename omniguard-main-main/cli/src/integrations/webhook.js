const https = require('https');
const http = require('http');

class WebhookIntegration {
  async execute(payload) {
    const webhookUrl = process.env.GENERIC_WEBHOOK_URL;
    const secret = process.env.GENERIC_WEBHOOK_SECRET;

    if (!webhookUrl) {
      console.log("[Webhook] Integration: GENERIC_WEBHOOK_URL not configured. Safe-skipping payload delivery.");
      return { ok: false, error: 'GENERIC_WEBHOOK_URL missing' };
    }

    return new Promise((resolve) => {
      const urlObj = new URL(webhookUrl);
      const client = urlObj.protocol === 'https:' ? https : http;
      const headers = {
        'Content-Type': 'application/json'
      };
      if (secret) {
        headers['X-OmniGuard-Signature'] = secret;
      }

      const req = client.request({
        hostname: urlObj.hostname,
        port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80),
        path: urlObj.pathname + urlObj.search,
        method: 'POST',
        headers
      }, (res) => {
        let data = '';
        res.on('data', d => { data += d; });
        res.on('end', () => {
          resolve({ ok: res.statusCode < 300, status: res.statusCode, body: data });
        });
      });

      req.on('error', (e) => {
        console.error(`[Webhook] Outgoing post failed: ${e.message}`);
        resolve({ ok: false, error: e.message });
      });

      req.write(JSON.stringify(payload));
      req.end();
    });
  }
}

module.exports = new WebhookIntegration();
