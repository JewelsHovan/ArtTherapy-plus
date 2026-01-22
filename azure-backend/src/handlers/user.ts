/**
 * User profile handlers
 *
 * Handles user profile retrieval and updates.
 * Ported from Cloudflare Worker implementation.
 */

import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { query } from '../db/index.js';
import {
  generateImageKey,
  storeImageFromBuffer,
  getPublicUrl,
  deleteImage,
} from '../services/storage.js';
import { config } from '../config/index.js';

/**
 * Whitelist of allowed profile fields for updates
 */
const ALLOWED_PROFILE_FIELDS = [
  'name',
  'avatar_url',
  'age',
  'sex',
  'gender',
  'symptoms',
  'location',
  'languages',
  'occupation',
  'relationship_status',
  'prescriptions',
  'activity_level',
  'settings',
];

/**
 * Fields that should be JSON stringified before storage
 */
const JSON_FIELDS = ['symptoms', 'languages', 'prescriptions', 'settings'];

/**
 * Parse a profile row from the database
 */
function parseProfileRow(row: Record<string, unknown>): Record<string, unknown> {
  return {
    ...row,
    symptoms: row.symptoms ? JSON.parse(row.symptoms as string) : [],
    languages: row.languages ? JSON.parse(row.languages as string) : [],
    prescriptions: row.prescriptions ? JSON.parse(row.prescriptions as string) : [],
    settings: row.settings ? JSON.parse(row.settings as string) : {},
  };
}

/**
 * Get user profile
 *
 * GET /api/user/profile
 */
export async function handleGetProfile(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const user = req.user!;

    const results = await query<Record<string, unknown>>(
      `SELECT
        id, email, name, avatar_url,
        age, sex, gender, symptoms, location,
        languages, occupation, relationship_status,
        prescriptions, activity_level,
        settings, created_at, updated_at
       FROM users
       WHERE id = @p0`,
      [user.id]
    );

    if (results.length === 0) {
      res.status(404).json({
        error: 'User not found',
        code: 'NOT_FOUND',
      });
      return;
    }

    const profile = parseProfileRow(results[0]);

    res.status(200).json({ profile });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      error: 'Failed to fetch profile',
      code: 'INTERNAL_ERROR',
    });
  }
}

/**
 * Update user profile
 *
 * PUT /api/user/profile
 * Body: { name?: string, age?: number, ... }
 */
export async function handleUpdateProfile(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const user = req.user!;
    const updates = req.body;

    // Build dynamic update query
    const updateParts: string[] = [];
    const values: unknown[] = [];
    let paramIndex = 0;

    for (const [key, value] of Object.entries(updates)) {
      // Convert camelCase to snake_case for database columns
      const dbKey = key.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);

      if (!ALLOWED_PROFILE_FIELDS.includes(dbKey)) {
        continue;
      }

      updateParts.push(`${dbKey} = @p${paramIndex}`);

      // Stringify arrays/objects for JSON columns
      if (JSON_FIELDS.includes(dbKey)) {
        values.push(JSON.stringify(value));
      } else {
        values.push(value);
      }
      paramIndex++;
    }

    if (updateParts.length === 0) {
      res.status(400).json({
        error: 'No valid fields to update',
        code: 'VALIDATION_ERROR',
      });
      return;
    }

    // Add updated_at timestamp
    updateParts.push(`updated_at = GETDATE()`);

    // Add user ID for WHERE clause
    values.push(user.id);

    const sql = `UPDATE users SET ${updateParts.join(', ')} WHERE id = @p${paramIndex}`;
    await query(sql, values);

    // Fetch updated profile
    const results = await query<Record<string, unknown>>(
      `SELECT
        id, email, name, avatar_url,
        age, sex, gender, symptoms, location,
        languages, occupation, relationship_status,
        prescriptions, activity_level,
        settings, created_at, updated_at
       FROM users
       WHERE id = @p0`,
      [user.id]
    );

    if (results.length === 0) {
      res.status(404).json({
        error: 'User not found',
        code: 'NOT_FOUND',
      });
      return;
    }

    const profile = parseProfileRow(results[0]);

    res.status(200).json({ profile });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      error: 'Failed to update profile',
      code: 'INTERNAL_ERROR',
    });
  }
}

