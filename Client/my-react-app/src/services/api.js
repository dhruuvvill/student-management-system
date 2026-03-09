import axios from 'axios';
import { API_BASE_URL } from '../utils/config.js';

/** Check if the backend is reachable (GET /). Returns { message } or throws. */
export async function checkApiHealth() {
  const { data } = await axios.get(API_BASE_URL, { timeout: 5000 });
  return data;
}

const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to every request if present
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Optionally handle 401 (e.g. clear token and redirect to login)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // Redirect to login when not already there (avoids loops)
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
