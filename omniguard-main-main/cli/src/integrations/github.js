const https = require('https');

class GithubIntegration {
  async execute(payload) {
    const repoFullName = process.env.GITHUB_REPOSITORY; // e.g. owner/repo
    const token = process.env.GITHUB_TOKEN;

    if (!repoFullName || !token) {
      console.log("[GitHub] Integration: Credentials not configured (GITHUB_REPOSITORY, GITHUB_TOKEN). Safe-skipping issue registration.");
      return { ok: false, error: 'GitHub credentials missing' };
    }

    return new Promise((resolve) => {
      const req = https.request({
        hostname: 'api.github.com',
        path: `/repos/${repoFullName}/issues`,
        method: 'POST',
        headers: {
          'Authorization': `token ${token}`,
          'User-Agent': 'OmniGuard-Enterprise',
          'Content-Type': 'application/json'
        }
      }, (res) => {
        let data = '';
        res.on('data', d => { data += d; });
        res.on('end', () => {
          let parsed = data;
          try { parsed = JSON.parse(data); } catch {}
          resolve({ ok: res.statusCode < 300, status: res.statusCode, body: parsed });
        });
      });

      req.on('error', (e) => {
        console.error(`[GitHub] Issue creation failed: ${e.message}`);
        resolve({ ok: false, error: e.message });
      });

      const body = {
        title: `[OmniGuard Alert] ${payload.title}`,
        body: `### Security Finding\n\n* **Severity:** ${payload.severity.toUpperCase()}\n* **File:** ${payload.file_path}:${payload.line_start}\n* **Details:** ${payload.description || 'No description provided.'}`
      };

      req.write(JSON.stringify(body));
      req.end();
    });
  }
}

module.exports = new GithubIntegration();
