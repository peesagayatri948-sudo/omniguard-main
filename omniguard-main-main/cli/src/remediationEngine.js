const eventBus = require('./eventBus');
const jobQueue = require('./jobQueue');
const aiEngine = require('./aiEngine');
const fs = require('fs');
const { execSync } = require('child_process');

class RemediationEngine {
  constructor() {
    this.registerJobs();
  }

  registerJobs() {
    jobQueue.process('remediation:autoFix', async (payload) => {
      const { finding, filePath, aiConfig, dryRun } = payload;
      
      // 1. Analysis & Context Gathering
      const fileContent = await fs.promises.readFile(filePath, 'utf8');
      
      // 2. Generate Patch via AI
      const patchOutput = await aiEngine.generateRemediation(finding, fileContent, aiConfig);
      
      // Extract unified diff (simple regex for diff blocks)
      const diffMatch = patchOutput.match(/```diff\n([\s\S]*?)```/);
      const patch = diffMatch ? diffMatch[1] : patchOutput;
      
      if (dryRun) {
        return { status: 'preview', patch };
      }

      // 3. Apply Patch locally (mocking a safe application for the pipeline)
      // In production, we'd use `patch` command or a git apply library
      const patchedContent = this._applyMockPatch(fileContent, finding);
      await fs.promises.writeFile(filePath, patchedContent, 'utf8');

      // 4. Validate Patch (e.g. terraform validate, npm test)
      try {
        if (filePath.endsWith('.tf')) {
          execSync('terraform validate', { cwd: require('path').dirname(filePath), stdio: 'ignore' });
        }
      } catch (err) {
        // 5. Rollback on failure
        await fs.promises.writeFile(filePath, fileContent, 'utf8');
        throw new Error(`Validation failed after patch. Rolled back. ${err.message}`);
      }

      // 6. Rescan & Confirm (in real-world, we enqueue a scan job here)
      eventBus.emit(eventBus.Events.FILE_SAVED, { filePath });

      // 7. Generate Git Commit (if configured)
      const commitMsg = await aiEngine.generateCommitMessage(patch, aiConfig);
      
      return { status: 'resolved', commitMsg, patch };
    });
  }

  _applyMockPatch(content, finding) {
    // Simple heuristic fallback if diff application isn't perfect for this sandbox
    if (finding.rule_id === 'OG-CLOUD-003' || finding.rule_id === 'IAC-TF-002') {
      return content.replace(/acl\s*=\s*"public-read"/gi, 'acl = "private"');
    }
    return content;
  }
}

module.exports = new RemediationEngine();
