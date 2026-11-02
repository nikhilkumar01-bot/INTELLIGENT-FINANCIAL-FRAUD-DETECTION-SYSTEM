import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  LogOut, 
  Database, 
  Cpu, 
  ShieldCheck, 
  AlertTriangle,
  ExternalLink 
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';

export const Header = () => {
  const { user, logout } = useAuth();
  const [systemStatus, setSystemStatus] = useState(null);
  const [recentAlerts, setRecentAlerts] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const [dashRes, alertRes] = await Promise.all([
          api.getDashboardSummary(),
          api.getAlerts({ limit: 5, status: 'Pending' })
        ]);
        if (dashRes.systemStatus) {
          setSystemStatus(dashRes.systemStatus);
        }
        if (alertRes.data) {
          setRecentAlerts(alertRes.data);
        }
      } catch (err) {
        console.warn('Telemetry fetch error:', err.message);
      }
    };

    fetchStatus();
    const interval = setInterval(fetchStatus, 30000); // 30s polling
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="h-16 px-6 border-b border-[#1F293D] bg-[#0E1322]/90 backdrop-blur-md flex items-center justify-between sticky top-0 z-30">
      {/* Telemetry Health Badges */}
      <div className="flex items-center gap-3">
        {/* ML Engine Badge */}
        <div className="flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono border border-indigo-500/30 bg-indigo-500/10 text-indigo-300">
          <Cpu className="w-3.5 h-3.5 text-indigo-400" />
          <span className="font-semibold">AI/ML:</span>
          <span className="text-slate-300">
            {systemStatus?.mlEngine?.online ? 'FastAPI Ensemble (RF + IsoForest)' : 'Ensemble Engine Active'}
          </span>
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
        </div>

        {/* Database Badge */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono border border-slate-700 bg-slate-800/40 text-slate-300">
          <Database className="w-3.5 h-3.5 text-slate-400" />
          <span>{systemStatus?.database?.engine || 'Secure Storage Active'}</span>
        </div>
      </div>

      {/* Header Actions */}
      <div className="flex items-center gap-4">
        {/* Notifications Popover */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 rounded-xl text-slate-400 hover:text-white hover:bg-[#161D2F] border border-transparent hover:border-[#1F293D] transition"
            title="Recent Fraud Alerts"
          >
            <Bell className="w-5 h-5" />
            {recentAlerts.length > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 rounded-full bg-red-500 ring-2 ring-[#0E1322]"></span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-[#111827] border border-[#1F293D] shadow-2xl p-4 z-50 animate-fadeIn">
              <div className="flex items-center justify-between pb-3 border-b border-[#1F293D]">
                <div className="flex items-center gap-2 text-sm font-semibold text-white">
                  <AlertTriangle className="w-4 h-4 text-orange-400" />
                  <span>Pending Fraud Alerts ({recentAlerts.length})</span>
                </div>
                <Link
                  to="/alerts"
                  onClick={() => setShowNotifications(false)}
                  className="text-xs text-indigo-400 hover:underline flex items-center gap-1"
                >
                  View All <ExternalLink className="w-3 h-3" />
                </Link>
              </div>

              <div className="mt-3 divide-y divide-[#1F293D] max-h-64 overflow-y-auto">
                {recentAlerts.length === 0 ? (
                  <p className="py-4 text-xs text-slate-400 text-center">No pending alerts. All clear.</p>
                ) : (
                  recentAlerts.map((a) => (
                    <Link
                      key={a.alertId}
                      to={`/alerts/${a.alertId}`}
                      onClick={() => setShowNotifications(false)}
                      className="py-2.5 px-2 flex items-start gap-3 hover:bg-slate-800/40 rounded-lg transition block"
                    >
                      <div className="p-1.5 rounded bg-red-500/10 text-red-400 border border-red-500/20 shrink-0">
                        <AlertTriangle className="w-4 h-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-mono font-semibold text-slate-200">{a.alertId}</span>
                          <span className="text-red-400 font-bold">Risk {a.riskScore}/100</span>
                        </div>
                        <p className="text-[11px] text-slate-400 truncate mt-0.5">
                          {a.reasons?.[0] || 'Unusual pattern detected.'}
                        </p>
                      </div>
                    </Link>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Badge & Logout */}
        <div className="flex items-center gap-3 pl-2 border-l border-[#1F293D]">
          <div className="hidden md:flex flex-col text-right">
            <span className="text-xs font-semibold text-white">{user?.name}</span>
            <span className="text-[11px] text-slate-400 capitalize">{user?.role}</span>
          </div>
          <button
            onClick={logout}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold text-rose-400 hover:text-white hover:bg-rose-600/20 border border-rose-500/20 hover:border-rose-500/40 transition"
            title="Log out of system"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </div>
    </header>
  );
};
