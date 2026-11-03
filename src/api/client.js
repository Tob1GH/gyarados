
import { supabase } from '../lib/supabaseClient.js';

const BASE = (
  import.meta.env.VITE_API_URL ||
  'http://localhost:4000/api'
).replace(/\/$/, '');

// Legacy token storage for compatibility
const TOKEN_KEY = 'athenaeum.token';

export const tokenStore = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (token) => localStorage.setItem(TOKEN_KEY, token),
  clear: () => localStorage.removeItem(TOKEN_KEY),
};

let onUnauthorized = null;

export const setUnauthorizedHandler = (fn) => {
  onUnauthorized = fn;
};

const clean = (params = {}) =>
  new URLSearchParams(
    Object.entries(params).filter(
      ([, value]) => value !== '' && value != null
    )
  ).toString();

async function request(
  path,
  { method = 'GET', body, signal } = {}
) {
  const isForm = body instanceof FormData;

  // Get current Supabase session
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError) {
    throw sessionError;
  }

  const token = session?.access_token;

  if (!token) {
    throw new Error(
      'Please sign in to continue.'
    );
  }

  if (!session.user?.email_confirmed_at) {
    throw new Error(
      'Please verify your email before continuing.'
    );
  }

  const headers = {
    Authorization: `Bearer ${token}`,
  };

  if (body && !isForm) {
    headers['Content-Type'] = 'application/json';
  }

  let res;

  try {
    res = await fetch(`${BASE}${path}`, {
      method,
      signal,
      headers,
      body:
        body == null
          ? undefined
          : isForm
            ? body
            : JSON.stringify(body),
    });
  } catch (error) {
    if (signal?.aborted) throw error;

    throw new Error(
      'Cannot connect to the backend. Check VITE_API_URL and make sure the backend is running.'
    );
  }

  if (res.status === 401) {
    onUnauthorized?.();
  }

  if (!res.ok) {
    let message = `Request failed (${res.status})`;

    try {
      const data = await res.json();

      message =
        data.message ||
        data.error ||
        message;
    } catch {
      // Non-JSON response
    }

    throw new Error(message);
  }

  if (res.status === 204) {
    return null;
  }

  return res.json();
}

export const api = {
  // Authentication
  login: (credentials) =>
    supabase.auth.signInWithPassword(credentials),

  register: (details) =>
    supabase.auth.signUp({
      email: details.email,
      password: details.password,
      options: {
        data: {
          full_name: details.name,
        },
        emailRedirectTo:
          `${window.location.origin}/login`,
      },
    }),

  me: async () => {
    const { data, error } =
      await supabase.auth.getUser();

    if (error) throw error;

    if (!data.user?.email_confirmed_at) {
      throw new Error('Email not verified.');
    }

    return {
      user: data.user,
    };
  },

  logout: () => supabase.auth.signOut(),

  // Dashboard
  stats: (signal) =>
    request('/stats', { signal }),

  // Library
  categories: (signal) =>
    request('/categories', { signal }),

  books: (params, signal) =>
    request(`/books?${clean(params)}`, { signal }),

  borrowBook: (id, member) =>
    request(`/books/${id}/borrow`, {
      method: 'POST',
      body: { member },
    }),

  loans: (params, signal) =>
    request(`/loans?${clean(params)}`, { signal }),

  returnLoan: (id) =>
    request(`/loans/${id}/return`, {
      method: 'POST',
    }),

  // Digital Assets
  assets: (params, signal) =>
    request(`/assets?${clean(params)}`, { signal }),

  uploadAsset: (formData) =>
    request('/assets', {
      method: 'POST',
      body: formData,
    }),

  deleteAsset: (id) =>
    request(`/assets/${id}`, {
      method: 'DELETE',
    }),
};
