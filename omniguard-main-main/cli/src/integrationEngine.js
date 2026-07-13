const fs = require('fs');
const path = require('path');
const eventBus = require('./eventBus');
const jobQueue = require('./jobQueue');

const TICKET_PLUGINS = ['jira', 'servicenow', 'github', 'gitlab', 'azure', 'bitbucket'];

class IntegrationEngine {
  constructor() {
    this.plugins = {};
    this.loadIntegrations();
    this.listenToEvents();
  }

  loadIntegrations() {
    const integrationsDir = path.join(__dirname, 'integrations');
    if (!fs.existsSync(integrationsDir)) return;
    
    const files = fs.readdirSync(integrationsDir);
    for (const file of files) {
      if (file.endsWith('.js')) {
        const name = file.replace('.js', '');
        try {
          this.plugins[name] = require(path.join(integrationsDir, file));
        } catch (e) {
          console.error(`[IntegrationEngine] Failed to load ${name}: ${e.message}`);
        }
      }
    }
  }

  listenToEvents() {
    eventBus.on(eventBus.Events.FINDING_CREATED, (finding) => {
      // Trigger integrations on critical and high severity findings
      if (finding.severity === 'critical' || finding.severity === 'high') {
        const normalizedPayload = {
          ...finding,
          finding,
          projectId: finding.project_id || process.env.GITLAB_PROJECT_ID || process.env.GITHUB_REPOSITORY,
          workspace: finding.workspace || process.env.BITBUCKET_WORKSPACE,
          repoSlug: finding.repo_slug || process.env.BITBUCKET_REPO_SLUG || process.env.GITHUB_REPOSITORY?.split('/')?.[1]
        };

        for (const name of Object.keys(this.plugins)) {
          const queueName = TICKET_PLUGINS.includes(name) ? 'integration:ticket' : 'integration:notify';
          jobQueue.add(queueName, { type: name, payload: normalizedPayload });
        }
      }
    });

    jobQueue.process('integration:notify', async (job) => {
      if (this.plugins[job.type]) {
        try {
          return await this.plugins[job.type].execute(job.payload);
        } catch (e) {
          console.error(`[IntegrationEngine] [notify] Plugin ${job.type} execution failed: ${e.message}`);
        }
      }
    });
    
    jobQueue.process('integration:ticket', async (job) => {
      if (this.plugins[job.type]) {
        try {
          return await this.plugins[job.type].execute(job.payload);
        } catch (e) {
          console.error(`[IntegrationEngine] [ticket] Plugin ${job.type} execution failed: ${e.message}`);
        }
      }
    });
  }
}

const engine = new IntegrationEngine();
module.exports = engine;
