import { Link } from 'react-router-dom';
import { ArrowRight, Network } from 'lucide-react';

const mcpTools = [
  {
    name: 'nexus-graph',
    desc: 'Retrieve the current Architecture Nexus state — the full deterministic model of your architecture, trust boundaries, data flows, and controls.',
  },
  {
    name: 'nexus-trace',
    desc: 'Trace security controls and data flows through the Architecture Nexus. Useful for tracing a control back to its regulatory requirements or following an attack path.',
  },
  {
    name: 'scan-code',
    desc: 'Request a vulnerability scan on a specific path or repository. Results include SAST findings, secret detections, and IaC misconfigurations.',
  },
  {
    name: 'drift-detection',
    desc: 'Check for architecture drift between the current state of an environment and the Architecture Nexus baseline.',
  },
  {
    name: 'compliance-evidence',
    desc: 'Retrieve compliance evidence, control mappings, and audit artifacts for a specified framework and scope.',
  },
  {
    name: 'attack-path-analysis',
    desc: 'Identify attack paths between two components in the Architecture Nexus, including intermediate steps and associated controls.',
  },
];

export default function MCPPage() {
  return (
    <>
      <section className="py-20 bg-white border-b border-gray-100">
        <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mb-16">
            <div className="section-label mb-4">MCP Server</div>
            <h1 className="text-5xl font-bold text-gray-900 leading-tight mb-6">
              Connect OmniGuard Nexus to any AI assistant via MCP
            </h1>
            <p className="text-xl text-gray-500 leading-relaxed mb-4">
              OmniGuard provides a native Model Context Protocol (MCP) server, allowing you to seamlessly integrate the Architecture Nexus into Claude Desktop or any other MCP-compatible AI client.
            </p>
            <p className="text-base text-gray-500 leading-relaxed mb-8">
              Once connected, your AI assistant can query the Architecture Nexus, trace attack paths, run scans, and retrieve compliance evidence — grounded in your actual architecture, not generic knowledge.
            </p>
            <div className="flex gap-3">
              <Link to="/book-demo" className="btn-primary">Get Access <ArrowRight size={15} /></Link>
              <Link to="/docs" className="btn-secondary">Documentation</Link>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-gray-50 border-b border-gray-100">
        <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-start">
            <div>
              <div className="section-label mb-4">Setup</div>
              <h2 className="section-title mb-6">Connect in minutes</h2>
              <ol className="space-y-5 mb-8">
                {[
                  {
                    step: '1',
                    label: 'Install the CLI',
                    desc: 'Install the OmniGuard CLI and authenticate: npm install -g omniguard-enterprise-cli && omniguard login',
                  },
                  {
                    step: '2',
                    label: 'Start the MCP server',
                    desc: 'Run omniguard mcp start to launch the local MCP daemon. It binds to a local socket and stays running in the background.',
                  },
                  {
                    step: '3',
                    label: 'Configure your AI client',
                    desc: 'Add the server configuration shown on the right to your claude_desktop_config.json or equivalent MCP client config file.',
                  },
                  {
                    step: '4',
                    label: 'Start querying',
                    desc: 'Your AI assistant can now query the Architecture Nexus, run scans, trace controls, and retrieve compliance evidence in real conversation.',
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

            <div className="space-y-4">
              <div>
                <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                  Start the MCP Server
                </div>
                <div className="bg-gray-950 rounded-xl border border-gray-800 p-4">
                  <code className="text-sm font-mono text-green-400">omniguard mcp start</code>
                </div>
              </div>

              <div>
                <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                  Claude Desktop Configuration
                </div>
                <div className="bg-gray-950 rounded-xl border border-gray-800 p-5">
                  <div className="text-xs text-gray-500 font-mono mb-3">claude_desktop_config.json</div>
                  <pre className="text-xs font-mono text-green-400 leading-relaxed overflow-x-auto">{`{
  "mcpServers": {
    "omniguard": {
      "command": "omniguard",
      "args": ["mcp", "start"]
    }
  }
}`}</pre>
                </div>
              </div>

              <div>
                <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                  Self-Hosted / Custom Endpoint
                </div>
                <div className="bg-gray-950 rounded-xl border border-gray-800 p-5">
                  <pre className="text-xs font-mono text-green-400 leading-relaxed overflow-x-auto">{`{
  "mcpServers": {
    "omniguard": {
      "command": "node",
      "args": ["cli/src/mcp-server.js"],
      "env": {
        "OMNIGUARD_ENDPOINT": "https://your-instance/api",
        "OMNIGUARD_API_KEY": "your-api-key"
      }
    }
  }
}`}</pre>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-white border-b border-gray-100">
        <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mb-12">
            <div className="section-label mb-4">Available Tools</div>
            <h2 className="section-title mb-4">Security capabilities accessible to AI assistants</h2>
            <p className="section-subtitle">
              The OmniGuard MCP server exposes these tools to connected AI clients, enabling them to perform real security analysis grounded in your actual architecture data.
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            {mcpTools.map((tool) => (
              <div key={tool.name} className="bg-gray-50 border border-gray-200 rounded-lg p-5">
                <div className="flex items-center gap-3 mb-3">
                  <Network size={15} className="text-blue-600 flex-shrink-0" />
                  <code className="text-sm font-mono font-semibold text-gray-900">{tool.name}</code>
                </div>
                <p className="text-sm text-gray-500 leading-relaxed">{tool.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 bg-gray-50 border-b border-gray-100">
        <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mx-auto">
            <div className="section-label mb-4 text-center">Example Conversation</div>
            <h2 className="section-title mb-8 text-center">What becomes possible with MCP</h2>
            <div className="space-y-4">
              {[
                {
                  role: 'user',
                  text: 'What are the highest-risk attack paths in our architecture right now?',
                },
                {
                  role: 'assistant',
                  text: '[Calls nexus-graph and attack-path-analysis tools]\n\nBased on your Architecture Nexus, I can see 4 active attack paths. The highest risk is: External Internet → API Gateway → Auth Service → User Database (CRITICAL — no auth middleware on the /admin route). This path exploits a missing control identified during the last Architecture Nexus snapshot and bypasses your WAF due to IaC drift detected 2 days ago.',
                },
                {
                  role: 'user',
                  text: 'Show me the SOC 2 compliance gaps for the payment service.',
                },
                {
                  role: 'assistant',
                  text: '[Calls compliance-evidence and nexus-trace tools]\n\nFor the payment-service component, I found 3 SOC 2 CC gaps:\n1. CC6.1 — Missing input validation on 2 API endpoints\n2. CC7.2 — Audit log does not capture admin access attempts\n3. CC6.6 — Inbound traffic rule allows port 3306 from non-PCI segment\n\nEvidence for the 94 passing controls is already collected in your compliance dashboard.',
                },
              ].map((msg, i) => (
                <div
                  key={i}
                  className={`p-4 rounded-lg ${
                    msg.role === 'user'
                      ? 'bg-blue-50 border border-blue-100 ml-8'
                      : 'bg-white border border-gray-200 mr-8'
                  }`}
                >
                  <div className={`text-xs font-semibold uppercase tracking-wider mb-2 ${msg.role === 'user' ? 'text-blue-600' : 'text-gray-400'}`}>
                    {msg.role === 'user' ? 'Security Engineer' : 'AI Assistant (via MCP)'}
                  </div>
                  <p className="text-sm text-gray-700 whitespace-pre-line leading-relaxed">{msg.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-gray-950">
        <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-white mb-4">Give your AI assistant real security context</h2>
          <p className="text-gray-400 mb-8 max-w-lg mx-auto">
            The OmniGuard MCP server is available on all plans.
          </p>
          <Link to="/book-demo" className="btn-primary text-sm px-7 py-3">
            Book a Demo <ArrowRight size={16} />
          </Link>
        </div>
      </section>
    </>
  );
}
