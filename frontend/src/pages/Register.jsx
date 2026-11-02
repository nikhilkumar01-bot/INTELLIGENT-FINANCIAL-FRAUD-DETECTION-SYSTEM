import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ShieldAlert, Lock, Mail, User, ArrowRight, AlertCircle, Shield } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('analyst');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await register({ name, email, password, role });
      navigate('/');
    } catch (err) {
      setError(err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0F19] flex items-center justify-center p-4 relative overflow-hidden">
      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 to-indigo-400 text-white shadow-xl shadow-indigo-600/30 mb-3">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">
            Fraud<span className="text-indigo-400">Shield</span> AI
          </h1>
          <p className="text-xs text-slate-400 mt-1">Register Security & Risk Personnel</p>
        </div>

        <div className="bg-[#111827] border border-[#1F293D] rounded-2xl p-8 shadow-2xl space-y-5">
          <h2 className="text-lg font-bold text-white">Create Authorized Account</h2>

          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Full Name</label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Officer Alex Morgan"
                  className="w-full pl-9 pr-3 py-2.5 bg-[#0E1322] border border-[#1F293D] rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500 transition"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="alex.morgan@fraudshield.local"
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
                  minLength={6}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">System Role</label>
              <div className="relative">
                <Shield className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 bg-[#0E1322] border border-[#1F293D] rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500 transition"
                >
                  <option value="analyst">Fraud Analyst (Investigations & Reports)</option>
                  <option value="admin">Administrator (Full System & Threshold Control)</option>
                </select>
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
                  <span>Create Account</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="pt-2 text-center border-t border-[#1F293D]">
            <p className="text-xs text-slate-400">
              Already have credentials?{' '}
              <Link to="/login" className="text-indigo-400 hover:underline font-medium">
                Sign in here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
