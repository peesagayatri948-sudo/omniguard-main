'use strict';
const https = require('https');

/**
 * Jenkins Integration — triggers builds and creates notifier pipeline steps
 * using Jenkins REST API with CSRF crumb handling.
 *
 * Required env / config:
 *   JENKINS_URL      — Jenkins base URL (e.g., https://jenkins.mycompany.com)
 *   JENKINS_USER     — Jenkins username
 *   JENKINS_TOKEN    — Jenkins API Token (not password)
 *   JENKINS_JOB_NAME — Default job name to trigger (e.g., "security-scan")
 */
class JenkinsIntegration {
  constructor() {
    this.baseUrl = (process.env.JENKINS_URL || 'http://localhost:8080').replace(/\/$/, '');
    this.user = process.env.JENKINS_USER || '';
    this.token = process.env.JENKINS_TOKEN || '';
    this.defaultJob = process.env.JENKINS_JOB_NAME || 'omniguard-security-gate';
  }

  async execute(payload = {}) {
    const { jobName, parameters, finding, action = 'trigger' } = payload;

    if (!this.user || !this.token) {
      console.warn('[Jenkins] JENKINS_USER / JENKINS_TOKEN not configured. Skipping Jenkins integration.');
      return { skipped: true };
    }

    const job = jobName || this.defaultJob;

    if (action === 'notify' && finding) {
      // Post a build description note with finding info
      return this._triggerParameterized(job, {
        OMNIGUARD_RULE_ID: finding.rule_id || 'unknown',
        OMNIGUARD_SEVERITY: finding.severity || 'medium',
        OMNIGUARD_FILE: finding.file_path || '',
        OMNIGUARD_TITLE: finding.title || '',
        OMNIGUARD_ACTION: 'notify'
      });
    }

    return this._triggerParameterized(job, parameters || {});
  }

  _getAuthHeader() {
    return 'Basic ' + Buffer.from(`${this.user}:${this.token}`).toString('base64');
  }

  _apiRequest(method, path, body = null, contentType = 'application/json') {
    return new Promise((resolve, reject) => {
      const urlObj = new URL(this.baseUrl + path);
      const isHttp = urlObj.protocol === 'http:';
      const protocol = isHttp ? require('http') : https;

      const options = {
        hostname: urlObj.hostname,
        port: urlObj.port || (isHttp ? 80 : 443),
        path: urlObj.pathname + urlObj.search,
        method,
        headers: {
          'Content-Type': contentType,
          'Authorization': this._getAuthHeader()
        }
      };

      const req = protocol.request(options, (res) => {
        let data = '';
        res.on('data', (d) => { data += d; });
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode, body: data ? JSON.parse(data) : data, headers: res.headers });
          } catch (e) {
            resolve({ status: res.statusCode, body: data, headers: res.headers });
          }
        });
      });

      req.on('error', reject);
      if (body) req.write(typeof body === 'string' ? body : JSON.stringify(body));
      req.end();
    });
  }

  async _getCrumb() {
    try {
      const result = await this._apiRequest('GET', '/crumbIssuer/api/json');
      if (result.status === 200 && result.body && result.body.crumb) {
        return { field: result.body.crumbRequestField, value: result.body.crumb };
      }
    } catch (e) {
      // Jenkins may have CSRF disabled
    }
    return null;
  }

  async _triggerParameterized(jobName, parameters = {}) {
    const crumb = await this._getCrumb();
    const encodedJob = encodeURIComponent(jobName).replace(/%2F/g, '/job/');

    // Build form-encoded parameters for Jenkins
    const params = Object.entries(parameters)
      .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
      .join('&');

    const urlObj = new URL(this.baseUrl);
    const isHttp = urlObj.protocol === 'http:';
    const protocol = isHttp ? require('http') : https;

    const path = `/job/${encodedJob}/buildWithParameters?${params}`;

    return new Promise((resolve, reject) => {
      const options = {
        hostname: urlObj.hostname,
        port: urlObj.port || (isHttp ? 80 : 443),
        path,
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': this._getAuthHeader(),
          'Content-Length': 0
        }
      };

      if (crumb) {
        options.headers[crumb.field] = crumb.value;
      }

      const req = protocol.request(options, (res) => {
        let data = '';
        res.on('data', (d) => { data += d; });
        res.on('end', () => {
          const queueUrl = res.headers?.location;
          if (res.statusCode === 201 || res.statusCode === 200) {
            console.log(`[Jenkins] Build triggered for job "${jobName}". Queue URL: ${queueUrl}`);
          } else {
            console.warn(`[Jenkins] Build trigger returned HTTP ${res.statusCode}: ${data.substring(0, 200)}`);
          }
          resolve({ status: res.statusCode, queueUrl, body: data });
        });
      });

      req.on('error', (err) => {
        console.error(`[Jenkins] Request error: ${err.message}`);
        reject(err);
      });
      req.end();
    });
  }
}

module.exports = new JenkinsIntegration();
