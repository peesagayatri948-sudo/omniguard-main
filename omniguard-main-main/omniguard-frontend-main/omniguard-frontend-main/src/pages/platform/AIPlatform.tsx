import { Link } from 'react-router-dom';
import { ArrowRight, Check, Cpu, Lock, BarChart3, GitBranch, Shield } from 'lucide-react';

const providers = [
  { name: 'Anthropic Claude', type: 'Commercial', cmd: 'omniguard provider add anthropic --key sk-ant-...' },
  { name: 'OpenAI GPT-4', type: 'Commercial', cmd: 'omniguard provider add openai --key sk-...' },
  { name: 'Google Gemini', type: 'Commercial', cmd: 'omniguard provider add gemini --key ...' },
  { name: 'AWS Bedrock', type: 'Commercial', cmd: 'omniguard provider add bedrock --profile default' },
  { name: 'Azure OpenAI', type: 'Commercial', cmd: 'omniguard provider add azure-openai --endpoint ...' },
  { name: 'Ollama (local)', type: 'Self-Hosted', cmd: 'omniguard provider add ollama --endpoint http://localhost:11434' },
  { name: 'LM Studio', type: 'Self-Hosted', cmd: 'omniguard provider add lmstudio --endpoint http://localhost:1234' },
  { name: 'Custom (BYOM)', type: 'Enterprise', cmd: 'omniguard provider add custom --endpoint https://...' },
];

export default function AIPlatform() {
  return (
    <>
      <section className="py-20 bg-white border-b border-gray-100">
        <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mb-16">
            <div className="section-label mb-4">AI Platform</div>
            <h1 className="text-5xl font-bold text-gray-900 leading-tight mb-6">
              Governed AI security that's explainable and auditable
            </h1>
            <p className="text-xl text-gray-500 leading-relaxed mb-4">
              Every AI decision in OmniGuard Nexus traces back to a specific threat, framework, control, and compliance rule. Nothing is an unexplained suggestion.
            </p>
            <p className="text-base text-gray-500 leading-relaxed mb-8">
              Bring your own model and your own API keys. Zero data is sent to third-party AI trainers — all AI requests flow through your configured provider under your existing contract, with full token-level audit logs.
            </p>
            <div className="flex gap-3">
              <Link to="/book-demo" className="btn-primary">Book a Demo <ArrowRight size={15} /></Link>
              <Link to="/docs" className="btn-secondary">Documentation</Link>
            </div>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: GitBranch, title: 'Multi-Model Orchestration', desc: 'Route security workloads to the optimal AI provider based on task type, cost, latency, and compliance requirements.' },
              { icon: Lock, title: 'Bring Your Own Model (BYOM)', desc: 'Connect any supported provider or deploy a custom model endpoint. OmniGuard does not require a specific AI vendor.' },
              { icon: Check, title: 'Bring Your Own API Keys (BYOK)', desc: 'Use your existing AI provider contracts and keys. No vendor lock-in, no AI costs billed through OmniGuard.' },
              { icon: Shield, title: 'Zero Data Leakage', desc: 'No data is sent to third-party AI trainers. All AI requests flow through your configured provider and are never used to train external models.' },
              { icon: BarChart3, title: 'Provider Usage Analytics', desc: 'Track token consumption, cost, latency, and model performance across providers with full per-request audit logs via omniguard provider usage.' },
              { icon: Cpu, title: 'Model Risk Management', desc: 'Evaluate AI model outputs against security policies before they surface as recommendations to developers or in reports.' },
            ].map((cap) => (
              <div key={cap.title} className="card">
                <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center mb-4">
                  <cap.icon size={20} className="text-blue-600" />
                </div>
                <h3 className="text-base font-semibold text-gray-900 mb-2">{cap.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{cap.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 bg-gray-50 border-b border-gray-100">
        <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-start">
            <div>
              <div className="section-label mb-4">Supported Providers</div>
              <h2 className="section-title mb-4">Works with the AI providers you already use</h2>
              <p className="text-gray-500 text-sm leading-relaxed mb-6">
                Configure providers with a single command. Each provider is registered under your API key — OmniGuard never stores or proxies your credentials.
              </p>
              <div className="space-y-3">
                {providers.map((p) => (
                  <div key={p.name} className="bg-white border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-800">{p.name}</span>
                      <span className={`tag text-xs ${
                        p.type === 'Commercial' ? 'bg-blue-50 text-blue-700' :
                        p.type === 'Self-Hosted' ? 'bg-gray-100 text-gray-700' :
                        'bg-purple-50 text-purple-700'
                      }`}>{p.type}</span>
                    </div>
                    <code className="text-xs font-mono text-gray-500">{p.cmd}</code>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <div className="section-label mb-4">Usage & Explainability</div>
              <h2 className="section-title mb-4">Monitor usage and trace every AI decision</h2>
              <p className="text-gray-500 text-sm leading-relaxed mb-6">
                OmniGuard Nexus implements deterministic workflows anchored to the Architecture Nexus. AI suggestions are grounded in specific evidence — every recommendation traces back through a chain of reasoning.
              </p>

              <div className="bg-gray-950 rounded-xl border border-gray-800 p-5 mb-6">
                <div className="text-xs text-gray-500 font-mono mb-3">omniguard provider usage --json</div>
                <pre className="text-xs font-mono text-green-400 leading-relaxed overflow-x-auto">{`{
  "providers": [
    {
      "name": "anthropic",
      "model": "claude-3-5-sonnet",
      "requests_today": 847,
      "tokens_used": 1284920,
      "cost_usd": 3.85,
      "avg_latency_ms": 312
    }
  ],
  "total_cost_usd": 3.85
}`}</pre>
              </div>

              <div className="space-y-3">
                {[
                  { label: 'Finding traces to specific threat', color: 'text-red-600', bg: 'bg-red-50 border-red-100' },
                  { label: 'Threat maps to framework control', color: 'text-orange-600', bg: 'bg-orange-50 border-orange-100' },
                  { label: 'Control links to compliance rule', color: 'text-yellow-700', bg: 'bg-yellow-50 border-yellow-100' },
                  { label: 'Compliance rule maps to evidence', color: 'text-blue-600', bg: 'bg-blue-50 border-blue-100' },
                  { label: 'Evidence collected from Architecture Nexus', color: 'text-green-700', bg: 'bg-green-50 border-green-100' },
                ].map((step, i) => (
                  <div key={i} className={`flex items-center gap-3 p-3 border rounded-lg ${step.bg}`}>
                    <span className={`text-sm font-semibold w-5 ${step.color}`}>{i + 1}.</span>
                    <span className="text-sm text-gray-700">{step.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-gray-950">
        <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-white mb-4">AI security your auditors can trust</h2>
          <p className="text-gray-400 mb-8 max-w-lg mx-auto">
            Every recommendation anchored to the Architecture Nexus. Zero data leakage. Full audit trail.
          </p>
          <Link to="/book-demo" className="btn-primary text-sm px-7 py-3">
            Book a Demo <ArrowRight size={16} />
          </Link>
        </div>
      </section>
    </>
  );
}
