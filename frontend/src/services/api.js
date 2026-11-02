const API_BASE = '/api';

const getHeaders = () => {
  const token = localStorage.getItem('fraudshield_token');
  const headers = { 'Content-Type': 'application/json' };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

const handleResponse = async (res) => {
  if (res.status === 401) {
    localStorage.removeItem('fraudshield_token');
    localStorage.removeItem('fraudshield_user');
    if (!window.location.pathname.includes('/login')) {
      window.location.href = '/login';
    }
  }

  const contentType = res.headers.get('content-type');
  if (contentType && contentType.includes('text/csv')) {
    return await res.blob();
  }

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'API request failed.');
  }
  return data;
};

export const api = {
  // Auth
  login: async (credentials) => {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials)
    });
    return handleResponse(res);
  },

  register: async (payload) => {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return handleResponse(res);
  },

  getMe: async () => {
    const res = await fetch(`${API_BASE}/auth/me`, { headers: getHeaders() });
    return handleResponse(res);
  },

  // Dashboard
  getDashboardSummary: async () => {
    const res = await fetch(`${API_BASE}/dashboard/summary`, { headers: getHeaders() });
    return handleResponse(res);
  },

  // Transactions
  getTransactions: async (params = {}) => {
    const q = new URLSearchParams(params).toString();
    const res = await fetch(`${API_BASE}/transactions?${q}`, { headers: getHeaders() });
    return handleResponse(res);
  },

  getTransactionById: async (id) => {
    const res = await fetch(`${API_BASE}/transactions/${id}`, { headers: getHeaders() });
    return handleResponse(res);
  },

  analyzeTransaction: async (txData) => {
    const res = await fetch(`${API_BASE}/transactions/analyze`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(txData)
    });
    return handleResponse(res);
  },

  importTransactions: async (transactions) => {
    const res = await fetch(`${API_BASE}/transactions/import`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ transactions })
    });
    return handleResponse(res);
  },

  exportTransactionsCsv: async () => {
    const res = await fetch(`${API_BASE}/transactions/export`, { headers: getHeaders() });
    return handleResponse(res);
  },

  // Customers
  getCustomers: async (params = {}) => {
    const q = new URLSearchParams(params).toString();
    const res = await fetch(`${API_BASE}/customers?${q}`, { headers: getHeaders() });
    return handleResponse(res);
  },

  getCustomerById: async (id) => {
    const res = await fetch(`${API_BASE}/customers/${id}`, { headers: getHeaders() });
    return handleResponse(res);
  },

  // Alerts
  getAlerts: async (params = {}) => {
    const q = new URLSearchParams(params).toString();
    const res = await fetch(`${API_BASE}/alerts?${q}`, { headers: getHeaders() });
    return handleResponse(res);
  },

  getAlertById: async (id) => {
    const res = await fetch(`${API_BASE}/alerts/${id}`, { headers: getHeaders() });
    return handleResponse(res);
  },

  updateAlert: async (id, data) => {
    const res = await fetch(`${API_BASE}/alerts/${id}`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },

  addAlertNote: async (id, note) => {
    const res = await fetch(`${API_BASE}/alerts/${id}/notes`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ note })
    });
    return handleResponse(res);
  },

  // Reports
  getReportSummary: async (params = {}) => {
    const q = new URLSearchParams(params).toString();
    const res = await fetch(`${API_BASE}/reports/summary?${q}`, { headers: getHeaders() });
    return handleResponse(res);
  },

  // Model
  getModelStatus: async () => {
    const res = await fetch(`${API_BASE}/model/status`, { headers: getHeaders() });
    return handleResponse(res);
  },

  getModelMetrics: async () => {
    const res = await fetch(`${API_BASE}/model/metrics`, { headers: getHeaders() });
    return handleResponse(res);
  },

  // Admin User Management
  getUsers: async () => {
    const res = await fetch(`${API_BASE}/users`, { headers: getHeaders() });
    return handleResponse(res);
  },

  updateUser: async (id, updates) => {
    const res = await fetch(`${API_BASE}/users/${id}`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify(updates)
    });
    return handleResponse(res);
  },

  getAuditLogs: async () => {
    const res = await fetch(`${API_BASE}/audit-logs`, { headers: getHeaders() });
    return handleResponse(res);
  },

  // Settings
  getSettings: async () => {
    const res = await fetch(`${API_BASE}/settings`, { headers: getHeaders() });
    return handleResponse(res);
  },

  updateSettings: async (settings) => {
    const res = await fetch(`${API_BASE}/settings`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify(settings)
    });
    return handleResponse(res);
  }
};
