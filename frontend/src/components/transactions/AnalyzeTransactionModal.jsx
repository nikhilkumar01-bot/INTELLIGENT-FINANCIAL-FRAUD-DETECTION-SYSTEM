import React, { useState } from 'react';
import { Play, Sparkles, AlertCircle, CheckCircle2, ShieldAlert } from 'lucide-react';
import { Modal } from '../common/Modal';
import { RiskBadge } from '../common/RiskBadge';
import { api } from '../../services/api';
import { formatCurrency } from '../../utils/formatters';

const PRESETS = [
  {
    name: 'Normal Grocery Purchase',
    data: {
      customerId: 'CUST-1002',
      amount: 42.50,
      channel: 'CARD',
      merchant: 'Whole Foods Market',
      txHour: 15,
      txVelocity1h: 1,
      isNewDevice: 0,
      isNewLocation: 0,
      notes: 'Customer buying groceries at local supermarket.'
    }
  },
  {
    name: 'Legit High-Value Electronics (Genuine False-Positive Test)',
    data: {
      customerId: 'CUST-1010',
      amount: 1450.00,
      channel: 'ONLINE',
      merchant: 'Apple Store Online',
      txHour: 14,
      txVelocity1h: 1,
      isNewDevice: 0,
      isNewLocation: 0,
      notes: 'Annual smartphone upgrade during business hours on trusted laptop.'
    }
  },
  {
    name: 'Suspicious Midnight Wire Transfer (Account Takeover)',
    data: {
      customerId: 'CUST-1005',
      amount: 18500.00,
      channel: 'WIRE_TRANSFER',
      merchant: 'Offshore Escrow Ltd',
      txHour: 3,
      txVelocity1h: 4,
      isNewDevice: 1,
      isNewLocation: 1,
      notes: 'Huge sudden wire transfer at 3 AM from unrecognized foreign device.'
    }
  },
  {
    name: 'Rapid Card Testing Attack',
    data: {
      customerId: 'CUST-1022',
      amount: 4.80,
      channel: 'ONLINE',
      merchant: 'Digital Micro Merchant Services',
      txHour: 20,
      txVelocity1h: 8,
      isNewDevice: 1,
      isNewLocation: 0,
      notes: 'Bot script rapidly probing stolen credentials with micro amounts.'
    }
  }
];

