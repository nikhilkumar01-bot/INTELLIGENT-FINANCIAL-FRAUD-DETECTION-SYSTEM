import React, { useState, useEffect } from 'react';
import { 
  FileBarChart2, 
  Download, 
  Printer, 
  Calendar, 
  Filter, 
  DollarSign, 
  ShieldAlert, 
  CheckCircle2,
  AlertTriangle,
  Layers
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend
} from 'recharts';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { api } from '../services/api';
import { formatCurrency, formatPercent, formatDateTime } from '../utils/formatters';

export const Reports = () => {
  const [range, setRange] = useState('30d');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const res = await api.getReportSummary({ range, startDate, endDate });
      if (res.success) {
        setReport(res);
      }
    } catch (err) {
      console.error('Error fetching report:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [range]);

  const handleCustomFilter = (e) => {
    e.preventDefault();
    fetchReport();
  };

  const handleExportCsv = async () => {
    try {
      const blob = await api.exportTransactionsCsv();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `fraud_report_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err) {
      alert('Export failed: ' + err.message);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return <LoadingSpinner label="Compiling executive financial fraud surveillance report..." />;
  }

  const m = report?.metrics || {};
  const meta = report?.reportMetadata || {};

  return (
    <div className="space-y-6 print:p-0 print:space-y-4">
      {/* Top Header / Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            Surveillance Reports & Risk Analytics
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Audit-ready reporting on transaction risk distributions and fraud prevention outcomes.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleExportCsv}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-[#1F293D] bg-[#111827] text-slate-300 hover:text-white hover:bg-[#161D2F] text-xs font-semibold transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-lg shadow-indigo-600/30 transition"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {/* Date Range Selector Bar (hidden in print) */}
      <div className="p-4 rounded-2xl border border-[#1F293D] bg-[#111827] flex flex-wrap items-center justify-between gap-4 print:hidden">
        <div className="flex items-center gap-2">
          {['7d', '30d', '90d'].map((r) => (
            <button
              key={r}
              onClick={() => { setRange(r); setStartDate(''); setEndDate(''); }}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                range === r
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/25'
                  : 'bg-[#0E1322] border border-[#1F293D] text-slate-400 hover:text-white'
              }`}
            >
              Past {r === '7d' ? '7 Days' : r === '30d' ? '30 Days' : '90 Days'}
            </button>
          ))}
        </div>

        <form onSubmit={handleCustomFilter} className="flex items-center gap-2 text-xs">
          <span className="text-slate-400 font-medium">Custom Range:</span>
          <input
            type="date"
            value={startDate}
            onChange={(e) => { setStartDate(e.target.value); setRange('custom'); }}
            className="px-2 py-1 bg-[#0E1322] border border-[#1F293D] rounded-lg text-white font-mono text-xs"
          />
          <span className="text-slate-500">to</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => { setEndDate(e.target.value); setRange('custom'); }}
            className="px-2 py-1 bg-[#0E1322] border border-[#1F293D] rounded-lg text-white font-mono text-xs"
          />
          <button
            type="submit"
            className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold transition"
          >
            Apply
          </button>
        </form>
      </div>

      {/* Printable Report Document Card */}
      <div className="p-8 rounded-2xl border border-[#1F293D] bg-[#111827] space-y-6 shadow-2xl print:border-none print:p-0 print:bg-white print:text-black">
        {/* Document Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#1F293D] pb-6 print:border-slate-300">
          <div>
            <span className="text-[11px] font-mono font-bold uppercase tracking-widest text-indigo-400 print:text-indigo-600">
              Executive Fraud Risk Audit Report
            </span>
            <h2 className="text-2xl font-black text-white mt-1 print:text-black">
              Intelligent Financial Fraud Detection System
            </h2>
            <p className="text-xs text-slate-400 print:text-slate-600 mt-1">
              Surveillance summary of synthetic transaction pipelines, anomaly metrics, and verified outcomes.
            </p>
          </div>

          <div className="text-right text-xs text-slate-400 print:text-slate-600 space-y-0.5">
            <div>Generated: <strong className="text-white print:text-black">{formatDateTime(meta.generatedAt)}</strong></div>
            <div>Date Window: <strong className="text-white print:text-black">{meta.dateRange?.start} to {meta.dateRange?.end}</strong></div>
            <div>Scope: <strong className="text-white print:text-black">{meta.sampleSize?.toLocaleString()} transactions</strong></div>
          </div>
        </div>

        {/* Key Summary Stats in Report */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-[#0E1322] border border-[#1F293D] print:bg-slate-50 print:border-slate-200">
            <span className="text-[11px] uppercase tracking-wider font-semibold text-slate-400 print:text-slate-600 block">
              Total Monitored
            </span>
            <span className="text-xl font-bold font-mono text-white print:text-black mt-1 block">
              {m.totalTransactions?.toLocaleString()}
            </span>
            <span className="text-[10px] text-slate-400 print:text-slate-600">
              Volume: {formatCurrency(m.totalVolume || 0)}
            </span>
          </div>

          <div className="p-4 rounded-xl bg-[#0E1322] border border-[#1F293D] print:bg-slate-50 print:border-slate-200">
            <span className="text-[11px] uppercase tracking-wider font-semibold text-slate-400 print:text-slate-600 block">
              Suspicious Flagged
            </span>
            <span className="text-xl font-bold font-mono text-red-400 print:text-red-600 mt-1 block">
              {m.flaggedCount?.toLocaleString()}
            </span>
            <span className="text-[10px] text-slate-400 print:text-slate-600">
              Rate: {m.fraudRate}% of total
            </span>
          </div>

          <div className="p-4 rounded-xl bg-[#0E1322] border border-[#1F293D] print:bg-slate-50 print:border-slate-200">
            <span className="text-[11px] uppercase tracking-wider font-semibold text-slate-400 print:text-slate-600 block">
              Confirmed Fraud Cases
            </span>
            <span className="text-xl font-bold font-mono text-rose-400 print:text-rose-600 mt-1 block">
              {m.confirmedFraud?.toLocaleString()}
            </span>
            <span className="text-[10px] text-slate-400 print:text-slate-600">
              Analyst adjudicated
            </span>
          </div>

          <div className="p-4 rounded-xl bg-[#0E1322] border border-[#1F293D] print:bg-slate-50 print:border-slate-200">
            <span className="text-[11px] uppercase tracking-wider font-semibold text-slate-400 print:text-slate-600 block">
              Protected Value
            </span>
            <span className="text-xl font-bold font-mono text-emerald-400 print:text-emerald-600 mt-1 block">
              {formatCurrency(m.totalFlaggedVolume || 0)}
            </span>
            <span className="text-[10px] text-slate-400 print:text-slate-600">
              Prevented exposure
            </span>
          </div>
        </div>

        {/* Channel Breakdown Table */}
        <div className="space-y-3 pt-2">
          <h3 className="text-sm font-bold text-white print:text-black">
            Fraud Incidents Breakdown by Payment Channel
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border border-[#1F293D] print:border-slate-300 rounded-xl overflow-hidden">
              <thead className="bg-[#161D2F] print:bg-slate-100 text-slate-400 print:text-slate-700 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-2.5 px-4">Channel</th>
                  <th className="py-2.5 px-4">Processed Volume</th>
                  <th className="py-2.5 px-4">Total Amount ($)</th>
                  <th className="py-2.5 px-4">Confirmed Fraud</th>
                  <th className="py-2.5 px-4">Fraud Proportion</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1F293D] print:divide-slate-200 text-slate-300 print:text-black">
                {report.channelBreakdown && report.channelBreakdown.map((c, i) => (
                  <tr key={i} className="hover:bg-slate-800/20">
                    <td className="py-2.5 px-4 font-mono font-bold">{c.channel}</td>
                    <td className="py-2.5 px-4 font-mono">{c.count?.toLocaleString()}</td>
                    <td className="py-2.5 px-4 font-mono">{formatCurrency(c.volume)}</td>
                    <td className="py-2.5 px-4 font-mono font-bold text-red-400 print:text-red-600">{c.fraudCount}</td>
                    <td className="py-2.5 px-4 font-mono">
                      {c.count > 0 ? ((c.fraudCount / c.count) * 100).toFixed(1) : 0}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Risk Distribution Breakdown */}
        <div className="space-y-3 pt-2">
          <h3 className="text-sm font-bold text-white print:text-black">
            Distribution of Model Assigned Risk Scores
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-3 rounded-lg border border-[#1F293D] print:border-slate-200 bg-[#0E1322] print:bg-slate-50">
              <span className="text-slate-400 print:text-slate-600 block">Low Risk (&lt;30)</span>
              <span className="text-lg font-bold font-mono text-emerald-400 print:text-emerald-600">
                {report.riskDistribution?.LOW || 0}
              </span>
            </div>
            <div className="p-3 rounded-lg border border-[#1F293D] print:border-slate-200 bg-[#0E1322] print:bg-slate-50">
              <span className="text-slate-400 print:text-slate-600 block">Medium Risk (30-59)</span>
              <span className="text-lg font-bold font-mono text-amber-400 print:text-amber-600">
                {report.riskDistribution?.MEDIUM || 0}
              </span>
            </div>
            <div className="p-3 rounded-lg border border-[#1F293D] print:border-slate-200 bg-[#0E1322] print:bg-slate-50">
              <span className="text-slate-400 print:text-slate-600 block">High Risk (60-79)</span>
              <span className="text-lg font-bold font-mono text-orange-400 print:text-orange-600">
                {report.riskDistribution?.HIGH || 0}
              </span>
            </div>
            <div className="p-3 rounded-lg border border-[#1F293D] print:border-slate-200 bg-[#0E1322] print:bg-slate-50">
              <span className="text-slate-400 print:text-slate-600 block">Critical Risk (80+)</span>
              <span className="text-lg font-bold font-mono text-red-400 print:text-red-600">
                {report.riskDistribution?.CRITICAL || 0}
              </span>
            </div>
          </div>
        </div>

        {/* Audit Disclaimer */}
        <div className="p-4 rounded-xl bg-[#0E1322] border border-[#1F293D] print:border-slate-200 text-[11px] text-slate-400 print:text-slate-600 space-y-1">
          <p className="font-semibold text-slate-300 print:text-slate-700">Audit & Compliance Statement</p>
          <p>
            This report represents synthetic transaction telemetry compiled for academic and research evaluation. 
            All decision rationale and risk scores are produced via ensemble Random Forest classification and Isolation Forest anomaly detection.
          </p>
        </div>
      </div>
    </div>
  );
};
