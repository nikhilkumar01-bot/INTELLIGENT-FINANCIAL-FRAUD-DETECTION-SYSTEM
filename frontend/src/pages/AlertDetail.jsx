import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  ShieldAlert, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  User, 
  Clock, 
  Send, 
  MessageSquare, 
  FileText,
  ExternalLink
} from 'lucide-react';
import { RiskBadge } from '../components/common/RiskBadge';
import { StatusBadge } from '../components/common/StatusBadge';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { formatCurrency, formatDateTime } from '../utils/formatters';

export const AlertDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [noteText, setNoteText] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState(null);

  const fetchAlert = async () => {
    try {
      const res = await api.getAlertById(id);
      if (res.success) {
        setData(res);
      }
    } catch (err) {
      console.error('Error fetching alert details:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlert();
  }, [id]);

  const handleUpdateDisposition = async (disposition) => {
    setActionLoading(true);
    setMessage(null);
    try {
      const res = await api.updateAlert(id, {
        finalDisposition: disposition,
        investigationStatus: 'Resolved',
        assignedAnalyst: user?.name || 'Senior Fraud Analyst',
        note: `Adjudication recorded by ${user?.name}: Marked as ${disposition}.`
      });
      if (res.success) {
        setData(prev => ({ ...prev, alert: res.alert }));
        setMessage({ type: 'success', text: `Alert successfully resolved as ${disposition}.` });
      }
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Error updating alert status.' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleStartInvestigation = async () => {
    setActionLoading(true);
    try {
      const res = await api.updateAlert(id, {
        investigationStatus: 'Under Investigation',
        assignedAnalyst: user?.name || 'Senior Fraud Analyst',
        note: `Case claimed for forensic investigation by ${user?.name}.`
      });
      if (res.success) {
        setData(prev => ({ ...prev, alert: res.alert }));
        setMessage({ type: 'success', text: 'Alert marked Under Investigation.' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setActionLoading(false);
    }
  };

  const handleAddNote = async (e) => {
    e.preventDefault();
    if (!noteText.trim()) return;
    setActionLoading(true);
    try {
      const res = await api.addAlertNote(id, noteText.trim());
      if (res.success) {
        setData(prev => ({ ...prev, alert: res.alert }));
        setNoteText('');
        setMessage({ type: 'success', text: 'Analyst forensic note appended to case history.' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner label="Loading investigation case dossier..." />;
  }

  if (!data || !data.alert) {
    return (
      <div className="p-8 text-center space-y-4">
        <h3 className="text-lg font-bold text-white">Alert Not Found</h3>
        <p className="text-xs text-slate-400">The requested alert ID {id} does not exist.</p>
        <button onClick={() => navigate('/alerts')} className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-semibold">
          Return to Alerts Inbox
        </button>
      </div>
    );
  }

  const { alert: a, transaction: tx, customer: cust } = data;

  return (
    <div className="space-y-6">
      {/* Navigation & Status */}
      <div className="flex items-center justify-between">
        <Link to="/alerts" className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition">
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Fraud Alerts Inbox</span>
        </Link>

        <div className="flex items-center gap-3">
          <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
            a.investigationStatus === 'Resolved' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' :
            a.investigationStatus === 'Under Investigation' ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30' :
            'bg-amber-500/10 text-amber-400 border-amber-500/30'
          }`}>
            {a.investigationStatus}
          </span>
          <RiskBadge score={a.riskScore} category={a.riskCategory} />
        </div>
      </div>

      {message && (
        <div className={`p-4 rounded-xl text-xs flex items-center gap-2 ${
          message.type === 'success' ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300' : 'bg-red-500/10 border border-red-500/30 text-red-300'
        }`}>
          {message.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertTriangle className="w-4 h-4 shrink-0" />}
          <span>{message.text}</span>
        </div>
      )}

      {/* Case Dossier Banner */}
      <div className="p-6 rounded-2xl border border-[#1F293D] bg-[#111827] flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs text-indigo-400 font-bold">{a.alertId}</span>
            <span className="text-xs text-slate-500">• Created {formatDateTime(a.createdAt)}</span>
          </div>
          <h2 className="text-3xl font-black text-white font-mono">{formatCurrency(a.amount)}</h2>
          <p className="text-xs text-slate-400">
            Assigned Analyst: <strong className="text-slate-200">{a.assignedAnalyst || 'Unassigned'}</strong>
            {a.finalDisposition && (
              <span className="ml-2 font-semibold text-rose-400">
                (Final Adjudication: {a.finalDisposition})
              </span>
            )}
          </p>
        </div>

        {/* Adjudication Action Box */}
        <div className="flex flex-wrap items-center gap-2">
          {a.investigationStatus === 'Pending' && (
            <button
              onClick={handleStartInvestigation}
              disabled={actionLoading}
              className="px-4 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs transition shadow-lg shadow-cyan-600/25"
            >
              Claim & Begin Investigation
            </button>
          )}

          {a.investigationStatus !== 'Resolved' && (
            <>
              <button
                onClick={() => handleUpdateDisposition('Confirmed Fraud')}
                disabled={actionLoading}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-semibold text-xs transition shadow-lg shadow-red-600/30"
              >
                <ShieldAlert className="w-4 h-4" />
                <span>Confirm as Fraud</span>
              </button>

              <button
                onClick={() => handleUpdateDisposition('Genuine')}
                disabled={actionLoading}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition shadow-lg shadow-emerald-600/30"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Resolve as Genuine</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Flag Reasons and Evidence */}
      <div className="p-5 rounded-2xl border border-red-500/20 bg-[#111827] space-y-3">
        <h3 className="text-sm font-bold text-white tracking-wide flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-red-400" />
          Detected Risk Factors & Evidence Chain
        </h3>
        <ul className="space-y-2">
          {a.reasons && a.reasons.map((r, i) => (
            <li key={i} className="p-3 rounded-xl bg-[#0E1322] border border-[#1F293D] text-xs text-slate-200 flex items-start gap-2.5">
              <span className="text-red-400 font-bold">•</span>
              <span>{r}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Linked Entities Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Linked Transaction */}
        <div className="p-5 rounded-2xl border border-[#1F293D] bg-[#111827] space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white tracking-wide">Linked Transaction Event</h3>
            {tx && (
              <Link to={`/transactions/${tx.transactionId}`} className="text-xs text-indigo-400 hover:underline flex items-center gap-1">
                View Transaction <ExternalLink className="w-3 h-3" />
              </Link>
            )}
          </div>

          {tx ? (
            <div className="divide-y divide-[#1F293D] text-xs">
              <div className="py-2 flex justify-between">
                <span className="text-slate-400">Transaction ID:</span>
                <span className="font-mono text-slate-200">{tx.transactionId}</span>
              </div>
              <div className="py-2 flex justify-between">
                <span className="text-slate-400">Channel / Merchant:</span>
                <span className="text-slate-200">{tx.channel} @ {tx.merchant}</span>
              </div>
              <div className="py-2 flex justify-between">
                <span className="text-slate-400">Timestamp:</span>
                <span className="text-slate-200">{formatDateTime(tx.timestamp)}</span>
              </div>
              <div className="py-2 flex justify-between">
                <span className="text-slate-400">Location:</span>
                <span className="text-slate-200">{tx.location}</span>
              </div>
            </div>
          ) : (
            <p className="text-xs text-slate-400">Transaction details not found.</p>
          )}
        </div>

        {/* Linked Customer Profile */}
        <div className="p-5 rounded-2xl border border-[#1F293D] bg-[#111827] space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white tracking-wide">Account Subject Identity</h3>
            {cust && (
              <Link to={`/customers/${cust.customerId}`} className="text-xs text-indigo-400 hover:underline flex items-center gap-1">
                Customer Profile <ExternalLink className="w-3 h-3" />
              </Link>
            )}
          </div>

          {cust ? (
            <div className="divide-y divide-[#1F293D] text-xs">
              <div className="py-2 flex justify-between">
                <span className="text-slate-400">Customer ID:</span>
                <span className="font-mono text-indigo-400 font-bold">{cust.customerId}</span>
              </div>
              <div className="py-2 flex justify-between">
                <span className="text-slate-400">Name:</span>
                <span className="text-slate-200">{cust.name}</span>
              </div>
              <div className="py-2 flex justify-between">
                <span className="text-slate-400">Typical Baseline:</span>
                <span className="font-mono text-emerald-400">{formatCurrency(cust.avgAmount)}</span>
              </div>
              <div className="py-2 flex justify-between">
                <span className="text-slate-400">Prior Confirmed Fraud:</span>
                <span className="font-mono text-slate-200">{cust.historicalFraudCount || 0} incidents</span>
              </div>
            </div>
          ) : (
            <p className="text-xs text-slate-400">Customer profile not found.</p>
          )}
        </div>
      </div>

      {/* Case Investigation Notes & Audit Log Thread */}
      <div className="p-5 rounded-2xl border border-[#1F293D] bg-[#111827] space-y-4">
        <h3 className="text-sm font-bold text-white tracking-wide flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-indigo-400" />
          Analyst Investigation Log & Audit Trail ({a.analystNotes?.length || 0})
        </h3>

        {/* Notes Timeline */}
        <div className="space-y-3">
          {a.analystNotes && a.analystNotes.map((n, i) => (
            <div key={i} className="p-3.5 rounded-xl bg-[#0E1322] border border-[#1F293D] space-y-1">
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-semibold text-indigo-400">{n.author || 'Analyst'}</span>
                <span className="text-slate-500 font-mono">{formatDateTime(n.timestamp)}</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">{n.note}</p>
            </div>
          ))}
        </div>

        {/* Append Note Input */}
        <form onSubmit={handleAddNote} className="flex gap-2 pt-2">
          <input
            type="text"
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            placeholder="Add investigation findings, cardholder contact notes, or forensic reasoning..."
            className="flex-1 px-4 py-2.5 bg-[#0E1322] border border-[#1F293D] rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
          />
          <button
            type="submit"
            disabled={actionLoading || !noteText.trim()}
            className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition disabled:opacity-50 flex items-center gap-1.5"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Add Note</span>
          </button>
        </form>
      </div>
    </div>
  );
};
