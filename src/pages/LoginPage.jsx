import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Mail, Lock, LogIn, ArrowLeft, Compass, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { Container } from '../components/layout/Container';
import { useApp } from '../context/AppContext';

export function LoginPage({ onSuccess }) {
  const { login, error: authError, clearError } = useAuth();
  const { showToast } = useApp();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    document.title = 'Sign In | FindNest';
  }, []);

  // Destination to return to after successful sign in
  const from = location.state?.from || '/';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [localError, setLocalError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError('');
    clearError();

    if (!email.trim() || !password) {
      setLocalError('Please enter both email and password.');
      return;
    }

    setLoading(true);
    try {
      await login({ email: email.trim(), password });
      showToast('Welcome back! You are now signed in.');
      if (onSuccess) {
        onSuccess();
      }
      navigate(from, { replace: true });
    } catch (err) {
      setLocalError(err.message || 'Login failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-140px)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-aurora-bg transition-colors duration-200 animate-fade-in">
      <Container size="sm">
        <div className="max-w-md mx-auto">
          {/* Back link */}
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-aurora-muted hover:text-aurora-accent transition-colors mb-6 group cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
            Back to Home
          </Link>

          {/* Card Container */}
          <div className="bg-aurora-card rounded-2xl shadow-card border border-aurora-border p-8 sm:p-10 transition-colors">
            {/* Header / Logo */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-aurora-accent text-white shadow-subtle mb-4">
                <Compass className="w-7 h-7" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold font-display text-aurora-text tracking-tight">
                Welcome Back
              </h1>
              <p className="text-xs sm:text-sm text-aurora-muted mt-1.5">
                Sign in to manage your reports, claims, and verified matches
              </p>
            </div>

            {/* Error banner */}
            {(localError || authError) && (
              <div className="mb-6 p-3.5 bg-aurora-error-bg border border-aurora-error/20 rounded-xl text-xs text-aurora-error font-medium flex items-center gap-2 animate-fade-in">
                <span>{localError || authError}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-aurora-text uppercase tracking-wider mb-1.5">
                  Email Address
                </label>
                <Input
                  id="login-email-input"
                  type="email"
                  icon={Mail}
                  placeholder="name@university.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  required
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-aurora-text uppercase tracking-wider">
                    Password
                  </label>
                </div>
                <div className="relative flex items-center">
                  <Input
                    id="login-password-input"
                    type={showPassword ? 'text' : 'password'}
                    icon={Lock}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                    required
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 text-aurora-muted hover:text-aurora-text focus:outline-none transition-colors"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <Button
                id="login-submit-btn"
                type="submit"
                variant="primary"
                size="lg"
                icon={LogIn}
                disabled={loading}
                className="w-full shadow-subtle mt-2"
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </Button>
            </form>

            {/* Footer switcher */}
            <div className="mt-8 pt-6 border-t border-aurora-border text-center">
              <p className="text-xs sm:text-sm text-aurora-muted">
                Don't have an account yet?{' '}
                <Link
                  to="/register"
                  className="font-bold text-aurora-accent hover:underline cursor-pointer"
                >
                  Create one for free
                </Link>
              </p>
            </div>
          </div>
        </div>
      </Container>
    </div>
  );
}
