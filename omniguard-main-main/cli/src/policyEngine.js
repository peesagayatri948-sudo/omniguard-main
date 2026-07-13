'use strict';

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const eventBus = require('./eventBus');
const jobQueue = require('./jobQueue');

class PolicyEngine {
  constructor() {
    this.customPolicies = [];
    this.globalEnforcement = null;
    this.registerJobs();
    this.listenToEvents();
  }

  registerJobs() {
    jobQueue.process('policy:load', async (payload) => {
      const { dir } = payload;
      return this.loadRepoPolicies(dir);
    });
  }

  listenToEvents() {
    eventBus.on(eventBus.Events.SCAN_STARTED, ({ filePath }) => {
      if (filePath.endsWith('.omniguard.yml') || filePath.endsWith('.omniguard.yaml')) {
        this.loadRepoPolicies(path.dirname(filePath));
      }
    });
  }

  loadRepoPolicies(dir) {
    try {
      const ymlPath = path.join(dir, '.omniguard.yml');
      const yamlPath = path.join(dir, '.omniguard.yaml');
      let p = '';
      if (fs.existsSync(ymlPath)) p = ymlPath;
      else if (fs.existsSync(yamlPath)) p = yamlPath;

      if (p) {
        const content = fs.readFileSync(p, 'utf8');
        this.parseYamlPolicy(content);
        return this.customPolicies;
      }
    } catch (err) {
      console.error(`[PolicyEngine] Failed to load repo policies: ${err.message}`);
    }
    return [];
  }

  parseYamlPolicy(yamlContent) {
    try {
      const doc = yaml.load(yamlContent);
      if (!doc) {
        this.customPolicies = [];
        this.globalEnforcement = null;
        return;
      }

      // Handle global enforcement config
      if (doc && doc.enforcement && typeof doc.enforcement === 'object') {
        this.globalEnforcement = doc.enforcement;
      } else {
        this.globalEnforcement = null;
      }

      // Check for flat rules array vs object containing a rules list
      let rules = [];
      if (Array.isArray(doc)) {
        rules = doc;
      } else if (doc && Array.isArray(doc.rules)) {
        rules = doc.rules;
      } else if (doc && typeof doc === 'object' && doc.id) {
        rules = [doc];
      }

      const seenIds = new Map();
      const parsedRules = [];

      for (let i = 0; i < rules.length; i++) {
        const r = rules[i];
        if (!r || typeof r !== 'object') continue;

        // Schema validation: id is mandatory
        if (!r.id) {
          throw new Error(`Rule at index ${i} is missing required field "id"`);
        }

        // Schema validation: duplicate check with line numbering
        if (seenIds.has(r.id)) {
          const lines = yamlContent.split('\n');
          let occur = 0;
          let lineNum = -1;
          for (let l = 0; l < lines.length; l++) {
            const trimmed = lines[l].trim();
            if (trimmed.startsWith(`id: ${r.id}`) || 
                trimmed.startsWith(`id: "${r.id}"`) || 
                trimmed.startsWith(`id: '${r.id}'`) ||
                trimmed.startsWith(`- id: ${r.id}`) ||
                trimmed.startsWith(`- id: "${r.id}"`) ||
                trimmed.startsWith(`- id: '${r.id}'`)) {
              occur++;
              if (occur > 1) {
                lineNum = l + 1;
                break;
              }
            }
          }
          if (lineNum === -1) {
            lineNum = lines.findIndex(l => l.includes(r.id)) + 1;
          }
          throw new Error(`Duplicate rule ID:\n${r.id}${lineNum > 0 ? ` at line ${lineNum}` : ''}`);
        }
        seenIds.set(r.id, true);

        // Normalize pattern (regex object structure vs simple string pattern)
        let patternStr = '';
        if (r.pattern) {
          if (typeof r.pattern === 'string') {
            patternStr = r.pattern;
          } else if (typeof r.pattern === 'object' && typeof r.pattern.regex === 'string') {
            patternStr = r.pattern.regex;
          }
        }

        // Compile regex if present
        let regexObj = null;
        if (patternStr) {
          try {
            regexObj = new RegExp(patternStr, 'gi');
          } catch (reErr) {
            throw new Error(`Invalid regular expression in rule "${r.id}": ${reErr.message}`);
          }
        }

        parsedRules.push({
          id: r.id,
          pattern: regexObj,
          patternStr,
          severity: r.severity || 'medium',
          language: Array.isArray(r.language) ? r.language : (r.language ? [r.language] : []),
          message: r.message || r.title || `Custom Policy Violation: ${r.id}`,
          description: r.description || r.message || `Custom policy violation detected for ${r.id}`,
          remediation: r.remediation || '',
          metadata: r.metadata || {},
          references: Array.isArray(r.references) ? r.references : (r.references ? [r.references] : []),
          category: r.category || r.metadata?.category || 'custom',
          enforcement: r.enforcement || {}
        });
      }

      this.customPolicies = parsedRules;
      eventBus.emit('Policy:Loaded', { count: parsedRules.length });
    } catch (e) {
      this.customPolicies = [];
      this.globalEnforcement = null;
      throw e;
    }
  }

