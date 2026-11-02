import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  ShieldAlert, 
  User, 
  Clock, 
  MapPin, 
  Smartphone, 
  Cpu, 
  DollarSign, 
  Activity, 
  AlertTriangle,
  CheckCircle2,
  ExternalLink
} from 'lucide-react';
import { RiskBadge } from '../components/common/RiskBadge';
import { StatusBadge } from '../components/common/StatusBadge';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { api } from '../services/api';
import { formatCurrency, formatDateTime } from '../utils/formatters';

export const TransactionDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        const res = await api.getTransactionById(id);
        if (res.success) {
          setData(res);
        }
      } catch (err) {
        console.error('Error fetching transaction detail:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDetail();
  }, [id]);

  if (loading) {
    return <LoadingSpinner label="Loading transaction telemetry and explainability..." />;
  }

  if (!data || !data.transaction) {
    return (
      <div className="p-8 text-center space-y-4">
        <h3 className="text-lg font-bold text-white">Transaction Not Found</h3>
        <p className="text-xs text-slate-400">The requested transaction ID {id} does not exist.</p>
        <button
          onClick={() => navigate('/transactions')}
          className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-semibold"
        >
          Return to Transactions
        </button>
      </div>
    );
  }

  const tx = data.transaction;
  const cust = data.customer;

  return (
    <div className="space-y-6">
      {/* Top Navigation */}
      <div className="flex items-center justify-between">
        <Link
          to="/transactions"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Transactions</span>
        </Link>

        <div className="flex items-center gap-3">
          <StatusBadge status={tx.finalStatus} />
          <RiskBadge score={tx.riskScore} category={tx.riskCategory} />
        </div>
      </div>

      {/* Main Header Card */}
      <div className="p-6 rounded-2xl border border-[#1F293D] bg-[#111827] flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <span className="text-xs font-mono uppercase tracking-wider text-slate-400">Transaction ID</span>
            <span className="font-mono text-base font-bold text-white">{tx.transactionId}</span>
          </div>
          <h2 className="text-3xl font-extrabold text-white font-mono">
            {formatCurrency(tx.amount)}
          </h2>
          <p className="text-xs text-slate-400">
            Processed via <strong className="text-slate-200">{tx.channel || tx.transactionType}</strong> at {tx.merchant}
          </p>
        </div>

        {/* Risk Gauge Block */}
        <div className="p-4 rounded-xl border border-[#1F293D] bg-[#0E1322] flex items-center gap-5">
          <div className="text-center">
            <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-400 block">Risk Score</span>
            <span className={`text-3xl font-extrabold font-mono ${
              tx.riskScore >= 70 ? 'text-red-400' : tx.riskScore >= 40 ? 'text-amber-400' : 'text-emerald-400'
            }`}>
              {tx.riskScore}
            </span>
            <span className="text-[10px] text-slate-500 block">/ 100</span>
          </div>

          <div className="w-px h-12 bg-[#1F293D]"></div>

          <div className="space-y-1 text-xs">
            <div className="flex items-center justify-between gap-4">
              <span className="text-slate-400">Supervised RF:</span>
              <span className="font-mono font-bold text-indigo-300">
                {((tx.supervisedProbability || (tx.riskScore/100)) * 100).toFixed(1)}%
              </span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-slate-400">IsoForest Anomaly:</span>
              <span className="font-mono font-bold text-cyan-300">
                {((tx.anomalyScore || 0.15) * 100).toFixed(1)}%
              </span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-slate-400">Engine Version:</span>
              <span className="font-mono text-[11px] text-slate-300">{tx.modelVersion || 'v1.2.0'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Explainable AI Decision Rationale Card */}
      <div className="p-6 rounded-2xl border border-indigo-500/30 bg-[#111827] shadow-xl space-y-4">
        <div className="flex items-center gap-2 text-white">
          <ShieldAlert className="w-5 h-5 text-indigo-400" />
          <h3 className="text-base font-bold">Explainable AI Decision Rationale</h3>
        </div>
        <p className="text-xs text-slate-400">
          The following deterministic criteria and machine learning feature anomalies contributed to this risk classification:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
          {tx.reasons && tx.reasons.length > 0 ? (
            tx.reasons.map((r, idx) => (
              <div 
                key={idx} 
                className="p-3.5 rounded-xl border border-[#1F293D] bg-[#0E1322] flex items-start gap-3"
              >
                <div className="p-1 rounded bg-indigo-500/20 text-indigo-400 shrink-0 mt-0.5">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <span className="text-xs text-slate-200 leading-relaxed">{r}</span>
              </div>
            ))
          ) : (
            <div className="p-3.5 rounded-xl border border-[#1F293D] bg-[#0E1322] text-xs text-slate-400">
              No anomalies detected. Spending metrics adhere to normal historical baselines.
            </div>
          )}
        </div>
      </div>

      {/* Feature telemetry & Customer baseline Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Transaction Feature Attributes */}
        <div className="p-5 rounded-2xl border border-[#1F293D] bg-[#111827] space-y-4">
          <h3 className="text-sm font-bold text-white tracking-wide flex items-center gap-2">
            <Activity className="w-4 h-4 text-indigo-400" />
            Transaction Telemetry & Hardware Fingerprint
          </h3>

          <div className="divide-y divide-[#1F293D] text-xs">
            <div className="py-2.5 flex items-center justify-between">
              <span className="text-slate-400 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" /> Timestamp & Window
              </span>
              <span className="font-mono text-slate-200">
                {formatDateTime(tx.timestamp)} {tx.isNightTx === 1 && '(Dormant Midnight Window)'}
              </span>
            </div>

            <div className="py-2.5 flex items-center justify-between">
              <span className="text-slate-400 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5" /> Geolocation & IP Country
              </span>
              <span className="font-medium text-slate-200">
                {tx.location} {tx.isNewLocation === 1 && <span className="text-amber-400 font-bold ml-1">(! New IP)</span>}
              </span>
            </div>

            <div className="py-2.5 flex items-center justify-between">
              <span className="text-slate-400 flex items-center gap-1.5">
                <Smartphone className="w-3.5 h-3.5" /> Hardware Device Signature
              </span>
              <span className="font-mono text-slate-200">
                {tx.deviceId} {tx.isNewDevice === 1 && <span className="text-amber-400 font-bold ml-1">(! Novel Device)</span>}
              </span>
            </div>

            <div className="py-2.5 flex items-center justify-between">
              <span className="text-slate-400">Velocity in Preceding 60 min</span>
              <span className="font-mono font-bold text-slate-200">
                {tx.txVelocity1h} transaction(s)
              </span>
            </div>

            <div className="py-2.5 flex items-center justify-between">
              <span className="text-slate-400">Merchant Recipient</span>
              <span className="font-semibold text-slate-200">{tx.merchant}</span>
            </div>
          </div>
        </div>

        {/* Customer Behavioral Context */}
        <div className="p-5 rounded-2xl border border-[#1F293D] bg-[#111827] space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white tracking-wide flex items-center gap-2">
              <User className="w-4 h-4 text-cyan-400" />
              Customer Spending Baseline
            </h3>
            {cust && (
              <Link 
                to={`/customers/${cust.customerId}`}
                className="text-xs text-indigo-400 hover:underline flex items-center gap-1"
              >
                Full Profile <ExternalLink className="w-3 h-3" />
              </Link>
            )}
          </div>

          <div className="divide-y divide-[#1F293D] text-xs">
            <div className="py-2.5 flex items-center justify-between">
              <span className="text-slate-400">Customer Identifier</span>
              <span className="font-mono font-bold text-indigo-400">{tx.customerId}</span>
            </div>

            <div className="py-2.5 flex items-center justify-between">
              <span className="text-slate-400">Customer Profile Name</span>
              <span className="text-slate-200">{cust?.name || 'Walk-in / Guest Client'}</span>
            </div>

            <div className="py-2.5 flex items-center justify-between">
              <span className="text-slate-400">Historical Typical Baseline</span>
              <span className="font-mono font-semibold text-slate-200">
                {formatCurrency(tx.customerAvgAmount || cust?.avgAmount || 100)}
              </span>
            </div>

            <div className="py-2.5 flex items-center justify-between">
              <span className="text-slate-400">Amount Deviation Ratio</span>
              <span className={`font-mono font-bold ${
                tx.amountToAvgRatio >= 4 ? 'text-red-400' : 'text-slate-200'
              }`}>
                {tx.amountToAvgRatio || (tx.amount / (tx.customerAvgAmount || 100)).toFixed(1)}x of normal baseline
              </span>
            </div>

            <div className="py-2.5 flex items-center justify-between">
              <span className="text-slate-400">Historical Confirmed Fraud Count</span>
              <span className="font-mono text-slate-200">
                {tx.historicalFraudCount || cust?.historicalFraudCount || 0} incidents
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
