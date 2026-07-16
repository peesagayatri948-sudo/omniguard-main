import { Link } from 'react-router-dom';
import { ArrowRight, Check, Zap, Eye, Cpu } from 'lucide-react';

export default function VSCode() {
  return (
    <>
      <section className="py-20 bg-white border-b border-gray-100">
        <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mb-16">
            <div className="section-label mb-4">VS Code Extension</div>
            <h1 className="text-5xl font-bold text-gray-900 leading-tight mb-6">
              Security intelligence inside your editor
            </h1>
            <p className="text-xl text-gray-500 leading-relaxed mb-4">
              The OmniGuard VS Code extension shifts security left by bringing the full power of the Architecture Nexus directly into your IDE. As you type, local AST and Regex parsers highlight vulnerabilities in real-time — no code is ever uploaded.
            </p>
            <p className="text-base text-gray-500 leading-relaxed mb-8">
              Click the Quick Fix bulb next to any flagged issue to have OmniGuard's AI instantly generate and apply a drop-in patch. All analysis runs locally; only the Architecture Nexus graph metadata syncs with your organization.
            </p>
            <div className="flex gap-3">
              <Link to="/book-demo" className="btn-primary">Get Access <ArrowRight size={15} /></Link>
              <Link to="/docs" className="btn-secondary">Documentation</Link>
            </div>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: Zap,
                title: 'Live Scanning (No Upload)',
                desc: 'Local AST and Regex parsers run as you type, highlighting vulnerabilities in real-time without sending your code to any server.',
              },
              {
                icon: Eye,
                title: 'Quick Fix Patches',
                desc: 'Click the Quick Fix bulb icon next to any vulnerability. OmniGuard\'s AI generates a precise, context-aware drop-in patch you can apply immediately.',
              },
              {
                icon: Cpu,
                title: 'Hover Explanations',
                desc: 'Hover over any flagged issue to see a full explanation: what the problem is, why it\'s a risk in your architecture, and how to fix it.',
              },
              {
                icon: Check,
                title: 'Policy Enforcement',
                desc: 'Your organization\'s security policies are enforced in real time. Policy violations appear as diagnostics as you write code, not during PR review.',
              },
              {
                icon: Zap,
                title: 'Architecture Nexus Queries',
                desc: 'Query the Architecture Nexus from the command palette. Ask questions like "which services cross this trust boundary without authentication?" without leaving your editor.',
              },
              {
                icon: Eye,
                title: 'Repository Awareness',
                desc: 'The extension understands your full repository structure — cross-file security analysis catches issues that file-scoped tools miss entirely.',
              },
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
              <div className="section-label mb-4">Installation</div>
              <h2 className="section-title mb-6">Set up in under two minutes</h2>
              <ol className="space-y-5">
                {[
                  {
                    step: '1',
                    label: 'Install from the marketplace',
                    desc: 'Open VS Code, go to the Extensions panel, and search for "OmniGuard Security". Click Install.',
                  },
                  {
                    step: '2',
                    label: 'Sign in',
                    desc: 'Open the Command Palette (⌘⇧P / Ctrl⇧P) and run the OmniGuard: Login command. Authenticate with your OmniGuard Nexus credentials.',
                  },
                  {
                    step: '3',
                    label: 'Open your repository',
                    desc: 'Open a folder or workspace. The extension detects your project structure and begins building the local Architecture Nexus context.',
                  },
                  {
                    step: '4',
                    label: 'Live scanning begins',
                    desc: 'Findings appear as inline diagnostics within seconds of opening a file. No configuration needed for default settings.',
                  },
                ].map((s) => (
                  <div key={s.step} className="flex items-start gap-4">
                    <div className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                      {s.step}
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-gray-900">{s.label}</div>
                      <div className="text-sm text-gray-500 mt-1">{s.desc}</div>
                    </div>
                  </div>
                ))}
              </ol>
            </div>
            <div>
              <div className="section-label mb-4">What's Included</div>
              <h2 className="section-title mb-6">Full security coverage in every file</h2>
              <ul className="space-y-3">
                {[
                  'Real-time SAST via local AST + Regex parsers (no code upload)',
                  'Secret detection with immediate redaction suggestions',
                  'IaC validation for Terraform, CloudFormation, and Kubernetes',
                  'Architecture Nexus queries from the command palette',
                  'Trust boundary violations highlighted in context',
                  'Policy violations with policy reference links',
                  'Quick Fix bulb — AI-generated patch applied in one click',
                  'Security sidebar showing finding summary and posture trends',
                  'Team policy sync — consistent enforcement across all editors',
                  'Offline mode via CLI daemon for air-gapped environments',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm text-gray-700">
                    <Check size={14} className="text-blue-600 flex-shrink-0 mt-0.5" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-gray-50 border-b border-gray-100">
        <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mx-auto">
            <div className="section-label mb-3 text-center">Configuration</div>
            <h2 className="section-title mb-8 text-center">Extension settings</h2>
            <div className="bg-gray-950 rounded-xl border border-gray-800 p-6">
              <div className="text-xs text-gray-500 font-mono mb-4">settings.json</div>
              <pre className="text-xs font-mono text-green-400 leading-relaxed overflow-x-auto">{`{
  "omniguard.scanOnSave": true,
  "omniguard.scanOnType": true,
  "omniguard.minSeverity": "medium",
  "omniguard.showInlineHints": true,
  "omniguard.aiRemediations": true,
  "omniguard.graphPath": ".omniguard/nexus.json",
  "omniguard.policyEnforcement": "warn",
  "omniguard.teamPolicies": true,
  "omniguard.telemetry": false
}`}</pre>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-gray-950">
        <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-white mb-4">Security where developers actually work</h2>
          <p className="text-gray-400 mb-8 max-w-lg mx-auto">
            The VS Code extension is included with every OmniGuard Nexus plan.
          </p>
          <Link to="/book-demo" className="btn-primary text-sm px-7 py-3">
            Book a Demo <ArrowRight size={16} />
          </Link>
        </div>
      </section>
    </>
  );
}
