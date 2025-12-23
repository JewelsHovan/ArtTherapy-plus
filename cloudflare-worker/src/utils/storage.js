/**
 * R2 Storage utilities for persistent image storage
 *
 * DALL-E image URLs expire after ~1 hour. This utility fetches images
 * and stores them in Cloudflare R2 for permanent access.
 */

/**
 * Generate a unique key for storing an image
 * @param {string} userId - User ID (optional, uses 'anonymous' if not provided)
 * @param {string} prefix - Prefix for the key (e.g., 'generated', 'edited')
 * @returns {string} Unique storage key
 */
export function generateImageKey(userId = 'anonymous', prefix = 'generated') {
  const timestamp = Date.now();
  const uuid = crypto.randomUUID();
  return `${prefix}/${userId}/${timestamp}-${uuid}.png`;
}

/**
 * Fetch image from URL and store in R2
 * @param {R2Bucket} bucket - R2 bucket binding (env.IMAGES)
 * @param {string} imageUrl - Source image URL (e.g., DALL-E temporary URL)
 * @param {string} key - Storage key from generateImageKey()
 * @param {Object} metadata - Optional metadata to store with the image
 * @returns {Promise<{success: boolean, key?: string, error?: string}>}
 */
export async function storeImageFromUrl(bucket, imageUrl, key, metadata = {}) {
  try {
    // Fetch the image from the source URL
    const response = await fetch(imageUrl);

    if (!response.ok) {
      return {
        success: false,
        error: `Failed to fetch image: ${response.status} ${response.statusText}`
      };
    }

    // Get the image as an ArrayBuffer
    const imageData = await response.arrayBuffer();

    // Determine content type
    const contentType = response.headers.get('content-type') || 'image/png';

    // Store in R2 with metadata
    await bucket.put(key, imageData, {
      httpMetadata: {
        contentType: contentType,
        cacheControl: 'public, max-age=31536000', // Cache for 1 year
      },
      customMetadata: {
        ...metadata,
        storedAt: new Date().toISOString(),
      },
    });

    return {
      success: true,
      key: key,
    };
  } catch (error) {
    console.error('R2 storage error:', error);
    return {
      success: false,
      error: error.message || 'Failed to store image',
    };
  }
}

/**
 * Build a public URL for an R2 object
 *
 * Note: This requires the R2 bucket to have public access enabled via:
 * - r2.dev subdomain (development)
 * - Custom domain (production)
 *
 * @param {string} key - Object key in R2
 * @param {string} publicUrlBase - Base URL (from env.R2_PUBLIC_URL or default)
 * @returns {string} Public URL for the image
 */
export function getPublicUrl(key, publicUrlBase) {
  // Remove trailing slash from base URL if present
  const base = publicUrlBase.replace(/\/$/, '');
  return `${base}/${key}`;
}

/**
 * Delete an image from R2
 * @param {R2Bucket} bucket - R2 bucket binding
 * @param {string} key - Object key to delete
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function deleteImage(bucket, key) {
  try {
    await bucket.delete(key);
    return { success: true };
  } catch (error) {
    console.error('R2 delete error:', error);
    return {
      success: false,
      error: error.message || 'Failed to delete image',
    };
  }
}

/**
 * Check if an image exists in R2
 * @param {R2Bucket} bucket - R2 bucket binding
 * @param {string} key - Object key to check
 * @returns {Promise<boolean>}
 */
export async function imageExists(bucket, key) {
  try {
    const object = await bucket.head(key);
    return object !== null;
  } catch (error) {
    return false;
  }
}
