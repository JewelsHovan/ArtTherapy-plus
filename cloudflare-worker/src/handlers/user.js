import { jsonResponse, errorResponse } from '../utils/response.js';

/**
 * Get user profile
 * GET /api/user/profile
 */
export async function handleGetProfile(request, env, user, origin = null) {
  try {
    const result = await env.DB.prepare(`
      SELECT
        id, email, name, avatar_url,
        age, sex, gender, symptoms, location,
        languages, occupation, relationship_status,
        prescriptions, activity_level,
        settings, created_at, updated_at
      FROM users
      WHERE id = ?
    `).bind(user.id).first();

    if (!result) {
      return errorResponse('User not found', 'NOT_FOUND', 404, origin);
    }

    // Parse JSON fields
    const profile = {
      ...result,
      symptoms: result.symptoms ? JSON.parse(result.symptoms) : [],
      languages: result.languages ? JSON.parse(result.languages) : [],
      prescriptions: result.prescriptions ? JSON.parse(result.prescriptions) : [],
      settings: result.settings ? JSON.parse(result.settings) : {}
    };

    return jsonResponse({ profile }, 200, {}, origin);
  } catch (error) {
    console.error('Get profile error:', error);
    return errorResponse('Failed to fetch profile', 'INTERNAL_ERROR', 500, origin);
  }
}

/**
 * Update user profile
 * PUT /api/user/profile
 */
export async function handleUpdateProfile(request, env, user, origin = null) {
  try {
    const updates = await request.json();

    // Whitelist of allowed profile fields
    const allowedFields = [
      'name', 'avatar_url', 'age', 'sex', 'gender',
      'symptoms', 'location', 'languages', 'occupation',
      'relationship_status', 'prescriptions', 'activity_level',
      'settings'
    ];

    const updateParts = [];
    const values = [];

    for (const [key, value] of Object.entries(updates)) {
      if (!allowedFields.includes(key)) continue;

      updateParts.push(`${key} = ?`);

      // Stringify arrays/objects for JSON columns
      if (['symptoms', 'languages', 'prescriptions', 'settings'].includes(key)) {
        values.push(JSON.stringify(value));
      } else {
        values.push(value);
      }
    }

    if (updateParts.length === 0) {
      return errorResponse('No valid fields to update', 'VALIDATION_ERROR', 400, origin);
    }

    // Add updated_at timestamp
    updateParts.push("updated_at = datetime('now')");
    values.push(user.id); // For WHERE clause

    const sql = `UPDATE users SET ${updateParts.join(', ')} WHERE id = ?`;
    await env.DB.prepare(sql).bind(...values).run();

    // Fetch updated profile
    const updated = await env.DB.prepare(`
      SELECT
        id, email, name, avatar_url,
        age, sex, gender, symptoms, location,
        languages, occupation, relationship_status,
        prescriptions, activity_level,
        settings, created_at, updated_at
      FROM users
      WHERE id = ?
    `).bind(user.id).first();

    const profile = {
      ...updated,
      symptoms: updated.symptoms ? JSON.parse(updated.symptoms) : [],
      languages: updated.languages ? JSON.parse(updated.languages) : [],
      prescriptions: updated.prescriptions ? JSON.parse(updated.prescriptions) : [],
      settings: updated.settings ? JSON.parse(updated.settings) : {}
    };

    return jsonResponse({ profile }, 200, {}, origin);
  } catch (error) {
    console.error('Update profile error:', error);
    return errorResponse('Failed to update profile', 'INTERNAL_ERROR', 500, origin);
  }
}
