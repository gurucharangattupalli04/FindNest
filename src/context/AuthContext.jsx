/**
 * Authentication Context and State Management for FindNest.
 * Handles JWT token storage, automatic profile hydration, login, registration, and logout.
 */
import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/authService';

const TOKEN_KEY = 'findnest_auth_token';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY));
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Validate stored token and hydrate user on initial load
  useEffect(() => {
    async function loadUser() {
      const storedToken = localStorage.getItem(TOKEN_KEY);
      if (!storedToken) {
        setIsLoading(false);
        return;
      }

      try {
        const userData = await authService.getMe(storedToken);
        setUser(userData);
        setToken(storedToken);
      } catch (err) {
        console.warn('Stored session invalid or expired:', err.message);
        localStorage.removeItem(TOKEN_KEY);
        setToken(null);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    }

    loadUser();
  }, []);

  const login = async ({ email, password }) => {
    setError(null);
    try {
      const result = await authService.login({ email, password });
      const { access_token, user: loggedUser } = result;

      localStorage.setItem(TOKEN_KEY, access_token);
      setToken(access_token);
      setUser(loggedUser);
      return loggedUser;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const register = async ({ email, full_name, password, phone_number }) => {
    setError(null);
    try {
      await authService.register({ email, full_name, password, phone_number });
      // Automatically log the user in after registration
      return await login({ email, password });
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setUser(null);
    setError(null);
  };

  const clearError = () => setError(null);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: Boolean(user && token),
        isLoading,
        error,
        login,
        register,
        logout,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
