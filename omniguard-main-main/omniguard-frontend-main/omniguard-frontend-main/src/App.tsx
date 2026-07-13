import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import PlatformOverview from './pages/platform/PlatformOverview';
import SecureDesignGraph from './pages/platform/SecureDesignGraph';
import SecurityEngine from './pages/platform/SecurityEngine';
import AIPlatform from './pages/platform/AIPlatform';
import PolicyEngine from './pages/platform/PolicyEngine';
import PlatformArchitecture from './pages/platform/PlatformArchitecture';
import ThreatModeling from './pages/platform/ThreatModeling';
import Solutions from './pages/Solutions';
import {
  ThreatModelingSolution,
  SecureSDLCSolution,
  AISecuritySolution,
  ComplianceSolution,
  CloudSecuritySolution,
} from './pages/solutions/SolutionPages';
import Integrations from './pages/Integrations';
import Enterprise from './pages/Enterprise';
import Pricing from './pages/Pricing';
import Documentation from './pages/Documentation';
import CLI from './pages/CLI';
import VSCode from './pages/VSCode';
import MCPPage from './pages/MCP';
import About from './pages/About';
import Careers from './pages/Careers';
import Contact from './pages/Contact';
import BookDemo from './pages/BookDemo';
import Blog from './pages/Blog';
import Resources from './pages/Resources';
import Support from './pages/Support';
import Privacy from './pages/Privacy';
import Terms from './pages/Terms';

import { AuthProvider } from './context/AuthContext';
import Login from './pages/auth/Login';
import Signup from './pages/auth/Signup';
import Onboarding from './pages/auth/Onboarding';
import AwaitingApproval from './pages/auth/AwaitingApproval';
import DeniedAccess from './pages/auth/DeniedAccess';
import ProtectedRoute from './components/dashboard/ProtectedRoute';
import DashboardLayout from './components/dashboard/DashboardLayout';
import Overview from './pages/dashboard/Overview';
import ArchitectureNexus from './pages/dashboard/ArchitectureNexus';
import CloudDrift from './pages/dashboard/CloudDrift';
import TeamManagement from './pages/dashboard/TeamManagement';
import DeveloperApi from './pages/dashboard/DeveloperApi';
import SbomCompliance from './pages/dashboard/SbomCompliance';
import AiRemediation from './pages/dashboard/AiRemediation';
import AiProviderConfig from './pages/dashboard/AiProviderConfig';
import AuditLogs from './pages/dashboard/AuditLogs';

function NotFound() {
  return (
    <div className="py-32 text-center">
      <div className="text-6xl font-bold text-gray-200 mb-4">404</div>
      <h1 className="text-2xl font-bold text-gray-900 mb-3">Page not found</h1>
      <p className="text-gray-500 mb-8">The page you're looking for doesn't exist.</p>
      <a href="/" className="btn-primary text-sm">Go Home</a>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Auth routes (no Layout) */}
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/onboarding" element={<Onboarding />} />
          <Route path="/awaiting-approval" element={<AwaitingApproval />} />
          <Route path="/denied" element={<DeniedAccess />} />

          {/* Marketing/public routes (with Layout) */}
          <Route element={<Layout />}>
            <Route path="/" element={<Home />} />

            {/* Platform */}
            <Route path="/platform" element={<PlatformOverview />} />
            <Route path="/platform/architecture-nexus" element={<SecureDesignGraph />} />
            <Route path="/platform/security-engine" element={<SecurityEngine />} />
            <Route path="/platform/ai-platform" element={<AIPlatform />} />
            <Route path="/platform/policy-engine" element={<PolicyEngine />} />
            <Route path="/platform/architecture" element={<PlatformArchitecture />} />
            <Route path="/platform/threat-modeling" element={<ThreatModeling />} />

            {/* Solutions */}
            <Route path="/solutions" element={<Solutions />} />
            <Route path="/solutions/threat-modeling" element={<ThreatModelingSolution />} />
            <Route path="/solutions/secure-sdlc" element={<SecureSDLCSolution />} />
            <Route path="/solutions/ai-security" element={<AISecuritySolution />} />
            <Route path="/solutions/compliance" element={<ComplianceSolution />} />
            <Route path="/solutions/cloud-security" element={<CloudSecuritySolution />} />

            {/* Developer Tools */}
            <Route path="/cli" element={<CLI />} />
            <Route path="/vscode" element={<VSCode />} />
            <Route path="/mcp" element={<MCPPage />} />

            {/* Other main pages */}
            <Route path="/integrations" element={<Integrations />} />
            <Route path="/enterprise" element={<Enterprise />} />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/docs" element={<Documentation />} />
            <Route path="/docs/*" element={<Documentation />} />

            {/* Company */}
            <Route path="/about" element={<About />} />
            <Route path="/careers" element={<Careers />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/book-demo" element={<BookDemo />} />

            {/* Resources */}
            <Route path="/blog" element={<Blog />} />
            <Route path="/resources" element={<Resources />} />
            <Route path="/support" element={<Support />} />

            {/* Legal */}
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/terms" element={<Terms />} />

            <Route path="*" element={<NotFound />} />
          </Route>

          {/* Dashboard routes (protected, dashboard layout) */}
          <Route
            path="/app"
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Overview />} />
            <Route path="nexus" element={<ArchitectureNexus />} />
            <Route path="drift" element={<CloudDrift />} />
            <Route path="team" element={<TeamManagement />} />
            <Route path="api" element={<DeveloperApi />} />
            <Route path="compliance" element={<SbomCompliance />} />
            <Route path="remediation" element={<AiRemediation />} />
            <Route path="ai-config" element={<AiProviderConfig />} />
            <Route path="logs" element={<AuditLogs />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
