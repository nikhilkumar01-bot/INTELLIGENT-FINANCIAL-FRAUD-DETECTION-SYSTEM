import React, { useState, useEffect } from 'react';
import { 
  ArrowLeftRight, 
  Search, 
  Filter, 
  Download, 
  Upload, 
  Sparkles, 
  Eye, 
  ChevronLeft, 
  ChevronRight,
  ArrowUpDown
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { RiskBadge } from '../components/common/RiskBadge';
import { StatusBadge } from '../components/common/StatusBadge';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { AnalyzeTransactionModal } from '../components/transactions/AnalyzeTransactionModal';
import { CsvImportModal } from '../components/transactions/CsvImportModal';
import { api } from '../services/api';
import { formatCurrency, formatDateTime } from '../utils/formatters';

export const Transactions = () => {
  const [transactions, setTransactions] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [riskCategory, setRiskCategory] = useState('ALL');
  const [channel, setChannel] = useState('ALL');
  const [finalStatus, setFinalStatus] = useState('ALL');
  const [sort, setSort] = useState('timestamp');
  const [order, setOrder] = useState('desc');

  // Modals
  const [isAnalyzeOpen, setIsAnalyzeOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const res = await api.getTransactions({
        page,
        limit: 15,
        search,
        riskCategory,
        channel,
        finalStatus,
        sort,
        order
      });
      if (res.success) {
        setTransactions(res.data || []);
        setTotal(res.total || 0);
        setTotalPages(res.totalPages || 1);
      }
    } catch (err) {
      console.error('Error fetching transactions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [page, riskCategory, channel, finalStatus, sort, order]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchTransactions();
  };

  const handleExportCsv = async () => {
    try {
      const blob = await api.exportTransactionsCsv();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `transactions_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err) {
      alert('Error exporting CSV: ' + err.message);
    }
  };

  const toggleSort = (col) => {
    if (sort === col) {
      setOrder(order === 'asc' ? 'desc' : 'asc');
    } else {
      setSort(col);
      setOrder('desc');
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            Transaction Surveillance & Risk Management
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time transaction stream with automated multi-layer fraud scoring.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleExportCsv}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-[#1F293D] bg-[#111827] text-slate-300 hover:text-white hover:bg-[#161D2F] text-xs font-semibold transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={() => setIsImportOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-[#1F293D] bg-[#111827] text-slate-300 hover:text-white hover:bg-[#161D2F] text-xs font-semibold transition"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Import CSV</span>
          </button>

          <button
            onClick={() => setIsAnalyzeOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-semibold text-xs shadow-lg shadow-indigo-600/30 transition"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Analyze Transaction</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl border border-[#1F293D] bg-[#111827] space-y-3">
        <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
            <input
              type="text"
              placeholder="Search by Transaction ID, Customer ID, or Merchant..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-[#0E1322] border border-[#1F293D] rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <button
            type="submit"
            className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-500 transition w-full md:w-auto"
          >
            Search
          </button>
        </form>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-[#1F293D]">
          <div>
            <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
              Risk Level
            </label>
            <select
              value={riskCategory}
              onChange={(e) => { setRiskCategory(e.target.value); setPage(1); }}
              className="w-full px-3 py-1.5 bg-[#0E1322] border border-[#1F293D] rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
            >
              <option value="ALL">All Risk Levels</option>
              <option value="CRITICAL">Critical Risk (80+)</option>
              <option value="HIGH">High Risk (60-79)</option>
              <option value="MEDIUM">Medium Risk (30-59)</option>
              <option value="LOW">Low Risk (&lt;30)</option>
            </select>
          </div>

          <div>
            <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
              Channel
            </label>
            <select
              value={channel}
              onChange={(e) => { setChannel(e.target.value); setPage(1); }}
              className="w-full px-3 py-1.5 bg-[#0E1322] border border-[#1F293D] rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
            >
              <option value="ALL">All Payment Channels</option>
              <option value="CARD">Card</option>
              <option value="ONLINE">Online eCommerce</option>
              <option value="WIRE_TRANSFER">Wire Transfer</option>
              <option value="ATM">ATM Withdrawal</option>
              <option value="UPI">UPI / Instant Pay</option>
            </select>
          </div>

          <div>
            <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
              Status
            </label>
            <select
              value={finalStatus}
              onChange={(e) => { setFinalStatus(e.target.value); setPage(1); }}
              className="w-full px-3 py-1.5 bg-[#0E1322] border border-[#1F293D] rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
            >
              <option value="ALL">All Statuses</option>
              <option value="Genuine">Genuine</option>
              <option value="Flagged">Flagged</option>
              <option value="Confirmed Fraud">Confirmed Fraud</option>
              <option value="Pending Review">Pending Review</option>
            </select>
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="rounded-2xl border border-[#1F293D] bg-[#111827] overflow-hidden">
        {loading ? (
          <LoadingSpinner label="Filtering transactions..." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#161D2F] text-slate-400 font-semibold uppercase tracking-wider border-b border-[#1F293D]">
                <tr>
                  <th className="py-3.5 px-4 cursor-pointer" onClick={() => toggleSort('transactionId')}>
                    <span className="flex items-center gap-1">Tx ID <ArrowUpDown className="w-3 h-3" /></span>
                  </th>
                  <th className="py-3.5 px-4">Customer</th>
                  <th className="py-3.5 px-4 cursor-pointer" onClick={() => toggleSort('amount')}>
                    <span className="flex items-center gap-1">Amount <ArrowUpDown className="w-3 h-3" /></span>
                  </th>
                  <th className="py-3.5 px-4">Channel</th>
                  <th className="py-3.5 px-4 cursor-pointer" onClick={() => toggleSort('timestamp')}>
                    <span className="flex items-center gap-1">Timestamp <ArrowUpDown className="w-3 h-3" /></span>
                  </th>
                  <th className="py-3.5 px-4 cursor-pointer" onClick={() => toggleSort('riskScore')}>
                    <span className="flex items-center gap-1">Risk Score <ArrowUpDown className="w-3 h-3" /></span>
                  </th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Primary Rationale</th>
                  <th className="py-3.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1F293D] text-slate-300">
                {transactions.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="py-8 text-center text-slate-400">
                      No transactions matched your search criteria.
                    </td>
                  </tr>
                ) : (
                  transactions.map((t) => (
                    <tr key={t.transactionId} className="hover:bg-slate-800/40 transition">
                      <td className="py-3 px-4 font-mono font-medium text-white">
                        <Link to={`/transactions/${t.transactionId}`} className="text-indigo-400 hover:underline">
                          {t.transactionId}
                        </Link>
                      </td>
                      <td className="py-3 px-4">
                        <Link to={`/customers/${t.customerId}`} className="font-mono text-slate-300 hover:text-indigo-400 hover:underline">
                          {t.customerId}
                        </Link>
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-slate-100">
                        {formatCurrency(t.amount)}
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-[11px] font-mono text-slate-300">
                          {t.channel || t.transactionType}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-400 font-mono text-[11px]">
                        {formatDateTime(t.timestamp)}
                      </td>
                      <td className="py-3 px-4">
                        <RiskBadge score={t.riskScore} category={t.riskCategory} />
                      </td>
                      <td className="py-3 px-4">
                        <StatusBadge status={t.finalStatus} />
                      </td>
                      <td className="py-3 px-4 max-w-xs truncate text-slate-400 text-[11px]">
                        {t.reasons?.[0] || 'Standard transaction metrics.'}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Link
                          to={`/transactions/${t.transactionId}`}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition inline-flex items-center"
                          title="Inspect Transaction"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Bar */}
        <div className="p-4 border-t border-[#1F293D] flex items-center justify-between text-xs text-slate-400">
          <span>
            Showing page <strong className="text-white">{page}</strong> of <strong className="text-white">{totalPages}</strong> ({total} total transactions)
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

      {/* Modals */}
      <AnalyzeTransactionModal
        isOpen={isAnalyzeOpen}
        onClose={() => setIsAnalyzeOpen(false)}
        onTransactionCreated={() => {
          fetchTransactions();
        }}
      />

      <CsvImportModal
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        onImportSuccess={() => {
          setIsImportOpen(false);
          fetchTransactions();
        }}
      />
    </div>
  );
};
