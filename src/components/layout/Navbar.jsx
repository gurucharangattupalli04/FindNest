import React, { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { 
  Compass, 
  PlusCircle, 
  ShieldAlert, 
  Sparkles, 
  Menu, 
  X, 
  LogIn, 
  LogOut, 
  User as UserIcon,
  Sun, 
  Moon
} from 'lucide-react';
import { Container } from './Container';
import { Button } from '../common/Button';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { NotificationBell } from '../notifications/NotificationBell';

export function Navbar({ onSelectNotification }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, isAuthenticated, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();

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

  // Desktop active NavLink style helper
  const navLinkClass = ({ isActive }) =>
    `relative py-1 transition-colors ${
      isActive
        ? 'text-aurora-accent font-semibold after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-aurora-accent after:rounded-full'
        : 'text-aurora-muted hover:text-aurora-accent'
    }`;

  // Mobile active NavLink style helper
  const mobileNavLinkClass = ({ isActive }) =>
    `px-3 py-2 text-sm font-medium rounded-xl transition-colors block ${
      isActive
        ? 'bg-aurora-chip text-aurora-accent font-semibold'
        : 'text-aurora-text hover:bg-aurora-chip'
    }`;

  const closeMobileMenu = () => setMobileMenuOpen(false);

  return (
    <header className="sticky top-0 z-40 w-full bg-aurora-card/95 backdrop-blur-md border-b border-aurora-border transition-colors">
      <Container>
        <div className="flex items-center justify-between h-18 py-3.5">
          {/* Brand Logo -> Links to / */}
          <Link 
            to="/"
            onClick={closeMobileMenu}
            className="flex items-center gap-3 group"
          >
            <div className="w-10 h-10 rounded-2xl bg-aurora-accent flex items-center justify-center text-white shadow-subtle group-hover:scale-105 transition-transform">
              <Compass className="w-5 h-5 animate-pulse-subtle" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="text-xl font-bold tracking-tight text-aurora-text">
                  Find<span className="text-aurora-accent">Nest</span>
                </span>
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-aurora-chip text-aurora-accent border border-aurora-border">
                  <Sparkles className="w-2.5 h-2.5" /> SMART
                </span>
              </div>
              <span className="text-[11px] font-medium text-aurora-muted tracking-wide">
                Lost & Found Network
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-6 text-sm font-medium text-aurora-muted">
            <NavLink to="/browse" className={navLinkClass}>
              Browse Listings
            </NavLink>
            <NavLink to="/how-it-works" className={navLinkClass}>
              How It Works
            </NavLink>
            <NavLink to="/community-stats" className={navLinkClass}>
              Community Stats
            </NavLink>
            <NavLink to="/faq" className={navLinkClass}>
              FAQ
            </NavLink>
            {isAuthenticated && (
              <NavLink to="/my-reports" className={navLinkClass}>
                My Reports
              </NavLink>
            )}
          </nav>

          {/* Action CTAs, Auth & Theme Toggle */}
          <div className="hidden sm:flex items-center gap-2.5">
            {/* Theme Toggle Button */}
            <button
              id="navbar-theme-toggle-btn"
              onClick={toggleTheme}
              className="p-2 rounded-xl text-aurora-muted hover:text-aurora-text hover:bg-aurora-chip transition-all cursor-pointer"
              aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
              title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {isDark ? <Sun className="w-4 h-4 text-aurora-warning" /> : <Moon className="w-4 h-4 text-aurora-muted" />}
            </button>

            {/* Found Something Button -> Links to /report-found */}
            <Link to="/report-found">
              <Button
                id="navbar-report-found-btn"
                variant="outline"
                size="sm"
                icon={PlusCircle}
                className="border-aurora-success/30 text-aurora-success hover:bg-aurora-success-bg"
              >
                Found Something
              </Button>
            </Link>

            {/* Report Lost Button -> Links to /report-lost */}
            <Link to="/report-lost">
              <Button
                id="navbar-report-lost-btn"
                variant="lost"
                size="sm"
                icon={ShieldAlert}
              >
                Report Lost
              </Button>
            </Link>

            {/* Authentication Section */}
            <div className="ml-1 pl-2.5 border-l border-aurora-border flex items-center gap-2">
              {isAuthenticated ? (
                <div className="flex items-center gap-2">
                  <NotificationBell onSelectNotification={onSelectNotification} />
                  <Link 
                    to="/my-reports"
                    title="View My Reports & Dashboard"
                    className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-aurora-chip hover:bg-aurora-border/60 border border-aurora-border text-xs font-semibold text-aurora-text transition-colors"
                  >
                    <div className="w-6 h-6 rounded-full bg-aurora-accent text-white flex items-center justify-center text-[10px] font-extrabold shadow-subtle">
                      {getInitials(user?.full_name, user?.email)}
                    </div>
                    <span className="max-w-[110px] truncate font-medium">{displayName}</span>
                  </Link>
                  <button
                    id="navbar-logout-btn"
                    onClick={() => {
                      logout();
                      navigate('/');
                    }}
                    title="Sign Out"
                    className="p-1.5 rounded-xl text-aurora-muted hover:text-aurora-error hover:bg-aurora-error-bg transition-colors cursor-pointer"
                    aria-label="Log out"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-1.5">
                  <Link to="/login">
                    <Button
                      id="navbar-login-btn"
                      variant="ghost"
                      size="sm"
                      icon={LogIn}
                    >
                      Sign In
                    </Button>
                  </Link>
                  <Link to="/register">
                    <Button
                      id="navbar-register-btn"
                      variant="primary"
                      size="sm"
                    >
                      Register
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Mobile menu and Theme Button */}
          <div className="flex sm:hidden items-center gap-1.5">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl text-aurora-muted hover:bg-aurora-chip"
              aria-label="Toggle theme"
            >
              {isDark ? <Sun className="w-4 h-4 text-aurora-warning" /> : <Moon className="w-4 h-4 text-aurora-muted" />}
            </button>

            {isAuthenticated && (
              <NotificationBell onSelectNotification={onSelectNotification} />
            )}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl text-aurora-muted hover:text-aurora-text hover:bg-aurora-chip"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile menu dropdown */}
        {mobileMenuOpen && (
          <div className="sm:hidden border-t border-aurora-border py-4 flex flex-col gap-3 animate-fade-in bg-aurora-card">
            {isAuthenticated && (
              <div className="px-3 py-2.5 mb-1 rounded-2xl bg-aurora-chip border border-aurora-border flex items-center justify-between">
                <Link
                  to="/my-reports"
                  onClick={closeMobileMenu}
                  className="flex items-center gap-2.5 truncate"
                >
                  <div className="w-8 h-8 rounded-full bg-aurora-accent text-white flex items-center justify-center text-xs font-bold shrink-0">
                    {getInitials(user?.full_name, user?.email)}
                  </div>
                  <div className="flex flex-col truncate">
                    <span className="text-xs font-bold text-aurora-text truncate">{displayName}</span>
                    <span className="text-[11px] text-aurora-muted truncate">{user?.email}</span>
                  </div>
                </Link>
                <button
                  onClick={() => {
                    logout();
                    closeMobileMenu();
                    navigate('/');
                  }}
                  className="text-xs font-semibold text-aurora-error hover:opacity-90 flex items-center gap-1 shrink-0 p-1 cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" /> Logout
                </button>
              </div>
            )}

            {isAuthenticated && (
              <Link
                id="mobile-nav-my-reports-btn"
                to="/my-reports"
                onClick={closeMobileMenu}
                className="w-full px-3 py-2 text-sm font-semibold text-aurora-accent bg-aurora-chip hover:bg-aurora-border/60 rounded-xl text-left flex items-center justify-between"
              >
                <span>My Reports & Listings</span>
                <span className="text-[10px] uppercase font-bold bg-aurora-accent text-white px-2 py-0.5 rounded-full">Dashboard</span>
              </Link>
            )}

            <NavLink to="/browse" onClick={closeMobileMenu} className={mobileNavLinkClass}>
              Browse Listings
            </NavLink>
            <NavLink to="/how-it-works" onClick={closeMobileMenu} className={mobileNavLinkClass}>
              How It Works
            </NavLink>
            <NavLink to="/community-stats" onClick={closeMobileMenu} className={mobileNavLinkClass}>
              Community Stats
            </NavLink>
            <NavLink to="/faq" onClick={closeMobileMenu} className={mobileNavLinkClass}>
              FAQ & Help
            </NavLink>

            {!isAuthenticated && (
              <div className="pt-2 flex flex-col gap-2 border-t border-aurora-border">
                <Link to="/login" onClick={closeMobileMenu}>
                  <Button
                    variant="outline"
                    size="md"
                    icon={LogIn}
                    className="w-full justify-start"
                  >
                    Sign In
                  </Button>
                </Link>
                <Link to="/register" onClick={closeMobileMenu}>
                  <Button
                    variant="primary"
                    size="md"
                    icon={UserIcon}
                    className="w-full justify-start"
                  >
                    Create Account
                  </Button>
                </Link>
              </div>
            )}

            <div className="pt-2 flex flex-col gap-2 border-t border-aurora-border">
              <Link to="/report-found" onClick={closeMobileMenu}>
                <Button
                  variant="outline"
                  size="md"
                  icon={PlusCircle}
                  className="w-full justify-start border-aurora-success/30 text-aurora-success hover:bg-aurora-success-bg"
                >
                  Found Something
                </Button>
              </Link>
              <Link to="/report-lost" onClick={closeMobileMenu}>
                <Button
                  variant="lost"
                  size="md"
                  icon={ShieldAlert}
                  className="w-full justify-start"
                >
                  Report Lost Item
                </Button>
              </Link>
            </div>
          </div>
        )}
      </Container>
    </header>
  );
}
