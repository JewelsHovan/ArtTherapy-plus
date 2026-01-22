/**
 * API Routes aggregator
 *
 * Combines all route modules and adds health check endpoint.
 */

import { Router, Request, Response } from 'express';
import authRoutes from './auth.routes.js';
import galleryRoutes from './gallery.routes.js';
import journalRoutes from './journal.routes.js';
import userRoutes from './user.routes.js';
import generateRoutes, { reflectRouter, inspireRouter, editRouter } from './generate.routes.js';
import settingsRoutes from './settings.routes.js';

const router = Router();

/**
 * Health check endpoint
 * GET /api/health
 *
 * Used by Azure Container Apps for health probes.
 */
router.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
});

// Mount route modules
router.use('/auth', authRoutes);
router.use('/gallery', galleryRoutes);
router.use('/journal', journalRoutes);
router.use('/user', userRoutes);
router.use('/generate', generateRoutes);
router.use('/reflect', reflectRouter);
router.use('/inspire', inspireRouter);
router.use('/edit', editRouter);
router.use('/settings', settingsRoutes);

export default router;
