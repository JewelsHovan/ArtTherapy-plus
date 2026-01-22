/**
 * Gallery handlers
 *
 * Handles CRUD operations for user's gallery items (generated artwork).
 * Ported from Cloudflare Worker implementation.
 */

import { Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { query } from '../db/index.js';

/**
 * Save a gallery item
 *
 * POST /api/gallery
 * Body: { image_url: string, description: string, prompt_used?: string, mode?: string }
 */
export async function handleSaveGalleryItem(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const user = req.user!;
    const { image_url, description, prompt_used, mode } = req.body;

    if (!image_url || !description) {
      res.status(400).json({
        error: 'image_url and description are required',
        code: 'VALIDATION_ERROR',
      });
      return;
    }

    const id = uuidv4();
    const now = new Date();

    await query(
      `INSERT INTO gallery_items (id, user_id, image_url, description, prompt_used, mode, created_at)
       VALUES (@p0, @p1, @p2, @p3, @p4, @p5, @p6)`,
      [id, user.id, image_url, description, prompt_used || null, mode || null, now]
    );

    res.status(201).json({
      success: true,
      item: {
        id,
        imageUrl: image_url,
        description,
        promptUsed: prompt_used,
        mode,
        createdAt: now.toISOString(),
      },
    });
  } catch (error) {
    console.error('Save gallery error:', error);
    res.status(500).json({
      error: 'Failed to save gallery item',
      code: 'SAVE_FAILED',
    });
  }
}

/**
 * Get all gallery items for authenticated user
 *
 * GET /api/gallery?limit=50&offset=0
 */
export async function handleGetGalleryItems(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const user = req.user!;
    const limit = Math.min(Math.max(1, parseInt(req.query.limit as string || '50', 10)), 100);
    const offset = Math.max(0, parseInt(req.query.offset as string || '0', 10));

    const items = await query<{
      id: string;
      image_url: string;
      description: string;
      prompt_used: string | null;
      mode: string | null;
      created_at: Date;
    }>(
      `SELECT id, image_url, description, prompt_used, mode, created_at
       FROM gallery_items
       WHERE user_id = @p0
       ORDER BY created_at DESC
       OFFSET @p1 ROWS
       FETCH NEXT @p2 ROWS ONLY`,
      [user.id, offset, limit]
    );

    const formattedItems = items.map((row) => ({
      id: row.id,
      imageUrl: row.image_url,
      description: row.description,
      promptUsed: row.prompt_used,
      mode: row.mode,
      createdAt: row.created_at instanceof Date
        ? row.created_at.toISOString()
        : row.created_at,
    }));

    res.status(200).json({
      success: true,
      items: formattedItems,
      pagination: { limit, offset, count: formattedItems.length },
    });
  } catch (error) {
    console.error('Get gallery error:', error);
    res.status(500).json({
      error: 'Failed to load gallery',
      code: 'LOAD_FAILED',
    });
  }
}

/**
 * Delete a gallery item
 *
 * DELETE /api/gallery/:id
 */
export async function handleDeleteGalleryItem(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const user = req.user!;
    const itemId = req.params.id;

    if (!itemId) {
      res.status(400).json({
        error: 'Item ID is required',
        code: 'VALIDATION_ERROR',
      });
      return;
    }

    // Verify ownership before delete
    const existing = await query<{ id: string }>(
      `SELECT id FROM gallery_items WHERE id = @p0 AND user_id = @p1`,
      [itemId, user.id]
    );

    if (existing.length === 0) {
      res.status(404).json({
        error: 'Gallery item not found',
        code: 'NOT_FOUND',
      });
      return;
    }

    await query(
      `DELETE FROM gallery_items WHERE id = @p0 AND user_id = @p1`,
      [itemId, user.id]
    );

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Delete gallery error:', error);
    res.status(500).json({
      error: 'Failed to delete gallery item',
      code: 'DELETE_FAILED',
    });
  }
}
