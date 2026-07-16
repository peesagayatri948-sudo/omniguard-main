'use strict';
const https = require('https');

/**
 * Microsoft Teams Integration — sends Adaptive Card notifications
 * to a Teams channel via Incoming Webhook.
 *
 * Required env / config:
 *   TEAMS_WEBHOOK_URL — Incoming webhook URL from Teams channel connector
 */
class TeamsIntegration {
  constructor() {
    this.webhookUrl = process.env.TEAMS_WEBHOOK_URL || '';
  }

  async execute(payload = {}) {
    const { finding, webhookUrl, message } = payload;
    const url = webhookUrl || this.webhookUrl;

    if (!url) {
      console.warn('[Teams] TEAMS_WEBHOOK_URL not configured. Skipping Microsoft Teams notification.');
      return { skipped: true };
    }

    const card = this._buildAdaptiveCard(finding, message);
    return this._sendCard(url, card);
  }

  _buildAdaptiveCard(finding, message) {
    if (message && !finding) {
      // Plain message mode
      return {
        type: 'message',
        attachments: [{
          contentType: 'application/vnd.microsoft.card.adaptive',
          content: {
            type: 'AdaptiveCard',
            version: '1.4',
            body: [{ type: 'TextBlock', text: message, wrap: true }]
          }
        }]
      };
    }

    const severityColor = {
      critical: 'Attention',
      high: 'Warning',
      medium: 'Accent',
      low: 'Good'
    }[finding?.severity] || 'Default';

    return {
      type: 'message',
      attachments: [{
        contentType: 'application/vnd.microsoft.card.adaptive',
        content: {
          $schema: 'http://adaptivecards.io/schemas/adaptive-card.json',
          type: 'AdaptiveCard',
          version: '1.4',
          body: [
            {
              type: 'Container',
              style: severityColor,
              items: [
                {
                  type: 'TextBlock',
                  text: `⚠️ OmniGuard Security Alert — ${(finding?.severity || 'medium').toUpperCase()}`,
                  weight: 'Bolder',
                  size: 'Medium'
                }
              ]
            },
            {
              type: 'FactSet',
              facts: [
                { title: 'Rule ID', value: finding?.rule_id || 'N/A' },
                { title: 'Title', value: finding?.title || 'Security Violation' },
                { title: 'Severity', value: finding?.severity || 'medium' },
                { title: 'File', value: `${finding?.file_path || 'N/A'}:${finding?.line_start || 0}` },
                { title: 'Clause', value: finding?.clause_reference || 'ISO 27001 A.8.28' }
              ]
            },
            finding?.description ? {
              type: 'TextBlock',
              text: finding.description,
              wrap: true,
              color: 'Default'
            } : null,
            finding?.ai_remediation ? {
              type: 'TextBlock',
              text: `💡 **Suggested Fix:** ${finding.ai_remediation}`,
              wrap: true,
              color: 'Good'
            } : null
          ].filter(Boolean),
          actions: [
            {
              type: 'Action.OpenUrl',
              title: 'View in OmniGuard Dashboard',
              url: `${process.env.OMNIGUARD_DASHBOARD_URL || 'https://app.omniguard.io'}/findings`
            }
          ]
        }
      }]
    };
  }

  _sendCard(webhookUrl, card) {
    return new Promise((resolve, reject) => {
      const urlObj = new URL(webhookUrl);
      const payload = JSON.stringify(card);

      const options = {
        hostname: urlObj.hostname,
        port: 443,
        path: urlObj.pathname + urlObj.search,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payload)
        }
      };

      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', (d) => { data += d; });
        res.on('end', () => {
          const success = res.statusCode >= 200 && res.statusCode < 300;
          if (success) {
            console.log('[Teams] Adaptive card notification sent successfully.');
          } else {
            console.warn(`[Teams] Notification failed: HTTP ${res.statusCode} - ${data}`);
          }
          resolve({ status: res.statusCode, body: data });
        });
      });

      req.on('error', (err) => {
        console.error(`[Teams] Request error: ${err.message}`);
        reject(err);
      });

      req.write(payload);
      req.end();
    });
  }
}

module.exports = new TeamsIntegration();
