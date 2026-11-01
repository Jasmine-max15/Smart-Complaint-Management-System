import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  timeout: 15000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('scms_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export function unwrap(response) {
  return response?.data?.data ?? response?.data ?? response;
}

export function getError(error) {
  return error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.message ||
    'Something went wrong. Please try again.';
}

export default api;
