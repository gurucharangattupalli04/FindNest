/**
 * Authentication API client for FindNest.
 * Connects to FastAPI backend authentication endpoints.
 */

import { getFullApiUrl } from './apiConfig';

const API_BASE = getFullApiUrl('/api/v1/auth');

function formatErrorMessage(data, defaultMsg) {
  if (!data) return defaultMsg;
  if (typeof data.detail === 'string') return data.detail;
  if (Array.isArray(data.detail)) {
    return data.detail.map((err) => err.msg || `${err.loc?.join('.')} is invalid`).join(', ');
  }
  return defaultMsg;
}

export const authService = {
  /**
   * Register a new user
   * @param {Object} userData - { email, full_name, password, phone_number }
   */
  async register(userData) {
    const response = await fetch(`${API_BASE}/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      throw new Error(formatErrorMessage(data, 'Registration failed. Please check your information.'));
    }

    return data;
  },

  /**
   * Log in user and receive JWT access token
   * @param {Object} credentials - { email, password }
   */
  async login(credentials) {
    const response = await fetch(`${API_BASE}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      throw new Error(formatErrorMessage(data, 'Invalid email or password.'));
    }

    return data;
  },

  /**
   * Retrieve current authenticated user profile
   * @param {string} token - JWT bearer token
   */
  async getMe(token) {
    const response = await fetch(`${API_BASE}/me`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      throw new Error(formatErrorMessage(data, 'Session expired. Please log in again.'));
    }

    return data;
  },
};
