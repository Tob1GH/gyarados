// All backend access lives here. Change VITE_API_URL in .env to point at your server.
// Expected endpoints are documented in README.md.
const BASE = (import.meta.env.VITE_API_URL || 'http://localhost:4000/api').replace(/\/$/, '');

const TOKEN_KEY = 'athenaeum.token';
export const tokenStore = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (t) => localStorage.setItem(TOKEN_KEY, t),
  clear: () => localStorage.removeItem(TOKEN_KEY),
};

// Called when the server says our session is no longer valid (expired or revoked token)
let onUnauthorized = null;
export const setUnauthorizedHandler = (fn) => { onUnauthorized = fn; };

const clean = (params = {}) =>
  new URLSearchParams(Object.entries(params).filter(([, v]) => v !== '' && v != null)).toString();

async function request(path, { method = 'GET', body, signal } = {}) {
  const isForm = body instanceof FormData;
  const token = tokenStore.get();
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body && !isForm) headers['Content-Type'] = 'application/json';

  const res = await fetch(`${BASE}${path}`, {
    method,
    signal,
    headers,
    body: body ? (isForm ? body : JSON.stringify(body)) : undefined,
  });

  if (res.status === 401 && token) onUnauthorized?.();
  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const data = await res.json();
      message = data.message || message;
    } catch { /* non-JSON error body */ }
    throw new Error(message);
  }
  return res.status === 204 ? null : res.json();
}

export const api = {
  // Auth
  login: (credentials) => request('/auth/login', { method: 'POST', body: credentials }),
  register: (details) => request('/auth/register', { method: 'POST', body: details }),
  me: (signal) => request('/auth/me', { signal }),
  logout: () => request('/auth/logout', { method: 'POST' }),

  stats: (signal) => request('/stats', { signal }),

  // Library
  categories: (signal) => request('/categories', { signal }),
  books: (params, signal) => request(`/books?${clean(params)}`, { signal }),
  borrowBook: (id, member) => request(`/books/${id}/borrow`, { method: 'POST', body: { member } }),
  loans: (params, signal) => request(`/loans?${clean(params)}`, { signal }),
  returnLoan: (id) => request(`/loans/${id}/return`, { method: 'POST' }),

  // Digital assets
  assets: (params, signal) => request(`/assets?${clean(params)}`, { signal }),
  uploadAsset: (formData) => request('/assets', { method: 'POST', body: formData }),
  deleteAsset: (id) => request(`/assets/${id}`, { method: 'DELETE' }),
};
