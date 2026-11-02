import React from 'react';
import { getRiskColor } from '../../utils/formatters';

export const RiskBadge = ({ score, category }) => {
  const cat = category || (score >= 80 ? 'CRITICAL' : score >= 60 ? 'HIGH' : score >= 30 ? 'MEDIUM' : 'LOW');
  const style = getRiskColor(score || (cat === 'CRITICAL' ? 85 : cat === 'HIGH' ? 65 : cat === 'MEDIUM' ? 45 : 15));

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${style.bg} ${style.text} ${style.border}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse"></span>
      {cat} {score !== undefined && `(${score})`}
    </span>
  );
};
