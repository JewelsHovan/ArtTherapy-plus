import { jsonResponse, errorResponse } from '../utils/response.js';

/**
 * Create a journal entry
 * POST /api/journal
 * Body: { gallery_item_id, reflection_questions, responses, notes }
 */
export async function handleCreateJournalEntry(request, env, user, origin) {
  try {
    const { gallery_item_id, reflection_questions, responses, notes } = await request.json();

    const id = crypto.randomUUID();

    await env.DB
      .prepare(`
        INSERT INTO journal_entries (id, user_id, gallery_item_id, reflection_questions, responses, notes, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
      `)
      .bind(id, user.id, gallery_item_id || null, reflection_questions || null, responses || null, notes || null)
      .run();

    return jsonResponse({
      success: true,
      entry: {
        id,
        galleryItemId: gallery_item_id,
        reflectionQuestions: reflection_questions,
        responses,
        notes,
        createdAt: new Date().toISOString()
      }
    }, 201, {}, origin);
  } catch (error) {
    console.error('Create journal error:', error);
    return errorResponse('Failed to save journal entry', 'SAVE_FAILED', 500, origin);
  }
}

/**
 * Get all journal entries for authenticated user
 * GET /api/journal?limit=20&offset=0
 */
export async function handleGetJournalEntries(request, env, user, origin) {
  try {
    const url = new URL(request.url);
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '20'), 50);
    const offset = parseInt(url.searchParams.get('offset') || '0');

    const result = await env.DB
      .prepare(`
        SELECT id, gallery_item_id, reflection_questions, responses, notes, created_at, updated_at
        FROM journal_entries
        WHERE user_id = ?
        ORDER BY created_at DESC
        LIMIT ? OFFSET ?
      `)
      .bind(user.id, limit, offset)
      .all();

    const entries = (result.results || []).map(row => ({
      id: row.id,
      galleryItemId: row.gallery_item_id,
      reflectionQuestions: row.reflection_questions,
      responses: row.responses,
      notes: row.notes,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }));

    return jsonResponse({
      success: true,
      entries,
      pagination: { limit, offset, count: entries.length }
    }, 200, {}, origin);
  } catch (error) {
    console.error('Get journal error:', error);
    return errorResponse('Failed to load journal entries', 'LOAD_FAILED', 500, origin);
  }
}
