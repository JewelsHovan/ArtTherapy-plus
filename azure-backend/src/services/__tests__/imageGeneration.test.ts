/**
 * Unit Tests for Image Generation Service
 *
 * Tests the multi-model image generation service with mocked dependencies.
 * Covers OpenAI DALL-E 3 and OpenRouter (Flux Pro, Gemini) paths.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock modules BEFORE importing the service
vi.mock('../../config/index.js', () => ({
  config: {
    openai: { apiKey: 'test-openai-key' },
    openrouter: {
      apiKey: 'test-openrouter-key',
      baseUrl: 'https://openrouter.ai/api/v1',
    },
    storage: {
      connectionString: 'test-connection-string',
      containerName: 'test-container',
      publicUrl: 'https://test.blob.core.windows.net/images',
    },
  },
}));

vi.mock('../openai.js', () => ({
  getOpenAIClient: vi.fn(),
}));

vi.mock('../storage.js', () => ({
  storeImageFromUrl: vi.fn(),
  storeImageFromBase64: vi.fn(),
  generateImageKey: vi.fn(),
  getPublicUrl: vi.fn(),
}));

// Import after mocks are set up
import { generateImage, getAvailableModels } from '../imageGeneration.js';
import { getOpenAIClient } from '../openai.js';
import {
  storeImageFromUrl,
  storeImageFromBase64,
  generateImageKey,
  getPublicUrl,
} from '../storage.js';

describe('imageGeneration', () => {
  // Mock implementations
  const mockOpenAI = {
    images: {
      generate: vi.fn(),
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();

    // Default mock implementations
    vi.mocked(getOpenAIClient).mockReturnValue(mockOpenAI as unknown as ReturnType<typeof getOpenAIClient>);
    vi.mocked(generateImageKey).mockReturnValue('generated/user-123/timestamp-uuid.png');
    vi.mocked(getPublicUrl).mockReturnValue('https://test.blob.core.windows.net/images/generated/user-123/timestamp-uuid.png');
    vi.mocked(storeImageFromUrl).mockResolvedValue({ success: true, key: 'test-key' });
    vi.mocked(storeImageFromBase64).mockResolvedValue({ success: true, key: 'test-key' });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getAvailableModels', () => {
    it('should return all models when OpenRouter is configured', () => {
      const models = getAvailableModels();
      expect(models).toContain('dall-e-3');
      expect(models).toContain('flux-pro');
      expect(models).toContain('gemini-image');
      expect(models).toHaveLength(3);
    });
  });

  describe('generateImage - Input Validation', () => {
    it('should return error for invalid model', async () => {
      const result = await generateImage({
        description: 'test pain',
        model: 'invalid-model' as never,
        userId: 'user-123',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid model');
      expect(result.modelUsed).toBe('dall-e-3');
    });

    it('should return error for invalid style', async () => {
      const result = await generateImage({
        description: 'test pain',
        style: 'invalid-style' as never,
        userId: 'user-123',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid style');
    });

    it('should use default model and style when not specified', async () => {
      mockOpenAI.images.generate.mockResolvedValue({
        data: [{ url: 'https://dalle.url/image.png', revised_prompt: 'revised' }],
      });

      const result = await generateImage({
        description: 'test pain',
        userId: 'user-123',
      });

      expect(result.success).toBe(true);
      expect(result.modelUsed).toBe('dall-e-3');
      expect(result.styleUsed).toBe('default');
    });
  });

  describe('generateImage - OpenAI DALL-E 3', () => {
    it('should successfully generate image with DALL-E 3', async () => {
      mockOpenAI.images.generate.mockResolvedValue({
        data: [{
          url: 'https://oaidalleapiprodscus.blob.core.windows.net/temporary/image.png',
          revised_prompt: 'A beautiful abstract representation...',
        }],
      });

      const result = await generateImage({
        description: 'sharp pain in shoulder',
        model: 'dall-e-3',
        style: 'watercolor',
        userId: 'user-123',
      });

      expect(result.success).toBe(true);
      expect(result.modelUsed).toBe('dall-e-3');
      expect(result.styleUsed).toBe('watercolor');
      expect(result.imageUrl).toBeDefined();
      expect(result.promptUsed).toBe('A beautiful abstract representation...');

      expect(mockOpenAI.images.generate).toHaveBeenCalledWith(
        expect.objectContaining({
          model: 'dall-e-3',
          size: '1024x1024',
          quality: 'standard',
          n: 1,
        })
      );
    });

    it('should pass styled prompt to OpenAI', async () => {
      mockOpenAI.images.generate.mockResolvedValue({
        data: [{ url: 'https://dalle.url/image.png', revised_prompt: 'revised' }],
      });

      await generateImage({
        description: 'burning sensation',
        model: 'dall-e-3',
        style: 'anime',
        userId: 'user-123',
      });

      const callArgs = mockOpenAI.images.generate.mock.calls[0][0];
      expect(callArgs.prompt).toContain('burning sensation');
      expect(callArgs.prompt.toLowerCase()).toContain('anime');
    });

    it('should handle OpenAI API errors gracefully', async () => {
      mockOpenAI.images.generate.mockRejectedValue(new Error('OpenAI rate limit exceeded'));

      const result = await generateImage({
        description: 'test',
        model: 'dall-e-3',
        userId: 'user-123',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('rate limit');
    });

    it('should handle missing image URL in OpenAI response', async () => {
      mockOpenAI.images.generate.mockResolvedValue({ data: [{}] });

      const result = await generateImage({
        description: 'test',
        model: 'dall-e-3',
        userId: 'user-123',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('No image URL');
    });

    it('should handle empty response data', async () => {
      mockOpenAI.images.generate.mockResolvedValue({ data: [] });

      const result = await generateImage({
        description: 'test',
        model: 'dall-e-3',
        userId: 'user-123',
      });

      expect(result.success).toBe(false);
    });
  });

  describe('generateImage - OpenRouter Models', () => {
    const mockFetch = vi.fn();

    beforeEach(() => {
      vi.stubGlobal('fetch', mockFetch);
    });

    afterEach(() => {
      vi.unstubAllGlobals();
    });

    it('should successfully generate image with Flux Pro (URL response)', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          choices: [{
            message: {
              content: [{
                type: 'image_url',
                image_url: { url: 'https://generated.image/flux.png' },
              }],
            },
          }],
        }),
      });

      const result = await generateImage({
        description: 'abstract pain visualization',
        model: 'flux-pro',
        style: 'abstract-expressionist',
        userId: 'user-123',
      });

      expect(result.success).toBe(true);
      expect(result.modelUsed).toBe('flux-pro');
      expect(result.styleUsed).toBe('abstract-expressionist');

      expect(mockFetch).toHaveBeenCalledWith(
        'https://openrouter.ai/api/v1/chat/completions',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            Authorization: 'Bearer test-openrouter-key',
            'Content-Type': 'application/json',
          }),
        })
      );
    });

    it('should handle base64 images array response from OpenRouter', async () => {
      const testBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          choices: [{
            message: {
              images: [testBase64],
            },
          }],
        }),
      });

      const result = await generateImage({
        description: 'test',
        model: 'gemini-image',
        userId: 'user-123',
      });

      expect(result.success).toBe(true);
      expect(storeImageFromBase64).toHaveBeenCalled();
    });

    it('should handle data URL response from OpenRouter', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          choices: [{
            message: {
              content: [{
                type: 'image_url',
                image_url: { url: 'data:image/png;base64,iVBORw0KGgo...' },
              }],
            },
          }],
        }),
      });

      const result = await generateImage({
        description: 'test',
        model: 'flux-pro',
        userId: 'user-123',
      });

      expect(result.success).toBe(true);
      expect(storeImageFromBase64).toHaveBeenCalled();
    });

    it('should handle OpenRouter API errors', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 429,
        text: () => Promise.resolve('Rate limit exceeded'),
      });

      const result = await generateImage({
        description: 'test',
        model: 'flux-pro',
        userId: 'user-123',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('OpenRouter API error: 429');
    });

    it('should handle no image in OpenRouter response', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          choices: [{
            message: {
              content: 'I cannot generate images',
            },
          }],
        }),
      });

      const result = await generateImage({
        description: 'test',
        model: 'flux-pro',
        userId: 'user-123',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('No image returned');
    });

    it('should send correct body to OpenRouter', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          choices: [{
            message: {
              content: [{
                type: 'image_url',
                image_url: { url: 'https://image.url/test.png' },
              }],
            },
          }],
        }),
      });

      await generateImage({
        description: 'test pain',
        model: 'flux-pro',
        style: 'photorealism',
        userId: 'user-123',
      });

      const callArgs = mockFetch.mock.calls[0];
      const body = JSON.parse(callArgs[1].body);

      expect(body.model).toBe('black-forest-labs/flux-pro-1.1');
      expect(body.messages[0].role).toBe('user');
      expect(body.messages[0].content).toContain('test pain');
      expect(body.modalities).toContain('image');
    });
  });

  describe('generateImage - Storage Integration', () => {
    it('should store image and return public URL on success', async () => {
      mockOpenAI.images.generate.mockResolvedValue({
        data: [{ url: 'https://temp.dalle.url/image.png', revised_prompt: 'revised' }],
      });
      vi.mocked(storeImageFromUrl).mockResolvedValue({ success: true, key: 'stored-key' });
      vi.mocked(getPublicUrl).mockReturnValue('https://storage.blob/images/stored-key');

      const result = await generateImage({
        description: 'test',
        model: 'dall-e-3',
        userId: 'user-123',
      });

      expect(result.success).toBe(true);
      expect(result.imageUrl).toBe('https://storage.blob/images/stored-key');
      expect(storeImageFromUrl).toHaveBeenCalledWith(
        'https://temp.dalle.url/image.png',
        expect.any(String),
        expect.objectContaining({
          userId: 'user-123',
        })
      );
    });

    it('should fall back to temporary URL if storage fails for DALL-E', async () => {
      mockOpenAI.images.generate.mockResolvedValue({
        data: [{ url: 'https://temp.dalle.url/image.png', revised_prompt: 'revised' }],
      });
      vi.mocked(storeImageFromUrl).mockResolvedValue({
        success: false,
        error: 'Storage unavailable',
      });

      const result = await generateImage({
        description: 'test',
        model: 'dall-e-3',
        userId: 'user-123',
      });

      expect(result.success).toBe(true);
      expect(result.imageUrl).toBe('https://temp.dalle.url/image.png');
    });

    it('should call generateImageKey with correct userId', async () => {
      mockOpenAI.images.generate.mockResolvedValue({
        data: [{ url: 'https://temp.url/image.png', revised_prompt: 'revised' }],
      });

      await generateImage({
        description: 'test',
        model: 'dall-e-3',
        userId: 'specific-user-456',
      });

      expect(generateImageKey).toHaveBeenCalledWith('specific-user-456', 'generated');
    });

    it('should include metadata when storing image', async () => {
      mockOpenAI.images.generate.mockResolvedValue({
        data: [{ url: 'https://temp.url/image.png', revised_prompt: 'revised prompt' }],
      });

      await generateImage({
        description: 'shoulder pain',
        model: 'dall-e-3',
        style: 'watercolor',
        userId: 'user-123',
      });

      expect(storeImageFromUrl).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String),
        expect.objectContaining({
          userId: 'user-123',
          description: 'shoulder pain',
          model: 'dall-e-3',
          style: 'watercolor',
        })
      );
    });
  });

  describe('generateImage - Error Handling', () => {
    it('should catch and return generic errors', async () => {
      mockOpenAI.images.generate.mockRejectedValue(new Error('Network error'));

      const result = await generateImage({
        description: 'test',
        model: 'dall-e-3',
        userId: 'user-123',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Network error');
      expect(result.modelUsed).toBe('dall-e-3');
    });

    it('should handle non-Error exceptions', async () => {
      mockOpenAI.images.generate.mockRejectedValue('string error');

      const result = await generateImage({
        description: 'test',
        model: 'dall-e-3',
        userId: 'user-123',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Unknown error');
    });
  });
});
