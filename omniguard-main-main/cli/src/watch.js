const chokidar = require('chokidar');
const path = require('path');
const eventBus = require('./eventBus');

class Watcher {
  constructor(workspacePath) {
    this.workspacePath = workspacePath;
    this.watcher = null;
  }

  start() {
    console.log(`[Watcher] Initializing filesystem watcher on ${this.workspacePath}...`);
    this.watcher = chokidar.watch(this.workspacePath, {
      ignored: [
        /(^|[\/\\])\../,
        '**/reports-test/**',
        '**/node_modules/**',
        '**/.omniguard/**'
      ],
      persistent: true,
      ignoreInitial: true
    });

    this.watcher
      .on('change', filePath => {
        eventBus.emit(eventBus.Events.FILE_SAVED, { filePath });
      })
      .on('add', filePath => {
        eventBus.emit(eventBus.Events.FILE_SAVED, { filePath });
      })
      .on('unlink', filePath => {
        eventBus.emit(eventBus.Events.FILE_DELETED, { filePath });
      });
  }

  stop() {
    if (this.watcher) {
      this.watcher.close();
    }
  }
}

module.exports = Watcher;

