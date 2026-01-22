/**
 * OpenAI service - Singleton client for AI operations
 *
 * Provides a singleton OpenAI client instance that is reused across requests
 * for efficient connection pooling.
 */

import OpenAI from 'openai';
import { config } from '../config/index.js';

// Lazy-initialized OpenAI client singleton
let openaiClient: OpenAI | null = null;

/**
 * Get the OpenAI client instance
 *
 * Lazily initializes the client on first call and returns the same
 * instance for all subsequent calls.
 *
 * @returns OpenAI client instance
 *
 * @example
 * ```typescript
 * const openai = getOpenAIClient();
 * const response = await openai.images.generate({
 *   model: 'dall-e-3',
 *   prompt: 'A painting...',
 * });
 * ```
 */
export function getOpenAIClient(): OpenAI {
  if (!openaiClient) {
    openaiClient = new OpenAI({
      apiKey: config.openai.apiKey,
    });
  }
  return openaiClient;
}

/**
 * Re-export OpenAI types for convenience
 */
export { OpenAI };
