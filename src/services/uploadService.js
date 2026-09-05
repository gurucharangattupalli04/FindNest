/**
 * FindNest Image Upload Service
 * Posts image files to the backend /api/v1/upload/image endpoint.
 */

import { getFullApiUrl } from './apiConfig';

export const uploadService = {
  /**
   * Uploads an image file to the backend.
   * @param {File} file - Image file (JPG, JPEG, PNG, WEBP, max 5MB)
   * @param {string} token - JWT bearer access token
   * @returns {Promise<{ image_url: string, filename: string, content_type: string, size_bytes: number }>}
   */
  async uploadImage(file, token) {
    if (!token) {
      throw new Error('Authentication required to upload images. Please sign in.');
    }

    // Client-side file size check (5 MB)
    const MAX_SIZE = 5 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      throw new Error('Selected image exceeds the 5MB maximum file size limit.');
    }

    // Client-side file type check
    const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
    if (!ALLOWED_TYPES.includes(file.type.toLowerCase())) {
      throw new Error('Unsupported image format. Allowed formats: JPG, JPEG, PNG, WEBP.');
    }

    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(getFullApiUrl('/api/v1/upload/image'), {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      const errorMsg = data?.detail || 'Failed to upload image. Please try again.';
      throw new Error(errorMsg);
    }

    return data;
  },
};
