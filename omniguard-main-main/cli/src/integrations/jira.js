const https = require('https');

class JiraIntegration {
  async execute(payload) {
    const jiraHost = process.env.JIRA_HOST; // e.g. company.atlassian.net
    const jiraEmail = process.env.JIRA_EMAIL;
    const jiraToken = process.env.JIRA_API_TOKEN;
    const projectKey = process.env.JIRA_PROJECT_KEY || 'SEC';

    if (!jiraHost || !jiraEmail || !jiraToken) {
      console.log("[Jira] Integration: Credentials not configured (JIRA_HOST, JIRA_EMAIL, JIRA_API_TOKEN). Safe-skipping ticket creation.");
      return { ok: false, error: 'Jira credentials missing' };
    }

    return new Promise((resolve) => {
      const auth = Buffer.from(`${jiraEmail}:${jiraToken}`).toString('base64');
      const req = https.request({
        hostname: jiraHost,
        path: '/rest/api/3/issue',
        method: 'POST',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
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
        console.error(`[Jira] Issue creation failed: ${e.message}`);
        resolve({ ok: false, error: e.message });
      });

      const body = {
        fields: {
          project: { key: projectKey },
          summary: `[OmniGuard] ${payload.severity.toUpperCase()} Finding: ${payload.title}`,
          description: {
            type: 'doc',
            version: 1,
            content: [{
              type: 'paragraph',
              content: [
                { type: 'text', text: `Vulnerability: ${payload.title}\nSeverity: ${payload.severity}\nFile Location: ${payload.file_path}:${payload.line_start}\nCWE: ${payload.cwe || 'N/A'}` }
              ]
            }]
          },
          issuetype: { name: 'Bug' }
        }
      };

      req.write(JSON.stringify(body));
      req.end();
    });
  }
}

module.exports = new JiraIntegration();
