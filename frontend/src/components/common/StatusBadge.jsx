import React from 'react';
import { getStatusBadgeStyle } from '../../utils/formatters';

export const StatusBadge = ({ status }) => {
  const style = getStatusBadgeStyle(status);

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${style}`}>
      {status || 'Genuine'}
    </span>
  );
};
