export default function Terms() {
  return (
    <section className="py-20 bg-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-12">
          <div className="section-label mb-4">Legal</div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Terms of Service</h1>
          <p className="text-sm text-gray-400">Last updated: June 2025</p>
        </div>
        <div className="space-y-8 text-gray-600 leading-relaxed">
          {[
            { title: '1. Acceptance of Terms', body: 'By accessing or using OmniGuard Nexus ("the Service"), you agree to be bound by these Terms of Service. If you are using the Service on behalf of an organization, you represent that you have authority to bind the organization to these terms. If you do not agree to these terms, do not use the Service.' },
            { title: '2. Service Description', body: 'OmniGuard Nexus provides an enterprise continuous threat modeling and secure design graph platform. The Service includes architecture discovery, security scanning, compliance mapping, policy enforcement, and related developer tooling. Service capabilities may change over time; we will provide notice of material changes.' },
            { title: '3. Account Responsibilities', body: 'You are responsible for maintaining the confidentiality of your API keys and account credentials. You agree not to share credentials, use the Service to compromise third-party systems you do not have authorization to test, attempt to reverse-engineer the Service, or use the Service in violation of applicable laws. Enterprise accounts may configure RBAC to manage team access.' },
            { title: '4. Data and Intellectual Property', body: 'You retain ownership of your source code, architecture data, and scan results ("Customer Data"). By using the Service, you grant OmniGuard Nexus a limited license to process Customer Data solely to provide the Service. OmniGuard Nexus retains ownership of the platform, AI models, threat library, compliance framework mappings, and related intellectual property.' },
            { title: '5. Acceptable Use', body: 'The Service may only be used for lawful security analysis of systems you own or have explicit authorization to test. The Service may not be used for: unauthorized access testing, creating malicious tools, attacking OmniGuard infrastructure, scraping or bulk exporting compliance frameworks beyond authorized use, or reselling access to the Service.' },
            { title: '6. Service Level and Availability', body: 'OmniGuard Nexus targets 99.9% uptime for production services. Enterprise plans include SLA commitments with defined remedies for downtime. We perform scheduled maintenance with advance notice. Self-hosted deployments operate on infrastructure controlled by the customer.' },
            { title: '7. Limitation of Liability', body: 'OmniGuard Nexus is not liable for security incidents that occur in your environment, regardless of whether findings were present in our platform. Security tooling is one component of a comprehensive security program; it does not guarantee the absence of vulnerabilities or breaches.' },
            { title: '8. Governing Law', body: 'These Terms are governed by the laws of the State of California. Disputes shall be resolved through binding arbitration in San Francisco, California.' },
          ].map((section) => (
            <div key={section.title}>
              <h2 className="text-base font-semibold text-gray-900 mb-3">{section.title}</h2>
              <p className="text-sm">{section.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
