import { Link } from 'react-router-dom';
import { ArrowRight, Check } from 'lucide-react';

interface SolutionPageProps {
  label: string;
  title: string;
  subtitle: string;
  highlights: string[];
  benefits: { title: string; desc: string }[];
  frameworks?: string[];
}

export function SolutionPage({ label, title, subtitle, highlights, benefits, frameworks }: SolutionPageProps) {
  return (
    <>
      <section className="py-20 bg-white border-b border-gray-100">
        <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mb-16">
            <div className="section-label mb-4">{label}</div>
            <h1 className="text-5xl font-bold text-gray-900 leading-tight mb-6">{title}</h1>
            <p className="text-xl text-gray-500 leading-relaxed mb-8">{subtitle}</p>
            <div className="flex gap-3">
              <Link to="/book-demo" className="btn-primary">Book a Demo <ArrowRight size={15} /></Link>
              <Link to="/contact" className="btn-secondary">Contact Sales</Link>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-3 mb-16">
            {highlights.map((h) => (
              <div key={h} className="flex items-center gap-3 p-4 bg-gray-50 border border-gray-100 rounded-lg">
                <Check size={15} className="text-blue-600 flex-shrink-0" />
                <span className="text-sm text-gray-700">{h}</span>
              </div>
            ))}
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {benefits.map((b) => (
              <div key={b.title} className="card">
                <h3 className="text-sm font-semibold text-gray-900 mb-2">{b.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{b.desc}</p>
              </div>
            ))}
          </div>

          {frameworks && (
            <div className="mt-12">
              <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Applicable Frameworks</div>
              <div className="flex flex-wrap gap-2">
                {frameworks.map((fw) => (
                  <span key={fw} className="px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-full text-xs font-medium text-gray-700">
                    {fw}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>
    </>
  );
}

export function ThreatModelingSolution() {
  return (
    <SolutionPage
      label="Solution — Continuous Threat Modeling"
      title="Replace quarterly threat modeling with continuous, automated analysis"
      subtitle="OmniGuard Nexus automatically discovers your architecture, builds a threat model, and keeps it updated as your systems evolve — making continuous threat modeling achievable for every engineering team."
      highlights={[
        'Architecture discovery in minutes from existing code and IaC',
        'STRIDE + MITRE ATT&CK threat enumeration',
        'Automatic attack path identification',
        'Trust boundary analysis and validation',
        'Continuous updates as architecture changes',
        'Developer-facing feedback via CLI and VS Code',
        'Audit-ready threat model documentation',
        'Integration with existing security workflows',
      ]}
      benefits={[
        { title: 'No manual modeling required', desc: 'OmniGuard reads your repositories, IaC, and cloud configs to build the threat model automatically. No diagrams to maintain.' },
        { title: 'Architecture-aware findings', desc: 'Every finding is contextualized by your actual architecture — not generic vulnerability descriptions.' },
        { title: 'Continuous updates', desc: 'The threat model updates automatically as your architecture evolves. No more stale security documentation.' },
        { title: 'Developer integration', desc: 'Architectural security feedback delivered to the CLI and VS Code before code merges.' },
        { title: 'Compliance mapping', desc: 'Threat model automatically maps to applicable compliance controls for PCI, HIPAA, SOC 2, and more.' },
        { title: 'Executive reporting', desc: 'Automated security posture reports suitable for board and audit committee review.' },
      ]}
    />
  );
}

export function SecureSDLCSolution() {
  return (
    <SolutionPage
      label="Solution — Secure SDLC"
      title="Embed security at every stage of the software development lifecycle"
      subtitle="OmniGuard Nexus integrates into every phase of the SDLC — from design review to deployment — providing automated security gates, developer feedback, and continuous compliance monitoring."
      highlights={[
        'Design-time architecture validation',
        'Pre-commit hook integration',
        'Pull request security gates',
        'Merge protection with configurable thresholds',
        'CI/CD pipeline security checks',
        'Post-deployment drift detection',
        'Continuous runtime policy enforcement',
        'Developer-friendly remediation guidance',
      ]}
      benefits={[
        { title: 'Shift left without friction', desc: 'Security feedback delivered where developers already work — CLI, VS Code, and PR reviews — not in a separate security portal.' },
        { title: 'Configurable gates', desc: 'Define exactly which findings block PRs, which require review, and which are informational. Balance security rigor with developer velocity.' },
        { title: 'Architecture validation', desc: 'Validate that proposed architecture changes don\'t introduce new attack paths before implementation begins.' },
        { title: 'Automated remediation', desc: 'AI-assisted fix suggestions reduce the time between finding detection and resolution.' },
        { title: 'Full SDLC coverage', desc: 'From design through production — one platform for design review, code security, IaC validation, and runtime monitoring.' },
        { title: 'Evidence collection', desc: 'Automatic collection of compliance evidence at each SDLC gate for audit readiness.' },
      ]}
    />
  );
}

export function AISecuritySolution() {
  return (
    <SolutionPage
      label="Solution — AI Security & Governance"
      title="Govern AI adoption across your organization without slowing it down"
      subtitle="As your organization adopts AI-powered development and AI-driven applications, OmniGuard Nexus provides the governance layer to ensure AI usage is secure, auditable, and compliant with emerging regulations."
      highlights={[
        'AI data flow mapping in the Architecture Nexus',
        'Prompt policy enforcement and monitoring',
        'AI provider usage analytics and cost tracking',
        'Model risk management and evaluation',
        'Secure MCP server for AI assistant integration',
        'BYOM and BYOK support for all major providers',
        'AI-specific compliance framework mapping',
        'Secure prompt execution environments',
      ]}
      benefits={[
        { title: 'Map AI data flows', desc: 'Automatically discover and map all AI API calls, data inputs, and model outputs in your Architecture Nexus.' },
        { title: 'Enforce prompt policies', desc: 'Define policies about what data can be sent to which AI providers and enforce them automatically.' },
        { title: 'Model risk management', desc: 'Evaluate AI model outputs against security policies before they surface as recommendations.' },
        { title: 'Provider independence', desc: 'BYOM and BYOK support means you\'re never locked into a specific AI vendor and never share data beyond your trust boundary.' },
        { title: 'Compliance mapping', desc: 'Map AI governance controls to NIST AI RMF, EU AI Act, and organization-specific AI policies.' },
        { title: 'Full audit trail', desc: 'Every AI decision, recommendation, and fix is logged with full traceability to source data and model used.' },
      ]}
      frameworks={['NIST AI RMF', 'EU AI Act', 'ISO 42001', 'NIST SP 800-218A', 'OWASP LLM Top 10']}
    />
  );
}

export function ComplianceSolution() {
  return (
    <SolutionPage
      label="Solution — Compliance Automation"
      title="Automate compliance evidence collection and reporting across 180+ frameworks"
      subtitle="OmniGuard Nexus continuously cross-references the Architecture Nexus against 180+ compliance frameworks, collects evidence automatically from cloud environments and scan results, and generates audit-ready reports with a single command: omniguard compliance report --framework soc2 --format pdf"
      highlights={[
        '180+ supported frameworks including PCI DSS, HIPAA, SOC 2',
        'Automatic evidence collection from scan results',
        'Continuous control status monitoring',
        'Audit-ready report generation in PDF and HTML',
        'Gap analysis with prioritized remediation roadmap',
        'Cross-framework control deduplication',
        'Custom framework support for internal policies',
        'Evidence retention with tamper-evident audit logs',
      ]}
      benefits={[
        { title: 'Continuous compliance', desc: 'Control status is assessed continuously — not just at audit time. Know your compliance posture on any given day.' },
        { title: 'Automatic evidence', desc: 'Evidence is collected automatically from scanning activities, policy checks, and architecture validation — no manual collection.' },
        { title: 'Cross-framework efficiency', desc: 'Controls mapped to multiple frameworks simultaneously. Pass one control review, satisfy requirements across several frameworks.' },
        { title: 'Gap analysis', desc: 'Instantly identify which compliance controls are not yet met and receive a prioritized remediation roadmap.' },
        { title: 'Auditor-ready packages', desc: 'Generate complete evidence packages with the click of a button — organized by control family and ready for auditor review.' },
        { title: '180+ frameworks', desc: 'From PCI DSS 4.0 and HIPAA to DORA, NIS2, FedRAMP, and CIS Controls — all maintained and updated by OmniGuard.' },
      ]}
      frameworks={['PCI DSS 4.0', 'HIPAA', 'SOC 2 Type II', 'ISO 27001:2022', 'NIST CSF 2.0', 'GDPR', 'FedRAMP', 'DORA', 'NIS2', 'HITRUST']}
    />
  );
}

export function CloudSecuritySolution() {
  return (
    <SolutionPage
      label="Solution — Cloud Security Posture"
      title="Detect architecture drift before it becomes a security incident"
      subtitle="OmniGuard Nexus continuously compares your deployed cloud infrastructure against the Architecture Nexus baseline, detecting misconfigurations and drift the moment they occur."
      highlights={[
        'Continuous cloud configuration monitoring',
        'Architecture drift detection against secure baseline',
        'Multi-cloud support: AWS, Azure, GCP',
        'IaC scanning for Terraform, CloudFormation, Pulumi',
        'IAM misconfiguration detection',
        'Network policy and VPC validation',
        'Data store exposure monitoring',
        'Kubernetes cluster security analysis',
      ]}
      benefits={[
        { title: 'Baseline comparison', desc: 'Every deployed configuration is compared against your Architecture Nexus baseline — not just generic cloud security benchmarks.' },
        { title: 'Real-time drift detection', desc: 'Know within minutes when a configuration change introduces a security gap. Not weeks later during a quarterly review.' },
        { title: 'IaC validation', desc: 'Validate infrastructure changes before they\'re applied. Catch misconfigurations in pull requests before they reach production.' },
        { title: 'Multi-cloud coverage', desc: 'AWS, Azure, and Google Cloud all supported. Unified view of cloud security posture across all providers.' },
        { title: 'Attack path updates', desc: 'Cloud configuration changes automatically trigger attack path re-analysis in the Architecture Nexus.' },
        { title: 'Compliance mapping', desc: 'Cloud misconfigurations mapped to applicable compliance controls for immediate impact assessment.' },
      ]}
      frameworks={['CIS Benchmarks', 'AWS Security Hub', 'Azure Security Center', 'GCP Security Command Center', 'SOC 2 CC6', 'ISO 27001 A.12']}
    />
  );
}
