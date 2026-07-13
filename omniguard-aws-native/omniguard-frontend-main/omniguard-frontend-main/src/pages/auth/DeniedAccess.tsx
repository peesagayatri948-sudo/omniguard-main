import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Shield, XCircle, LogOut } from 'lucide-react';

export default function DeniedAccess() {
  const { signOut } = useAuth();
  const navigate = useNavigate();

  const handleReset = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full text-center bg-white p-8 border border-gray-200 rounded-xl shadow-sm space-y-6">
        <div className="w-14 h-14 bg-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <XCircle size={28} className="text-white" />
        </div>
        
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Access Request Denied</h2>
          <p className="text-sm text-gray-500 mt-2">
            Your request to join the organization was declined by the administrator or CISO.
          </p>
        </div>

        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-left">
          <p className="text-xs text-red-800 leading-relaxed font-medium">
            ❌ Please contact your security team if you think this is a mistake, or register under a new organization workspace.
          </p>
        </div>

        <div className="flex flex-col gap-2 pt-2">
          <button
            onClick={handleReset}
            className="btn-primary w-full justify-center gap-2"
          >
            <Shield size={14} />
            Try Joining / Creating Org Again
          </button>
        </div>
      </div>
    </div>
  );
}
