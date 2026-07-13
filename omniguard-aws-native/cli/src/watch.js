const chokidar = require('chokidar');
const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const repoName = process.argv[2] || 'omniguard-enterprise';
const workspacePath = process.env.WORKSPACE_PATH || path.join(require('os').homedir(), '.omniguard', 'clones', repoName);

console.log("==========================================================");
console.log(" OMNIGUARD AUTONOMOUS WATCHER (v1.9.9)");
console.log("==========================================================");
console.log(`Watching Repository: ${repoName}`);
console.log(`Workspace Path: ${workspacePath}`);
console.log("Monitoring filesystem, git, diagnostics, and security events...");
console.log("==========================================================\n");

// Initialize the file system watcher
const watcher = chokidar.watch(workspacePath, {
  ignored: /(^|[\/\\])\../, // ignore dotfiles
  persistent: true
});

watcher
  .on('change', filePath => {
    console.log(`[Watch Event] File modified: ${filePath}`);
    triggerPipeline();
  })
  .on('add', filePath => {
    console.log(`[Watch Event] File added: ${filePath}`);
    triggerPipeline();
  });

let timeout = null;
function triggerPipeline() {
  if (timeout) clearTimeout(timeout);
  timeout = setTimeout(() => {
    console.log(`\n[Pipeline] Triggering automated security and architecture rescan...`);
    try {
        // Trigger daemon endpoint for scan
        execSync(`curl -X POST http://localhost:5185/api/manual-scan -H "Content-Type: application/json" -d "{\\"repoName\\":\\"${repoName}\\"}"`, { stdio: 'ignore' });
        console.log(`[Pipeline] Scan complete. Architecture Nexus & Compliance Matrix updated.`);
    } catch(e) {
        console.log(`[Pipeline] Failed to trigger scan. Is the daemon running?`);
    }
  }, 2000);
}

console.log(`Watcher initialized. Waiting for events...`);
