import { Link } from 'react-router-dom';
import { ArrowRight, Check, Cpu, Eye, AlertTriangle } from 'lucide-react';

export default function SecurityEngine() {
  return (
    <>
      <section className="py-20 bg-white border-b border-gray-100">
        <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mb-16">
            <div className="section-label mb-4">Security Engine</div>
            <h1 className="text-5xl font-bold text-gray-900 leading-tight mb-6">
              AI-powered scanning that understands architecture context
            </h1>
            <p className="text-xl text-gray-500 leading-relaxed mb-8">
              OmniGuard’s Security Engine goes beyond traditional scanners. Every finding is enriched with architectural context from the Architecture Nexus, making results actionable and defensible.
            </p>
            <div className="flex gap-3">
              <Link to="/book-demo" className="btn-primary">Book a Demo <ArrowRight size={15} /></Link>
              <Link to="/docs/security-engine" className="btn-secondary">Documentation</Link>
            </div>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: Eye, title: 'SAST', desc: 'Static analysis with architectural context. Findings are ranked by exploitability within your actual architecture, not just code-level risk.' },
              { icon: AlertTriangle, title: 'Secret Scanning', desc: 'Detect secrets, credentials, API keys, and tokens across commits, branches, and pull requests — with automatic rotation guidance.' },
              { icon: Cpu, title: 'IaC Scanning', desc: 'Terraform, CloudFormation, Pulumi, Bicep, and Kubernetes manifests scanned against your secure design baseline for drift detection.' },
              { icon: Check, title: 'Dependency Scanning', desc: 'SCA with reachability analysis. Know which CVEs are actually exploitable in your running application, not just present in a package.' },
              { icon: Eye, title: 'Container Scanning', desc: 'Image scanning, runtime policy enforcement, and base image recommendations integrated with your deployment pipeline.' },
              { icon: AlertTriangle, title: 'SBOM Generation', desc: 'Automatic Software Bill of Materials generation in CycloneDX and SPDX formats, continuously updated as dependencies change.' },
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
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <div className="section-label mb-4">Pull Request Protection</div>
              <h2 className="section-title mb-6">Block insecure code before it merges</h2>
              <p className="section-subtitle mb-6">
                OmniGuard integrates directly into your CI/CD pipeline to enforce security gates at the pull request level. Configure which findings block merges, which require review, and which are informational.
              </p>
              <ul className="space-y-3">
                {[
                  'PR-level security gate enforcement',
                  'Configurable blocking thresholds by severity',
                  'AI-assisted remediation suggestions inline',
                  'Architecture impact assessment for each PR',
                  'Merge protection with required security approvals',
                  'Integration with GitHub, GitLab, Azure DevOps, Bitbucket',
                ].map((item) => (
                  <li key={item} className="flex items-center gap-3 text-sm text-gray-700">
                    <Check size={14} className="text-blue-600 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-gray-950 rounded-xl border border-gray-800 p-6">
              <div className="text-xs text-gray-500 font-mono mb-4">Pull Request #847 — Security Gate</div>
              <div className="space-y-3">
                <div className="flex items-start gap-3 p-3 bg-red-900/20 border border-red-800/40 rounded-lg">
                  <span className="tag bg-red-900/50 text-red-400 flex-shrink-0 mt-0.5">BLOCKED</span>
                  <div>
                    <div className="text-sm font-mono text-red-300">Secret detected: AWS_SECRET_KEY in config.ts:23</div>
                    <div className="text-xs text-gray-500 mt-1">Merge blocked. Rotate credentials and remove before merging.</div>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-orange-900/20 border border-orange-800/40 rounded-lg">
                  <span className="tag bg-orange-900/50 text-orange-400 flex-shrink-0 mt-0.5">HIGH</span>
                  <div>
                    <div className="text-sm font-mono text-orange-300">Missing auth check on /api/admin/users endpoint</div>
                    <div className="text-xs text-gray-500 mt-1">Violates trust boundary policy: admin-service → user-db</div>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-yellow-900/20 border border-yellow-800/40 rounded-lg">
                  <span className="tag bg-yellow-900/50 text-yellow-400 flex-shrink-0 mt-0.5">MEDIUM</span>
                  <div>
                    <div className="text-sm font-mono text-yellow-300">lodash@4.17.20 — CVE-2021-23337 (prototype pollution)</div>
                    <div className="text-xs text-gray-500 mt-1">Reachable via user-supplied input. Upgrade to 4.17.21.</div>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-green-900/20 border border-green-800/40 rounded-lg">
                  <span className="tag bg-green-900/50 text-green-400 flex-shrink-0 mt-0.5">PASS</span>
                  <div>
                    <div className="text-sm font-mono text-green-300">Architecture design check — passed</div>
                    <div className="text-xs text-gray-500 mt-1">All trust boundaries respected. No new attack paths introduced.</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-gray-950">
        <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-white mb-4">Security that understands your architecture</h2>
          <p className="text-gray-400 mb-8 max-w-lg mx-auto">
            Every finding contextualized by your Architecture Nexus. No more noise — just actionable security intelligence.
          </p>
          <Link to="/book-demo" className="btn-primary text-sm px-7 py-3">
            Book a Demo <ArrowRight size={16} />
          </Link>
        </div>
      </section>
    </>
  );
}
