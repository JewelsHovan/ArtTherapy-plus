/**
 * ArtTherapy+ API Server
 *
 * Express.js application entry point for Azure Container Apps deployment.
 * Migrated from Cloudflare Workers with equivalent functionality.
 */

// Load environment variables from .env file (must be first!)
import 'dotenv/config';

import express from 'express';
import helmet from 'helmet';
import { corsMiddleware } from './config/cors.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { generalRateLimiter } from './middleware/rateLimit.js';
import routes from './routes/index.js';
import { config } from './config/index.js';
import { closeDatabase } from './db/index.js';

// Create Express application
const app = express();

// Trust proxy for rate limiting behind load balancers
// Azure Container Apps runs behind a load balancer
app.set('trust proxy', 1);

// Security middleware
app.use(helmet({
  // Allow cross-origin requests (handled by our CORS middleware)
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

// Custom CORS middleware with strict origin validation
app.use(corsMiddleware);

// Parse JSON bodies with 10MB limit for base64 images
app.use(express.json({ limit: '10mb' }));

// General rate limiting for all API endpoints
app.use('/api', generalRateLimiter);

// Mount API routes
app.use('/api', routes);

// 404 handler for unknown routes
app.use(notFoundHandler);

// Global error handler
app.use(errorHandler);

// Start server
const server = app.listen(config.server.port, () => {
  console.log(`ArtTherapy+ API server running on port ${config.server.port}`);
  console.log(`Environment: ${config.server.nodeEnv}`);
  console.log(`Health check: http://localhost:${config.server.port}/api/health`);
});

// Graceful shutdown handling
async function shutdown(signal: string): Promise<void> {
  console.log(`\nReceived ${signal}. Starting graceful shutdown...`);

  // Stop accepting new connections
  server.close(async () => {
    console.log('HTTP server closed');

    try {
      // Close database connection
      await closeDatabase();
      console.log('Database connection closed');
    } catch (err) {
      console.error('Error closing database:', err);
    }

    console.log('Graceful shutdown complete');
    process.exit(0);
  });

  // Force exit after 30 seconds
  setTimeout(() => {
    console.error('Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 30000);
}

// Handle shutdown signals
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

// Handle uncaught errors
process.on('uncaughtException', (err) => {
  console.error('Uncaught exception:', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled rejection at:', promise, 'reason:', reason);
  // Don't exit - let the application continue
});

export default app;
