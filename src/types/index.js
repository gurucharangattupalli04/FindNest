/**
 * @typedef {'LOST' | 'FOUND'} ItemType
 * 
 * @typedef {'electronics' | 'wallets' | 'keys' | 'bags' | 'pets' | 'accessories' | 'other'} ItemCategory
 * 
 * @typedef {Object} LostFoundItem
 * @property {string} id - Unique identifier
 * @property {ItemType} type - Whether the item was lost or found
 * @property {string} title - Short descriptive title
 * @property {ItemCategory} category - Category grouping
 * @property {string} description - Detailed notes and distinctive traits
 * @property {string} location - General location or venue
 * @property {string} date - ISO Date string
 * @property {string | null} [reward] - Reward amount if applicable
 * @property {string} contactName - Reporter name or handle
 * @property {'Active' | 'Resolved' | 'Archived'} status - Item listing status
 * @property {boolean} [featured] - Featured flag for feed highlighting
 * @property {string} [accentColor] - Gradient accent for thumbnail card
 */

export const ItemStatus = {
  ACTIVE: 'Active',
  RESOLVED: 'Resolved',
  ARCHIVED: 'Archived',
};
