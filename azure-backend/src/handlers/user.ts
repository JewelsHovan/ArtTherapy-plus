/**
 * User profile handlers
 *
 * Handles user profile retrieval and updates.
 * Ported from Cloudflare Worker implementation.
 */

import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { query } from '../db/index.js';

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
