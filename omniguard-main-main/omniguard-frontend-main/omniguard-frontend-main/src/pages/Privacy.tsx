export default function Privacy() {
  return (
    <section className="py-20 bg-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-12">
          <div className="section-label mb-4">Legal</div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Privacy Policy</h1>
          <p className="text-sm text-gray-400">Last updated: June 2025</p>
        </div>
        <div className="prose prose-sm max-w-none space-y-8 text-gray-600 leading-relaxed">
          {[
            { title: '1. Information We Collect', body: 'OmniGuard Nexus, Inc. collects information you provide directly (account registration, support requests, demo requests), information from your use of our platform (scan results, repository metadata, usage analytics), and technical information (IP address, browser type, log data). We do not store raw source code beyond what is necessary to perform security analysis; scan results are stored in your organization\'s account and subject to your data retention settings.' },
            { title: '2. How We Use Your Information', body: 'We use collected information to provide, maintain, and improve the OmniGuard Nexus platform; generate the Architecture Nexus and security findings for your organization; send product updates and security advisories; respond to support inquiries; and analyze platform usage to improve performance and features. We do not sell personal information to third parties.' },
            { title: '3. Data Storage and Security', body: 'Customer data is stored in encrypted form at rest (AES-256) and in transit (TLS 1.3). Enterprise customers may choose their data region (US, EU, APAC). Self-hosted deployments store all data within the customer\'s own infrastructure under their control. We maintain comprehensive audit logs of all access to customer data by OmniGuard personnel.' },
            { title: '4. AI Provider Data Handling', body: 'When using OmniGuard Nexus AI features, security analysis data may be sent to your configured AI provider (Anthropic, OpenAI, etc.) in accordance with that provider\'s terms and your organization\'s BYOK configuration. We do not send customer data to AI providers without your explicit configuration. Customers using the BYOM option control all AI data flows within their own infrastructure.' },
            { title: '5. Data Retention', body: 'Scan results and Architecture Nexus data are retained for 12 months by default. Enterprise customers may configure custom retention periods from 30 days to indefinite. Audit logs are retained for 7 years by default in compliance with common regulatory requirements. You may request deletion of your account data at any time.' },
            { title: '6. Your Rights', body: 'Depending on your jurisdiction, you may have rights to access, correct, delete, or port your personal data. Enterprise customers in the EU/EEA have rights under GDPR. California residents have rights under CCPA. To exercise these rights, contact privacy@omniguard.io.' },
            { title: '7. Contact', body: 'For privacy inquiries, contact our Data Protection Officer at privacy@omniguard.io or OmniGuard Nexus, Inc., 123 Market Street, San Francisco, CA 94105.' },
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
