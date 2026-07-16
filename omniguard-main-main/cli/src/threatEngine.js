const https = require('https');
const eventBus = require('./eventBus');
const jobQueue = require('./jobQueue');

class ThreatEngine {
  constructor() {
    this.registerJobs();
    this.listenToEvents();
  }

  registerJobs() {
    jobQueue.process('threat:enrich', async (payload) => {
      const { finding } = payload;
      return this.enrichFinding(finding);
    });
  }

  listenToEvents() {
    eventBus.on(eventBus.Events.FINDING_CREATED, async (finding) => {
      await jobQueue.add('threat:enrich', { finding });
    });
  }

  async enrichFinding(finding) {
    const cve = finding.cve || 'N/A';
    const cwe = finding.cwe || 'CWE-200';

    let epss = 0.01;
    let cvss = 3.0;
    let isCisaKev = false;
    let offline = false;

    // Severity fallbacks
    if (finding.severity === 'critical') cvss = 9.5;
    else if (finding.severity === 'high') cvss = 8.0;
    else if (finding.severity === 'medium') cvss = 5.5;

    // Real API lookup if CVE is valid
    if (cve !== 'N/A' && cve.startsWith('CVE-')) {
      try {
        console.log(`[ThreatEngine] Querying threat intel for ${cve}...`);
        const epssData = await this.queryEpssApi(cve);
        if (epssData && epssData.data && epssData.data[0]) {
          epss = parseFloat(epssData.data[0].epss) || epss;
        }

        const nvdData = await this.queryNvdApi(cve);
        if (nvdData && nvdData.vulnerabilities && nvdData.vulnerabilities[0]) {
          const metrics = nvdData.vulnerabilities[0].cve.metrics;
          const cvssMetric = metrics.cvssMetricV31?.[0] || metrics.cvssMetricV30?.[0] || metrics.cvssMetricV2?.[0];
          if (cvssMetric) {
            cvss = cvssMetric.cvssData.baseScore || cvss;
          }
        }
      } catch (err) {
        console.warn(`[ThreatEngine] Intel lookup failed/offline for ${cve}: ${err.message}. Using offline fallback.`);
        offline = true;
      }
    }

    // Risk calculations
    const likelihood = isCisaKev ? 0.95 : (epss > 0.1 ? 0.8 : 0.4);
    const technicalRisk = cvss;
    const businessImpact = finding.severity === 'critical' ? 9.0 : (finding.severity === 'high' ? 7.0 : 4.0);
    const complianceImpact = finding.severity === 'critical' ? 10.0 : 5.0;

    const riskScore = (technicalRisk * 0.4 + businessImpact * 0.4 + complianceImpact * 0.2) * likelihood;

    const enriched = {
      ...finding,
      threat_intel: {
        cve,
        cwe,
        epss,
        cvss,
        is_cisa_kev: isCisaKev,
        mitre_attack: this.getMitreMapping(cwe),
        risk_score: parseFloat(riskScore.toFixed(2)),
        business_risk: businessImpact,
        technical_risk: technicalRisk,
        compliance_risk: complianceImpact,
        likelihood,
        priority: riskScore > 6.0 ? 'CRITICAL' : (riskScore > 4.0 ? 'HIGH' : 'MEDIUM'),
        recommended_fix: finding.recommended_fix || 'Apply standard hardening controls.',
        offline_fallback: offline
      }
    };

    eventBus.emit('Threat:Enriched', enriched);
    return enriched;
  }

  queryEpssApi(cve) {
    return new Promise((resolve, reject) => {
      https.get(`https://api.first.org/data/v1/epss?cve=${cve}`, { timeout: 3000 }, (res) => {
        let data = '';
        res.on('data', d => { data += d; });
        res.on('end', () => {
          try { resolve(JSON.parse(data)); } catch (e) { reject(e); }
        });
      }).on('error', reject).on('timeout', () => reject(new Error('Timeout')));
    });
  }

  queryNvdApi(cve) {
    return new Promise((resolve, reject) => {
      // API Key is optional but increases rate limits.
      const options = {
        hostname: 'services.nvd.nist.gov',
        path: `/rest/json/cves/2.0?cveId=${cve}`,
        method: 'GET',
        headers: { 'User-Agent': 'OmniGuard-Enterprise' },
        timeout: 3000
      };
      if (process.env.NVD_API_KEY) {
        options.headers['apiKey'] = process.env.NVD_API_KEY;
      }
      https.get(options, (res) => {
        let data = '';
        res.on('data', d => { data += d; });
        res.on('end', () => {
          try { resolve(JSON.parse(data)); } catch (e) { reject(e); }
        });
      }).on('error', reject).on('timeout', () => reject(new Error('Timeout')));
    });
  }

  getMitreMapping(cwe) {
    if (cwe.includes('798')) return 'T1110 (Brute Force) / T1078 (Valid Accounts)';
    if (cwe.includes('89') || cwe.includes('119')) return 'T1190 (Exploit Public-Facing Application)';
    return 'T1059 (Command and Scripting Interpreter)';
  }
}

const engine = new ThreatEngine();
module.exports = engine;
