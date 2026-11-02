import React, { useState, useEffect } from 'react';
import { AlertTriangle, Search, Filter, Eye, ChevronLeft, ChevronRight, ShieldAlert, CheckCircle2, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { RiskBadge } from '../components/common/RiskBadge';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { api } from '../services/api';
import { formatCurrency, formatDateTime } from '../utils/formatters';

export const Alerts = () => {
  const [alerts, setAlerts] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  // Filters
  const [status, setStatus] = useState('ALL');
  const [riskCategory, setRiskCategory] = useState('ALL');

  const fetchAlerts = async () => {
    setLoading(true);
    try {
      const res = await api.getAlerts({ page, limit: 15, status, riskCategory });
      if (res.success) {
        setAlerts(res.data || []);
        setTotal(res.total || 0);
        setTotalPages(res.totalPages || 1);
      }
    } catch (err) {
      console.error('Error fetching alerts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, [page, status, riskCategory]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            Fraud Alerts & Investigation Center
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Triage, investigate, and adjudicate high-risk transaction flags with audit accountability.
          </p>
        </div>
      </div>

      {/* Status Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-[#1F293D] pb-3">
        {[
          { label: 'All Alerts', value: 'ALL' },
          { label: 'Pending Review', value: 'Pending' },
          { label: 'Under Investigation', value: 'Under Investigation' },
          { label: 'Resolved', value: 'Resolved' }
        ].map((tab) => (
          <button
            key={tab.value}
            onClick={() => { setStatus(tab.value); setPage(1); }}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition ${
              status === tab.value
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'bg-[#111827] text-slate-400 hover:text-white hover:bg-[#161D2F] border border-[#1F293D]'
            }`}
          >
            {tab.label}
          </button>
        ))}

        <div className="ml-auto flex items-center gap-2">
          <select
            value={riskCategory}
            onChange={(e) => { setRiskCategory(e.target.value); setPage(1); }}
            className="px-3 py-1.5 bg-[#0E1322] border border-[#1F293D] rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
          >
            <option value="ALL">All Risk Severities</option>
            <option value="CRITICAL">Critical (80+)</option>
            <option value="HIGH">High (60-79)</option>
          </select>
        </div>
      </div>

      {/* Alerts Table */}
      <div className="rounded-2xl border border-[#1F293D] bg-[#111827] overflow-hidden">
        {loading ? (
          <LoadingSpinner label="Loading fraud alerts..." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#161D2F] text-slate-400 font-semibold uppercase tracking-wider border-b border-[#1F293D]">
                <tr>
                  <th className="py-3.5 px-4">Alert ID</th>
                  <th className="py-3.5 px-4">Transaction / Cust</th>
                  <th className="py-3.5 px-4">Amount</th>
                  <th className="py-3.5 px-4">Risk Severity</th>
                  <th className="py-3.5 px-4">Primary Rationale</th>
                  <th className="py-3.5 px-4">Assigned Analyst</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1F293D] text-slate-300">
                {alerts.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="py-8 text-center text-slate-400">
                      No fraud alerts match the selected status filter.
                    </td>
                  </tr>
                ) : (
                  alerts.map((a) => (
                    <tr key={a.alertId} className="hover:bg-slate-800/40 transition">
                      <td className="py-3.5 px-4 font-mono font-bold text-white">
                        <Link to={`/alerts/${a.alertId}`} className="text-indigo-400 hover:underline">
                          {a.alertId}
                        </Link>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-mono text-slate-200">{a.transactionId}</div>
                        <div className="text-[11px] text-slate-500">{a.customerId}</div>
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-100">
                        {formatCurrency(a.amount)}
                      </td>
                      <td className="py-3.5 px-4">
                        <RiskBadge score={a.riskScore} category={a.riskCategory} />
                      </td>
                      <td className="py-3.5 px-4 max-w-xs truncate text-slate-300">
                        {a.reasons?.[0] || 'Unusual combination of telemetry factors.'}
                      </td>
                      <td className="py-3.5 px-4 text-slate-300">
                        {a.assignedAnalyst || 'Unassigned'}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
                          a.investigationStatus === 'Resolved' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' :
                          a.investigationStatus === 'Under Investigation' ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30' :
                          'bg-amber-500/10 text-amber-400 border-amber-500/30'
                        }`}>
                          {a.investigationStatus}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <Link
                          to={`/alerts/${a.alertId}`}
                          className="px-3 py-1.5 rounded-lg bg-indigo-600/20 text-indigo-300 hover:bg-indigo-600 hover:text-white border border-indigo-500/30 text-xs font-semibold transition"
                        >
                          Investigate
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        <div className="p-4 border-t border-[#1F293D] flex items-center justify-between text-xs text-slate-400">
          <span>
            Page <strong className="text-white">{page}</strong> of <strong className="text-white">{totalPages}</strong> ({total} total alerts)
          </span>

          <div className="flex items-center gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
              className="p-1.5 rounded-lg border border-[#1F293D] bg-[#0E1322] hover:bg-slate-800 disabled:opacity-40 transition"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage(page + 1)}
              className="p-1.5 rounded-lg border border-[#1F293D] bg-[#0E1322] hover:bg-slate-800 disabled:opacity-40 transition"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
