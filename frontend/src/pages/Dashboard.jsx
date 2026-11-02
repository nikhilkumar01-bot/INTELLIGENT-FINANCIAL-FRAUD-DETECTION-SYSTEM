import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, 
  CheckCircle, 
  AlertTriangle, 
  DollarSign, 
  Activity, 
  TrendingUp, 
  Sparkles, 
  ArrowRight,
  RefreshCw,
  Clock,
  Layers
} from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
  BarChart, Bar, Legend, CartesianGrid
} from 'recharts';
import { MetricCard } from '../components/common/MetricCard';
import { RiskBadge } from '../components/common/RiskBadge';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { AnalyzeTransactionModal } from '../components/transactions/AnalyzeTransactionModal';
import { api } from '../services/api';
import { formatCurrency, formatPercent, formatDateTime } from '../utils/formatters';

const RISK_COLORS = {
  LOW: '#10B981',
  MEDIUM: '#F59E0B',
  HIGH: '#F97316',
  CRITICAL: '#EF4444'
};

const PIE_COLORS = ['#10B981', '#EF4444', '#F59E0B'];

export const Dashboard = () => {
  const [data, setData] = useState(null);
  const [recentAlerts, setRecentAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isAnalyzeOpen, setIsAnalyzeOpen] = useState(false);

  const fetchData = async () => {
    try {
      const [dashRes, alertRes] = await Promise.all([
        api.getDashboardSummary(),
        api.getAlerts({ limit: 6, status: 'ALL' })
      ]);
      if (dashRes.success) setData(dashRes.summary);
      if (alertRes.success) setRecentAlerts(alertRes.data);
    } catch (err) {
      console.error('Error fetching dashboard telemetry:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  if (loading) {
    return <LoadingSpinner label="Compiling real-time fraud risk telemetry..." />;
  }

  const s = data || {};

  // Formatter for Donut Chart
  const pieData = [
    { name: 'Genuine', value: s.genuineTransactions || 0, color: '#10B981' },
    { name: 'Confirmed Fraud', value: s.confirmedFraudCases || 0, color: '#EF4444' },
    { name: 'Suspicious / In Review', value: Math.max(0, (s.suspiciousTransactions || 0) - (s.confirmedFraudCases || 0)), color: '#F59E0B' }
  ];

  // Bar chart data for Risk Distribution
  const riskDistributionData = [
    { tier: 'Low (<30)', count: s.riskDistribution?.LOW || 0, fill: '#10B981' },
    { tier: 'Medium (30-59)', count: s.riskDistribution?.MEDIUM || 0, fill: '#F59E0B' },
    { tier: 'High (60-79)', count: s.riskDistribution?.HIGH || 0, fill: '#F97316' },
    { tier: 'Critical (80+)', count: s.riskDistribution?.CRITICAL || 0, fill: '#EF4444' }
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner / Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            Intelligence Overview & Threat Feed
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Supervised Random Forest classification and Isolation Forest anomaly telemetry.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="p-2.5 rounded-xl border border-[#1F293D] bg-[#111827] text-slate-400 hover:text-white hover:bg-[#161D2F] transition disabled:opacity-50"
            title="Refresh Telemetry"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={() => setIsAnalyzeOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-semibold text-xs shadow-lg shadow-indigo-600/25 transition"
          >
            <Sparkles className="w-4 h-4" />
            <span>Analyze Transaction</span>
          </button>
        </div>
      </div>

      {/* Primary KPI Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Processed"
          value={s.totalTransactions?.toLocaleString() || '0'}
          change="+1,250 live"
          changeType="positive"
          subtitle="Monitored in past 30 days"
          icon={Layers}
        />

        <MetricCard
          title="Suspicious Flagged"
          value={s.suspiciousTransactions?.toLocaleString() || '0'}
          change={`${s.fraudDetectionRate || 0}% rate`}
          changeType="negative"
          subtitle="Risk score ≥ 60 or heuristic trigger"
          icon={AlertTriangle}
          alert={(s.suspiciousTransactions || 0) > 0}
        />

        <MetricCard
          title="Confirmed Fraud"
          value={s.confirmedFraudCases?.toLocaleString() || '0'}
          change="Verified"
          changeType="negative"
          subtitle="Analyst-adjudicated loss prevented"
          icon={ShieldAlert}
        />

        <MetricCard
          title="Flagged Total Value"
          value={formatCurrency(s.totalFlaggedValue || 0)}
          change={`FPR: ${s.falsePositiveRate || 0}%`}
          changeType="neutral"
          subtitle="High-risk transactions value"
          icon={DollarSign}
        />
      </div>

      {/* Secondary Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl border border-[#1F293D] bg-[#111827] flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Pending Alert Queue</span>
            <h4 className="text-xl font-bold text-amber-400 mt-1">{s.pendingAlerts || 0} Alerts</h4>
          </div>
          <Link to="/alerts" className="text-xs text-indigo-400 hover:underline flex items-center gap-1 font-medium">
            Triage Now <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="p-4 rounded-xl border border-[#1F293D] bg-[#111827] flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Under Investigation</span>
            <h4 className="text-xl font-bold text-cyan-400 mt-1">{s.underInvestigationAlerts || 0} Active Cases</h4>
          </div>
          <Link to="/alerts" className="text-xs text-indigo-400 hover:underline flex items-center gap-1 font-medium">
            View Cases <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="p-4 rounded-xl border border-[#1F293D] bg-[#111827] flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Fraud Detection Rate</span>
            <h4 className="text-xl font-bold text-emerald-400 mt-1">{s.fraudDetectionRate || 0}%</h4>
          </div>
          <span className="text-xs text-slate-400">Low false positives</span>
        </div>
      </div>

      {/* Charts Section: Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Activity Trends Over Time */}
        <div className="lg:col-span-2 p-5 rounded-2xl border border-[#1F293D] bg-[#111827] space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white tracking-wide">
                Transaction Volume & Suspicious Surges (14-Day Timeline)
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">Daily volume vs. automated machine learning flags</p>
            </div>
            <div className="flex items-center gap-4 text-xs">
              <span className="flex items-center gap-1.5 text-slate-300">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-500"></span> Total Volume
              </span>
              <span className="flex items-center gap-1.5 text-red-400">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span> Suspicious
              </span>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={s.activityTrends || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="totalGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366F1" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#6366F1" stopOpacity={0.0}/>
                  </linearGradient>
                  <linearGradient id="suspGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#EF4444" stopOpacity={0.5}/>
                    <stop offset="95%" stopColor="#EF4444" stopOpacity={0.0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1F293D" vertical={false} />
                <XAxis 
                  dataKey="date" 
                  stroke="#64748B" 
                  fontSize={11} 
                  tickLine={false}
                  tickFormatter={(val) => val ? val.slice(5) : ''}
                />
                <YAxis stroke="#64748B" fontSize={11} tickLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0E1322', borderColor: '#1F293D', borderRadius: '0.75rem', fontSize: '12px' }}
                />
                <Area type="monotone" dataKey="total" stroke="#6366F1" strokeWidth={2} fillOpacity={1} fill="url(#totalGrad)" name="Total Transactions" />
                <Area type="monotone" dataKey="suspicious" stroke="#EF4444" strokeWidth={2} fillOpacity={1} fill="url(#suspGrad)" name="Suspicious Flagged" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Verification Status Donut */}
        <div className="p-5 rounded-2xl border border-[#1F293D] bg-[#111827] space-y-4 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-white tracking-wide">Verification Breakdown</h3>
            <p className="text-xs text-slate-400 mt-0.5">Genuine vs. confirmed fraud vs. review</p>
          </div>

          <div className="h-52 w-full flex items-center justify-center relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={85}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0E1322', borderColor: '#1F293D', borderRadius: '0.75rem', fontSize: '12px' }} 
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-xs text-slate-400">Genuine</span>
              <span className="text-xl font-bold text-emerald-400">
                {s.totalTransactions ? Math.round((s.genuineTransactions / s.totalTransactions) * 100) : 0}%
              </span>
            </div>
          </div>

          <div className="space-y-2 pt-2 border-t border-[#1F293D] text-xs">
            {pieData.map((p, i) => (
              <div key={i} className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-slate-300">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: p.color }}></span>
                  {p.name}
                </span>
                <span className="font-mono font-semibold text-white">{p.value.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Charts Section: Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Risk Distribution Chart */}
        <div className="p-5 rounded-2xl border border-[#1F293D] bg-[#111827] space-y-4">
          <div>
            <h3 className="text-sm font-bold text-white tracking-wide">Risk Severity Tier Distribution</h3>
            <p className="text-xs text-slate-400 mt-0.5">Score brackets computed by ensemble model</p>
          </div>

          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={riskDistributionData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1F293D" vertical={false} />
                <XAxis dataKey="tier" stroke="#64748B" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748B" fontSize={11} tickLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0E1322', borderColor: '#1F293D', borderRadius: '0.75rem', fontSize: '12px' }} 
                />
                <Bar dataKey="count" radius={[6, 6, 0, 0]} name="Transactions">
                  {riskDistributionData.map((entry, index) => (
                    <Cell key={`bar-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Channel Breakdown */}
        <div className="p-5 rounded-2xl border border-[#1F293D] bg-[#111827] space-y-4">
          <div>
            <h3 className="text-sm font-bold text-white tracking-wide">Vulnerability by Payment Channel</h3>
            <p className="text-xs text-slate-400 mt-0.5">Total volume vs. confirmed fraud per channel</p>
          </div>

          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={s.channelBreakdown || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1F293D" vertical={false} />
                <XAxis dataKey="channel" stroke="#64748B" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748B" fontSize={11} tickLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0E1322', borderColor: '#1F293D', borderRadius: '0.75rem', fontSize: '12px' }} 
                />
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                <Bar dataKey="total" fill="#6366F1" radius={[4, 4, 0, 0]} name="Total Volume" />
                <Bar dataKey="fraud" fill="#EF4444" radius={[4, 4, 0, 0]} name="Confirmed Fraud" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent Alerts Feed Table */}
      <div className="p-5 rounded-2xl border border-[#1F293D] bg-[#111827] space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-white tracking-wide">High-Priority Fraud Alerts Feed</h3>
            <p className="text-xs text-slate-400 mt-0.5">Latest suspicious events flagged for investigation</p>
          </div>
          <Link
            to="/alerts"
            className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
          >
            Open Investigation Center <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#161D2F] text-slate-400 font-semibold uppercase tracking-wider border-b border-[#1F293D]">
              <tr>
                <th className="py-3 px-4">Alert ID</th>
                <th className="py-3 px-4">Transaction / Cust</th>
                <th className="py-3 px-4">Amount</th>
                <th className="py-3 px-4">Risk Severity</th>
                <th className="py-3 px-4">Primary Flag Reason</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1F293D] text-slate-300">
              {recentAlerts.map((a) => (
                <tr key={a.alertId} className="hover:bg-slate-800/40 transition">
                  <td className="py-3 px-4 font-mono font-medium text-white">{a.alertId}</td>
                  <td className="py-3 px-4">
                    <div className="font-mono text-slate-200">{a.transactionId}</div>
                    <div className="text-[11px] text-slate-500">{a.customerId}</div>
                  </td>
                  <td className="py-3 px-4 font-mono font-bold text-slate-100">
                    {formatCurrency(a.amount)}
                  </td>
                  <td className="py-3 px-4">
                    <RiskBadge score={a.riskScore} category={a.riskCategory} />
                  </td>
                  <td className="py-3 px-4 max-w-xs truncate text-slate-300">
                    {a.reasons?.[0] || 'Unusual feature combination detected.'}
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold border ${
                      a.investigationStatus === 'Resolved' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' :
                      a.investigationStatus === 'Under Investigation' ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30' :
                      'bg-amber-500/10 text-amber-400 border-amber-500/30'
                    }`}>
                      {a.investigationStatus}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <Link
                      to={`/alerts/${a.alertId}`}
                      className="px-3 py-1.5 rounded-lg bg-indigo-600/20 text-indigo-300 hover:bg-indigo-600 hover:text-white border border-indigo-500/30 text-xs font-semibold transition"
                    >
                      Investigate
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Interactive Analyze Modal */}
      <AnalyzeTransactionModal
        isOpen={isAnalyzeOpen}
        onClose={() => setIsAnalyzeOpen(false)}
        onTransactionCreated={() => {
          fetchData();
        }}
      />
    </div>
  );
};
