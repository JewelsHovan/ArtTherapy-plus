/**
 * Unit tests for imageGeneration service
 *
 * Tests multi-model image generation with mocked dependencies.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock modules before importing the service
vi.mock('../openai.js', () => ({
  getOpenAIClient: vi.fn(),
}));

vi.mock('../storage.js', () => ({
  storeImageFromUrl: vi.fn(),
  storeImageFromBase64: vi.fn(),
  generateImageKey: vi.fn(),
  getPublicUrl: vi.fn(),
}));

vi.mock('../../config/index.js', () => ({
  config: {
    openai: { apiKey: 'test-openai-key' },
    storage: {
      connectionString: '',
      containerName: 'images',
      publicUrl: '',
    },
    openrouter: undefined,
  },
}));

// Import after mocks are set up
import { getAvailableModels, generateImage } from '../imageGeneration.js';
import { getOpenAIClient } from '../openai.js';
import {
  storeImageFromUrl,
  storeImageFromBase64,
  generateImageKey,
  getPublicUrl,
} from '../storage.js';
import { config } from '../../config/index.js';

// Type the mocked functions
const mockedGetOpenAIClient = vi.mocked(getOpenAIClient);
const mockedStoreImageFromUrl = vi.mocked(storeImageFromUrl);
const mockedStoreImageFromBase64 = vi.mocked(storeImageFromBase64);
const mockedGenerateImageKey = vi.mocked(generateImageKey);
const mockedGetPublicUrl = vi.mocked(getPublicUrl);

describe('imageGeneration service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset config to base state
    Object.assign(config, {
      openai: { apiKey: 'test-openai-key' },
      storage: {
        connectionString: '',
        containerName: 'images',
        publicUrl: '',
      },
      openrouter: undefined,
    });

    // Set up default mock returns
    mockedGenerateImageKey.mockReturnValue('generated/user-123/timestamp-uuid.png');
    mockedGetPublicUrl.mockReturnValue('https://storage.example.com/images/generated/user-123/timestamp-uuid.png');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getAvailableModels()', () => {
    it('should return only dall-e-3 when OpenRouter is not configured', () => {
      // Config already has openrouter: undefined
      const models = getAvailableModels();
      expect(models).toEqual(['dall-e-3']);
      expect(models).not.toContain('flux-pro');
      expect(models).not.toContain('gemini-image');
    });

    it('should return all 3 models when OpenRouter is configured', () => {
      // Enable OpenRouter
      Object.assign(config, {
        openrouter: {
          apiKey: 'test-openrouter-key',
          baseUrl: 'https://openrouter.ai/api/v1',
        },
      });

      const models = getAvailableModels();
      expect(models).toHaveLength(3);
      expect(models).toContain('dall-e-3');
      expect(models).toContain('flux-pro');
      expect(models).toContain('gemini-image');
    });
  });

  describe('generateImage() - input validation', () => {
    it('should return error for invalid model', async () => {
      const result = await generateImage({
        description: 'test pain',
        model: 'invalid-model' as any,
        userId: 'user-123',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid model');
      expect(result.error).toContain('invalid-model');
      expect(result.modelUsed).toBe('dall-e-3'); // Default fallback
      expect(result.styleUsed).toBe('default');
    });

    it('should return error for invalid style', async () => {
      const result = await generateImage({
        description: 'test pain',
        style: 'invalid-style' as any,
        userId: 'user-123',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid style');
      expect(result.error).toContain('invalid-style');
    });

    it('should return error when model is not available', async () => {
      // OpenRouter not configured, but flux-pro requested
      const result = await generateImage({
        description: 'test pain',
        model: 'flux-pro',
        userId: 'user-123',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('not available');
      expect(result.error).toContain('OPENROUTER_API_KEY');
    });

    it('should use default model and style when not specified', async () => {
      // Set up OpenAI mock
      const mockOpenAI = {
        images: {
          generate: vi.fn().mockResolvedValue({
            data: [{ url: 'https://dalle.example.com/image.png', revised_prompt: 'revised prompt' }],
          }),
        },
      };
      mockedGetOpenAIClient.mockReturnValue(mockOpenAI as any);

      const result = await generateImage({
        description: 'test pain',
        userId: 'user-123',
      });

      expect(result.modelUsed).toBe('dall-e-3');
      expect(result.styleUsed).toBe('default');
    });
  });

  describe('generateImage() - DALL-E 3', () => {
    const mockDalleUrl = 'https://dalle.example.com/generated-image.png';
    const mockRevisedPrompt = 'A beautiful artistic interpretation...';

    beforeEach(() => {
      const mockOpenAI = {
        images: {
          generate: vi.fn().mockResolvedValue({
            data: [{ url: mockDalleUrl, revised_prompt: mockRevisedPrompt }],
          }),
        },
      };
      mockedGetOpenAIClient.mockReturnValue(mockOpenAI as any);
    });

    it('should generate image with DALL-E 3 and return temporary URL when storage not configured', async () => {
      const result = await generateImage({
        description: 'sharp pain in my shoulder',
        model: 'dall-e-3',
        style: 'watercolor',
        userId: 'user-123',
      });

      expect(result.success).toBe(true);
      expect(result.imageUrl).toBe(mockDalleUrl);
      expect(result.modelUsed).toBe('dall-e-3');
      expect(result.styleUsed).toBe('watercolor');
      expect(result.promptUsed).toBe(mockRevisedPrompt);

      // Verify OpenAI client was called correctly
      const mockOpenAI = mockedGetOpenAIClient();
      expect(mockOpenAI.images.generate).toHaveBeenCalledWith({
        model: 'dall-e-3',
        prompt: expect.stringContaining('sharp pain in my shoulder'),
        size: '1024x1024',
        quality: 'standard',
        n: 1,
      });
    });

    it('should store image and return public URL when storage is configured', async () => {
      // Configure storage
      Object.assign(config.storage, {
        connectionString: 'connection-string',
        publicUrl: 'https://storage.example.com/images',
      });

      mockedStoreImageFromUrl.mockResolvedValue({ success: true, key: 'generated/user-123/image.png' });

      const result = await generateImage({
        description: 'test pain',
        model: 'dall-e-3',
        userId: 'user-123',
      });

      expect(result.success).toBe(true);
      expect(result.imageUrl).toBe('https://storage.example.com/images/generated/user-123/timestamp-uuid.png');

      // Verify storage was called
      expect(mockedStoreImageFromUrl).toHaveBeenCalledWith(
        mockDalleUrl,
        expect.any(String),
        expect.objectContaining({
          userId: 'user-123',
          model: 'dall-e-3',
          style: 'default',
        })
      );
    });

    it('should fall back to temporary URL when storage fails', async () => {
      // Configure storage
      Object.assign(config.storage, {
        connectionString: 'connection-string',
        publicUrl: 'https://storage.example.com/images',
      });

      mockedStoreImageFromUrl.mockResolvedValue({ success: false, error: 'Storage error' });

      const result = await generateImage({
        description: 'test pain',
        model: 'dall-e-3',
        userId: 'user-123',
      });

      expect(result.success).toBe(true);
      expect(result.imageUrl).toBe(mockDalleUrl); // Falls back to DALL-E URL
    });

    it('should handle DALL-E API error', async () => {
      const mockOpenAI = {
        images: {
          generate: vi.fn().mockRejectedValue(new Error('API rate limit exceeded')),
        },
      };
      mockedGetOpenAIClient.mockReturnValue(mockOpenAI as any);

      const result = await generateImage({
        description: 'test pain',
        model: 'dall-e-3',
        userId: 'user-123',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('API rate limit exceeded');
    });

    it('should handle missing image URL in DALL-E response', async () => {
      const mockOpenAI = {
        images: {
          generate: vi.fn().mockResolvedValue({
            data: [{}], // No URL in response
          }),
        },
      };
      mockedGetOpenAIClient.mockReturnValue(mockOpenAI as any);

      const result = await generateImage({
        description: 'test pain',
        model: 'dall-e-3',
        userId: 'user-123',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('No image URL returned from DALL-E');
    });
  });

  describe('generateImage() - OpenRouter models', () => {
    const mockFetchResponse = {
      ok: true,
      json: vi.fn(),
      text: vi.fn().mockResolvedValue(''),
    };

    beforeEach(() => {
      // Enable OpenRouter
      Object.assign(config, {
        openrouter: {
          apiKey: 'test-openrouter-key',
          baseUrl: 'https://openrouter.ai/api/v1',
        },
        storage: {
          connectionString: 'connection-string',
          containerName: 'images',
          publicUrl: 'https://storage.example.com/images',
        },
      });

      // Mock global fetch
      global.fetch = vi.fn().mockResolvedValue(mockFetchResponse as any);

      mockedStoreImageFromUrl.mockResolvedValue({ success: true, key: 'generated/user-123/image.png' });
      mockedStoreImageFromBase64.mockResolvedValue({ success: true, key: 'generated/user-123/image.png' });
    });

    afterEach(() => {
      vi.unstubAllGlobals();
    });

    it('should generate image with Flux Pro via OpenRouter (URL format)', async () => {
      mockFetchResponse.json.mockResolvedValue({
        choices: [{
          message: {
            content: [{
              type: 'image_url',
              image_url: { url: 'https://openrouter.images.com/flux-image.png' },
            }],
          },
        }],
      });

      const result = await generateImage({
        description: 'test pain',
        model: 'flux-pro',
        style: 'photorealism',
        userId: 'user-123',
      });

      expect(result.success).toBe(true);
      expect(result.modelUsed).toBe('flux-pro');
      expect(result.styleUsed).toBe('photorealism');

      // Verify fetch was called with correct params
      expect(global.fetch).toHaveBeenCalledWith(
        'https://openrouter.ai/api/v1/chat/completions',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            Authorization: 'Bearer test-openrouter-key',
            'Content-Type': 'application/json',
          }),
          body: expect.stringContaining('black-forest-labs/flux-pro-1.1'),
        })
      );

      // Verify storage from URL was called
      expect(mockedStoreImageFromUrl).toHaveBeenCalled();
    });

    it('should generate image with Gemini via OpenRouter (base64 format)', async () => {
      const mockBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAAB...';
      mockFetchResponse.json.mockResolvedValue({
        choices: [{
          message: {
            content: [{
              type: 'image_url',
              image_url: { url: mockBase64 },
            }],
          },
        }],
      });

      const result = await generateImage({
        description: 'test pain',
        model: 'gemini-image',
        userId: 'user-123',
      });

      expect(result.success).toBe(true);
      expect(result.modelUsed).toBe('gemini-image');

      // Verify fetch used gemini model
      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: expect.stringContaining('google/gemini-2.0-flash-exp:free'),
        })
      );

      // Verify storage from base64 was called
      expect(mockedStoreImageFromBase64).toHaveBeenCalled();
    });

    it('should handle OpenRouter images array format', async () => {
      mockFetchResponse.json.mockResolvedValue({
        choices: [{
          message: {
            images: ['base64EncodedImageData...'],
          },
        }],
      });

      const result = await generateImage({
        description: 'test pain',
        model: 'flux-pro',
        userId: 'user-123',
      });

      expect(result.success).toBe(true);
      expect(mockedStoreImageFromBase64).toHaveBeenCalled();
    });

    it('should handle OpenRouter API error', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 429,
        text: vi.fn().mockResolvedValue('Rate limit exceeded'),
      } as any);

      const result = await generateImage({
        description: 'test pain',
        model: 'flux-pro',
        userId: 'user-123',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('OpenRouter API error');
      expect(result.error).toContain('429');
    });

    it('should handle no image in OpenRouter response', async () => {
      mockFetchResponse.json.mockResolvedValue({
        choices: [{
          message: {
            content: 'Sorry, I cannot generate that image.',
          },
        }],
      });

      const result = await generateImage({
        description: 'test pain',
        model: 'flux-pro',
        userId: 'user-123',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('No image returned from OpenRouter');
    });

    it('should handle storage failure for OpenRouter images', async () => {
      mockFetchResponse.json.mockResolvedValue({
        choices: [{
          message: {
            content: [{
              type: 'image_url',
              image_url: { url: 'https://openrouter.images.com/image.png' },
            }],
          },
        }],
      });

      mockedStoreImageFromUrl.mockResolvedValue({ success: false, error: 'Storage unavailable' });

      const result = await generateImage({
        description: 'test pain',
        model: 'flux-pro',
        userId: 'user-123',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Failed to store image');
    });

    it('should return base64/URL directly when storage is not configured', async () => {
      // Disable storage
      Object.assign(config.storage, {
        connectionString: '',
        publicUrl: '',
      });

      const mockUrl = 'https://openrouter.images.com/image.png';
      mockFetchResponse.json.mockResolvedValue({
        choices: [{
          message: {
            content: [{
              type: 'image_url',
              image_url: { url: mockUrl },
            }],
          },
        }],
      });

      const result = await generateImage({
        description: 'test pain',
        model: 'flux-pro',
        userId: 'user-123',
      });

      expect(result.success).toBe(true);
      expect(result.imageUrl).toBe(mockUrl);
      expect(mockedStoreImageFromUrl).not.toHaveBeenCalled();
    });
  });

  describe('generateImage() - styled prompts', () => {
    beforeEach(() => {
      const mockOpenAI = {
        images: {
          generate: vi.fn().mockResolvedValue({
            data: [{ url: 'https://dalle.example.com/image.png', revised_prompt: 'revised' }],
          }),
        },
      };
      mockedGetOpenAIClient.mockReturnValue(mockOpenAI as any);
    });

    it('should apply style template to prompt', async () => {
      await generateImage({
        description: 'burning sensation',
        model: 'dall-e-3',
        style: 'anime',
        userId: 'user-123',
      });

      const mockOpenAI = mockedGetOpenAIClient();
      const callArgs = mockOpenAI.images.generate.mock.calls[0][0];

      // The prompt should contain the description and anime-related keywords
      expect(callArgs.prompt).toContain('burning sensation');
      expect(callArgs.prompt.toLowerCase()).toContain('anime');
    });

    it('should apply default style when not specified', async () => {
      await generateImage({
        description: 'test pain',
        model: 'dall-e-3',
        userId: 'user-123',
      });

      const mockOpenAI = mockedGetOpenAIClient();
      const callArgs = mockOpenAI.images.generate.mock.calls[0][0];

      // Default style includes "art therapy" related keywords
      expect(callArgs.prompt).toContain('test pain');
      expect(callArgs.prompt.toLowerCase()).toContain('abstract');
    });
  });
});
