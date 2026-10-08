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
  const [activeFilter, setActiveFilter] = useState('all');
  const [loading, setLoading] = useState(false);
  const [markingAll, setMarkingAll] = useState(false);
  const [error, setError] = useState(null);

  const containerRef = useRef(null);

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

  const loadNotifications = useCallback(async (filterMode = activeFilter) => {
    if (!isAuthenticated || !token) return;
    setLoading(true);
    setError(null);
    try {
      const unreadOnly = filterMode === 'unread';
      const items = await fetchNotifications(token, 30, unreadOnly);
      setNotifications(items);
    } catch (err) {
      setError(err.message || 'Failed to load notifications.');
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, token, activeFilter]);

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

  useEffect(() => {
    if (isOpen) {
      loadNotifications(activeFilter);
    }
  }, [isOpen, activeFilter, loadNotifications]);

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
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, is_read: true }))
      );
      if (activeFilter === 'unread') {
        setNotifications([]);
      }
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    } finally {
      setMarkingAll(false);
    }
  };

  const handleNotificationClick = async (notif) => {
    if (!notif.is_read && token) {
      try {
        await markNotificationAsRead(notif.id, token);
        setNotifications((prev) =>
          prev.map((n) => (n.id === notif.id ? { ...n, is_read: true } : n))
        );
        setUnreadCount((c) => Math.max(0, c - 1));
      } catch (err) {
        console.error('Failed to mark notification as read:', err);
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
            ? 'bg-aurora-chip border-aurora-accent text-aurora-accent'
            : 'bg-aurora-card hover:bg-aurora-chip border-aurora-border text-aurora-muted hover:text-aurora-text'
        }`}
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span
            id="notification-unread-badge"
            className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-aurora-accent text-white text-[10px] font-extrabold rounded-full flex items-center justify-center border-2 border-aurora-card"
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
          className="absolute right-0 mt-2 w-80 sm:w-96 max-w-[calc(100vw-32px)] bg-aurora-card rounded-2xl shadow-card border border-aurora-border z-50 overflow-hidden animate-fade-in text-aurora-text"
        >
          {/* Header */}
          <div className="p-3.5 border-b border-aurora-border bg-aurora-chip flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-aurora-text">Notifications</span>
              {unreadCount > 0 && (
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-aurora-accent text-white">
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
                className="text-[11px] font-semibold text-aurora-accent hover:underline flex items-center gap-1 cursor-pointer disabled:opacity-50"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                {markingAll ? 'Marking...' : 'Mark all read'}
              </button>
            )}
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center gap-1 px-3 py-2 border-b border-aurora-border bg-aurora-card">
            <button
              id="notification-filter-all-btn"
              type="button"
              onClick={() => setActiveFilter('all')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                activeFilter === 'all'
                  ? 'bg-aurora-accent text-white shadow-subtle'
                  : 'text-aurora-muted hover:text-aurora-text hover:bg-aurora-chip'
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
                  ? 'bg-aurora-accent text-white shadow-subtle'
                  : 'text-aurora-muted hover:text-aurora-text hover:bg-aurora-chip'
              }`}
            >
              <span>Unread</span>
              {unreadCount > 0 && (
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                    activeFilter === 'unread'
                      ? 'bg-white/25 text-white'
                      : 'bg-aurora-chip text-aurora-accent font-bold'
                  }`}
                >
                  {unreadCount}
                </span>
              )}
            </button>
          </div>

          {/* List Area */}
          <div className="max-h-[380px] overflow-y-auto divide-y divide-aurora-border">
            {loading ? (
              <div className="p-6 text-center space-y-3">
                <div className="animate-spin w-5 h-5 border-2 border-aurora-border border-t-aurora-accent rounded-full mx-auto" />
                <p className="text-xs text-aurora-muted">Checking for notifications...</p>
              </div>
            ) : error ? (
              <div className="p-6 text-center space-y-2">
                <AlertCircle className="w-6 h-6 text-aurora-error mx-auto" />
                <p className="text-xs text-aurora-error font-medium">{error}</p>
                <button
                  type="button"
                  onClick={() => loadNotifications(activeFilter)}
                  className="inline-flex items-center gap-1 px-3 py-1 bg-aurora-chip rounded-lg text-xs font-medium text-aurora-text transition-colors cursor-pointer"
                >
                  <RefreshCw className="w-3 h-3" /> Retry
                </button>
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center space-y-2">
                <div className="w-10 h-10 rounded-full bg-aurora-chip text-aurora-muted flex items-center justify-center mx-auto">
                  <Inbox className="w-5 h-5" />
                </div>
                <p className="text-xs font-semibold text-aurora-text">
                  {activeFilter === 'unread' ? 'No unread notifications' : 'No notifications yet'}
                </p>
                <p className="text-[11px] text-aurora-muted max-w-[200px] mx-auto">
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
                    className={`p-3.5 transition-all cursor-pointer hover:bg-aurora-chip/60 relative group ${
                      isUnread ? 'bg-aurora-chip/30' : 'bg-aurora-card'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="shrink-0 mt-0.5">
                        <div className="w-8 h-8 rounded-xl bg-aurora-accent text-white flex flex-col items-center justify-center shadow-subtle font-extrabold text-[11px]">
                          <span className="leading-none">{scorePct}%</span>
                          <span className="text-[7px] opacity-80 leading-none">MATCH</span>
                        </div>
                      </div>

                      <div className="flex-grow min-w-0">
                        <div className="flex items-center justify-between gap-1 mb-1">
                          <h4 className="text-xs font-bold text-aurora-text truncate flex items-center gap-1.5">
                            {isUnread && (
                              <span className="w-1.5 h-1.5 rounded-full bg-aurora-accent shrink-0 inline-block animate-pulse" />
                            )}
                            <span className="truncate">{notif.title}</span>
                          </h4>
                          <span className="text-[10px] text-aurora-muted shrink-0 font-medium font-mono">
                            {formatRelativeTime(notif.created_at)}
                          </span>
                        </div>

                        <p className="text-[11px] text-aurora-muted line-clamp-2 leading-relaxed mb-2">
                          {notif.message}
                        </p>

                        <div className="flex items-center gap-2 text-[10px]">
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-aurora-success-bg text-aurora-success font-semibold border border-aurora-success/20">
                            <Sparkles className="w-2.5 h-2.5" /> High AI Confidence
                          </span>
                          <span className="text-aurora-muted flex items-center gap-1 group-hover:text-aurora-accent transition-colors ml-auto font-medium">
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

          {/* Footer */}
          <div className="p-2.5 bg-aurora-chip border-t border-aurora-border text-center">
            <span className="text-[10px] text-aurora-muted flex items-center justify-center gap-1">
              <Sparkles className="w-3 h-3 text-aurora-accent" /> Notifications trigger automatically on ≥ 75% AI matches
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
