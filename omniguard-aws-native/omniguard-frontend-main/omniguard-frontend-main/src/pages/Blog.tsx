import { ChevronRight } from 'lucide-react';

const posts = [
  {
    category: 'Research',
    title: 'Why Threat Modeling Must Be Continuous: The Case Against Point-in-Time Security Reviews',
    excerpt: 'Traditional threat modeling is conducted as a one-time exercise at project inception. As architectures evolve, these models become dangerously stale. We explore why continuous threat modeling is the only defensible approach.',
    date: 'June 2025',
    readTime: '8 min read',
  },
  {
    category: 'Product',
    title: 'Introducing the Architecture Nexus: A New Approach to Architecture Security',
    excerpt: 'We built OmniGuard Nexus because we believed the future of application security was not another scanner — it was a continuously maintained graph of your architecture, threats, controls, and compliance. Here\'s how we built it.',
    date: 'May 2025',
    readTime: '12 min read',
  },
  {
    category: 'Engineering',
    title: 'Building an AI Security Platform That\'s Actually Auditable',
    excerpt: 'The hardest part of building AI-assisted security tooling isn\'t the AI — it\'s making every AI decision traceable to a real threat, control, and compliance requirement. Here\'s how OmniGuard approaches explainability.',
    date: 'May 2025',
    readTime: '10 min read',
  },
  {
    category: 'Compliance',
    title: 'PCI DSS 4.0: What the New Requirements Mean for Your Architecture',
    excerpt: 'PCI DSS 4.0 introduced significant changes to Requirement 6, demanding continuous monitoring and automated testing of security controls. We break down what this means for engineering teams and how to automate compliance.',
    date: 'April 2025',
    readTime: '7 min read',
  },
  {
    category: 'Security',
    title: 'Attack Path Analysis: How One Misconfigured IAM Role Becomes a Complete Breach',
    excerpt: 'A deep dive into how attackers chain individual weaknesses — misconfigured IAM, exposed internal services, weak trust boundaries — into end-to-end attack paths through modern cloud architectures.',
    date: 'April 2025',
    readTime: '15 min read',
  },
  {
    category: 'Product',
    title: 'OmniGuard Nexus MCP Server: Giving AI Assistants Real Security Context',
    excerpt: 'We built a Model Context Protocol server for OmniGuard Nexus so AI assistants can query the Architecture Nexus, Threat Library, and compliance evidence during conversations. Here\'s what that unlocks.',
    date: 'March 2025',
    readTime: '6 min read',
  },
];

const categories = ['All', 'Research', 'Product', 'Engineering', 'Compliance', 'Security'];

export default function Blog() {
  return (
    <>
      <section className="py-20 bg-white border-b border-gray-100">
        <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mb-12">
            <div className="section-label mb-4">Blog</div>
            <h1 className="text-5xl font-bold text-gray-900 leading-tight mb-6">
              Security research, product updates, and engineering insights
            </h1>
            <p className="section-subtitle">
              From the OmniGuard Nexus team — on continuous threat modeling, architecture security, AI governance, and compliance automation.
            </p>
          </div>

          <div className="flex gap-2 flex-wrap mb-10">
            {categories.map((cat) => (
              <button
                key={cat}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                  cat === 'All' ? 'bg-blue-600 text-white border-blue-600' : 'text-gray-600 border-gray-300 hover:border-gray-400'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Featured */}
          <div className="grid lg:grid-cols-2 gap-8 mb-8">
            <div className="card group cursor-pointer">
              <div className="bg-gray-100 rounded-lg h-48 mb-5 flex items-center justify-center">
                <span className="text-xs text-gray-400 font-mono">omniguard / research</span>
              </div>
              <span className="tag bg-blue-50 text-blue-700 text-xs mb-3">{posts[0].category}</span>
              <h2 className="text-lg font-bold text-gray-900 mb-3 group-hover:text-blue-700 transition-colors leading-snug">
                {posts[0].title}
              </h2>
              <p className="text-sm text-gray-500 leading-relaxed mb-4">{posts[0].excerpt}</p>
              <div className="flex items-center justify-between text-xs text-gray-400">
                <span>{posts[0].date}</span>
                <span>{posts[0].readTime}</span>
              </div>
            </div>
            <div className="card group cursor-pointer">
              <div className="bg-gray-100 rounded-lg h-48 mb-5 flex items-center justify-center">
                <span className="text-xs text-gray-400 font-mono">omniguard / product</span>
              </div>
              <span className="tag bg-green-50 text-green-700 text-xs mb-3">{posts[1].category}</span>
              <h2 className="text-lg font-bold text-gray-900 mb-3 group-hover:text-blue-700 transition-colors leading-snug">
                {posts[1].title}
              </h2>
              <p className="text-sm text-gray-500 leading-relaxed mb-4">{posts[1].excerpt}</p>
              <div className="flex items-center justify-between text-xs text-gray-400">
                <span>{posts[1].date}</span>
                <span>{posts[1].readTime}</span>
              </div>
            </div>
          </div>

          {/* Rest */}
          <div className="space-y-4">
            {posts.slice(2).map((post) => (
              <div key={post.title} className="flex items-start gap-6 p-5 bg-white border border-gray-200 rounded-lg hover:border-blue-200 hover:bg-blue-50/20 transition-all group cursor-pointer">
                <div className="bg-gray-100 rounded w-20 h-16 flex-shrink-0 flex items-center justify-center">
                  <span className="text-xs text-gray-400">img</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="tag bg-gray-100 text-gray-600 text-xs">{post.category}</span>
                    <span className="text-xs text-gray-400">{post.date}</span>
                    <span className="text-xs text-gray-400">{post.readTime}</span>
                  </div>
                  <h3 className="text-sm font-semibold text-gray-900 group-hover:text-blue-700 transition-colors leading-snug">
                    {post.title}
                  </h3>
                  <p className="text-xs text-gray-500 mt-1.5 leading-relaxed line-clamp-2">{post.excerpt}</p>
                </div>
                <ChevronRight size={16} className="text-gray-300 flex-shrink-0 mt-1 group-hover:text-blue-500 transition-colors" />
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
