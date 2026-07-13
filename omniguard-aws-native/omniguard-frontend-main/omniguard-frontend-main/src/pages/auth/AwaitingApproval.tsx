import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Shield, RefreshCw, LogOut } from 'lucide-react';

export default function AwaitingApproval() {
  const { user, refreshUserOrg, signOut } = useAuth();
  const navigate = useNavigate();
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    if (user && user.orgStatus === 'active') {
      navigate('/app');
    }
  }, [user, navigate]);

  const checkStatus = async () => {
    setChecking(true);
    await refreshUserOrg();
    setChecking(false);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  if (!user) return null;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full text-center bg-white p-8 border border-gray-200 rounded-xl shadow-sm space-y-6">
        <div className="w-14 h-14 bg-amber-500 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
          <Shield size={28} className="text-white" />
        </div>
        
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Awaiting CISO Approval</h2>
          <p className="text-sm text-gray-500 mt-2">
            Your request to join the organization as <strong className="capitalize">{user.role}</strong> has been received and is pending admin approval.
          </p>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-left">
          <p className="text-xs text-amber-800 leading-relaxed font-medium">
            🔒 Approval alerts have been dispatched to the CISO / Security Managers of this tenant. You will gain access as soon as they authorize your role.
          </p>
        </div>

        <div className="flex flex-col gap-2 pt-2">
          <button
            onClick={checkStatus}
            disabled={checking}
            className="btn-primary w-full justify-center gap-2"
          >
            <RefreshCw size={14} className={checking ? 'animate-spin' : ''} />
            {checking ? 'Checking status...' : 'Refresh Status'}
          </button>
          <button
            onClick={handleSignOut}
            className="btn-ghost w-full justify-center gap-2"
          >
            <LogOut size={14} />
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}
