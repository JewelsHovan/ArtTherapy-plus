/**
 * Global error handling middleware
 *
 * Provides consistent error response format across the API.
 * Handles both expected and unexpected errors.
 */

import { Request, Response, NextFunction } from 'express';

/**
 * Custom API error class with error code
 */
export class ApiError extends Error {
  public readonly code: string;
  public readonly statusCode: number;

  constructor(message: string, code: string, statusCode: number = 500) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.statusCode = statusCode;

    // Maintains proper stack trace for where error was thrown
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Common API errors
 */
export const Errors = {
  /** Resource not found */
  notFound: (resource: string = 'Resource') =>
    new ApiError(`${resource} not found`, 'NOT_FOUND', 404),

  /** Validation error */
  validation: (message: string) =>
    new ApiError(message, 'VALIDATION_ERROR', 400),

  /** Authentication required */
  unauthorized: (message: string = 'Authentication required') =>
    new ApiError(message, 'UNAUTHORIZED', 401),

  /** Permission denied */
  forbidden: (message: string = 'Permission denied') =>
    new ApiError(message, 'FORBIDDEN', 403),

  /** Conflict (e.g., duplicate resource) */
  conflict: (message: string) =>
    new ApiError(message, 'CONFLICT', 409),

  /** Internal server error */
  internal: (message: string = 'Internal server error') =>
    new ApiError(message, 'INTERNAL_ERROR', 500),
};

/**
 * Global error handling middleware
 *
 * Catches all errors thrown in route handlers and returns
 * a consistent error response format: { error, code }
 *
 * @example
 * ```typescript
 * // In route handler:
 * throw new ApiError('User not found', 'NOT_FOUND', 404);
 *
 * // Response:
 * // { "error": "User not found", "code": "NOT_FOUND" }
 * ```
 */
export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  // Log error for debugging (in production, use proper logging)
  console.error('Error:', err);

  // Handle known API errors
  if (err instanceof ApiError) {
    res.status(err.statusCode).json({
      error: err.message,
      code: err.code,
    });
    return;
  }

  // Handle JSON parsing errors
  if (err instanceof SyntaxError && 'body' in err) {
    res.status(400).json({
      error: 'Invalid JSON in request body',
      code: 'INVALID_JSON',
    });
    return;
  }

  // Handle unknown errors
  // In production, don't leak error details
  const isProduction = process.env.NODE_ENV === 'production';

  res.status(500).json({
    error: isProduction ? 'Internal server error' : err.message,
    code: 'INTERNAL_ERROR',
  });
}

/**
 * Not found handler for unknown routes
 *
 * Should be added after all other routes.
 *
 * @example
 * ```typescript
 * app.use('/api', apiRoutes);
 * app.use(notFoundHandler);
 * app.use(errorHandler);
 * ```
 */
export function notFoundHandler(
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  res.status(404).json({
    error: 'Not found',
    code: 'NOT_FOUND',
  });
}
