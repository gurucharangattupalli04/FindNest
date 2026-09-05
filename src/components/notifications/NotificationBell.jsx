import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Bell,
  Sparkles,
  CheckCheck,
  Inbox,
  AlertCircle,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import {
  fetchNotifications,
  fetchUnreadCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from '../../services/notificationsApi';

function formatRelativeTime(dateString) {
  if (!dateString) return '';
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffSec = Math.floor((now - date) / 1000);

    if (diffSec < 60) return 'Just now';
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr}h ago`;
    const diffDays = Math.floor(diffHr / 24);
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  } catch {
    return '';
  }
}

export function NotificationBell({ onSelectNotification }) {
  const { token, isAuthenticated } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [activeFilter, setActiveFilter] = useState('all'); // 'all' | 'unread'
  const [loading, setLoading] = useState(false);
  const [markingAll, setMarkingAll] = useState(false);
  const [error, setError] = useState(null);

  const containerRef = useRef(null);

  // 1. Fetch unread count lightweight
  const loadUnreadCount = useCallback(async () => {
    if (!isAuthenticated || !token) {
      setUnreadCount(0);
      return;
    }
    try {
      const res = await fetchUnreadCount(token);
      setUnreadCount(res.unread_count || 0);
    } catch {
      // Ignore background poll errors silently
    }
  }, [isAuthenticated, token]);

  // 2. Fetch notifications list
  const loadNotifications = useCallback(async (filterMode = activeFilter) => {
    if (!isAuthenticated || !token) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetchNotifications({
        unread_only: filterMode === 'unread',
        page: 1,
        limit: 25,
        token,
      });
      setNotifications(res.items || []);
      setUnreadCount(res.unread_count || 0);
    } catch (err) {
      setError(err.message || 'Failed to load notifications.');
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, token, activeFilter]);

  // Poll unread count every 30s only when document is visible
  useEffect(() => {
    loadUnreadCount();
    let interval = null;

    const startPolling = () => {
      if (!interval) {
        interval = setInterval(loadUnreadCount, 30000);
      }
    };

    const stopPolling = () => {
      if (interval) {
        clearInterval(interval);
        interval = null;
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        loadUnreadCount();
        startPolling();
      } else {
        stopPolling();
      }
    };

    if (document.visibilityState === 'visible') {
      startPolling();
    }

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      stopPolling();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [loadUnreadCount]);

  // Load notifications whenever dropdown opens
  useEffect(() => {
    if (isOpen) {
      loadNotifications(activeFilter);
    }
  }, [isOpen, activeFilter, loadNotifications]);

  // Close dropdown on outside click or Escape
  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    }
    function handleKeyDown(e) {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const handleToggle = () => {
    setIsOpen((prev) => !prev);
  };

  const handleMarkAllRead = async () => {
    if (!token || unreadCount === 0 || markingAll) return;
    setMarkingAll(true);
    try {
      await markAllNotificationsAsRead(token);
      setUnreadCount(0);
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } catch (err) {
      setError(err.message || 'Failed to mark notifications as read.');
    } finally {
      setMarkingAll(false);
    }
  };

  const handleNotificationClick = async (notif) => {
    // Mark as read in UI & API if not already read
    if (!notif.is_read && token) {
      try {
        await markNotificationAsRead(notif.id, token);
        setNotifications((prev) =>
          prev.map((n) => (n.id === notif.id ? { ...n, is_read: true } : n))
        );
        setUnreadCount((c) => Math.max(0, c - 1));
      } catch {
        // Fallback: continue navigation anyway
      }
    }

    setIsOpen(false);

    if (onSelectNotification) {
      onSelectNotification(notif);
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="relative inline-block" ref={containerRef}>
      {/* Bell Trigger Button */}
      <button
        id="notification-bell-btn"
        type="button"
        onClick={handleToggle}
        aria-label="View notifications"
        aria-expanded={isOpen}
        className={`relative p-2 rounded-xl border transition-all duration-150 cursor-pointer ${
          isOpen
            ? 'bg-brand-50 border-brand-300 text-brand-600 shadow-sm'
            : 'bg-white hover:bg-slate-100 border-slate-200/90 text-slate-600 hover:text-slate-900'
        }`}
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span
            id="notification-unread-badge"
            className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-gradient-to-r from-brand-600 to-indigo-600 text-white text-[10px] font-extrabold rounded-full flex items-center justify-center shadow-md animate-pulse-subtle border-2 border-white"
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Popover */}
      {isOpen && (
        <div
          id="notification-dropdown-panel"
          role="region"
          aria-label="Notifications list"
          className="absolute right-0 mt-2 w-80 sm:w-96 max-w-[calc(100vw-32px)] bg-white rounded-2xl shadow-2xl border border-slate-200/90 z-50 overflow-hidden animate-fade-in text-slate-800"
        >
          {/* Header */}
          <div className="p-3.5 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-slate-900">Notifications</span>
              {unreadCount > 0 && (
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-brand-100 text-brand-700">
                  {unreadCount} unread
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                id="notification-mark-all-read-btn"
                type="button"
                disabled={markingAll}
                onClick={handleMarkAllRead}
                className="text-[11px] font-semibold text-brand-600 hover:text-brand-800 flex items-center gap-1 hover:underline cursor-pointer disabled:opacity-50"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                {markingAll ? 'Marking...' : 'Mark all read'}
              </button>
            )}
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center gap-1 px-3 py-2 border-b border-slate-100 bg-white">
            <button
              id="notification-filter-all-btn"
              type="button"
              onClick={() => setActiveFilter('all')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                activeFilter === 'all'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              All
            </button>
            <button
              id="notification-filter-unread-btn"
              type="button"
              onClick={() => setActiveFilter('unread')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer ${
                activeFilter === 'unread'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <span>Unread</span>
              {unreadCount > 0 && (
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                    activeFilter === 'unread'
                      ? 'bg-white/25 text-white'
                      : 'bg-brand-100 text-brand-700 font-bold'
                  }`}
                >
                  {unreadCount}
                </span>
              )}
            </button>
          </div>

          {/* List Area */}
          <div className="max-h-[380px] overflow-y-auto divide-y divide-slate-100">
            {loading ? (
              <div className="p-6 text-center space-y-3">
                <div className="animate-spin w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full mx-auto" />
                <p className="text-xs text-slate-500">Checking for notifications...</p>
              </div>
            ) : error ? (
              <div className="p-6 text-center space-y-2">
                <AlertCircle className="w-7 h-7 text-rose-500 mx-auto" />
                <p className="text-xs text-slate-600 font-medium">{error}</p>
                <button
                  type="button"
                  onClick={() => loadNotifications(activeFilter)}
                  className="inline-flex items-center gap-1 px-3 py-1 bg-slate-100 hover:bg-slate-200 rounded-lg text-xs font-medium text-slate-700 transition-colors"
                >
                  <RefreshCw className="w-3 h-3" /> Retry
                </button>
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center space-y-2">
                <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                  <Inbox className="w-5 h-5" />
                </div>
                <p className="text-xs font-semibold text-slate-700">
                  {activeFilter === 'unread' ? 'No unread notifications' : 'No notifications yet'}
                </p>
                <p className="text-[11px] text-slate-400 max-w-[200px] mx-auto">
                  Smart AI match alerts and updates will appear here.
                </p>
              </div>
            ) : (
              notifications.map((notif) => {
                const scorePct = Math.round(notif.match_score);
                const isUnread = !notif.is_read;

                return (
                  <div
                    key={notif.id}
                    id={`notification-item-${notif.id}`}
                    onClick={() => handleNotificationClick(notif)}
                    className={`p-3.5 transition-all cursor-pointer hover:bg-slate-50 relative group ${
                      isUnread ? 'bg-indigo-50/30' : 'bg-white'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {/* Match Score Badge or Icon */}
                      <div className="shrink-0 mt-0.5">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-white flex flex-col items-center justify-center shadow-xs font-extrabold text-[11px]">
                          <span className="leading-none">{scorePct}%</span>
                          <span className="text-[8px] opacity-90 leading-none">MATCH</span>
                        </div>
                      </div>

                      {/* Content */}
                      <div className="flex-grow min-w-0">
                        <div className="flex items-center justify-between gap-1 mb-1">
                          <h4 className="text-xs font-bold text-slate-900 truncate flex items-center gap-1.5">
                            {isUnread && (
                              <span className="w-2 h-2 rounded-full bg-brand-600 shrink-0 inline-block animate-pulse" />
                            )}
                            <span className="truncate">{notif.title}</span>
                          </h4>
                          <span className="text-[10px] text-slate-400 shrink-0 font-medium">
                            {formatRelativeTime(notif.created_at)}
                          </span>
                        </div>

                        <p className="text-[11px] text-slate-600 line-clamp-2 leading-relaxed mb-2">
                          {notif.message}
                        </p>

                        {/* Badges / Meta */}
                        <div className="flex items-center gap-2 text-[10px]">
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-emerald-50 text-emerald-700 font-bold border border-emerald-200/60">
                            <Sparkles className="w-2.5 h-2.5" /> High AI Confidence
                          </span>
                          <span className="text-slate-400 flex items-center gap-1 group-hover:text-brand-600 transition-colors ml-auto font-medium">
                            View details <ExternalLink className="w-2.5 h-2.5" />
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer note */}
          <div className="p-2.5 bg-slate-50 border-t border-slate-100 text-center">
            <span className="text-[10px] text-slate-400 flex items-center justify-center gap-1">
              <Sparkles className="w-3 h-3 text-brand-500" /> Notifications trigger automatically on ≥ 75% AI matches
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
