'use strict';
const https = require('https');

/**
 * Azure DevOps Integration — creates work items and adds PR comments
 * from OmniGuard findings via Azure DevOps REST API.
 *
 * Required env / config:
 *   AZURE_DEVOPS_TOKEN  — Personal Access Token (PAT)
 *   AZURE_DEVOPS_ORG    — Organization name (e.g., "MyOrg")
 *   AZURE_DEVOPS_PROJECT — Project name (e.g., "MyProject")
 */
class AzureIntegration {
  constructor() {
    this.token = process.env.AZURE_DEVOPS_TOKEN || '';
    this.org = process.env.AZURE_DEVOPS_ORG || '';
    this.project = process.env.AZURE_DEVOPS_PROJECT || '';
    this.baseUrl = 'dev.azure.com';
  }

  async execute(payload = {}) {
    const { finding, action = 'workitem', pullRequestId, repositoryId } = payload;
    if (!this.token || !this.org || !this.project) {
      console.warn('[Azure] AZURE_DEVOPS_TOKEN / AZURE_DEVOPS_ORG / AZURE_DEVOPS_PROJECT not configured. Skipping.');
      return { skipped: true };
    }

    if (action === 'pr-comment' && pullRequestId && repositoryId) {
      return this._addPRComment(pullRequestId, repositoryId, finding);
    }
    return this._createWorkItem(finding);
  }

  _getAuthHeader() {
    // Azure DevOps uses Basic auth with ":" prefix for PAT
    return 'Basic ' + Buffer.from(`:${this.token}`).toString('base64');
  }

  _apiRequest(method, path, body = null, contentType = 'application/json') {
    return new Promise((resolve, reject) => {
      const fullPath = `/` + this.org + '/' + encodeURIComponent(this.project) + path;
      const options = {
        hostname: this.baseUrl,
        port: 443,
        path: fullPath,
        method,
        headers: {
          'Content-Type': contentType,
          'Authorization': this._getAuthHeader()
        }
      };

      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', (d) => { data += d; });
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode, body: data ? JSON.parse(data) : {} });
          } catch (e) {
            resolve({ status: res.statusCode, body: data });
          }
        });
      });
      req.on('error', reject);
      if (body) req.write(JSON.stringify(body));
      req.end();
    });
  }

  async _createWorkItem(finding) {
    const title = `[OmniGuard] ${finding.severity?.toUpperCase()} - ${finding.title || finding.rule_id}`;
    const description = [
      `<h2>OmniGuard Security Finding</h2>`,
      `<p><strong>Rule ID:</strong> <code>${finding.rule_id}</code></p>`,
      `<p><strong>Severity:</strong> ${finding.severity}</p>`,
      `<p><strong>File:</strong> <code>${finding.file_path}:${finding.line_start}</code></p>`,
      `<p><strong>Evidence:</strong> <code>${finding.evidence || 'N/A'}</code></p>`,
      `<p><strong>Compliance:</strong> ${finding.clause_reference || 'ISO 27001 A.8.28'}</p>`,
      `<p>${finding.description || 'Security violation detected by OmniGuard.'}</p>`
    ].join('\n');

    const patchDocument = [
      { op: 'add', path: '/fields/System.Title', value: title },
      { op: 'add', path: '/fields/System.Description', value: description },
      { op: 'add', path: '/fields/System.WorkItemType', value: 'Bug' },
      { op: 'add', path: '/fields/System.Tags', value: 'OmniGuard; Security' },
      { op: 'add', path: '/fields/Microsoft.VSTS.Common.Priority', value: finding.severity === 'critical' ? 1 : 2 }
    ];

    const result = await this._apiRequest(
      'POST',
      `/_apis/wit/workitems/$Bug?api-version=7.0`,
      patchDocument,
      'application/json-patch+json'
    );
    console.log(`[Azure] Work item created: ${result.body?.id || result.status}`);
    return result;
  }

  async _addPRComment(pullRequestId, repositoryId, finding) {
    const comment = [
      `⚠️ **OmniGuard Security Alert**`,
      `**Rule:** \`${finding.rule_id}\` | **Severity:** \`${finding.severity}\``,
      `**File:** \`${finding.file_path}:${finding.line_start}\``,
      `**Issue:** ${finding.title}`,
      finding.description || ''
    ].join('\n\n');

    const body = {
      comments: [{ parentCommentId: 0, content: comment, commentType: 1 }],
      status: 1
    };

    const result = await this._apiRequest(
      'POST',
      `/_apis/git/repositories/${repositoryId}/pullRequests/${pullRequestId}/threads?api-version=7.0`,
      body
    );
    console.log(`[Azure] PR comment added to PR #${pullRequestId}: ${result.status}`);
    return result;
  }
}

module.exports = new AzureIntegration();
