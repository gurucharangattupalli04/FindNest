/**
 * Central Axios HTTP Client for FindNest.
 * Configured with automatic JWT token attachment interceptor
 * and unified error normalization.
 */
import axios from 'axios';
import { API_BASE_URL } from './apiConfig';

const TOKEN_KEY = 'findnest_auth_token';

// Create configured Axios instance
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

// Request interceptor: automatically attach JWT Bearer token if present
apiClient.interceptors.request.use(
  (config) => {
    try {
      const token = localStorage.getItem(TOKEN_KEY);
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (e) {
      console.warn('Unable to read auth token for request', e);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: extract clean error message
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    let message = 'An unexpected error occurred. Please try again.';

    if (error.response?.data) {
      const data = error.response.data;
      if (typeof data.detail === 'string') {
        message = data.detail;
      } else if (Array.isArray(data.detail)) {
        message = data.detail.map((d) => d.msg || `${d.loc?.join('.')} is invalid`).join(', ');
      } else if (data.message) {
        message = data.message;
      }
    } else if (error.message) {
      message = error.message;
    }

    const enhancedError = new Error(message);
    enhancedError.status = error.response?.status;
    enhancedError.originalError = error;
    return Promise.reject(enhancedError);
  }
);

export default apiClient;
