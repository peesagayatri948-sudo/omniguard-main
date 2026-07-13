const eventBus = require('./eventBus');
const jobQueue = require('./jobQueue');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

class SBOMEngine {
  constructor() {
    this.registerJobs();
  }

  registerJobs() {
    jobQueue.process('sbom:generate', async (payload) => {
      const { directory, format } = payload;
      return this.generateSBOM(directory, format || 'cyclonedx');
    });
  }

  async generateSBOM(directory, format) {
    const sbom = {
      bomFormat: format === 'spdx' ? 'SPDX' : 'CycloneDX',
      specVersion: format === 'spdx' ? '2.3' : '1.5',
      serialNumber: `urn:uuid:${crypto.randomUUID()}`,
      metadata: { timestamp: new Date().toISOString() },
      components: []
    };

    const packageJsonPath = path.join(directory, 'package.json');
    if (fs.existsSync(packageJsonPath)) {
      try {
        const pkg = JSON.parse(await fs.promises.readFile(packageJsonPath, 'utf8'));
        const deps = { ...pkg.dependencies, ...pkg.devDependencies };
        
        for (const [name, version] of Object.entries(deps)) {
          sbom.components.push({
            type: 'library',
            name,
            version: version.replace(/^[~^]/, ''),
            purl: `pkg:npm/${name}@${version.replace(/^[~^]/, '')}`
          });
        }
      } catch (e) {}
    }

    // Python requirements.txt
    const reqPath = path.join(directory, 'requirements.txt');
    if (fs.existsSync(reqPath)) {
      try {
        const reqs = await fs.promises.readFile(reqPath, 'utf8');
        reqs.split('\n').forEach(line => {
          const match = line.match(/^([^=]+)==(.*)$/);
          if (match) {
            sbom.components.push({
              type: 'library',
              name: match[1],
              version: match[2],
              purl: `pkg:pypi/${match[1]}@${match[2]}`
            });
          }
        });
      } catch (e) {}
    }

    return sbom;
  }
}

module.exports = new SBOMEngine();
