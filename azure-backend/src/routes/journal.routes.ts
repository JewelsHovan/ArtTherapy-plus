/**
 * Journal routes
 *
 * Handles CRUD operations for user's reflection entries.
 * All routes require authentication.
 */

import { Router } from 'express';
import {
  handleCreateJournalEntry,
  handleGetJournalEntries,
} from '../handlers/journal.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

// All journal routes require authentication
router.use(authMiddleware);

/**
 * Create a journal entry
 * POST /api/journal
 * Body: { gallery_item_id?: string, reflection_questions?: string, responses?: string, notes?: string }
 */
router.post('/', handleCreateJournalEntry);

/**
 * Get all journal entries for user
 * GET /api/journal?limit=20&offset=0
 */
router.get('/', handleGetJournalEntries);

export default router;
