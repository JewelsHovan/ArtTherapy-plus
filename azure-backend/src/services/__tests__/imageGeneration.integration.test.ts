/**
 * Integration Tests for Image Generation Service
 *
 * These tests hit REAL APIs and are SKIPPED by default.
 *
 * Requirements to run:
 * 1. OPENAI_API_KEY must be configured
 * 2. OPENROUTER_API_KEY for OpenRouter model tests
 * 3. Run: npm run test:integration
 *
 * WARNING: These tests cost money (API calls) and are slow.
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { generateImage, getAvailableModels } from '../imageGeneration.js';
import { config } from '../../config/index.js';

describe.skip('imageGeneration - Integration Tests', () => {
  beforeAll(() => {
    // Verify API keys are present
    if (!config.openai?.apiKey) {
      throw new Error('OPENAI_API_KEY required for integration tests');
    }
  });

  describe('Model Availability', () => {
    it('should reflect actual configuration', () => {
      const models = getAvailableModels();

      console.log('Available models:', models);

      expect(models).toContain('dall-e-3'); // Always available

      if (config.openrouter?.apiKey) {
        expect(models).toContain('flux-pro');
        expect(models).toContain('gemini-image');
        console.log('OpenRouter models available');
      } else {
        expect(models).not.toContain('flux-pro');
        expect(models).not.toContain('gemini-image');
        console.log('OpenRouter not configured - only DALL-E 3 available');
      }
    });
  });

  describe('OpenAI DALL-E 3 (Real API)', () => {
    it('should generate an actual image with DALL-E 3', async () => {
      const result = await generateImage({
        description: 'a calm ocean wave at sunset',
        model: 'dall-e-3',
        style: 'watercolor',
        userId: 'integration-test',
      });

      console.log('DALL-E 3 Result:', {
        success: result.success,
        imageUrl: result.imageUrl?.substring(0, 100) + '...',
        promptUsed: result.promptUsed?.substring(0, 100) + '...',
      });

      expect(result.success).toBe(true);
      expect(result.imageUrl).toBeDefined();
      expect(result.imageUrl).toMatch(/^https?:\/\//);
      expect(result.promptUsed).toBeDefined();
      expect(result.modelUsed).toBe('dall-e-3');
      expect(result.styleUsed).toBe('watercolor');
    }, 60000); // 60 second timeout

    it('should generate with default style', async () => {
      const result = await generateImage({
        description: 'peaceful garden',
        model: 'dall-e-3',
        userId: 'integration-test',
      });

      expect(result.success).toBe(true);
      expect(result.styleUsed).toBe('default');
    }, 60000);
  });

  describe('OpenRouter Models (Real API)', () => {
    beforeAll(() => {
      if (!config.openrouter?.apiKey) {
        console.warn('OPENROUTER_API_KEY not configured - skipping OpenRouter tests');
      }
    });

    it('should generate an image with Flux Pro', async () => {
      if (!config.openrouter?.apiKey) {
        console.log('Skipping - OpenRouter not configured');
        return;
      }

      const result = await generateImage({
        description: 'a peaceful forest path',
        model: 'flux-pro',
        style: 'photorealism',
        userId: 'integration-test',
      });

      console.log('Flux Pro Result:', {
        success: result.success,
        error: result.error,
        imageUrl: result.imageUrl?.substring(0, 100),
      });

      expect(result.success).toBe(true);
      expect(result.imageUrl).toBeDefined();
      expect(result.modelUsed).toBe('flux-pro');
    }, 90000); // 90 second timeout

    it('should generate an image with Gemini Flash (free tier)', async () => {
      if (!config.openrouter?.apiKey) {
        console.log('Skipping - OpenRouter not configured');
        return;
      }

      const result = await generateImage({
        description: 'a colorful abstract pattern',
        model: 'gemini-image',
        style: 'abstract-expressionist',
        userId: 'integration-test',
      });

      console.log('Gemini Flash Result:', {
        success: result.success,
        error: result.error,
        imageUrl: result.imageUrl?.substring(0, 100),
      });

      expect(result.success).toBe(true);
      expect(result.imageUrl).toBeDefined();
      expect(result.modelUsed).toBe('gemini-image');
    }, 90000);
  });

  describe('Style Presets (Real API)', () => {
    const styles = [
      'default',
      'photorealism',
      'oil-painting',
      'watercolor',
      'cartoon',
      'anime',
      'abstract-expressionist',
      'minimalist',
    ] as const;

    it.each(styles)('should generate image with %s style', async (style) => {
      const result = await generateImage({
        description: 'a feeling of tension',
        model: 'dall-e-3',
        style,
        userId: 'integration-test',
      });

      console.log(`Style "${style}":`, {
        success: result.success,
        promptUsed: result.promptUsed?.substring(0, 80) + '...',
      });

      expect(result.success).toBe(true);
      expect(result.styleUsed).toBe(style);
      expect(result.promptUsed).toBeDefined();
    }, 60000);
  });

  describe('Error Scenarios', () => {
    it('should handle invalid model gracefully', async () => {
      const result = await generateImage({
        description: 'test',
        model: 'invalid-model' as never,
        userId: 'integration-test',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid model');
    });

    it('should handle unavailable model gracefully', async () => {
      // Force test unavailable model by testing without OpenRouter
      if (config.openrouter?.apiKey) {
        console.log('Skipping - OpenRouter is configured, model is available');
        return;
      }

      const result = await generateImage({
        description: 'test',
        model: 'flux-pro',
        userId: 'integration-test',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('not available');
    });
  });
});

/**
 * Manual Testing Checklist
 *
 * When running integration tests manually, verify:
 *
 * [ ] DALL-E 3 with each style preset generates unique images
 * [ ] Flux Pro (if configured) generates high-quality artistic images
 * [ ] Gemini Flash (if configured) generates images quickly
 * [ ] Generated image URLs are accessible and display correctly
 * [ ] Styled prompts include style-specific instructions
 * [ ] Error messages are clear and actionable
 * [ ] Storage integration saves images to Azure Blob (if configured)
 *
 * To enable integration tests:
 * 1. Remove `.skip` from the describe block
 * 2. Ensure API keys are configured in .env
 * 3. Run: npm run test -- src/services/__tests__/imageGeneration.integration.test.ts
 */
