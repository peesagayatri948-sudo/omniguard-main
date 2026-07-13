'use strict';

const eventBus = require('./eventBus');
const https = require('https');
const http = require('http');

/**
 * AIEngine — AI Integration Orchestrator.
 * Supports: Anthropic, OpenAI, Gemini, Ollama, OpenRouter, LiteLLM.
 * Implements auto-detection, auto-fallback, and degraded mode.
 */
class AIEngine {
  constructor() {
    this.listenToEvents();
  }

  listenToEvents() {
    eventBus.on(eventBus.Events.AI_REMEDIATION_REQUESTED, async (payload) => {
      try {
        const result = await this.generateRemediation(payload.finding, payload.context, payload.aiConfig);
        eventBus.emit(eventBus.Events.AI_REMEDIATION_COMPLETED, { id: payload.id, result });
      } catch (error) {
        eventBus.emit('AI:Error', { id: payload.id, error: error.message });
      }
    });
  }

  /**
   * Return a list of all currently configured and active AI providers based on environment/config keys
   */
  getAvailableProviders() {
    const providers = [];
    if (process.env.ANTHROPIC_API_KEY) providers.push('anthropic');
    if (process.env.OPENAI_API_KEY) providers.push('openai');
    if (process.env.GEMINI_API_KEY) providers.push('gemini');
    if (process.env.OPENROUTER_API_KEY) providers.push('openrouter');
    if (process.env.OLLAMA_BASE_URL || process.env.OLLAMA_HOST) providers.push('ollama');
    if (process.env.LITELLM_BASE_URL) providers.push('litellm');
    return providers;
  }

  getOptimalModel(taskType, aiConfig) {
    const provider = aiConfig.provider || 'anthropic';
    
    if (provider === 'openai') {
      if (taskType === 'classification' || taskType === 'summary') return 'gpt-4o-mini';
      return 'gpt-4o';
    } else if (provider === 'gemini') {
      if (taskType === 'classification' || taskType === 'summary') return 'gemini-1.5-flash';
      return 'gemini-1.5-pro';
    } else if (provider === 'openrouter') {
      if (taskType === 'classification' || taskType === 'summary') return 'meta-llama/llama-3-8b-instruct:free';
      return 'anthropic/claude-3.5-sonnet';
    } else if (provider === 'ollama') {
      return aiConfig.model || 'llama3';
    } else if (provider === 'litellm') {
      return aiConfig.model || 'gpt-4o-mini';
    } else {
      // Default Anthropic
      if (taskType === 'classification' || taskType === 'summary') return 'claude-3-haiku-20240307';
      if (taskType === 'architecture') return 'claude-3-opus-20240229';
      return 'claude-3-5-sonnet-20241022';
    }
  }