/**
 * Allowed MIME types for avatar uploads
 */
const ALLOWED_AVATAR_MIME_TYPES = ['image/png', 'image/jpeg', 'image/webp'];

/**
 * Map MIME types to file extensions
 */
const MIME_TO_EXTENSION: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
};

/**
 * Upload user avatar
 *
 * POST /api/user/avatar
 * Body: { image: string } (base64 data URL)
 */
export async function handleUploadAvatar(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const user = req.user!;
    const { image } = req.body;

    if (!image || typeof image !== 'string') {
      res.status(400).json({
        error: 'Image data is required',
        code: 'VALIDATION_ERROR',
      });
      return;
    }

    // Validate data URL format: data:image/TYPE;base64,DATA
    const dataUrlMatch = image.match(/^data:(image\/[a-zA-Z+]+);base64,(.+)$/);
    if (!dataUrlMatch) {
      res.status(400).json({
        error: 'Invalid image format. Please provide a valid base64 data URL.',
        code: 'VALIDATION_ERROR',
      });
      return;
    }

    const [, mimeType, base64Data] = dataUrlMatch;

    // Validate MIME type against whitelist
    if (!ALLOWED_AVATAR_MIME_TYPES.includes(mimeType)) {
      res.status(400).json({
        error: `Unsupported image type. Allowed types: ${ALLOWED_AVATAR_MIME_TYPES.join(', ')}`,
        code: 'VALIDATION_ERROR',
      });
      return;
    }

    // Convert base64 to Buffer
    const buffer = Buffer.from(base64Data, 'base64');

    // Validate buffer size (max 5MB)
    const maxSizeBytes = 5 * 1024 * 1024;
    if (buffer.length > maxSizeBytes) {
      res.status(400).json({
        error: 'Image too large. Maximum size is 5MB.',
        code: 'VALIDATION_ERROR',
      });
      return;
    }

    // Get file extension from MIME type
    const extension = MIME_TO_EXTENSION[mimeType] || 'png';

    // Generate storage key with correct extension
    const baseKey = generateImageKey(user.id, 'avatars');
    const key = baseKey.replace(/\.png$/, `.${extension}`);

    // Store the image in Azure Blob Storage
    const storeResult = await storeImageFromBuffer(buffer, key, mimeType, {
      userId: user.id,
      purpose: 'avatar',
    });

    if (!storeResult.success) {
      console.error('Avatar storage failed:', storeResult.error);
      res.status(500).json({
        error: 'Failed to store avatar image',
        code: 'STORAGE_ERROR',
      });
      return;
    }

    // Get public URL for the new avatar
    const publicUrl = getPublicUrl(key);

    // Get the user's current avatar URL to delete the old one
    const currentResults = await query<Record<string, unknown>>(
      'SELECT avatar_url FROM users WHERE id = @p0',
      [user.id]
    );

    const currentAvatarUrl = currentResults[0]?.avatar_url as string | null;

    // Delete old avatar if it exists and is from our storage
    if (currentAvatarUrl && config.storage.publicUrl) {
      const storageBaseUrl = config.storage.publicUrl.replace(/\/$/, '');
      if (currentAvatarUrl.startsWith(storageBaseUrl)) {
        try {
          // Extract key from URL
          const oldKey = currentAvatarUrl.replace(`${storageBaseUrl}/`, '');
          await deleteImage(oldKey);
        } catch (deleteError) {
          // Log but don't fail the request - old avatar cleanup is best effort
          console.warn('Failed to delete old avatar:', deleteError);
        }
      }
    }

    // Update user's avatar_url in database
    await query(
      'UPDATE users SET avatar_url = @p0, updated_at = GETDATE() WHERE id = @p1',
      [publicUrl, user.id]
    );

    res.status(200).json({
      avatar_url: publicUrl,
    });
  } catch (error) {
    console.error('Upload avatar error:', error);
    res.status(500).json({
      error: 'Failed to upload avatar',
      code: 'INTERNAL_ERROR',
    });
  }
}
