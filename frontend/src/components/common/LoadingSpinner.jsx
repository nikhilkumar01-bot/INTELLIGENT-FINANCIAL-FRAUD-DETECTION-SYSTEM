import React from 'react';

export const LoadingSpinner = ({ label = 'Loading intelligence telemetry...' }) => {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="relative w-12 h-12">
        <div className="w-12 h-12 rounded-full border-4 border-indigo-500/20 border-t-indigo-500 animate-spin"></div>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-2.5 h-2.5 rounded-full bg-indigo-400 animate-pulse"></div>
        </div>
      </div>
      <p className="mt-4 text-sm font-medium text-slate-400 animate-pulse">{label}</p>
    </div>
  );
};