export const AnalyzeTransactionModal = ({ isOpen, onClose, onTransactionCreated }) => {
  const [formData, setFormData] = useState({
    customerId: 'CUST-1002',
    amount: 120.00,
    channel: 'CARD',
    merchant: 'Amazon Marketplace',
    location: 'New York, USA',
    deviceId: 'DEV-USER-01',
    txHour: 14,
    txVelocity1h: 1,
    isNewDevice: 0,
    isNewLocation: 0,
    notes: 'Synthetic demo transaction'
  });

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const applyPreset = (preset) => {
    setFormData({ ...formData, ...preset.data });
    setResult(null);
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await api.analyzeTransaction(formData);
      if (res.success) {
        setResult(res);
        if (onTransactionCreated) {
          onTransactionCreated(res.transaction);
        }
      }
    } catch (err) {
      setError(err.message || 'Analysis failed. Please verify transaction features.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="AI Fraud Risk Inference Playground" maxWidth="max-w-3xl">
      <div className="space-y-5">
        {/* Presets Bar */}
        <div>
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-2">
            Quick Scenarios (Demonstration Presets)
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {PRESETS.map((p, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => applyPreset(p)}
                className="text-left p-2.5 rounded-xl border border-[#1F293D] bg-[#161D2F] hover:border-indigo-500/50 hover:bg-indigo-600/10 transition text-xs flex items-center justify-between group"
              >
                <span className="font-medium text-slate-300 group-hover:text-white truncate">{p.name}</span>
                <Sparkles className="w-3.5 h-3.5 text-indigo-400 shrink-0 ml-1" />
              </button>
            ))}
          </div>
        </div>

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Customer ID</label>
              <input
                type="text"
                value={formData.customerId}
                onChange={(e) => setFormData({ ...formData, customerId: e.target.value })}
                className="w-full px-3 py-2 bg-[#0E1322] border border-[#1F293D] rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Amount ($ USD)</label>
              <input
                type="number"
                step="0.01"
                min="0.1"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 bg-[#0E1322] border border-[#1F293D] rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500 font-mono"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Payment Channel</label>
              <select
                value={formData.channel}
                onChange={(e) => setFormData({ ...formData, channel: e.target.value })}
                className="w-full px-3 py-2 bg-[#0E1322] border border-[#1F293D] rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="CARD">Credit/Debit Card</option>
                <option value="ONLINE">Online Gateway / eCommerce</option>
                <option value="WIRE_TRANSFER">Wire Transfer</option>
                <option value="ATM">ATM Withdrawal</option>
                <option value="UPI">UPI / Instant Pay</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Merchant / Recipient</label>
              <input
                type="text"
                value={formData.merchant}
                onChange={(e) => setFormData({ ...formData, merchant: e.target.value })}
                className="w-full px-3 py-2 bg-[#0E1322] border border-[#1F293D] rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Hour of Day (0 - 23)</label>
              <input
                type="number"
                min="0"
                max="23"
                value={formData.txHour}
                onChange={(e) => setFormData({ ...formData, txHour: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 bg-[#0E1322] border border-[#1F293D] rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Velocity in Last 1h</label>
              <input
                type="number"
                min="1"
                max="30"
                value={formData.txVelocity1h}
                onChange={(e) => setFormData({ ...formData, txVelocity1h: parseInt(e.target.value) || 1 })}
                className="w-full px-3 py-2 bg-[#0E1322] border border-[#1F293D] rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500 font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            <label className="flex items-center gap-3 p-3 bg-[#0E1322] border border-[#1F293D] rounded-xl cursor-pointer hover:border-slate-700">
              <input
                type="checkbox"
                checked={formData.isNewDevice === 1}
                onChange={(e) => setFormData({ ...formData, isNewDevice: e.target.checked ? 1 : 0 })}
                className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 bg-slate-900 border-slate-700"
              />
              <span className="text-xs text-slate-300">Unrecognized Device Signature (New Hardware)</span>
            </label>

            <label className="flex items-center gap-3 p-3 bg-[#0E1322] border border-[#1F293D] rounded-xl cursor-pointer hover:border-slate-700">
              <input
                type="checkbox"
                checked={formData.isNewLocation === 1}
                onChange={(e) => setFormData({ ...formData, isNewLocation: e.target.checked ? 1 : 0 })}
                className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 bg-slate-900 border-slate-700"
              />
              <span className="text-xs text-slate-300">Unusual Location / Foreign IP Geolocation</span>
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-semibold text-sm shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 transition disabled:opacity-50"
          >
            {loading ? (
              <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></span>
            ) : (
              <Play className="w-4 h-4 fill-current" />
            )}
            Run AI Fraud Risk Scoring Engine
          </button>
        </form>

        {error && (
          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Inference Results Card */}
        {result && (
          <div className="p-5 rounded-2xl bg-[#0E1322] border border-indigo-500/40 shadow-xl space-y-4 animate-fadeIn">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#1F293D]">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-xl ${
                  result.assessment.riskScore >= 70 ? 'bg-red-500/20 text-red-400' : 'bg-emerald-500/20 text-emerald-400'
                }`}>
                  <ShieldAlert className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-base text-white">
                    Inference Verdict: {result.assessment.actionRecommendation}
                  </h4>
                  <p className="text-xs text-slate-400 font-mono">
                    ID: {result.transaction.transactionId} | Model: {result.assessment.modelVersion} ({result.assessment.detector})
                  </p>
                </div>
              </div>

              <RiskBadge score={result.assessment.riskScore} category={result.assessment.riskCategory} />
            </div>

            {/* Score Breakdown Bars */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3 rounded-xl bg-[#161D2F] border border-[#1F293D]">
                <span className="text-[11px] text-slate-400 block">Combined Risk Score</span>
                <span className={`text-xl font-bold font-mono ${
                  result.assessment.riskScore >= 70 ? 'text-red-400' : result.assessment.riskScore >= 40 ? 'text-amber-400' : 'text-emerald-400'
                }`}>
                  {result.assessment.riskScore} / 100
                </span>
              </div>

              <div className="p-3 rounded-xl bg-[#161D2F] border border-[#1F293D]">
                <span className="text-[11px] text-slate-400 block">Supervised RF Probability</span>
                <span className="text-xl font-bold font-mono text-indigo-300">
                  {(result.assessment.supervisedProbability * 100).toFixed(1)}%
                </span>
              </div>

              <div className="p-3 rounded-xl bg-[#161D2F] border border-[#1F293D]">
                <span className="text-[11px] text-slate-400 block">Isolation Forest Anomaly</span>
                <span className="text-xl font-bold font-mono text-cyan-300">
                  {(result.assessment.anomalyScore * 100).toFixed(1)}%
                </span>
              </div>
            </div>

            {/* Explainable AI Decision Rationale */}
            <div>
              <h5 className="text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                Explainable AI Rationale & Contributing Features
              </h5>
              <ul className="space-y-1.5">
                {result.assessment.reasons.map((r, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-slate-300 bg-[#161D2F]/60 px-3 py-2 rounded-lg border border-[#1F293D]">
                    <span className="text-indigo-400 font-bold">•</span>
                    <span>{r}</span>
                  </li>
                ))}
              </ul>
            </div>

            {result.alert && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center justify-between text-xs text-red-300">
                <span className="font-semibold">⚠️ Automatic Fraud Alert Generated: #{result.alert.alertId}</span>
                <span className="font-mono text-[11px]">Assigned to Analyst Queue</span>
              </div>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
};
