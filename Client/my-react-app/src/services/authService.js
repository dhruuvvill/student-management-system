import api from './api.js';

/**
 * Login with email and password.
 * Returns { user, token }. Stores token and user in localStorage on success.
 */
export async function login(email, password) {
  const { data } = await api.post('/auth/login', { email, password });
  if (data.token) {
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
  }
  return data;
}

/**
 * Register a new user (name, email, password, role optional).
 * Returns { user, token }. Stores token and user in localStorage on success.
 */
export async function register({ name, email, password, role }) {
  const { data } = await api.post('/auth/register', {
    name,
    email,
    password,
    role: role || 'student',
  });
  if (data.token) {
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
  }
  return data;
}

/**
 * Get stored user from localStorage (no API call).
 */
export function getStoredUser() {
  try {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  } catch {
    return null;
  }
}

/**
 * Check if user is logged in (has token).
 */
export function isAuthenticated() {
  return !!localStorage.getItem('token');
}

/**
 * Logout: remove token and user from localStorage.
 */
export function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
}
