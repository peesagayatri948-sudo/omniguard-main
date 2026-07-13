import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

const integrationGroups = [
  {
    category: 'Source Control',
    items: [
      { name: 'GitHub', desc: 'PR checks, Actions workflows, GitHub Advanced Security integration, and organization-level scanning.' },
      { name: 'GitLab', desc: 'GitLab CI/CD pipelines, merge request gates, GitLab Ultimate security features, and self-hosted support.' },
      { name: 'Azure DevOps', desc: 'Azure Pipelines integration, work item creation, board sync, and Azure Repos support.' },
      { name: 'Bitbucket', desc: 'Bitbucket Pipelines, PR decoration, Bitbucket Cloud and Server/Data Center support.' },
    ],
  },
  {
    category: 'Cloud Providers',
    items: [
      { name: 'Amazon Web Services', desc: 'IAM analysis, S3 policy review, VPC configuration, CloudTrail integration, and AWS Config support.' },
      { name: 'Microsoft Azure', desc: 'Azure RBAC analysis, Key Vault integration, NSG review, Azure Defender integration.' },
      { name: 'Google Cloud', desc: 'GCP IAM analysis, Cloud Storage policies, VPC Service Controls, and Security Command Center.' },
    ],
  },
  {
    category: 'Infrastructure',
    items: [
      { name: 'Terraform', desc: 'Scan Terraform HCL for misconfigurations, drift from baseline, and policy violations before apply.' },
      { name: 'Kubernetes', desc: 'Cluster configuration analysis, RBAC review, network policy validation, and admission webhook support.' },
      { name: 'Docker', desc: 'Container image scanning, Dockerfile analysis, and registry integration for continuous monitoring.' },
      { name: 'HashiCorp Vault', desc: 'Secret sprawl detection, Vault policy analysis, and integration with OmniGuard secret scanning.' },
    ],
  },
  {
    category: 'Collaboration & Ticketing',
    items: [
      { name: 'Jira', desc: 'Automatic ticket creation for security findings with priority, assignee, and sprint management.' },
      { name: 'Confluence', desc: 'Architecture documentation ingestion and automatic security documentation generation.' },
      { name: 'Slack', desc: 'Real-time security alerts, finding notifications, and approval workflow messages.' },
      { name: 'Microsoft Teams', desc: 'Security notification delivery, finding summaries, and approval workflow integration.' },
    ],
  },
  {
    category: 'Identity & Access',
    items: [
      { name: 'Okta', desc: 'SSO integration, user provisioning, group sync, and RBAC mapping for enterprise deployments.' },
    ],
  },
  {
    category: 'AI Providers',
    items: [
      { name: 'Anthropic', desc: 'Claude models for security analysis, threat explanation, and AI-assisted remediation.' },
      { name: 'OpenAI', desc: 'GPT-4 models for natural language policy parsing and security documentation generation.' },
      { name: 'Google Gemini', desc: 'Gemini models for code analysis, threat modeling assistance, and compliance summarization.' },
      { name: 'AWS Bedrock', desc: 'Use Bedrock-hosted models including Claude, Llama, and Titan within your AWS environment.' },
      { name: 'Azure OpenAI', desc: 'OpenAI models deployed in your Azure tenant for enterprise data residency requirements.' },
      { name: 'Ollama', desc: 'Run OmniGuard Nexus AI features entirely locally using open-source models via Ollama.' },
      { name: 'LM Studio', desc: 'Connect any GGUF model running locally via LM Studio for fully offline AI-assisted security.' },
    ],
  },
];

export default function Integrations() {
  return (
    <>
      <section className="py-20 bg-white border-b border-gray-100">
        <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mb-16">
            <div className="section-label mb-4">Integrations</div>
            <h1 className="text-5xl font-bold text-gray-900 leading-tight mb-6">
              Connects to your entire security and development stack
            </h1>
            <p className="text-xl text-gray-500 leading-relaxed mb-8">
              OmniGuard Nexus integrates natively with source control, cloud providers, AI models, identity providers, infrastructure tools, and collaboration platforms — fitting seamlessly into existing workflows.
            </p>
            <div className="flex gap-3">
              <Link to="/book-demo" className="btn-primary">Book a Demo <ArrowRight size={15} /></Link>
              <Link to="/docs/integrations" className="btn-secondary">Integration Docs</Link>
            </div>
          </div>

          {integrationGroups.map((group) => (
            <div key={group.category} className="mb-14">
              <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-5">{group.category}</h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {group.items.map((item) => (
                  <div key={item.name} className="card hover:border-blue-200 transition-colors">
                    <div className="text-sm font-semibold text-gray-900 mb-2">{item.name}</div>
                    <p className="text-xs text-gray-500 leading-relaxed">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="py-16 bg-gray-50">
        <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Don't see your tool?</h2>
          <p className="text-gray-500 mb-8 max-w-lg mx-auto">
            OmniGuard Nexus provides a full REST API and webhook system for custom integrations. Contact our team to discuss your specific integration requirements.
          </p>
          <div className="flex justify-center gap-4">
            <Link to="/contact" className="btn-primary text-sm">Contact Sales <ArrowRight size={15} /></Link>
            <Link to="/docs/api" className="btn-secondary text-sm">API Documentation</Link>
          </div>
        </div>
      </section>
    </>
  );
}
