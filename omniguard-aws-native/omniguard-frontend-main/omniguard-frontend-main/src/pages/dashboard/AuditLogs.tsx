import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { Activity, Search, Shield, Filter, RotateCcw } from 'lucide-react';

export default function AuditLogs() {
  const { user } = useAuth();
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAuditLogs();
  }, [user]);

  const loadAuditLogs = async () => {
    if (!user || !isSupabaseConfigured || !supabase) return;
    try {
      let orgId = '00000000-0000-0000-0000-000000000000';
      const { data: member } = await supabase
        .from('organization_members')
        .select('organization_id')
        .eq('user_id', user.id)
        .maybeSingle();
      if (member) orgId = member.organization_id;

      const { data } = await supabase
        .from('audit_logs')
        .select('*')
        .eq('organization_id', orgId)
        .order('created_at', { ascending: false })
        .limit(100);

      if (data) setLogs(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const restoreCheckpoint = async (log: any) => {
    if (log.action !== 'git_commit_checkpoint') return;
    if (!confirm(`Are you sure you want to rollback to checkpoint ${log.details.commitHash}?`)) return;
    try {
      const res = await fetch('http://127.0.0.1:5185/restore-checkpoint', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ commitHash: log.details.commitHash, repoName: log.target_id, orgId: log.organization_id })
      });
      const data = await res.json();
      if (data.ok) alert('Checkpoint restored successfully! Workspace rolled back.');
      else alert('Failed to restore checkpoint: ' + data.error);
    } catch(e: any) {
      alert('Error: ' + e.message);
    }
  };

  if (loading) return <div className="p-8 text-gray-500">Loading Enterprise Audit Logs...</div>;

  return (
    <div className="max-w-6xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Activity className="text-purple-600" /> Central Audit & Checkpoint Logs
          </h1>
          <p className="text-sm text-gray-500 mt-1">Immutable record of architecture changes, AI fixes, and system drift.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={loadAuditLogs} className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 bg-white hover:bg-gray-50 flex items-center gap-2">
            <Filter size={16} /> Filters
          </button>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                <th className="px-6 py-4">Timestamp</th>
                <th className="px-6 py-4">Actor</th>
                <th className="px-6 py-4">Action Event</th>
                <th className="px-6 py-4">Target / Scope</th>
                <th className="px-6 py-4">Details & Checkpoints</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-500 font-mono">
                    {new Date(log.created_at).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-xs font-medium text-gray-900">
                    {log.actor || 'System'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-purple-50 text-purple-700">
                      {log.action.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-600">
                    {log.target_id || log.resource_name || 'Global'}
                  </td>
                  <td className="px-6 py-4 text-xs text-gray-600">
                    <div className="flex items-center justify-between">
                      <pre className="font-mono text-[10px] bg-gray-50 p-2 rounded border border-gray-100 max-w-sm overflow-hidden text-ellipsis">
                        {JSON.stringify(log.details || log.new_values || {}, null, 1)}
                      </pre>
                      {log.action === 'git_commit_checkpoint' && (
                        <button onClick={() => restoreCheckpoint(log)} className="ml-4 px-3 py-1.5 bg-red-50 text-red-700 hover:bg-red-100 rounded flex items-center gap-1.5 transition-colors font-semibold border border-red-200">
                          <RotateCcw size={14} /> Restore
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {logs.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-400 text-sm">
                    No audit logs available for this organization.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
