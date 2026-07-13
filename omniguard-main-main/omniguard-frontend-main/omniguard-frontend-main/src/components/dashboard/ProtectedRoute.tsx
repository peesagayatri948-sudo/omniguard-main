import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-500">Loading workspace...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.orgStatus === 'none') {
    return <Navigate to="/onboarding" replace />;
  }

  if (user.orgStatus === 'pending') {
    return <Navigate to="/awaiting-approval" replace />;
  }

  if (user.orgStatus === 'declined') {
    return <Navigate to="/denied" replace />;
  }

  return <>{children}</>;
}
