import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  DollarSign, 
  Activity, 
  AlertTriangle, 
  ShieldAlert,
  CreditCard,
  Eye,
  CheckCircle2
} from 'lucide-react';
import { RiskBadge } from '../components/common/RiskBadge';
import { StatusBadge } from '../components/common/StatusBadge';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { api } from '../services/api';
import { formatCurrency, formatDateTime } from '../utils/formatters';

export const CustomerDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCustomer = async () => {
      try {
        const res = await api.getCustomerById(id);
        if (res.success) {
          setData(res);
        }
      } catch (err) {
        console.error('Error fetching customer profile:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchCustomer();
  }, [id]);

  if (loading) {
    return <LoadingSpinner label="Compiling customer spending behavioral history..." />;
  }

  if (!data || !data.customer) {
    return (
      <div className="p-8 text-center space-y-4">
        <h3 className="text-lg font-bold text-white">Customer Not Found</h3>
        <p className="text-xs text-slate-400">The customer profile {id} could not be located.</p>
        <button
          onClick={() => navigate('/customers')}
          className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-semibold"
        >
          Return to Customers
        </button>
      </div>
    );
  }

  const { customer, analytics, transactions } = data;

  // Check if customer experienced high deviation transactions
  const highDeviationTx = transactions.find(t => (t.amountToAvgRatio || 1) >= 4.0 || t.riskScore >= 70);

  return (
    <div className="space-y-6">
      {/* Top Navigation */}
      <div className="flex items-center justify-between">
        <Link
          to="/customers"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Customers</span>
        </Link>

        <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
          customer.riskProfile === 'HIGH' ? 'bg-red-500/10 text-red-400 border-red-500/30' :
          customer.riskProfile === 'MEDIUM' ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' :
          'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
        }`}>
          Risk Tier: {customer.riskProfile}
        </span>
      </div>

      {/* Customer Header Card */}
      <div className="p-6 rounded-2xl border border-[#1F293D] bg-[#111827] flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-xl">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-600 to-indigo-400 flex items-center justify-center text-white font-extrabold text-xl shadow-lg shadow-indigo-600/30 shrink-0">
            {customer.name ? customer.name.slice(0, 2) : 'CU'}
          </div>
          <div>
            <div className="flex items-center gap-3">
              <span className="font-mono text-xs text-indigo-400 font-bold">{customer.customerId}</span>
              <span className="text-xs text-slate-500">• Synthetic Behavioral Entity</span>
            </div>
            <h2 className="text-2xl font-black text-white">{customer.name}</h2>
            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 mt-1">
              <span className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5" /> {customer.email}</span>
              <span className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5" /> {customer.phone}</span>
              <span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" /> {customer.primaryLocation}</span>
            </div>
          </div>
        </div>

        {/* Quick Baseline Box */}
        <div className="p-4 rounded-xl border border-[#1F293D] bg-[#0E1322] flex items-center gap-5">
          <div>
            <span className="text-[10px] uppercase font-semibold text-slate-400 block">Baseline Typical Spend</span>
            <span className="text-2xl font-extrabold font-mono text-emerald-400">
              {formatCurrency(customer.avgAmount)}
            </span>
            <span className="text-[10px] text-slate-500 block">Per transaction mean</span>
          </div>
        </div>
      </div>

      {/* Behavioral Deviation Alert Banner (if applicable) */}
      {highDeviationTx && (
        <div className="p-4 rounded-2xl border border-red-500/40 bg-red-950/20 flex items-start gap-3.5 shadow-lg">
          <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
          <div className="text-xs">
            <h4 className="font-bold text-red-300 text-sm">
              Significant Behavioral Deviation Observed
            </h4>
            <p className="text-red-200/80 mt-0.5">
              Customer routinely spends around <strong>{formatCurrency(customer.avgAmount)}</strong>, but recently initiated transaction{' '}
              <Link to={`/transactions/${highDeviationTx.transactionId}`} className="underline font-mono font-bold text-white">
                {highDeviationTx.transactionId}
              </Link>{' '}
              for <strong>{formatCurrency(highDeviationTx.amount)}</strong> ({highDeviationTx.amountToAvgRatio || 5.2}x historical baseline).
            </p>
          </div>
        </div>
      )}

      {/* Behavioral Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl border border-[#1F293D] bg-[#111827]">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Calculated Spend</span>
          <h4 className="text-xl font-bold font-mono text-white mt-1">
            {formatCurrency(analytics?.totalSpent || 0)}
          </h4>
          <span className="text-xs text-slate-400">{analytics?.totalTransactions || 0} total transactions</span>
        </div>

        <div className="p-4 rounded-xl border border-[#1F293D] bg-[#111827]">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Peak Transaction</span>
          <h4 className="text-xl font-bold font-mono text-amber-400 mt-1">
            {formatCurrency(analytics?.maxTransaction || 0)}
          </h4>
          <span className="text-xs text-slate-400">Highest observed single spend</span>
        </div>

        <div className="p-4 rounded-xl border border-[#1F293D] bg-[#111827]">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Flagged Activity</span>
          <h4 className={`text-xl font-bold font-mono mt-1 ${
            (analytics?.flaggedTransactions || 0) > 0 ? 'text-red-400' : 'text-emerald-400'
          }`}>
            {analytics?.flaggedTransactions || 0}
          </h4>
          <span className="text-xs text-slate-400">Transactions with score ≥ 60</span>
        </div>

        <div className="p-4 rounded-xl border border-[#1F293D] bg-[#111827]">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Active Window</span>
          <h4 className="text-xl font-bold font-mono text-indigo-400 mt-1">
            {customer.typicalHourRange || '08:00 - 22:00'}
          </h4>
          <span className="text-xs text-slate-400">Normal daytime spending habit</span>
        </div>
      </div>

      {/* Historical Transactions List */}
      <div className="p-5 rounded-2xl border border-[#1F293D] bg-[#111827] space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-white tracking-wide">
              Transaction History for {customer.name} ({transactions.length})
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">Chronological record used for behavioral feature baselining</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#161D2F] text-slate-400 font-semibold uppercase tracking-wider border-b border-[#1F293D]">
              <tr>
                <th className="py-3 px-4">Tx ID</th>
                <th className="py-3 px-4">Amount</th>
                <th className="py-3 px-4">Channel</th>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Deviation</th>
                <th className="py-3 px-4">Risk Score</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1F293D] text-slate-300">
              {transactions.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-6 text-center text-slate-400">
                    No transactions found for this customer.
                  </td>
                </tr>
              ) : (
                transactions.map((t) => (
                  <tr key={t.transactionId} className="hover:bg-slate-800/40 transition">
                    <td className="py-3 px-4 font-mono font-medium text-white">{t.transactionId}</td>
                    <td className="py-3 px-4 font-mono font-bold text-slate-100">{formatCurrency(t.amount)}</td>
                    <td className="py-3 px-4 font-mono text-slate-300">{t.channel || t.transactionType}</td>
                    <td className="py-3 px-4 text-slate-400 font-mono text-[11px]">{formatDateTime(t.timestamp)}</td>
                    <td className="py-3 px-4 font-mono">
                      <span className={(t.amountToAvgRatio || 1) >= 3 ? 'text-red-400 font-bold' : 'text-slate-400'}>
                        {t.amountToAvgRatio || (t.amount / customer.avgAmount).toFixed(1)}x
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <RiskBadge score={t.riskScore} category={t.riskCategory} />
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge status={t.finalStatus} />
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Link
                        to={`/transactions/${t.transactionId}`}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition inline-flex items-center"
                        title="View Transaction"
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
      </div>
    </div>
  );
};
