/**
 * Azure Blob Storage service for persistent image storage
 *
 * DALL-E image URLs expire after ~1 hour. This service fetches images
 * and stores them in Azure Blob Storage for permanent access.
 *
 * Ported from Cloudflare R2 implementation with equivalent functionality.
 */

import {
  BlobServiceClient,
  ContainerClient,
  BlockBlobClient,
} from '@azure/storage-blob';
import { v4 as uuidv4 } from 'uuid';
import { config } from '../config/index.js';

// Lazy-initialized blob service client
let blobServiceClient: BlobServiceClient | null = null;
let containerClient: ContainerClient | null = null;

/**
 * Get the Azure Blob Storage container client
 * Lazily initializes the client on first call
 */
function getContainerClient(): ContainerClient | null {
  if (!config.storage.connectionString) {
    return null;
  }

  if (!blobServiceClient) {
    blobServiceClient = BlobServiceClient.fromConnectionString(
      config.storage.connectionString
    );
  }

  if (!containerClient) {
    containerClient = blobServiceClient.getContainerClient(
      config.storage.containerName
    );
  }

  return containerClient;
}

/**
 * Generate a unique key for storing an image
 *
 * @param userId - User ID (optional, uses 'anonymous' if not provided)
 * @param prefix - Prefix for the key (e.g., 'generated', 'edited')
 * @returns Unique storage key
 *
 * @example
 * ```typescript
 * const key = generateImageKey('user-123', 'generated');
 * // Returns: 'generated/user-123/1699123456789-uuid.png'
 * ```
 */
export function generateImageKey(
  userId: string = 'anonymous',
  prefix: string = 'generated'
): string {
  const timestamp = Date.now();
  const uuid = uuidv4();
  return `${prefix}/${userId}/${timestamp}-${uuid}.png`;
}

/**
 * Fetch image from URL and store in Azure Blob Storage
 *
 * @param imageUrl - Source image URL (e.g., DALL-E temporary URL)
 * @param key - Storage key from generateImageKey()
 * @param metadata - Optional metadata to store with the image
 * @returns Result object with success status and key or error
 *
 * @example
 * ```typescript
 * const result = await storeImageFromUrl(dalleUrl, key, { userId: 'user-123' });
 * if (result.success) {
 *   console.log('Stored at:', result.key);
 * }
 * ```
 */
export async function storeImageFromUrl(
  imageUrl: string,
  key: string,
  metadata: Record<string, string> = {}
): Promise<{ success: boolean; key?: string; error?: string }> {
  try {
    const container = getContainerClient();
    if (!container) {
      return {
        success: false,
        error: 'Azure Blob Storage not configured',
      };
    }

    // Fetch the image from the source URL
    const response = await fetch(imageUrl);

    if (!response.ok) {
      return {
        success: false,
        error: `Failed to fetch image: ${response.status} ${response.statusText}`,
      };
    }

    // Get the image as an ArrayBuffer
    const imageData = await response.arrayBuffer();

    // Determine content type
    const contentType = response.headers.get('content-type') || 'image/png';

    // Get blob client for the key
    const blobClient: BlockBlobClient = container.getBlockBlobClient(key);

    // Upload to Azure Blob Storage with metadata
    await blobClient.uploadData(Buffer.from(imageData), {
      blobHTTPHeaders: {
        blobContentType: contentType,
        blobCacheControl: 'public, max-age=31536000', // Cache for 1 year
      },
      metadata: {
        ...metadata,
        storedAt: new Date().toISOString(),
      },
    });

    return {
      success: true,
      key: key,
    };
  } catch (error) {
    console.error('Azure Blob Storage error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to store image',
    };
  }
}

/**
 * Build a public URL for a blob
 *
 * Note: This requires the container to have public access enabled
 * or uses a CDN/custom domain.
 *
 * @param key - Object key in Azure Blob Storage
 * @returns Public URL for the image
 *
 * @example
 * ```typescript
 * const url = getPublicUrl('generated/user-123/image.png');
 * // Returns: 'https://account.blob.core.windows.net/images/generated/user-123/image.png'
 * ```
 */
export function getPublicUrl(key: string): string {
  // Use configured public URL or construct from account
  const base = config.storage.publicUrl.replace(/\/$/, '');
  return `${base}/${key}`;
}

/**
 * Delete an image from Azure Blob Storage
 *
 * @param key - Object key to delete
 * @returns Result object with success status or error
 *
 * @example
 * ```typescript
 * const result = await deleteImage('generated/user-123/image.png');
 * if (result.success) {
 *   console.log('Image deleted');
 * }
 * ```
 */
export async function deleteImage(
  key: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const container = getContainerClient();
    if (!container) {
      return {
        success: false,
        error: 'Azure Blob Storage not configured',
      };
    }

    const blobClient = container.getBlockBlobClient(key);
    await blobClient.delete();

    return { success: true };
  } catch (error) {
    console.error('Azure Blob Storage delete error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete image',
    };
  }
}

/**
 * Check if an image exists in Azure Blob Storage
 *
 * @param key - Object key to check
 * @returns True if the blob exists
 *
 * @example
 * ```typescript
 * const exists = await imageExists('generated/user-123/image.png');
 * ```
 */
export async function imageExists(key: string): Promise<boolean> {
  try {
    const container = getContainerClient();
    if (!container) {
      return false;
    }

    const blobClient = container.getBlockBlobClient(key);
    return await blobClient.exists();
  } catch {
    return false;
  }
}
