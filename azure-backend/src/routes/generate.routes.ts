/**
 * AI Generation routes
 *
 * Handles image generation, prompts, reflections, and inspiration.
 * All routes require authentication.
 */

import { Router } from 'express';
import {
  handleGenerateImage,
  handleGeneratePrompt,
  handleReflect,
  handleInspire,
  handleEditImage,
} from '../handlers/generate.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

// All generation routes require authentication
router.use(authMiddleware);

/**
 * Generate an image from a pain description
 * POST /api/generate/image
 * Body: { description: string }
 */
router.post('/image', handleGenerateImage);

/**
 * Generate artistic prompts from a pain description
 * POST /api/generate/prompt
 * Body: { description: string }
 */
router.post('/prompt', handleGeneratePrompt);

export default router;

// Export the router for additional routes that need auth but aren't under /generate
export const reflectRouter = Router();
reflectRouter.use(authMiddleware);

/**
 * Generate reflection questions for artwork
 * POST /api/reflect
 * Body: { description: string, image_context?: string }
 */
reflectRouter.post('/', handleReflect);

export const inspireRouter = Router();
inspireRouter.use(authMiddleware);

/**
 * Generate inspirational art therapy prompts
 * GET /api/inspire
 */
inspireRouter.get('/', handleInspire);

export const editRouter = Router();
editRouter.use(authMiddleware);

/**
 * Edit/transform an image with style transfer
 * POST /api/edit/image
 * Body: { image: string (base64 or URL), description: string }
 */
editRouter.post('/image', handleEditImage);
