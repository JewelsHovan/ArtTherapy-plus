/**
 * Integration tests for imageGeneration service
 *
 * SKIPPED: These tests require real API keys and make actual API calls.
 * Enable selectively during manual testing with valid credentials.
 *
 * To run:
 * 1. Set environment variables: DATABASE_URL, JWT_SECRET, OPENAI_API_KEY
 * 2. Optionally set: OPENROUTER_API_KEY, AZURE_STORAGE_CONNECTION_STRING
 * 3. Remove .skip from the describe block
 * 4. Run: npm test -- --testNamePattern="integration"
 *
 * Note: This file uses dynamic imports to avoid config validation errors
 * when running in environments without all required env vars.
 */

import { describe, it, expect, beforeAll } from 'vitest';
import type { ImageModel, StylePreset } from '../../utils/stylePresets.js';

// Types for the module
type GetAvailableModelsFn = () => ImageModel[];
type GenerateImageFn = (options: {
  description: string;
  model?: ImageModel;
  style?: StylePreset;
  userId: string;
}) => Promise<{
  success: boolean;
  imageUrl?: string;
  promptUsed?: string;
  modelUsed: ImageModel;
  styleUsed: StylePreset;
  error?: string;
}>;

// These will be populated by dynamic import inside the tests
let getAvailableModels: GetAvailableModelsFn;
let generateImage: GenerateImageFn;

describe.skip('imageGeneration - integration tests', () => {
  // Long timeout for API calls
  const TIMEOUT = 60000;

  beforeAll(async () => {
    // Dynamic import to defer config loading until tests actually run
    const mod = await import('../imageGeneration.js');
    getAvailableModels = mod.getAvailableModels;
    generateImage = mod.generateImage;
  });

  describe('getAvailableModels() - with real config', () => {
    it('should return available models based on environment', () => {
      const models = getAvailableModels();

      // DALL-E 3 should always be available
      expect(models).toContain('dall-e-3');

      // Log which models are available for manual verification
      console.log('Available models:', models);
    });
  });

  describe('generateImage() - DALL-E 3', () => {
    it(
      'should generate an image using DALL-E 3',
      async () => {
        const result = await generateImage({
          description: 'a gentle wave of warmth spreading through the body',
          model: 'dall-e-3',
          style: 'watercolor',
          userId: 'integration-test-user',
        });

        console.log('DALL-E 3 result:', {
          success: result.success,
          modelUsed: result.modelUsed,
          styleUsed: result.styleUsed,
          imageUrl: result.imageUrl?.substring(0, 100) + '...',
          error: result.error,
        });

        expect(result.success).toBe(true);
        expect(result.imageUrl).toBeDefined();
        expect(result.modelUsed).toBe('dall-e-3');
        expect(result.styleUsed).toBe('watercolor');
      },
      TIMEOUT
    );

    it(
      'should generate with default style',
      async () => {
        const result = await generateImage({
          description: 'tension releasing from tight muscles',
          model: 'dall-e-3',
          userId: 'integration-test-user',
        });

        expect(result.success).toBe(true);
        expect(result.styleUsed).toBe('default');
      },
      TIMEOUT
    );
  });

  describe('generateImage() - Flux Pro (OpenRouter)', () => {
    it(
      'should generate an image using Flux Pro',
      async () => {
        const models = getAvailableModels();
        if (!models.includes('flux-pro')) {
          console.log('Skipping: Flux Pro not available (OPENROUTER_API_KEY not set)');
          return;
        }

        const result = await generateImage({
          description: 'a soothing blue energy flowing through the spine',
          model: 'flux-pro',
          style: 'photorealism',
          userId: 'integration-test-user',
        });

        console.log('Flux Pro result:', {
          success: result.success,
          modelUsed: result.modelUsed,
          styleUsed: result.styleUsed,
          imageUrl: result.imageUrl?.substring(0, 100) + '...',
          error: result.error,
        });

        expect(result.success).toBe(true);
        expect(result.modelUsed).toBe('flux-pro');
      },
      TIMEOUT
    );
  });

  describe('generateImage() - Gemini Image (OpenRouter)', () => {
    it(
      'should generate an image using Gemini',
      async () => {
        const models = getAvailableModels();
        if (!models.includes('gemini-image')) {
          console.log('Skipping: Gemini Image not available (OPENROUTER_API_KEY not set)');
          return;
        }

        const result = await generateImage({
          description: 'peaceful clouds of healing light',
          model: 'gemini-image',
          style: 'abstract-expressionist',
          userId: 'integration-test-user',
        });

        console.log('Gemini Image result:', {
          success: result.success,
          modelUsed: result.modelUsed,
          styleUsed: result.styleUsed,
          imageUrl: result.imageUrl?.substring(0, 100) + '...',
          error: result.error,
        });

        expect(result.success).toBe(true);
        expect(result.modelUsed).toBe('gemini-image');
      },
      TIMEOUT
    );
  });

  describe('generateImage() - all styles', () => {
    // Test a subset of styles to save API costs
    it.each(['default', 'anime', 'minimalist'] as const)(
      'should generate with %s style',
      async (style) => {
        const result = await generateImage({
          description: 'comfort spreading through aching joints',
          model: 'dall-e-3',
          style: style,
          userId: 'integration-test-user',
        });

        expect(result.success).toBe(true);
        expect(result.styleUsed).toBe(style);
      },
      TIMEOUT
    );
  });

  describe('generateImage() - error handling', () => {
    it('should handle very long descriptions gracefully', async () => {
      const longDescription = 'a sensation of pain '.repeat(100);

      const result = await generateImage({
        description: longDescription,
        model: 'dall-e-3',
        userId: 'integration-test-user',
      });

      // Should either succeed (model handles truncation) or fail gracefully
      expect(result).toHaveProperty('success');
      if (!result.success) {
        expect(result.error).toBeDefined();
      }
    }, TIMEOUT);

    it('should handle special characters in description', async () => {
      const result = await generateImage({
        description: 'pain like <sharp> needles & "burning" 100% intensity',
        model: 'dall-e-3',
        userId: 'integration-test-user',
      });

      expect(result.success).toBe(true);
    }, TIMEOUT);
  });

  describe('generateImage() - storage integration', () => {
    it(
      'should store generated image in Azure Blob Storage',
      async () => {
        // This test requires AZURE_STORAGE_CONNECTION_STRING to be set

        const result = await generateImage({
          description: 'warmth radiating from the center',
          model: 'dall-e-3',
          style: 'default',
          userId: 'integration-test-storage',
        });

        console.log('Storage test result:', {
          success: result.success,
          imageUrl: result.imageUrl,
        });

        expect(result.success).toBe(true);

        // If storage is configured, URL should be from our storage domain
        // rather than a temporary DALL-E URL
        if (result.imageUrl && !result.imageUrl.includes('oaidalleapiprodscus')) {
          expect(result.imageUrl).toContain('blob.core.windows.net');
        }
      },
      TIMEOUT
    );
  });
});
