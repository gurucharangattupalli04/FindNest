/**
 * FindNest Real API Service Layer
 * Connects to FastAPI + PostgreSQL backend for Lost & Found items CRUD.
 */

const LOST_API = '/api/v1/lost-items';
const FOUND_API = '/api/v1/found-items';

function buildQueryString(params = {}) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '' && value !== 'all' && value !== 'ALL') {
      query.append(key, value);
    }
  });
  const qs = query.toString();
  return qs ? `?${qs}` : '';
}

function formatErrorMessage(data, fallback) {
  if (!data) return fallback;
  if (typeof data.detail === 'string') return data.detail;
  if (Array.isArray(data.detail)) {
    return data.detail.map((d) => d.msg || `${d.loc?.join('.')} is invalid`).join(', ');
  }
  return fallback;
}

const CATEGORY_ACCENT_COLORS = {
  electronics: 'from-blue-500/20 to-indigo-500/10',
  wallets: 'from-emerald-500/20 to-teal-500/10',
  keys: 'from-amber-500/20 to-orange-500/10',
  bags: 'from-purple-500/20 to-indigo-500/10',
  pets: 'from-amber-400/20 to-yellow-500/10',
  accessories: 'from-rose-500/20 to-pink-500/10',
  documents: 'from-cyan-500/20 to-blue-500/10',
  other: 'from-slate-500/20 to-zinc-500/10',
};

export function normalizeItem(rawItem, type) {
  if (!rawItem) return null;
  const isLost = type === 'LOST' || (!type && rawItem.date_lost);
  const itemType = isLost ? 'LOST' : 'FOUND';
  const categoryKey = (rawItem.category || 'other').toLowerCase();

  return {
    ...rawItem,
    id: rawItem.id,
    type: itemType,
    title: rawItem.title,
    category: categoryKey,
    description: rawItem.description || '',
    color: rawItem.color || '',
    brand: rawItem.brand || '',
    location: rawItem.location || '',
    storage_location: rawItem.storage_location || null,
    date: isLost ? rawItem.date_lost : rawItem.date_found,
    reward: rawItem.reward || null,
    contactName: rawItem.contact_name || 'Community Member',
    contactPhone: rawItem.contact_phone || null,
    contactEmail: rawItem.contact_email || null,
    status: rawItem.status || 'active',
    user_id: rawItem.user_id,
    image_url: rawItem.image_url || null,
    imageUrl: rawItem.image_url || null,
    featured: Boolean(rawItem.is_featured),
    accentColor: CATEGORY_ACCENT_COLORS[categoryKey] || 'from-slate-100 to-slate-200',
  };
}

export const itemsApi = {
  // -------------------------------------------------------------
  // Lost Items CRUD
  // -------------------------------------------------------------
  async getLostItems(params = {}) {
    const res = await fetch(`${LOST_API}${buildQueryString(params)}`);
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      throw new Error(formatErrorMessage(data, 'Failed to fetch lost items'));
    }
    const items = (data.items || []).map((i) => normalizeItem(i, 'LOST'));
    return { ...data, items };
  },

  async getLostItem(id) {
    const res = await fetch(`${LOST_API}/${id}`);
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      throw new Error(formatErrorMessage(data, `Lost item #${id} not found`));
    }
    return normalizeItem(data, 'LOST');
  },

  async createLostItem(itemData, token) {
    const res = await fetch(LOST_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(itemData),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      throw new Error(formatErrorMessage(data, 'Failed to create lost item report'));
    }
    return normalizeItem(data, 'LOST');
  },

  async updateLostItem(id, itemData, token) {
    const res = await fetch(`${LOST_API}/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(itemData),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      throw new Error(formatErrorMessage(data, `Failed to update lost item #${id}`));
    }
    return normalizeItem(data, 'LOST');
  },

  async deleteLostItem(id, token) {
    const res = await fetch(`${LOST_API}/${id}`, {
      method: 'DELETE',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      throw new Error(formatErrorMessage(data, `Failed to delete lost item #${id}`));
    }
    return data;
  },

  // -------------------------------------------------------------
  // Found Items CRUD
  // -------------------------------------------------------------
  async getFoundItems(params = {}) {
    const res = await fetch(`${FOUND_API}${buildQueryString(params)}`);
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      throw new Error(formatErrorMessage(data, 'Failed to fetch found items'));
    }
    const items = (data.items || []).map((i) => normalizeItem(i, 'FOUND'));
    return { ...data, items };
  },

  async getFoundItem(id) {
    const res = await fetch(`${FOUND_API}/${id}`);
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      throw new Error(formatErrorMessage(data, `Found item #${id} not found`));
    }
    return normalizeItem(data, 'FOUND');
  },

  async createFoundItem(itemData, token) {
    const res = await fetch(FOUND_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(itemData),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      throw new Error(formatErrorMessage(data, 'Failed to create found item report'));
    }
    return normalizeItem(data, 'FOUND');
  },

  async updateFoundItem(id, itemData, token) {
    const res = await fetch(`${FOUND_API}/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(itemData),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      throw new Error(formatErrorMessage(data, `Failed to update found item #${id}`));
    }
    return normalizeItem(data, 'FOUND');
  },

  async deleteFoundItem(id, token) {
    const res = await fetch(`${FOUND_API}/${id}`, {
      method: 'DELETE',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      throw new Error(formatErrorMessage(data, `Failed to delete found item #${id}`));
    }
    return data;
  },

  // -------------------------------------------------------------
  // Unified Listing & My Reports
  // -------------------------------------------------------------
  async getAllItems(params = {}) {
    const [lostRes, foundRes] = await Promise.all([
      this.getLostItems(params),
      this.getFoundItems(params),
    ]);

    const combined = [...lostRes.items, ...foundRes.items].sort((a, b) => {
      const dateA = new Date(a.date || a.created_at).getTime();
      const dateB = new Date(b.date || b.created_at).getTime();
      return dateB - dateA;
    });

    return {
      items: combined,
      total: (lostRes.total || 0) + (foundRes.total || 0),
    };
  },

  async getMyReports(userId) {
    if (!userId) return { lost: [], found: [] };
    const [lostRes, foundRes] = await Promise.all([
      this.getLostItems({ user_id: userId, limit: 100 }),
      this.getFoundItems({ user_id: userId, limit: 100 }),
    ]);
    return {
      lost: lostRes.items,
      found: foundRes.items,
    };
  },

  // -------------------------------------------------------------
  // Step 8 Smart AI Matching Endpoints
  // -------------------------------------------------------------
  async getLostItemMatches(id, limit = 10) {
    const res = await fetch(`${LOST_API}/${id}/matches?limit=${limit}`);
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      throw new Error(formatErrorMessage(data, `Failed to load matches for lost item #${id}`));
    }
    const matches = (data.matches || []).map((m) => ({
      ...m,
      matched_item: normalizeItem(m.matched_item, 'FOUND'),
    }));
    return { ...data, matches };
  },

  async getFoundItemMatches(id, limit = 10) {
    const res = await fetch(`${FOUND_API}/${id}/matches?limit=${limit}`);
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      throw new Error(formatErrorMessage(data, `Failed to load matches for found item #${id}`));
    }
    const matches = (data.matches || []).map((m) => ({
      ...m,
      matched_item: normalizeItem(m.matched_item, 'LOST'),
    }));
    return { ...data, matches };
  },

  async getItemMatches(id, type, limit = 10) {
    const isLost = type === 'LOST' || type === 'lost';
    return isLost ? this.getLostItemMatches(id, limit) : this.getFoundItemMatches(id, limit);
  },
};
