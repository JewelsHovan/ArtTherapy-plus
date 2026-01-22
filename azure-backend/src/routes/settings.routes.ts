/**
 * Settings routes
 *
 * Provides endpoints for retrieving application settings and configuration,
 * including available image generation models and style presets.
 */

import { Router, Response } from 'express';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth.js';
import { IMAGE_MODELS, STYLE_PRESETS } from '../utils/stylePresets.js';
import { getAvailableModels } from '../services/imageGeneration.js';

const router = Router();

/**
 * Get available image models and style presets
 *
 * GET /api/settings/image-models
 *
 * Returns the list of available image generation models (filtered by configuration)
 * and all style presets with their descriptions and templates.
 */
router.get('/image-models', authMiddleware, (_req: AuthenticatedRequest, res: Response) => {
  try {
    // Get models that are actually available based on configuration
    const availableModelIds = getAvailableModels();
    const models = IMAGE_MODELS.filter((m) => availableModelIds.includes(m.id));

    res.json({
      models,
      styles: STYLE_PRESETS,
      defaultModel: 'dall-e-3',
      defaultStyle: 'default',
    });
  } catch (error) {
    console.error('Get image models error:', error);
    res.status(500).json({
      error: 'Failed to retrieve image model settings',
      code: 'SETTINGS_ERROR',
    });
  }
});

export default router;
