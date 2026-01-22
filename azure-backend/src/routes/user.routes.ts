/**
 * User profile routes
 *
 * Handles user profile retrieval and updates.
 * All routes require authentication.
 */

import { Router } from 'express';
import { handleGetProfile, handleUpdateProfile } from '../handlers/user.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

// All user routes require authentication
router.use(authMiddleware);

/**
 * Get user profile
 * GET /api/user/profile
 */
router.get('/profile', handleGetProfile);

/**
 * Update user profile
 * PUT /api/user/profile
 * Body: { name?: string, age?: number, ... }
 */
router.put('/profile', handleUpdateProfile);

export default router;
