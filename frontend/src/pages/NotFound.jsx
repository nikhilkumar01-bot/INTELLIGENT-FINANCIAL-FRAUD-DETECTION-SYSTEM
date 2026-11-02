import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert, ArrowLeft } from 'lucide-react';

export const NotFound = () => {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center p-6 space-y-4">
      <div className="p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
        <ShieldAlert className="w-12 h-12" />
      </div>
      <h1 className="text-4xl font-extrabold text-white font-mono">404</h1>
      <h2 className="text-xl font-bold text-slate-200">Security Vector Not Found</h2>
      <p className="text-xs text-slate-400 max-w-sm">
        The requested routing endpoint does not exist or requires elevated clearance.
      </p>
      <Link
        to="/"
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition shadow-lg shadow-indigo-600/30"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Return to Dashboard</span>
      </Link>
    </div>
  );
};
