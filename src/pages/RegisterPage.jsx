import React, { useState } from 'react';
import { User, Mail, Lock, Phone, UserPlus, ArrowLeft, AlertCircle, Compass, ShieldCheck, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { Container } from '../components/layout/Container';

export function RegisterPage({ onNavigate, onSuccess }) {
  const { register, error: authError, clearError } = useAuth();
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
      if (onSuccess) onSuccess();
      else if (onNavigate) onNavigate('home');
    } catch (err) {
      setLocalError(err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-140px)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-slate-50 via-indigo-50/20 to-slate-50">
      <Container size="sm">
        <div className="max-w-md mx-auto">
          {/* Back link */}
          <button
            type="button"
            onClick={() => onNavigate && onNavigate('home')}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-brand-600 transition-colors mb-6 group cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
            Back to Home
          </button>

          {/* Card Container */}
          <div className="bg-white/90 backdrop-blur-md rounded-3xl shadow-xl shadow-slate-200/60 border border-slate-200/80 p-8 sm:p-10">
            {/* Header / Logo */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-brand-600 via-brand-500 to-indigo-500 text-white shadow-lg shadow-brand-500/25 mb-4">
                <Compass className="w-7 h-7" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Join FindNest
              </h1>
              <p className="text-sm text-slate-500 mt-2">
                Create an account to report, track, and recover items
              </p>
            </div>

            {/* Error Notification */}
            {(localError || authError) && (
              <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 flex items-start gap-3 animate-fade-in">
                <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                <p className="text-xs sm:text-sm font-medium text-rose-800 leading-snug">
                  {localError || authError}
                </p>
              </div>
            )}

            {/* Registration Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                id="register-name"
                label="Full Name"
                type="text"
                placeholder="e.g. Alex Chen"
                value={fullName}
                onChange={(e) => {
                  setFullName(e.target.value);
                  setLocalError('');
                }}
                icon={User}
                required
                autoComplete="name"
              />

              <Input
                id="register-email"
                label="Email Address"
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setLocalError('');
                }}
                icon={Mail}
                required
                autoComplete="email"
              />

              <Input
                id="register-phone"
                label="Phone Number (Optional)"
                type="tel"
                placeholder="+1 (555) 000-0000"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                icon={Phone}
                helperText="Used to contact you when your lost item is found"
                autoComplete="tel"
              />

              <div className="w-full flex flex-col gap-1.5">
                <label
                  htmlFor="register-password"
                  className="text-xs font-semibold text-slate-700 tracking-wide uppercase"
                >
                  Password (min 8 characters) <span className="text-rose-500">*</span>
                </label>
                <div className="relative flex items-center">
                  <div className="absolute left-3.5 pointer-events-none text-slate-400 flex items-center">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    id="register-password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="At least 8 characters"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setLocalError('');
                    }}
                    required
                    autoComplete="new-password"
                    className="w-full bg-white border border-slate-200 rounded-xl py-2.5 pl-10 pr-11 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 text-slate-400 hover:text-slate-600 focus:outline-none"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="w-full flex flex-col gap-1.5">
                <label
                  htmlFor="register-confirm-password"
                  className="text-xs font-semibold text-slate-700 tracking-wide uppercase"
                >
                  Confirm Password <span className="text-rose-500">*</span>
                </label>
                <div className="relative flex items-center">
                  <div className="absolute left-3.5 pointer-events-none text-slate-400 flex items-center">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <input
                    id="register-confirm-password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Re-type your password"
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      setLocalError('');
                    }}
                    required
                    autoComplete="new-password"
                    className="w-full bg-white border border-slate-200 rounded-xl py-2.5 pl-10 pr-4 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all"
                  />
                </div>
              </div>

              <Button
                id="register-submit-btn"
                type="submit"
                variant="primary"
                size="lg"
                icon={UserPlus}
                disabled={loading}
                className="w-full shadow-md shadow-brand-500/20 mt-3"
              >
                {loading ? 'Creating Account...' : 'Create Account'}
              </Button>
            </form>

            {/* Footer switcher */}
            <div className="mt-8 pt-6 border-t border-slate-100 text-center">
              <p className="text-xs sm:text-sm text-slate-500">
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => onNavigate && onNavigate('login')}
                  className="font-bold text-brand-600 hover:text-brand-700 hover:underline cursor-pointer"
                >
                  Sign in
                </button>
              </p>
            </div>
          </div>
        </div>
      </Container>
    </div>
  );
}
