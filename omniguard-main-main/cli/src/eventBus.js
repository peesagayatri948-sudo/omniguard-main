const EventEmitter = require('events');

class OmniEventBus extends EventEmitter {
  constructor() {
    super();
    // High default limit since this is the central bus
    this.setMaxListeners(100);
  }

  // Debugging wrapper to log events in dev mode
  emit(eventName, ...args) {
    if (process.env.DEBUG_EVENTS) {
      console.log(`[EventBus] Emitted: ${eventName}`);
    }
    return super.emit(eventName, ...args);
  }
}

const eventBus = new OmniEventBus();

// Standardized Event Names
eventBus.Events = {
  // Filesystem
  FILE_SAVED: 'Filesystem:FileSaved',
  FILE_DELETED: 'Filesystem:FileDeleted',
  
  // Git
  GIT_COMMIT: 'Git:Commit',
  GIT_PUSH: 'Git:Push',
  GIT_BRANCH_CHANGED: 'Git:BranchChanged',
  
  // Scans
  SCAN_STARTED: 'Scan:Started',
  SCAN_COMPLETED: 'Scan:Completed',
  
  // Findings
  FINDING_CREATED: 'Finding:Created',
  FINDING_RESOLVED: 'Finding:Resolved',
  FINDING_SUPPRESSED: 'Finding:Suppressed',
  
  // AI
  AI_REMEDIATION_REQUESTED: 'AI:RemediationRequested',
  AI_REMEDIATION_COMPLETED: 'AI:RemediationCompleted',
  
  // Architecture & Threat Model
  GRAPH_NODE_UPDATED: 'Graph:NodeUpdated',
  THREAT_MODEL_UPDATED: 'ThreatModel:Updated',
  COMPLIANCE_RECALCULATED: 'Compliance:ScoreRecalculated',
  
  // System
  CLI_CONNECTED: 'System:CLIConnected',
  DAEMON_STARTED: 'System:DaemonStarted'
};

module.exports = eventBus;
