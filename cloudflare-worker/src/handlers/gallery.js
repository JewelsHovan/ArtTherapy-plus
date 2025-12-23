import { jsonResponse, errorResponse } from '../utils/response.js';

/**
 * Save a gallery item
 * POST /api/gallery
 * Body: { image_url, description, prompt_used, mode }
 */
export async function handleSaveGalleryItem(request, env, user, origin) {
  try {
    const { image_url, description, prompt_used, mode } = await request.json();

    if (!image_url || !description) {
      return errorResponse('image_url and description are required', 'VALIDATION_ERROR', 400, origin);
    }

    const id = crypto.randomUUID();

    await env.DB
      .prepare(`
        INSERT INTO gallery_items (id, user_id, image_url, description, prompt_used, mode, created_at)
        VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
      `)
      .bind(id, user.id, image_url, description, prompt_used || null, mode || null)
      .run();

    return jsonResponse({
      success: true,
      item: {
        id,
        imageUrl: image_url,
        description,
        promptUsed: prompt_used,
        mode,
        createdAt: new Date().toISOString()
      }
    }, 201, {}, origin);
  } catch (error) {
    console.error('Save gallery error:', error);
    return errorResponse('Failed to save gallery item', 'SAVE_FAILED', 500, origin);
  }
}

/**
 * Get all gallery items for authenticated user
 * GET /api/gallery?limit=50&offset=0
 */
export async function handleGetGalleryItems(request, env, user, origin) {
  try {
    const url = new URL(request.url);
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '50'), 100);
    const offset = parseInt(url.searchParams.get('offset') || '0');

    const result = await env.DB
      .prepare(`
        SELECT id, image_url, description, prompt_used, mode, created_at
        FROM gallery_items
        WHERE user_id = ?
        ORDER BY created_at DESC
        LIMIT ? OFFSET ?
      `)
      .bind(user.id, limit, offset)
      .all();

    const items = (result.results || []).map(row => ({
      id: row.id,
      imageUrl: row.image_url,
      description: row.description,
      promptUsed: row.prompt_used,
      mode: row.mode,
      createdAt: row.created_at
    }));

    return jsonResponse({
      success: true,
      items,
      pagination: { limit, offset, count: items.length }
    }, 200, {}, origin);
  } catch (error) {
    console.error('Get gallery error:', error);
    return errorResponse('Failed to load gallery', 'LOAD_FAILED', 500, origin);
  }
}

/**
 * Delete a gallery item
 * DELETE /api/gallery/:id
 */
export async function handleDeleteGalleryItem(request, env, user, itemId, origin) {
  try {
    if (!itemId) {
      return errorResponse('Item ID is required', 'VALIDATION_ERROR', 400, origin);
    }

    // Verify ownership before delete
    const existing = await env.DB
      .prepare('SELECT id FROM gallery_items WHERE id = ? AND user_id = ?')
      .bind(itemId, user.id)
      .first();

    if (!existing) {
      return errorResponse('Gallery item not found', 'NOT_FOUND', 404, origin);
    }

    await env.DB
      .prepare('DELETE FROM gallery_items WHERE id = ? AND user_id = ?')
      .bind(itemId, user.id)
      .run();

    return jsonResponse({ success: true }, 200, {}, origin);
  } catch (error) {
    console.error('Delete gallery error:', error);
    return errorResponse('Failed to delete gallery item', 'DELETE_FAILED', 500, origin);
  }
}
