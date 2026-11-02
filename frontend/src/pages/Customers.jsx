import React, { useState, useEffect } from 'react';
import { Users, Search, Filter, Eye, ChevronLeft, ChevronRight, UserCheck, AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { api } from '../services/api';
import { formatCurrency, formatDateOnly } from '../utils/formatters';

export const Customers = () => {
  const [customers, setCustomers] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [risk, setRisk] = useState('ALL');
  const [loading, setLoading] = useState(true);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const res = await api.getCustomers({ page, limit: 15, search, risk });
      if (res.success) {
        setCustomers(res.data || []);
        setTotal(res.total || 0);
        setTotalPages(res.totalPages || 1);
      }
    } catch (err) {
      console.error('Error fetching customers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [page, risk]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchCustomers();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            Customer Behavioral Profiles & Baselines
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Historical transaction patterns, spending baselines, and deviation monitoring.
          </p>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="p-4 rounded-2xl border border-[#1F293D] bg-[#111827] flex flex-col md:flex-row items-center gap-3">
        <form onSubmit={handleSearchSubmit} className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
          <input
            type="text"
            placeholder="Search by Customer ID (e.g. CUST-1002) or Name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-[#0E1322] border border-[#1F293D] rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
          />
        </form>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <select
            value={risk}
            onChange={(e) => { setRisk(e.target.value); setPage(1); }}
            className="px-3 py-2 bg-[#0E1322] border border-[#1F293D] rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
          >
            <option value="ALL">All Risk Profiles</option>
            <option value="LOW">Low Risk Baseline</option>
            <option value="MEDIUM">Medium Risk Profile</option>
            <option value="HIGH">High Risk Profile</option>
          </select>
        </div>
      </div>

      {/* Customers Table */}
      <div className="rounded-2xl border border-[#1F293D] bg-[#111827] overflow-hidden">
        {loading ? (
          <LoadingSpinner label="Compiling customer behavioral profiles..." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#161D2F] text-slate-400 font-semibold uppercase tracking-wider border-b border-[#1F293D]">
                <tr>
                  <th className="py-3.5 px-4">Customer ID</th>
                  <th className="py-3.5 px-4">Name & Contact</th>
                  <th className="py-3.5 px-4">Typical Baseline</th>
                  <th className="py-3.5 px-4">Active Hours</th>
                  <th className="py-3.5 px-4">Risk Profile</th>
                  <th className="py-3.5 px-4">Historical Fraud</th>
                  <th className="py-3.5 px-4">Primary Location</th>
                  <th className="py-3.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1F293D] text-slate-300">
                {customers.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="py-8 text-center text-slate-400">
                      No customer profiles found.
                    </td>
                  </tr>
                ) : (
                  customers.map((c) => (
                    <tr key={c.customerId} className="hover:bg-slate-800/40 transition">
                      <td className="py-3 px-4 font-mono font-bold text-white">
                        <Link to={`/customers/${c.customerId}`} className="text-indigo-400 hover:underline">
                          {c.customerId}
                        </Link>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-200">{c.name}</div>
                        <div className="text-[11px] text-slate-400">{c.email}</div>
                      </td>
                      <td className="py-3 px-4 font-mono font-semibold text-slate-200">
                        {formatCurrency(c.avgAmount)}
                      </td>
                      <td className="py-3 px-4 font-mono text-[11px] text-slate-400">
                        {c.typicalHourRange || '08:00 - 22:00'}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold border ${
                          c.riskProfile === 'HIGH' ? 'bg-red-500/10 text-red-400 border-red-500/30' :
                          c.riskProfile === 'MEDIUM' ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' :
                          'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                        }`}>
                          {c.riskProfile}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono text-center">
                        {c.historicalFraudCount > 0 ? (
                          <span className="text-red-400 font-bold">{c.historicalFraudCount}</span>
                        ) : (
                          <span className="text-slate-500">0</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-slate-400">
                        {c.primaryLocation}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Link
                          to={`/customers/${c.customerId}`}
                          className="px-3 py-1.5 rounded-lg bg-indigo-600/20 text-indigo-300 hover:bg-indigo-600 hover:text-white border border-indigo-500/30 text-xs font-semibold transition inline-flex items-center gap-1"
                        >
                          <Eye className="w-3.5 h-3.5" /> Inspect
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
            Page <strong className="text-white">{page}</strong> of <strong className="text-white">{totalPages}</strong> ({total} customers)
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
