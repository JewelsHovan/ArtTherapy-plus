/**
 * Authentication routes
 *
 * Handles Microsoft OAuth, email/password auth, and token management.
 */

import { Router } from 'express';
import {
  handleMicrosoftCallback,
  handleSignup,
  handleLogin,
  handleVerifyToken,
  handleLogout,
} from '../handlers/auth.js';
import { loginRateLimiter, signupRateLimiter, oauthRateLimiter } from '../middleware/rateLimit.js';

const router = Router();

/**
 * Microsoft OAuth callback
 * POST /api/auth/microsoft/callback
 * Body: { access_token: string }
 */
router.post('/microsoft/callback', oauthRateLimiter, handleMicrosoftCallback);

/**
 * Email/password signup
 * POST /api/auth/signup
 * Body: { email: string, password: string, name?: string }
 */
router.post('/signup', signupRateLimiter, handleSignup);

/**
 * Email/password login
 * POST /api/auth/login
 * Body: { email: string, password: string }
 */
router.post('/login', loginRateLimiter, handleLogin);

/**
 * Verify token validity
 * POST /api/auth/verify
 * Headers: Authorization: Bearer <token>
 */
router.post('/verify', handleVerifyToken);

/**
 * Logout (client-side, no server state)
 * POST /api/auth/logout
 */
router.post('/logout', handleLogout);

export default router;