  evaluate(filePath, content) {
    const findings = [];
    const ext = path.extname(filePath).toLowerCase();
    const basename = path.basename(filePath);

    // Map file extensions to languages
    let fileLang = '';
    if (ext === '.js' || ext === '.jsx') fileLang = 'javascript';
    else if (ext === '.ts' || ext === '.tsx') fileLang = 'typescript';
    else if (ext === '.py') fileLang = 'python';
    else if (ext === '.go') fileLang = 'go';
    else if (ext === '.java') fileLang = 'java';
    else if (ext === '.rb') fileLang = 'ruby';
    else if (ext === '.php') fileLang = 'php';
    else if (ext === '.tf') fileLang = 'terraform';
    else if (ext === '.yml' || ext === '.yaml') fileLang = 'yaml';
    else if (ext === '.json') fileLang = 'json';
    else if (basename === 'Dockerfile' || ext === '.dockerfile') fileLang = 'docker';
    else if (ext === '.sh') fileLang = 'shell';

    for (const rule of this.customPolicies) {
      // Filter by language if specified in schema
      if (rule.language && rule.language.length > 0) {
        if (!fileLang || !rule.language.some(l => l.toLowerCase() === fileLang)) {
          continue;
        }
      }

      if (rule.pattern) {
        rule.pattern.lastIndex = 0;
        let match;
        while ((match = rule.pattern.exec(content)) !== null) {
          const beforeMatch = content.slice(0, match.index);
          const lineStart = beforeMatch.split('\n').length;
          const matchedLines = match[0].split('\n').length;
          const lineEnd = lineStart + matchedLines - 1;

          findings.push({
            scanner: 'policy',
            rule_id: rule.id,
            severity: rule.severity,
            title: rule.message,
            description: rule.description,
            file_path: filePath,
            line_start: lineStart,
            line_end: lineEnd,
            remediation: rule.remediation,
            metadata: rule.metadata,
            references: rule.references,
            category: rule.category,
            enforcement: rule.enforcement
          });

          if (match[0].length === 0) rule.pattern.lastIndex++;
        }
      }
    }
    return findings;
  }

  checkEnforcement(findings) {
    const SEVERITY_MAP = { info: 0, low: 1, medium: 2, high: 3, critical: 4 };
    let shouldBlock = false;
    let blockReason = '';

    const globalMode = this.globalEnforcement?.mode || 'audit';
    const globalMinSev = this.globalEnforcement?.minimum_severity || 'info';

    for (const f of findings) {
      if (f.scanner !== 'policy') continue;

      const ruleMode = f.enforcement?.mode || globalMode;
      const ruleMinSev = f.enforcement?.minimum_severity || globalMinSev;

      if (ruleMode === 'block') {
        const fSevVal = SEVERITY_MAP[f.severity] ?? 2;
        const limitSevVal = SEVERITY_MAP[ruleMinSev] ?? 0;

        if (fSevVal >= limitSevVal) {
          shouldBlock = true;
          blockReason += `\n  - Blocking Rule: ${f.rule_id} (${f.severity.toUpperCase()}) in ${f.file_path}:${f.line_start}`;
        }
      }
    }

    return { block: shouldBlock, reason: blockReason };
  }
}

const engine = new PolicyEngine();
module.exports = engine;
