import React, { useState, useEffect } from 'react';
import { Sliders, Shield, Save, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

export const Settings = () => {
  const { isAdmin } = useAuth();
  const [settings, setSettings] = useState({
    lowRiskThreshold: 30,
    mediumRiskThreshold: 60,
    highRiskThreshold: 80,
    autoAlertThreshold: 70,
    autoFlagNightTransactions: true,
    activeModelVersion: 'v1.2.0'
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await api.getSettings();
        if (res.success && res.settings) {
          setSettings(res.settings);
        }
      } catch (err) {
        console.error('Error fetching settings:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!isAdmin) {
      alert('Only administrators can modify threshold configurations.');
      return;
    }

    setSaving(true);
    setMessage(null);

    try {
      const res = await api.updateSettings(settings);
      if (res.success) {
        setMessage({ type: 'success', text: 'System risk thresholds successfully updated and applied in real time.' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Error updating settings.' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <LoadingSpinner label="Loading threshold policies..." />;
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
          System Risk Governance & Threshold Configuration
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Adjust risk tier cutoffs, auto-alert escalation gates, and nocturnal heuristics.
        </p>
      </div>

      {message && (
        <div className={`p-4 rounded-xl text-xs flex items-center gap-2 ${
          message.type === 'success' ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300' : 'bg-red-500/10 border border-red-500/30 text-red-300'
        }`}>
          {message.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
          <span>{message.text}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Thresholds Card */}
        <div className="p-6 rounded-2xl border border-[#1F293D] bg-[#111827] space-y-5">
          <div className="flex items-center justify-between border-b border-[#1F293D] pb-3">
            <h3 className="text-sm font-bold text-white tracking-wide">
              Calibrated Risk Score Classification Tiers (0 – 100)
            </h3>
            <span className="text-[11px] text-indigo-400 font-mono">Ensemble Policy Gate</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Low Risk Ceiling (&lt; Score)
              </label>
              <input
                type="number"
                min="10"
                max="50"
                value={settings.lowRiskThreshold}
                onChange={(e) => setSettings({ ...settings, lowRiskThreshold: parseInt(e.target.value) || 30 })}
                disabled={!isAdmin}
                className="w-full px-3 py-2 bg-[#0E1322] border border-[#1F293D] rounded-xl text-sm font-mono text-emerald-400 focus:outline-none focus:border-indigo-500 disabled:opacity-60"
              />
              <p className="text-[11px] text-slate-400 mt-1">Transactions below this threshold are categorized as Genuine Candidates.</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Medium Risk Ceiling (&lt; Score)
              </label>
              <input
                type="number"
                min="31"
                max="75"
                value={settings.mediumRiskThreshold}
                onChange={(e) => setSettings({ ...settings, mediumRiskThreshold: parseInt(e.target.value) || 60 })}
                disabled={!isAdmin}
                className="w-full px-3 py-2 bg-[#0E1322] border border-[#1F293D] rounded-xl text-sm font-mono text-amber-400 focus:outline-none focus:border-indigo-500 disabled:opacity-60"
              />
              <p className="text-[11px] text-slate-400 mt-1">Triggers standard step-up 2FA or routine review.</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                High Risk Ceiling (&lt; Score)
              </label>
              <input
                type="number"
                min="61"
                max="90"
                value={settings.highRiskThreshold}
                onChange={(e) => setSettings({ ...settings, highRiskThreshold: parseInt(e.target.value) || 80 })}
                disabled={!isAdmin}
                className="w-full px-3 py-2 bg-[#0E1322] border border-[#1F293D] rounded-xl text-sm font-mono text-orange-400 focus:outline-none focus:border-indigo-500 disabled:opacity-60"
              />
              <p className="text-[11px] text-slate-400 mt-1">Scores above this ceiling are categorized as Critical Risk (80+).</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Automatic Alert Escalation Threshold
              </label>
              <input
                type="number"
                min="40"
                max="95"
                value={settings.autoAlertThreshold}
                onChange={(e) => setSettings({ ...settings, autoAlertThreshold: parseInt(e.target.value) || 70 })}
                disabled={!isAdmin}
                className="w-full px-3 py-2 bg-[#0E1322] border border-[#1F293D] rounded-xl text-sm font-mono text-red-400 focus:outline-none focus:border-indigo-500 disabled:opacity-60"
              />
              <p className="text-[11px] text-slate-400 mt-1">Automatically pushes flagged transaction into analyst triage inbox.</p>
            </div>
          </div>
        </div>

        {/* Feature Switches Card */}
        <div className="p-6 rounded-2xl border border-[#1F293D] bg-[#111827] space-y-4">
          <h3 className="text-sm font-bold text-white tracking-wide border-b border-[#1F293D] pb-3">
            Behavioral Heuristic Rules
          </h3>

          <label className="flex items-center gap-3 p-3 bg-[#0E1322] border border-[#1F293D] rounded-xl cursor-pointer">
            <input
              type="checkbox"
              checked={settings.autoFlagNightTransactions}
              onChange={(e) => setSettings({ ...settings, autoFlagNightTransactions: e.target.checked })}
              disabled={!isAdmin}
              className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 bg-slate-900 border-slate-700"
            />
            <div>
              <span className="text-xs font-semibold text-slate-200 block">
                Flag Midnight Window Deviations (12:00 AM – 05:00 AM)
              </span>
              <span className="text-[11px] text-slate-400">
                Adds high-risk scoring weight to transactions executed outside normal customer daylight baseline.
              </span>
            </div>
          </label>
        </div>

        {isAdmin ? (
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-lg shadow-indigo-600/30 flex items-center gap-2 transition disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Updating Policies...' : 'Save Configuration Changes'}</span>
          </button>
        ) : (
          <p className="text-xs text-amber-400 italic">
            * Read-only mode: Only users with the Administrator role can modify threshold configuration.
          </p>
        )}
      </form>
    </div>
  );
};
