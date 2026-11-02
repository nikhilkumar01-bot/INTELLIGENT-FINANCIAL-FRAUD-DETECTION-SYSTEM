import React, { useState, useEffect } from 'react';
import { UserCog, Shield, CheckCircle2, XCircle, AlertTriangle, Clock, RefreshCw } from 'lucide-react';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { api } from '../services/api';
import { formatDateTime } from '../utils/formatters';

export const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [uRes, logRes] = await Promise.all([
        api.getUsers(),
        api.getAuditLogs()
      ]);
      if (uRes.success) setUsers(uRes.users || []);
      if (logRes.success) setAuditLogs(logRes.logs || []);
    } catch (err) {
      console.error('Error fetching admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleToggleStatus = async (user) => {
    const newStatus = user.status === 'active' ? 'suspended' : 'active';
    setUpdatingId(user._id || user.id);
    try {
      const res = await api.updateUser(user._id || user.id, { status: newStatus });
      if (res.success) {
        setUsers(users.map(u => (u._id === user._id || u.id === user.id) ? { ...u, status: newStatus } : u));
      }
    } catch (err) {
      alert('Error updating user status: ' + err.message);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleRoleChange = async (user, newRole) => {
    setUpdatingId(user._id || user.id);
    try {
      const res = await api.updateUser(user._id || user.id, { role: newRole });
      if (res.success) {
        setUsers(users.map(u => (u._id === user._id || u.id === user.id) ? { ...u, role: newRole } : u));
      }
    } catch (err) {
      alert('Error changing user role: ' + err.message);
    } finally {
      setUpdatingId(null);
    }
  };

  if (loading) {
    return <LoadingSpinner label="Loading user directory and audit logs..." />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
          Administrator Control: Users & Audit Trail
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Role-based security administration and forensic action tracking.
        </p>
      </div>

      {/* Users Management Card */}
      <div className="p-5 rounded-2xl border border-[#1F293D] bg-[#111827] space-y-4">
        <h3 className="text-sm font-bold text-white tracking-wide">
          Authorized Security Personnel Directory ({users.length})
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#161D2F] text-slate-400 font-semibold uppercase tracking-wider border-b border-[#1F293D]">
              <tr>
                <th className="py-3 px-4">Name</th>
                <th className="py-3 px-4">Email</th>
                <th className="py-3 px-4">Current Role</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Created</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1F293D] text-slate-300">
              {users.map((u) => {
                const uid = u._id || u.id;
                return (
                  <tr key={uid} className="hover:bg-slate-800/40 transition">
                    <td className="py-3 px-4 font-semibold text-white">{u.name}</td>
                    <td className="py-3 px-4 font-mono text-slate-300">{u.email}</td>
                    <td className="py-3 px-4">
                      <select
                        value={u.role}
                        onChange={(e) => handleRoleChange(u, e.target.value)}
                        disabled={updatingId === uid}
                        className="px-2 py-1 bg-[#0E1322] border border-[#1F293D] rounded-lg text-xs text-indigo-300 focus:outline-none"
                      >
                        <option value="analyst">Fraud Analyst</option>
                        <option value="admin">Administrator</option>
                      </select>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold border ${
                        u.status === 'active' 
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' 
                          : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                      }`}>
                        {u.status || 'active'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-400 font-mono text-[11px]">
                      {formatDateTime(u.createdAt)}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handleToggleStatus(u)}
                        disabled={updatingId === uid}
                        className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                          u.status === 'active'
                            ? 'bg-rose-500/20 text-rose-300 hover:bg-rose-500 hover:text-white border border-rose-500/30'
                            : 'bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500 hover:text-white border border-emerald-500/30'
                        }`}
                      >
                        {u.status === 'active' ? 'Suspend' : 'Activate'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Forensic Audit Log Feed */}
      <div className="p-5 rounded-2xl border border-[#1F293D] bg-[#111827] space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-white tracking-wide flex items-center gap-2">
            <Clock className="w-4 h-4 text-indigo-400" />
            System Audit Trail ({auditLogs.length} events logged)
          </h3>
          <button
            onClick={fetchData}
            className="p-1.5 rounded-lg border border-[#1F293D] bg-[#0E1322] text-slate-400 hover:text-white"
            title="Refresh logs"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="divide-y divide-[#1F293D] max-h-96 overflow-y-auto">
          {auditLogs.length === 0 ? (
            <p className="py-4 text-xs text-slate-400 text-center">No audit logs recorded yet.</p>
          ) : (
            auditLogs.map((log, idx) => (
              <div key={idx} className="py-3 flex items-start justify-between gap-4 text-xs">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-indigo-400">{log.action}</span>
                    <span className="text-[11px] px-2 py-0.5 rounded bg-[#161D2F] text-slate-300 border border-[#1F293D]">
                      {log.entityType} #{log.entityId}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Actor: <strong className="text-slate-200">{log.actorName || log.actorId}</strong> ({log.actorRole || 'system'})
                  </p>
                </div>
                <span className="text-slate-500 font-mono text-[11px] shrink-0">
                  {formatDateTime(log.timestamp)}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
