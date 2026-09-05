/**
 * FindNest Notifications API Service Layer
 * Connects to FastAPI backend for In-App and Smart Match notifications.
 */

import { getFullApiUrl } from './apiConfig';

const NOTIFICATIONS_API = getFullApiUrl('/api/v1/notifications');

function formatErrorMessage(data, fallback) {
  if (!data) return fallback;
  if (typeof data.detail === 'string') return data.detail;
  if (Array.isArray(data.detail)) {
    return data.detail.map((d) => d.msg || `${d.loc?.join('.')} is invalid`).join(', ');
  }
  return fallback;
}

/**
 * Fetch paginated list of notifications for the authenticated user
 */
export async function fetchNotifications({ unread_only = false, page = 1, limit = 20, token } = {}) {
  if (!token) {
    throw new Error('Authentication required to fetch notifications.');
  }

  const query = new URLSearchParams();
  if (unread_only) query.append('unread_only', 'true');
  if (page) query.append('page', String(page));
  if (limit) query.append('limit', String(limit));

  const url = `${NOTIFICATIONS_API}${query.toString() ? `?${query.toString()}` : ''}`;
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  const data = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(formatErrorMessage(data, 'Failed to fetch notifications.'));
  }

  return data;
}

/**
 * Fetch current unread notification count
 */
export async function fetchUnreadCount(token) {
  if (!token) return { unread_count: 0 };

  const response = await fetch(`${NOTIFICATIONS_API}/unread-count`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  const data = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(formatErrorMessage(data, 'Failed to fetch unread notification count.'));
  }

  return data;
}

/**
 * Mark a single notification as read
 */
export async function markNotificationAsRead(id, token) {
  if (!token) {
    throw new Error('Authentication required.');
  }

  const response = await fetch(`${NOTIFICATIONS_API}/${id}/read`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  const data = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(formatErrorMessage(data, 'Failed to mark notification as read.'));
  }

  return data;
}

/**
 * Mark all notifications for current user as read
 */
export async function markAllNotificationsAsRead(token) {
  if (!token) {
    throw new Error('Authentication required.');
  }

  const response = await fetch(`${NOTIFICATIONS_API}/mark-all-read`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  const data = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(formatErrorMessage(data, 'Failed to mark all notifications as read.'));
  }

  return data;
}
