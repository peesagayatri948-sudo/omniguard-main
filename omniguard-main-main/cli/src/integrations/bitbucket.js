'use strict';
const https = require('https');

/**
 * Bitbucket Integration — creates issues and posts PR review comments
 * from OmniGuard findings via Bitbucket Cloud REST API 2.0.
 *
 * Required env / config:
 *   BITBUCKET_USERNAME   — Atlassian account username
 *   BITBUCKET_APP_PASSWORD — App password (not account password)
 *   BITBUCKET_WORKSPACE  — Workspace slug (e.g., "myteam")
 *   BITBUCKET_REPO_SLUG  — Repository slug (e.g., "my-repo")
 */
class BitbucketIntegration {
  constructor() {
    this.username = process.env.BITBUCKET_USERNAME || '';
    this.appPassword = process.env.BITBUCKET_APP_PASSWORD || '';
    this.workspace = process.env.BITBUCKET_WORKSPACE || '';
    this.repoSlug = process.env.BITBUCKET_REPO_SLUG || '';
  }

  async execute(payload = {}) {
    const { finding, action = 'issue', pullRequestId, workspace, repoSlug } = payload;

    const ws = workspace || this.workspace;
    const repo = repoSlug || this.repoSlug;

    if (!this.username || !this.appPassword) {
      console.warn('[Bitbucket] BITBUCKET_USERNAME / BITBUCKET_APP_PASSWORD not configured. Skipping.');
      return { skipped: true };
    }
    if (!ws || !repo) {
      console.warn('[Bitbucket] workspace / repoSlug not configured. Skipping.');
      return { skipped: true };
    }

    if (action === 'pr-comment' && pullRequestId) {
      return this._addPRComment(ws, repo, pullRequestId, finding);
    }
    return this._createIssue(ws, repo, finding);
  }

  _getAuthHeader() {
    return 'Basic ' + Buffer.from(`${this.username}:${this.appPassword}`).toString('base64');
  }

  _apiRequest(method, path, body = null) {
    return new Promise((resolve, reject) => {
      const options = {
        hostname: 'api.bitbucket.org',
        port: 443,
        path: `/2.0${path}`,
        method,
        headers: {
          'Content-Type': 'application/json',
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

  async _createIssue(workspace, repoSlug, finding) {
    const title = `[OmniGuard] ${finding.severity?.toUpperCase()} - ${finding.title || finding.rule_id}`;
    const content = [
      `## OmniGuard Security Finding`,
      `**Rule ID:** \`${finding.rule_id}\``,
      `**Severity:** ${finding.severity}`,
      `**File:** \`${finding.file_path}:${finding.line_start}\``,
      `**Evidence:** \`${finding.evidence || 'N/A'}\``,
      `**Compliance:** ${finding.clause_reference || 'ISO 27001 A.8.28'}`,
      ``,
      finding.description || 'Security violation detected by OmniGuard compliance scan.'
    ].join('\n');

    const priorityMap = { critical: 'blocker', high: 'critical', medium: 'major', low: 'minor' };
    const result = await this._apiRequest(
      'POST',
      `/repositories/${workspace}/${repoSlug}/issues`,
      {
        title,
        content: { raw: content },
        priority: priorityMap[finding.severity] || 'major',
        kind: 'bug'
      }
    );
    console.log(`[Bitbucket] Issue created: ${result.body?.links?.html?.href || result.status}`);
    return result;
  }

  async _addPRComment(workspace, repoSlug, pullRequestId, finding) {
    const comment = [
      `⚠️ **OmniGuard Security Alert**`,
      `**Rule:** \`${finding.rule_id}\` | **Severity:** \`${finding.severity}\``,
      `**File:** \`${finding.file_path}:${finding.line_start}\``,
      `**Issue:** ${finding.title}`,
      finding.description || ''
    ].join('\n\n');

    const result = await this._apiRequest(
      'POST',
      `/repositories/${workspace}/${repoSlug}/pullrequests/${pullRequestId}/comments`,
      { content: { raw: comment } }
    );
    console.log(`[Bitbucket] PR comment added to PR #${pullRequestId}: ${result.status}`);
    return result;
  }
}

module.exports = new BitbucketIntegration();
