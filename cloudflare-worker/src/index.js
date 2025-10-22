import { handleMicrosoftCallback, handleVerifyToken, handleLogout } from './handlers/auth.js';
import { handleCORS, errorResponse, jsonResponse } from './utils/response.js';
import { verifyAuth } from './middleware/auth.js';

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;

    // CORS preflight
    if (request.method === 'OPTIONS') {
      return handleCORS();
    }

    try {
      // Health check (public)
      if (path === '/api/health') {
        return jsonResponse({ status: 'ok', timestamp: new Date().toISOString() });
      }

      // Authentication endpoints (public)
      if (path === '/api/auth/microsoft/callback' && request.method === 'POST') {
        return await handleMicrosoftCallback(request, env);
      }

      if (path === '/api/auth/verify' && request.method === 'POST') {
        return await handleVerifyToken(request, env);
      }

      if (path === '/api/auth/logout' && request.method === 'POST') {
        return await handleLogout();
      }

      // TODO: Add protected endpoints for gallery, user, journal in Phase 2 & 3
      // These will use verifyAuth middleware

      // Existing OpenAI endpoints (will be protected in Phase 2)
      // TODO: Import and route to generate handlers

      // 404 for unknown routes
      return errorResponse('Not found', 'NOT_FOUND', 404);

    } catch (error) {
      console.error('Worker error:', error);
      return errorResponse('Internal server error', 'INTERNAL_ERROR', 500);
    }
  }
};
