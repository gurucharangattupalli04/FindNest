/**
 * Global API Configuration for FindNest.
 * Adapts seamlessly between local development (Vite proxy)
 * and production deployment (Render/Railway/Custom Domain).
 */

const rawBase = (import.meta.env.VITE_API_BASE_URL || '').trim();
// Strip trailing slashes and redundant /api/v1 suffix if user typed it
export const API_BASE_URL = rawBase.replace(/\/+$/, '').replace(/\/api\/v1\/?$/, '');

/**
 * Returns full URL for an API endpoint path (e.g. '/api/v1/auth/register')
 */
export function getFullApiUrl(path) {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return API_BASE_URL ? `${API_BASE_URL}${cleanPath}` : cleanPath;
}

/**
 * Normalizes an image URL: prepends backend origin if it's a relative /static/ path
 */
export function getImageUrl(imageUrl) {
  if (!imageUrl) return '';
  if (
    imageUrl.startsWith('http://') || 
    imageUrl.startsWith('https://') || 
    imageUrl.startsWith('blob:') || 
    imageUrl.startsWith('data:')
  ) {
    return imageUrl;
  }
  const cleanPath = imageUrl.startsWith('/') ? imageUrl : `/${imageUrl}`;
  return API_BASE_URL ? `${API_BASE_URL}${cleanPath}` : cleanPath;
}
