const https = require('https');

class SlackIntegration {
  async execute(payload) {
    const webhookUrl = process.env.SLACK_WEBHOOK_URL;
    if (!webhookUrl) {
      console.log("[Slack] Integration: SLACK_WEBHOOK_URL not configured. Safe-skipping alert.");
      return { ok: false, error: 'SLACK_WEBHOOK_URL missing' };
    }
    
    return new Promise((resolve) => {
      const urlObj = new URL(webhookUrl);
      const req = https.request({
        hostname: urlObj.hostname,
        path: urlObj.pathname + urlObj.search,
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      }, (res) => {
        let data = '';
        res.on('data', d => { data += d; });
        res.on('end', () => {
          resolve({ ok: res.statusCode < 300, status: res.statusCode, body: data });
        });
      });

      req.on('error', (e) => {
        console.error(`[Slack] Alert failed: ${e.message}`);
        resolve({ ok: false, error: e.message });
      });

      const message = {
        text: `🚨 *OmniGuard Alert* 🚨\n*Finding:* ${payload.title}\n*Severity:* ${payload.severity.toUpperCase()}\n*File:* \`${payload.file_path}:${payload.line_start}\``
      };

      req.write(JSON.stringify(message));
      req.end();
    });
  }
}

module.exports = new SlackIntegration();
