const policyEngine = require('../policyEngine');
const path = require('path');

module.exports = {
  name: 'policy',
  loaded: false,
  scan(content, filePath, lines, baseName) {
    // Enable force-reload in testing environments to support dynamic test assertions
    if (!this.loaded || process.env.OMNIGUARD_TEST === 'true') {
      policyEngine.loadRepoPolicies(process.cwd());
      this.loaded = true;
    }
    
    // Evaluate if policies are present
    return policyEngine.evaluate(filePath, content);
  }
};
