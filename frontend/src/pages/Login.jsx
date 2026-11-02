import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ShieldAlert, Lock, Mail, ArrowRight, AlertCircle, KeyRound, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(err.message || 'Login failed. Please verify your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (demoEmail, demoPass) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setError('');
  };

  return (
    <div className="min-h-screen bg-[#0B0F19] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Glows */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-purple-600/15 rounded-full blur-3xl pointer-events-none"></div>

      <div className="w-full max-w-md relative z-10">
        {/* Brand Banner */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 to-indigo-400 text-white shadow-xl shadow-indigo-600/30 mb-3">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">
            Fraud<span className="text-indigo-400">Shield</span> AI
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Intelligent Financial Fraud Detection & Investigation Platform
          </p>
        </div>

        {/* Card */}
        <div className="bg-[#111827] border border-[#1F293D] rounded-2xl p-8 shadow-2xl space-y-6">
          <div>
            <h2 className="text-lg font-bold text-white">Sign In to Sentinel Portal</h2>
            <p className="text-xs text-slate-400 mt-1">
              Authenticate to monitor transactions, review alerts, and run ML inference.
            </p>
          </div>

          {/* Quick Demo Fill Buttons */}
          <div className="p-3.5 rounded-xl bg-[#0E1322] border border-[#1F293D] space-y-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" /> Demo Credentials Quick-Fill:
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => fillDemo('admin@fraudshield.local', 'Admin@123')}
                className="py-1.5 px-3 rounded-lg text-xs font-medium border border-indigo-500/30 bg-indigo-500/10 text-indigo-300 hover:bg-indigo-500/20 transition truncate"
              >
                Chief Risk Officer (Admin)
              </button>
              <button
                type="button"
                onClick={() => fillDemo('analyst@fraudshield.local', 'Analyst@123')}
                className="py-1.5 px-3 rounded-lg text-xs font-medium border border-cyan-500/30 bg-cyan-500/10 text-cyan-300 hover:bg-cyan-500/20 transition truncate"
              >
                Senior Fraud Analyst
              </button>
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Corporate Email</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="analyst@fraudshield.local"
                  className="w-full pl-9 pr-3 py-2.5 bg-[#0E1322] border border-[#1F293D] rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500 transition"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-9 pr-3 py-2.5 bg-[#0E1322] border border-[#1F293D] rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500 transition font-mono"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-semibold text-sm shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 transition disabled:opacity-50"
            >
              {loading ? (
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              ) : (
                <>
                  <span>Sign In to Dashboard</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="pt-2 text-center border-t border-[#1F293D]">
            <p className="text-xs text-slate-400">
              Need a new account?{' '}
              <Link to="/register" className="text-indigo-400 hover:underline font-medium">
                Register analyst profile
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
