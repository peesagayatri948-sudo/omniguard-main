const fs = require('fs');
const path = require('path');
const eventBus = require('./eventBus');
const jobQueue = require('./jobQueue');

class ReportEngine {
  constructor() {
    this.registerJobs();
  }

  registerJobs() {
    jobQueue.process('report:generate', async (payload) => {
      const { findings, format, outputPath } = payload;
      return this.generateReport(findings, format, outputPath);
    });
  }

  async generateReport(findings, format, outputPath) {
    let outputContent = '';
    const ext = format.toLowerCase();
    
    switch (ext) {
      case 'json':
        outputContent = JSON.stringify(findings, null, 2);
        break;
      case 'csv':
        outputContent = this.convertToCsv(findings);
        break;
      case 'sarif':
        outputContent = this.convertToSarif(findings);
        break;
      case 'html':
        outputContent = this.convertToHtml(findings);
        break;
      case 'cyclonedx':
        outputContent = this.convertToCycloneDx(findings);
        break;
      case 'spdx':
        outputContent = this.convertToSpdx(findings);
        break;
      case 'pdf':
        outputContent = this.convertToPdf(findings);
        break;
      default:
        throw new Error(`Unsupported format: ${format}`);
    }

    if (outputPath) {
      const dir = path.dirname(outputPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(outputPath, outputContent, 'utf8');
      console.log(`[ReportEngine] Report successfully saved to ${outputPath}`);
    }

    eventBus.emit('Report:Generated', { format, path: outputPath });
    return outputContent;
  }

  convertToCsv(findings) {
    const headers = 'ID,Scanner,Severity,Title,File,Line,CWE\n';
    const rows = findings.map(f => `"${f.rule_id}","${f.scanner}","${f.severity}","${f.title.replace(/"/g, '""')}","${f.file_path}",${f.line_start},"${f.cwe || 'N/A'}"`).join('\n');
    return headers + rows;
  }

  convertToSarif(findings) {
    return JSON.stringify({
      $schema: 'https://schemastore.azurewebsites.net/schemas/json/sarif-2.1.0-rtm.5.json',
      version: '2.1.0',
      runs: [{
        tool: {
          driver: {
            name: 'OmniGuard',
            version: '2.0.0',
            informationUri: 'https://omniguard.dev',
            rules: Array.from(new Set(findings.map(f => f.rule_id))).map(ruleId => {
              const f = findings.find(x => x.rule_id === ruleId);
              return {
                id: ruleId,
                name: f.title,
                shortDescription: { text: f.title }
              };
            })
          }
        },
        results: findings.map(f => ({
          ruleId: f.rule_id,
          level: f.severity === 'critical' || f.severity === 'high' ? 'error' : 'warning',
          message: { text: f.title },
          locations: [{
            physicalLocation: {
              artifactLocation: { uri: f.file_path },
              region: { startLine: f.line_start }
            }
          }]
        }))
      }]
    }, null, 2);
  }

  convertToCycloneDx(findings) {
    // Standard CycloneDX BOM structure with component linking
    const components = findings.map((f, i) => ({
      'bom-ref': `comp-${i}`,
      type: 'library',
      name: path.basename(f.file_path),
      version: '1.0.0',
      purl: `pkg:generic/${path.basename(f.file_path)}@1.0.0`,
      properties: [
        { name: 'file_path', value: f.file_path },
        { name: 'line', value: String(f.line_start) }
      ]
    }));

    const vulnerabilities = findings.map((f, i) => ({
      id: f.rule_id,
      source: { name: 'OmniGuard' },
      ratings: [{
        severity: f.severity,
        method: 'CVSSv3'
      }],
      description: f.title,
      affects: [{ ref: `comp-${i}` }]
    }));

    return JSON.stringify({
      bomFormat: 'CycloneDX',
      specVersion: '1.4',
      version: 1,
      metadata: {
        timestamp: new Date().toISOString(),
        tool: {
          components: [{
            type: 'application',
            name: 'OmniGuard',
            version: '2.0.0'
          }]
        }
      },
      components,
      vulnerabilities
    }, null, 2);
  }

  convertToSpdx(findings) {
    let doc = `SPDXVersion: SPDX-2.3
DataLicense: CC0-1.0
SPDXID: SPDXRef-Document
DocumentName: OmniGuard-SBOM
DocumentNamespace: https://omniguard.dev/spdx/omniguard-sbom-${Date.now()}
Creator: Tool: OmniGuard-2.0.0
Created: ${new Date().toISOString()}

`;

    findings.forEach((f, i) => {
      doc += `PackageName: ${path.basename(f.file_path)}
SPDXID: SPDXRef-Package-${i}
PackageVersion: 1.0.0
PackageDownloadLocation: NOASSERTION
FilesAnalyzed: false
PackageLicenseConcluded: NOASSERTION
PackageLicenseDeclared: NOASSERTION
PackageCopyrightText: NOASSERTION
ExternalRef: SECURITY advisories ${f.rule_id}

`;
    });

    return doc;
  }

  convertToHtml(findings) {
    return `
    <!DOCTYPE html>
    <html>
      <head>
        <title>OmniGuard Security Analysis Report</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #0f172a; color: #f1f5f9; padding: 40px; margin: 0; }
          .container { max-width: 1200px; margin: 0 auto; }
          header { display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #334155; padding-bottom: 20px; }
          h1 { color: #38bdf8; margin: 0; }
          .summary-cards { display: flex; gap: 20px; margin: 30px 0; }
          .card { background: #1e293b; padding: 20px; border-radius: 8px; flex: 1; border: 1px solid #334155; text-align: center; }
          .card h3 { margin: 0 0 10px 0; color: #94a3b8; }
          .card p { margin: 0; font-size: 2rem; font-weight: bold; color: #f1f5f9; }
          table { width: 100%; border-collapse: collapse; margin-top: 30px; background: #1e293b; border-radius: 8px; overflow: hidden; }
          th, td { padding: 16px; text-align: left; border-bottom: 1px solid #334155; }
          th { background: #0f172a; color: #38bdf8; }
          tr:hover { background: #2c3e50; }
          .badge { padding: 6px 12px; border-radius: 4px; font-weight: bold; text-transform: uppercase; font-size: 0.8rem; }
          .critical { background: #f43f5e; color: #ffffff; }
          .high { background: #f97316; color: #ffffff; }
          .medium { background: #eab308; color: #000000; }
          .low { background: #3b82f6; color: #ffffff; }
        </style>
      </head>
      <body>
        <div class="container">
          <header>
            <h1>OmniGuard Analysis Report</h1>
            <p>Generated: ${new Date().toLocaleString()}</p>
          </header>
          <div class="summary-cards">
            <div class="card">
              <h3>Total Findings</h3>
              <p>${findings.length}</p>
            </div>
            <div class="card">
              <h3>Critical / High</h3>
              <p>${findings.filter(f => ['critical', 'high'].includes(f.severity)).length}</p>
            </div>
            <div class="card">
              <h3>Medium / Low</h3>
              <p>${findings.filter(f => ['medium', 'low'].includes(f.severity)).length}</p>
            </div>
          </div>
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Severity</th>
                <th>Title</th>
                <th>Location</th>
              </tr>
            </thead>
            <tbody>
              ${findings.map(f => `
                <tr>
                  <td><code>${f.rule_id}</code></td>
                  <td><span class="badge ${f.severity}">${f.severity}</span></td>
                  <td>${f.title}</td>
                  <td><code>${f.file_path}:${f.line_start}</code></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </body>
    </html>
    `;
  }

  convertToPdf(findings) {
    // Generate clean postscript/printable PDF template layout mapping
    return `%PDF-1.4
%
1 0 obj
<< /Title (OmniGuard Security Report)
   /Creator (OmniGuard 2.0)
   /CreationDate (D:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z) >>
endobj
2 0 obj
<< /Type /Catalog /Pages 3 0 R >>
endobj
3 0 obj
<< /Type /Pages /Kids [4 0 R] /Count 1 >>
endobj
4 0 obj
<< /Type /Page /Parent 3 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 5 0 R >> >> /Contents 6 0 R >>
endobj
5 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>
endobj
6 0 obj
<< /Length 120 >>
stream
BT
/F1 18 Tf
50 800 Td
(OmniGuard Executive Security Report) Tj
/F1 12 Tf
0 -30 Td
(Total Vulnerabilities Detected: ${findings.length}) Tj
0 -20 Td
(Date generated: ${new Date().toLocaleDateString()}) Tj
ET
endstream
endobj
xref
0 7
0000000000 65535 f 
0000000009 00000 n 
0000000150 00000 n 
0000000200 00000 n 
0000000262 00000 n 
0000000378 00000 n 
0000000450 00000 n 
trailer
<< /Size 7 /Root 2 0 R /Info 1 0 R >>
startxref
620
%%EOF`;
  }
}

const engine = new ReportEngine();
module.exports = engine;
