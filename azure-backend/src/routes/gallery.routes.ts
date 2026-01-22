/**
 * Gallery routes
 *
 * Handles CRUD operations for user's generated artwork.
 * All routes require authentication.
 */

import { Router } from 'express';
import {
  handleSaveGalleryItem,
  handleGetGalleryItems,
  handleDeleteGalleryItem,
} from '../handlers/gallery.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

// All gallery routes require authentication
router.use(authMiddleware);

/**
 * Save a gallery item
 * POST /api/gallery
 * Body: { image_url: string, description: string, prompt_used?: string, mode?: string }
 */
router.post('/', handleSaveGalleryItem);

/**
 * Get all gallery items for user
 * GET /api/gallery?limit=50&offset=0
 */
router.get('/', handleGetGalleryItems);

/**
 * Delete a gallery item
 * DELETE /api/gallery/:id
 */
router.delete('/:id', handleDeleteGalleryItem);

export default router;
