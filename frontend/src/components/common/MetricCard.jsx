import React from 'react';

export const MetricCard = ({ title, value, change, changeType = 'neutral', subtitle, icon: Icon, alert = false }) => {
  const changeColor = {
    positive: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    negative: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
    neutral: 'text-slate-400 bg-slate-800/40 border-slate-700/30'
  }[changeType];

  return (
    <div className={`p-5 rounded-xl border bg-[#111827] transition-all duration-200 hover:border-indigo-500/40 hover:shadow-lg ${
      alert ? 'border-red-500/30 bg-red-950/10' : 'border-[#1F293D]'
    }`}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">{title}</span>
        {Icon && (
          <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>

      <div className="mt-3 flex items-baseline justify-between gap-2">
        <h3 className="text-2xl font-bold tracking-tight text-white">{value}</h3>
        {change && (
          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${changeColor}`}>
            {change}
          </span>
        )}
      </div>

      {subtitle && (
        <p className="mt-1.5 text-xs text-slate-400 truncate">{subtitle}</p>
      )}
    </div>
  );
};
