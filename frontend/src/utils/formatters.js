export const formatCurrency = (amount, currency = 'USD') => {
  if (amount === undefined || amount === null || isNaN(amount)) return '$0.00';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
};

export const formatDateTime = (dateString) => {
  if (!dateString) return 'N/A';
  const d = new Date(dateString);
  return d.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

export const formatDateOnly = (dateString) => {
  if (!dateString) return 'N/A';
  const d = new Date(dateString);
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

export const formatPercent = (val) => {
  if (val === undefined || val === null || isNaN(val)) return '0.0%';
  return `${Number(val).toFixed(1)}%`;
};

export const getRiskColor = (score) => {
  if (score >= 80) return { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/30', label: 'CRITICAL' };
  if (score >= 60) return { bg: 'bg-orange-500/10', text: 'text-orange-400', border: 'border-orange-500/30', label: 'HIGH' };
  if (score >= 30) return { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/30', label: 'MEDIUM' };
  return { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/30', label: 'LOW' };
};

export const getStatusBadgeStyle = (status) => {
  switch (status) {
    case 'Confirmed Fraud':
      return 'bg-red-500/15 text-red-400 border-red-500/30';
    case 'Flagged':
      return 'bg-orange-500/15 text-orange-400 border-orange-500/30';
    case 'Pending Review':
      return 'bg-amber-500/15 text-amber-400 border-amber-500/30';
    case 'Genuine':
    default:
      return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
  }
};
