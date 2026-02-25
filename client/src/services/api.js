const BASE = '/api';

async function fetchJson(url, options = {}) {
  const res = await fetch(`${BASE}${url}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const error = new Error(`API error: ${res.status}`);
    error.status = res.status;
    throw error;
  }
  return res.json();
}

export const api = {
  getStats() {
    return fetchJson('/stats');
  },
  getTransactions(params = {}) {
    const query = new URLSearchParams();
    if (params.risk_level) query.set('risk_level', params.risk_level);
    if (params.status) query.set('status', params.status);
    if (params.from) query.set('from', params.from);
    if (params.to) query.set('to', params.to);
    if (params.limit != null) query.set('limit', params.limit);
    if (params.offset != null) query.set('offset', params.offset);
    const qs = query.toString();
    return fetchJson(`/transactions${qs ? `?${qs}` : ''}`);
  },
  getTransaction(id) {
    return fetchJson(`/transactions/${encodeURIComponent(id)}`);
  },
  updateTransactionStatus(id, status) {
    return fetchJson(`/transactions/${encodeURIComponent(id)}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  },
};
