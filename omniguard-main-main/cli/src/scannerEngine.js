const eventBus = require('./eventBus');
const jobQueue = require('./jobQueue');
const fs = require('fs');
const path = require('path');

class ScannerEngine {
  constructor() {
    this.plugins = [];
    this.loadPlugins();
    this.registerJobs();
    this.listenToEvents();
  }

  loadPlugins() {
    const scannersDir = path.join(__dirname, 'scanners');
    if (!fs.existsSync(scannersDir)) {
      fs.mkdirSync(scannersDir, { recursive: true });
    }
    const files = fs.readdirSync(scannersDir);
    for (const file of files) {
      if (file.endsWith('.js')) {
        try {
          const plugin = require(path.join(scannersDir, file));
          this.plugins.push(plugin);
        } catch (e) {
          console.error(`[ScannerEngine] Failed to load plugin ${file}: ${e.message}`);
        }
      }
    }
  }

  registerJobs() {
    jobQueue.process('scan:file', async (payload) => {
      const { filePath, content } = payload;
      return this.scanFile(filePath, content);
    });
  }

  listenToEvents() {
    eventBus.on(eventBus.Events.FILE_SAVED, async ({ filePath }) => {
      try {
        const content = await fs.promises.readFile(filePath, 'utf8');
        eventBus.emit(eventBus.Events.SCAN_STARTED, { filePath });
        const findings = await jobQueue.add('scan:file', { filePath, content });
        if (findings && findings.length > 0) {
          findings.forEach(f => {
            eventBus.emit(eventBus.Events.FINDING_CREATED, f);
          });
        }
        eventBus.emit(eventBus.Events.SCAN_COMPLETED, { filePath, findingsCount: findings ? findings.length : 0 });
      } catch (err) {
        console.error(`[ScannerEngine] Error reading file ${filePath}: ${err.message}`);
      }
    });
  }

  scanFile(filePath, content) {
    let findings = [];
    const lines = content.split('\n');
    const baseName = path.basename(filePath);

    for (const plugin of this.plugins) {
      if (typeof plugin.scan === 'function') {
        try {
          const pluginFindings = plugin.scan(content, filePath, lines, baseName);
          if (Array.isArray(pluginFindings)) {
            findings = findings.concat(pluginFindings);
          }
        } catch (e) {
          console.error(`[ScannerEngine] Plugin ${plugin.name} failed on ${filePath}: ${e.message}`);
        }
      }
    }

    return findings;
  }
}

const engine = new ScannerEngine();
module.exports = engine;
