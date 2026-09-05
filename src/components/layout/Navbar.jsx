import React, { useState } from 'react';
import { Compass, PlusCircle, ShieldAlert, Sparkles, Menu, X, LogIn, LogOut, User as UserIcon } from 'lucide-react';
import { Container } from './Container';
import { Button } from '../common/Button';
import { useAuth } from '../../context/AuthContext';
import { NotificationBell } from '../notifications/NotificationBell';

export function Navbar({ onOpenReportLost, onOpenReportFound, onNavigate, onSelectNotification }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, isAuthenticated, logout } = useAuth();

  const getInitials = (name, email) => {
    if (name && name.trim()) {
      const parts = name.trim().split(' ');
      if (parts.length >= 2) {
        return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
      }
      return name.slice(0, 2).toUpperCase();
    }
    if (email) {
      return email.slice(0, 2).toUpperCase();
    }
    return 'FN';
  };

  const displayName = user?.full_name || user?.email?.split('@')[0] || 'Member';

  return (
    <header className="sticky top-0 z-40 w-full glass-nav transition-all">
      <Container>
        <div className="flex items-center justify-between h-18 py-3.5">
          {/* Brand Logo */}
          <div 
            onClick={() => onNavigate && onNavigate('home')}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-brand-600 via-brand-500 to-indigo-400 flex items-center justify-center text-white shadow-md shadow-brand-500/25 group-hover:scale-105 transition-transform">
              <Compass className="w-5 h-5 animate-pulse-subtle" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="text-xl font-extrabold tracking-tight text-slate-900">
                  Find<span className="text-brand-600">Nest</span>
                </span>
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-brand-50 text-brand-700 border border-brand-200">
                  <Sparkles className="w-2.5 h-2.5" /> SMART
                </span>
              </div>
              <span className="text-[11px] font-medium text-slate-500 tracking-wide">
                Lost & Found Network
              </span>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-7 text-sm font-medium text-slate-600">
            <a href="#browse-section" onClick={() => onNavigate && onNavigate('home')} className="hover:text-brand-600 transition-colors">
              Browse Listings
            </a>
            {isAuthenticated && (
              <button
                id="nav-my-reports-btn"
                onClick={() => onNavigate && onNavigate('my-reports')}
                className="hover:text-brand-600 font-semibold text-brand-700 transition-colors cursor-pointer"
              >
                My Reports
              </button>
            )}
            <a href="#how-it-works" onClick={() => onNavigate && onNavigate('home')} className="hover:text-brand-600 transition-colors">
              How It Works
            </a>
            <a href="#community-impact" onClick={() => onNavigate && onNavigate('home')} className="hover:text-brand-600 transition-colors">
              Community Stats
            </a>
          </nav>

          {/* Action CTAs & Auth */}
          <div className="hidden sm:flex items-center gap-2.5">
            <Button
              id="navbar-report-found-btn"
              variant="outline"
              size="sm"
              icon={PlusCircle}
              onClick={onOpenReportFound}
              className="border-emerald-200 text-emerald-700 hover:bg-emerald-50 hover:border-emerald-300"
            >
              Found Something
            </Button>
            <Button
              id="navbar-report-lost-btn"
              variant="lost"
              size="sm"
              icon={ShieldAlert}
              onClick={onOpenReportLost}
            >
              Report Lost
            </Button>

            {/* Authentication Section */}
            <div className="ml-2 pl-2.5 border-l border-slate-200 flex items-center gap-2">
              {isAuthenticated ? (
                <div className="flex items-center gap-2">
                  <NotificationBell onSelectNotification={onSelectNotification} />
                  <div 
                    title="View My Reports"
                    onClick={() => onNavigate && onNavigate('my-reports')}
                    className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-slate-100/90 hover:bg-slate-200/80 border border-slate-200/80 text-xs font-semibold text-slate-700 cursor-pointer transition-colors"
                  >
                    <div className="w-6 h-6 rounded-full bg-brand-600 text-white flex items-center justify-center text-[10px] font-extrabold shadow-sm">
                      {getInitials(user?.full_name, user?.email)}
                    </div>
                    <span className="max-w-[110px] truncate font-medium">{displayName}</span>
                  </div>
                  <button
                    id="navbar-logout-btn"
                    onClick={logout}
                    title="Sign Out"
                    className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                    aria-label="Log out"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-1.5">
                  <Button
                    id="navbar-login-btn"
                    variant="ghost"
                    size="sm"
                    icon={LogIn}
                    onClick={() => onNavigate && onNavigate('login')}
                    className="text-slate-700 font-semibold hover:text-brand-600"
                  >
                    Sign In
                  </Button>
                  <Button
                    id="navbar-register-btn"
                    variant="primary"
                    size="sm"
                    onClick={() => onNavigate && onNavigate('register')}
                    className="shadow-sm shadow-brand-500/20"
                  >
                    Register
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="flex sm:hidden items-center gap-2">
            {isAuthenticated && (
              <NotificationBell onSelectNotification={onSelectNotification} />
            )}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile menu dropdown */}
        {mobileMenuOpen && (
          <div className="sm:hidden border-t border-slate-200/80 py-4 flex flex-col gap-3 animate-fade-in">
            {isAuthenticated && (
              <div className="px-3 py-2.5 mb-1 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2.5 truncate">
                  <div className="w-8 h-8 rounded-full bg-brand-600 text-white flex items-center justify-center text-xs font-bold shrink-0">
                    {getInitials(user?.full_name, user?.email)}
                  </div>
                  <div className="flex flex-col truncate">
                    <span className="text-xs font-bold text-slate-900 truncate">{displayName}</span>
                    <span className="text-[11px] text-slate-500 truncate">{user?.email}</span>
                  </div>
                </div>
                <button
                  onClick={() => {
                    logout();
                    setMobileMenuOpen(false);
                  }}
                  className="text-xs font-semibold text-rose-600 hover:text-rose-700 flex items-center gap-1 shrink-0 p-1"
                >
                  <LogOut className="w-3.5 h-3.5" /> Logout
                </button>
              </div>
            )}

            {isAuthenticated && (
              <button
                id="mobile-nav-my-reports-btn"
                onClick={() => {
                  if (onNavigate) onNavigate('my-reports');
                  setMobileMenuOpen(false);
                }}
                className="w-full px-3 py-2 text-sm font-semibold text-brand-700 bg-brand-50 hover:bg-brand-100 rounded-lg text-left flex items-center justify-between"
              >
                <span>My Reports & Listings</span>
                <span className="text-[10px] uppercase font-bold bg-brand-200/70 text-brand-800 px-2 py-0.5 rounded-full">Dashboard</span>
              </button>
            )}

            <a
              href="#browse-section"
              onClick={() => {
                if (onNavigate) onNavigate('home');
                setMobileMenuOpen(false);
              }}
              className="px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg"
            >
              Browse Listings
            </a>
            <a
              href="#how-it-works"
              onClick={() => {
                if (onNavigate) onNavigate('home');
                setMobileMenuOpen(false);
              }}
              className="px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg"
            >
              How It Works
            </a>
            <a
              href="#community-impact"
              onClick={() => {
                if (onNavigate) onNavigate('home');
                setMobileMenuOpen(false);
              }}
              className="px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg"
            >
              Community Stats
            </a>

            {!isAuthenticated && (
              <div className="pt-2 flex flex-col gap-2 border-t border-slate-100">
                <Button
                  variant="outline"
                  size="md"
                  icon={LogIn}
                  onClick={() => {
                    setMobileMenuOpen(false);
                    if (onNavigate) onNavigate('login');
                  }}
                  className="justify-start text-slate-700"
                >
                  Sign In
                </Button>
                <Button
                  variant="primary"
                  size="md"
                  icon={UserIcon}
                  onClick={() => {
                    setMobileMenuOpen(false);
                    if (onNavigate) onNavigate('register');
                  }}
                  className="justify-start"
                >
                  Create Account
                </Button>
              </div>
            )}

            <div className="pt-2 flex flex-col gap-2 border-t border-slate-100">
              <Button
                variant="outline"
                size="md"
                icon={PlusCircle}
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenReportFound();
                }}
                className="justify-start border-emerald-200 text-emerald-700"
              >
                Found Something
              </Button>
              <Button
                variant="lost"
                size="md"
                icon={ShieldAlert}
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenReportLost();
                }}
                className="justify-start"
              >
                Report Lost Item
              </Button>
            </div>
          </div>
        )}
      </Container>
    </header>
  );
}
