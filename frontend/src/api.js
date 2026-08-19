// API client with JWT interceptor and graceful fallback
const API_BASE = (typeof window !== 'undefined' && window.location.hostname === 'localhost')
  ? 'http://localhost:3000/api'
  : '/api';

function getToken() {
  return localStorage.getItem('auth_token');
}

function setToken(token) {
  if (token) localStorage.setItem('auth_token', token);
  else localStorage.removeItem('auth_token');
}

async function request(path, options = {}) {
  const token = getToken();
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  try {
    const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: 'Network error' }));
      return { data: null, error: err.message, status: res.status, fallback: true };
    }
    const json = await res.json();
    return { data: json.data, error: null, fallback: false };
  } catch (e) {
    return { data: null, error: e.message, fallback: true };
  }
}

export const api = {
  // Auth
  register: (body) => request('/register', { method: 'POST', body: JSON.stringify(body) }),
  login: (body) => request('/login', { method: 'POST', body: JSON.stringify(body) }),
  getUser: () => request('/user'),

  // Content (public)
  getPapers: () => request('/papers'),
  getPaper: (id) => request(`/papers/${id}`),
  getPassage: (id) => request(`/passages/${id}`),
  getQuestion: (id) => request(`/questions/${id}`),

  // Practice (auth required)
  getRecords: () => request('/practice/records'),
  submitRecord: (body) => request('/practice/records', { method: 'POST', body: JSON.stringify(body) }),
  getStats: () => request('/practice/stats'),
  getWrongRecords: (type) => request(`/practice/wrong-records${type && type !== 'all' ? `?type=${type}` : ''}`),

  // Teacher annotation (auth required)
  updateOption: (qId, optId, body) => request(`/questions/${qId}/options/${optId}`, {
    method: 'PATCH', body: JSON.stringify(body),
  }),
  updatePassage: (id, body) => request(`/passages/${id}`, {
    method: 'PATCH', body: JSON.stringify(body),
  }),

  // AI
  explainQuestion: (body) => request('/ai/explain', { method: 'POST', body: JSON.stringify(body) }),
};

export { getToken, setToken };
export default api;
