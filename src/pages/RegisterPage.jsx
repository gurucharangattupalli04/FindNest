import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Mail, Lock, Phone, UserPlus, ArrowLeft, Compass, ShieldCheck, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { Container } from '../components/layout/Container';

export function RegisterPage({ onSuccess }) {
  const { register, error: authError, clearError } = useAuth();
  const { showToast } = useApp();
  const navigate = useNavigate();

  useEffect(() => {
    document.title = 'Create Account | FindNest';
  }, []);

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [localError, setLocalError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError('');
    clearError();

    if (!fullName.trim()) {
      setLocalError('Please enter your full name.');
      return;
    }
    if (!email.trim()) {
      setLocalError('Please enter your email address.');
      return;
    }
    if (password.length < 8) {
      setLocalError('Password must be at least 8 characters long.');
      return;
    }
    if (password !== confirmPassword) {
      setLocalError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      await register({
        email: email.trim(),
        full_name: fullName.trim(),
        password,
        phone_number: phoneNumber.trim() || undefined,
      });
      showToast('Account created successfully! Welcome to FindNest.');
      if (onSuccess) {
        onSuccess();
      }
      navigate('/', { replace: true });
    } catch (err) {
      setLocalError(err.message || 'Registration failed.');
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
                Create an Account
              </h1>
              <p className="text-xs sm:text-sm text-aurora-muted mt-1.5">
                Join the FindNest community to report items and receive instant AI match alerts
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
                  Full Name <span className="text-aurora-error">*</span>
                </label>
                <Input
                  id="register-name-input"
                  icon={User}
                  placeholder="e.g. Maya Lin"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  autoComplete="name"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-aurora-text uppercase tracking-wider mb-1.5">
                  Email Address <span className="text-aurora-error">*</span>
                </label>
                <Input
                  id="register-email-input"
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
                <label className="block text-xs font-bold text-aurora-text uppercase tracking-wider mb-1.5">
                  Phone Number (Optional)
                </label>
                <Input
                  id="register-phone-input"
                  type="tel"
                  icon={Phone}
                  placeholder="+1 (555) 000-0000"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  autoComplete="tel"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-aurora-text uppercase tracking-wider mb-1.5">
                  Password <span className="text-aurora-error">*</span>
                </label>
                <div className="relative flex items-center">
                  <Input
                    id="register-password-input"
                    type={showPassword ? 'text' : 'password'}
                    icon={Lock}
                    placeholder="At least 8 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="new-password"
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

              <div>
                <label className="block text-xs font-bold text-aurora-text uppercase tracking-wider mb-1.5">
                  Confirm Password <span className="text-aurora-error">*</span>
                </label>
                <Input
                  id="register-confirm-password-input"
                  type={showPassword ? 'text' : 'password'}
                  icon={Lock}
                  placeholder="Re-enter password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  autoComplete="new-password"
                  required
                />
              </div>

              <div className="pt-2">
                <Button
                  id="register-submit-btn"
                  type="submit"
                  variant="primary"
                  size="lg"
                  icon={UserPlus}
                  disabled={loading}
                  className="w-full shadow-subtle"
                >
                  {loading ? 'Creating account...' : 'Create Account'}
                </Button>
              </div>
            </form>

            {/* Privacy note */}
            <div className="mt-4 flex items-center gap-2 justify-center text-[11px] text-aurora-muted">
              <ShieldCheck className="w-3.5 h-3.5 text-aurora-success shrink-0" />
              <span>Contact information is never shared without consent</span>
            </div>

            {/* Footer switcher */}
            <div className="mt-6 pt-6 border-t border-aurora-border text-center">
              <p className="text-xs sm:text-sm text-aurora-muted">
                Already have an account?{' '}
                <Link
                  to="/login"
                  className="font-bold text-aurora-accent hover:underline cursor-pointer"
                >
                  Sign in
                </Link>
              </p>
            </div>
          </div>
        </div>
      </Container>
    </div>
  );
}
