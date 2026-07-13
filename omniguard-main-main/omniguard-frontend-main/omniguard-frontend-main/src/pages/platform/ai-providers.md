# AI Providers

Configure AI providers, set up BYOM/BYOK, and manage AI usage policies.

## AI Platform Overview
OmniGuard allows enterprises to bring their own AI models (BYOM) and keys (BYOK), ensuring zero data leakage to third-party AI trainers.

## Configure Providers
Connect your preferred providers:
```bash
omniguard provider add anthropic --key sk-ant-...
```

## BYOM Setup
You can connect local models (like Ollama) or enterprise gateways (AWS Bedrock, Azure OpenAI) to power the OmniGuard AI remediation engine.

## Provider Usage Analytics
Track token usage and costs across your organization:
```bash
omniguard provider usage --json
```