  async executePrompt(promptText, taskType, aiConfig = {}) {
    let provider = aiConfig.provider || 'anthropic';
    let apiKey = aiConfig.apiKey;

    // Detect if key is missing and find fallback if possible
    const available = this.getAvailableProviders();
    
    // Check key availability
    let hasCredentials = false;
    if (provider === 'ollama') {
      hasCredentials = true; // Local, doesn't strictly need API key
    } else if (provider === 'anthropic' && (apiKey || process.env.ANTHROPIC_API_KEY)) {
      apiKey = apiKey || process.env.ANTHROPIC_API_KEY;
      hasCredentials = true;
    } else if (provider === 'openai' && (apiKey || process.env.OPENAI_API_KEY)) {
      apiKey = apiKey || process.env.OPENAI_API_KEY;
      hasCredentials = true;
    } else if (provider === 'gemini' && (apiKey || process.env.GEMINI_API_KEY)) {
      apiKey = apiKey || process.env.GEMINI_API_KEY;
      hasCredentials = true;
    } else if (provider === 'openrouter' && (apiKey || process.env.OPENROUTER_API_KEY)) {
      apiKey = apiKey || process.env.OPENROUTER_API_KEY;
      hasCredentials = true;
    } else if (provider === 'litellm') {
      apiKey = apiKey || process.env.LITELLM_API_KEY || 'not-needed';
      hasCredentials = true;
    }

    // Auto-fallback mechanism
    if (!hasCredentials) {
      if (available.length > 0) {
        const fallback = available[0];
        console.warn(`[AIEngine] Requested provider "${provider}" is not configured. Falling back to configured provider "${fallback}".`);
        provider = fallback;
        if (provider === 'anthropic') apiKey = process.env.ANTHROPIC_API_KEY;
        else if (provider === 'openai') apiKey = process.env.OPENAI_API_KEY;
        else if (provider === 'gemini') apiKey = process.env.GEMINI_API_KEY;
        else if (provider === 'openrouter') apiKey = process.env.OPENROUTER_API_KEY;
      } else {
        throw new Error(`AI Provider "${provider}" is not configured and no fallback is available. Configure environment keys to enable AI features.`);
      }
    }

    aiConfig.apiKey = apiKey;
    const model = this.getOptimalModel(taskType, { ...aiConfig, provider });

    return new Promise((resolve, reject) => {
      let endpointUrl;

      // Construct target URLs based on the active provider
      if (provider === 'anthropic') {
        endpointUrl = 'https://api.anthropic.com/v1/messages';
      } else if (provider === 'openai') {
        endpointUrl = 'https://api.openai.com/v1/chat/completions';
      } else if (provider === 'gemini') {
        endpointUrl = 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions';
      } else if (provider === 'openrouter') {
        endpointUrl = 'https://openrouter.ai/api/v1/chat/completions';
      } else if (provider === 'ollama') {
        endpointUrl = process.env.OLLAMA_BASE_URL || aiConfig.endpoint || 'http://localhost:11434/api/generate';
      } else if (provider === 'litellm') {
        endpointUrl = process.env.LITELLM_BASE_URL || aiConfig.endpoint || 'http://localhost:4000/v1/chat/completions';
      }

      const urlObj = new URL(endpointUrl);
      const isHttp = urlObj.protocol === 'http:';
      const client = isHttp ? http : https;

      const headers = {
        'Content-Type': 'application/json'
      };

      let payload = {};

      if (provider === 'anthropic') {
        headers['x-api-key'] = apiKey;
        headers['anthropic-version'] = '2023-06-01';
        payload = {
          model,
          max_tokens: 2000,
          messages: [{ role: 'user', content: promptText }]
        };
      } else if (provider === 'openai' || provider === 'gemini' || provider === 'litellm') {
        headers['Authorization'] = `Bearer ${apiKey}`;
        payload = {
          model,
          messages: [{ role: 'user', content: promptText }]
        };
      } else if (provider === 'openrouter') {
        headers['Authorization'] = `Bearer ${apiKey}`;
        headers['HTTP-Referer'] = 'https://omniguard.dev';
        headers['X-Title'] = 'OmniGuard';
        payload = {
          model,
          messages: [{ role: 'user', content: promptText }]
        };
      } else if (provider === 'ollama') {
        // Ollama native generate endpoint if path ends in /generate
        if (urlObj.pathname.endsWith('/generate')) {
          payload = {
            model,
            prompt: promptText,
            stream: false
          };
        } else {
          // Ollama chat compatibility endpoint
          payload = {
            model,
            messages: [{ role: 'user', content: promptText }],
            stream: false
          };
        }
      }

      const options = {
        hostname: urlObj.hostname,
        port: urlObj.port || (isHttp ? 80 : 443),
        path: urlObj.pathname + urlObj.search,
        method: 'POST',
        headers,
        timeout: 30000 // 30 second timeout for robust API calls
      };

      const req = client.request(options, (res) => {
        let data = '';
        res.on('data', d => { data += d; });
        res.on('end', () => {
          try {
            if (res.statusCode >= 300) {
              let parsedErr;
              try { parsedErr = JSON.parse(data); } catch (e) {}
              return reject(new Error(parsedErr?.error?.message || `AI Provider returned HTTP ${res.statusCode}: ${data.substring(0, 150)}`));
            }

            const parsed = JSON.parse(data);
            let text = '';
            if (provider === 'anthropic') {
              text = parsed.content?.[0]?.text;
            } else if (provider === 'ollama' && urlObj.pathname.endsWith('/generate')) {
              text = parsed.response;
            } else {
              text = parsed.choices?.[0]?.message?.content;
            }
            resolve((text || '').trim());
          } catch (e) {
            reject(new Error(`Failed to parse AI response: ${e.message}`));
          }
        });
      });

      req.on('timeout', () => {
        req.destroy();
        reject(new Error(`AI request timed out after 30s (${provider})`));
      });

      req.on('error', (e) => {
        reject(new Error(`AI network error (${provider}): ${e.message}`));
      });

      req.write(JSON.stringify(payload));
      req.end();
    });
  }

  async explainFinding(finding, aiConfig) {
    const prompt = `Explain the following security finding in plain language, its impact, and how an attacker might exploit it. \nFinding: ${JSON.stringify(finding)}`;
    return this.executePrompt(prompt, 'summary', aiConfig);
  }

  async generateRemediation(finding, context, aiConfig) {
    const prompt = `Generate a secure remediation patch for the following finding. Provide unified diff format and a brief explanation.\nFinding: ${JSON.stringify(finding)}\nCode Context:\n${context}`;
    return this.executePrompt(prompt, 'remediation', aiConfig);
  }

  async generateCommitMessage(diff, aiConfig) {
    const prompt = `Generate a clear, conventional commit message for the following security patch:\n${diff}`;
    return this.executePrompt(prompt, 'summary', aiConfig);
  }
}

module.exports = new AIEngine();
