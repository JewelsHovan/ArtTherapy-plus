/**
 * Journal handlers
 *
 * Handles CRUD operations for user's journal entries (reflections).
 * Ported from Cloudflare Worker implementation.
 */

import { Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { query } from '../db/index.js';

/**
 * Create a journal entry
 *
 * POST /api/journal
 * Body: { gallery_item_id?: string, reflection_questions?: string, responses?: string, notes?: string }
 */
export async function handleCreateJournalEntry(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const user = req.user!;
    const { gallery_item_id, reflection_questions, responses, notes } = req.body;

    const id = uuidv4();
    const now = new Date();

    await query(
      `INSERT INTO journal_entries (id, user_id, gallery_item_id, reflection_questions, responses, notes, created_at, updated_at)
       VALUES (@p0, @p1, @p2, @p3, @p4, @p5, @p6, @p7)`,
      [
        id,
        user.id,
        gallery_item_id || null,
        reflection_questions || null,
        responses || null,
        notes || null,
        now,
        now,
      ]
    );

    res.status(201).json({
      success: true,
      entry: {
        id,
        galleryItemId: gallery_item_id,
        reflectionQuestions: reflection_questions,
        responses,
        notes,
        createdAt: now.toISOString(),
      },
    });
  } catch (error) {
    console.error('Create journal error:', error);
    res.status(500).json({
      error: 'Failed to save journal entry',
      code: 'SAVE_FAILED',
    });
  }
}

/**
 * Get all journal entries for authenticated user
 *
 * GET /api/journal?limit=20&offset=0
 */
export async function handleGetJournalEntries(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const user = req.user!;
    const limit = Math.min(Math.max(1, parseInt(req.query.limit as string || '20', 10)), 50);
    const offset = Math.max(0, parseInt(req.query.offset as string || '0', 10));

    const entries = await query<{
      id: string;
      gallery_item_id: string | null;
      reflection_questions: string | null;
      responses: string | null;
      notes: string | null;
      created_at: Date;
      updated_at: Date;
    }>(
      `SELECT id, gallery_item_id, reflection_questions, responses, notes, created_at, updated_at
       FROM journal_entries
       WHERE user_id = @p0
       ORDER BY created_at DESC
       OFFSET @p1 ROWS
       FETCH NEXT @p2 ROWS ONLY`,
      [user.id, offset, limit]
    );

    const formattedEntries = entries.map((row) => ({
      id: row.id,
      galleryItemId: row.gallery_item_id,
      reflectionQuestions: row.reflection_questions,
      responses: row.responses,
      notes: row.notes,
      createdAt: row.created_at instanceof Date
        ? row.created_at.toISOString()
        : row.created_at,
      updatedAt: row.updated_at instanceof Date
        ? row.updated_at.toISOString()
        : row.updated_at,
    }));

    res.status(200).json({
      success: true,
      entries: formattedEntries,
      pagination: { limit, offset, count: formattedEntries.length },
    });
  } catch (error) {
    console.error('Get journal error:', error);
    res.status(500).json({
      error: 'Failed to load journal entries',
      code: 'LOAD_FAILED',
    });
  }
}
