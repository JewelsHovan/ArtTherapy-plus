/**
 * Unit Tests for Style Presets
 *
 * Tests pure functions for model and style validation,
 * lookup, and prompt generation.
 */

import { describe, it, expect } from 'vitest';
import {
  isValidModel,
  isValidStyle,
  getModelInfo,
  getStyleInfo,
  getStylePrompt,
  IMAGE_MODELS,
  STYLE_PRESETS,
  type ImageModel,
  type StylePreset,
} from '../stylePresets.js';

describe('stylePresets', () => {
  describe('Constants', () => {
    it('should have 3 image models defined', () => {
      expect(IMAGE_MODELS).toHaveLength(3);
    });

    it('should have 8 style presets defined', () => {
      expect(STYLE_PRESETS).toHaveLength(8);
    });

    it('should have dall-e-3 as openai provider', () => {
      const dalleModel = IMAGE_MODELS.find((m) => m.id === 'dall-e-3');
      expect(dalleModel).toBeDefined();
      expect(dalleModel?.provider).toBe('openai');
      expect(dalleModel?.costTier).toBe('high');
    });

    it('should have flux-pro as openrouter provider with correct ID', () => {
      const fluxModel = IMAGE_MODELS.find((m) => m.id === 'flux-pro');
      expect(fluxModel).toBeDefined();
      expect(fluxModel?.provider).toBe('openrouter');
      expect(fluxModel?.openrouterId).toBe('black-forest-labs/flux-pro-1.1');
      expect(fluxModel?.costTier).toBe('medium');
    });

    it('should have gemini-image as openrouter provider with correct ID', () => {
      const geminiModel = IMAGE_MODELS.find((m) => m.id === 'gemini-image');
      expect(geminiModel).toBeDefined();
      expect(geminiModel?.provider).toBe('openrouter');
      expect(geminiModel?.openrouterId).toBe('google/gemini-2.0-flash-exp:free');
      expect(geminiModel?.costTier).toBe('low');
    });

    it('should have all style presets with valid structure', () => {
      STYLE_PRESETS.forEach((style) => {
        expect(style.id).toBeDefined();
        expect(style.name).toBeDefined();
        expect(style.description).toBeDefined();
        expect(style.promptTemplate).toBeDefined();
        expect(style.promptTemplate).toContain('{description}');
      });
    });

    it('should have all models with valid structure', () => {
      IMAGE_MODELS.forEach((model) => {
        expect(model.id).toBeDefined();
        expect(model.name).toBeDefined();
        expect(model.description).toBeDefined();
        expect(model.provider).toMatch(/^(openai|openrouter)$/);
        expect(model.costTier).toMatch(/^(low|medium|high)$/);

        // OpenRouter models should have openrouterId
        if (model.provider === 'openrouter') {
          expect(model.openrouterId).toBeDefined();
        }
      });
    });
  });

  describe('isValidModel', () => {
    it('should return true for dall-e-3', () => {
      expect(isValidModel('dall-e-3')).toBe(true);
    });

    it('should return true for flux-pro', () => {
      expect(isValidModel('flux-pro')).toBe(true);
    });

    it('should return true for gemini-image', () => {
      expect(isValidModel('gemini-image')).toBe(true);
    });

    it('should return false for invalid model strings', () => {
      expect(isValidModel('invalid-model')).toBe(false);
      expect(isValidModel('')).toBe(false);
      expect(isValidModel('gpt-4')).toBe(false);
      expect(isValidModel('midjourney')).toBe(false);
    });

    it('should return false for case-mismatched models', () => {
      expect(isValidModel('DALL-E-3')).toBe(false);
      expect(isValidModel('Dall-E-3')).toBe(false);
      expect(isValidModel('FLUX-PRO')).toBe(false);
    });
  });

  describe('isValidStyle', () => {
    const validStyles: StylePreset[] = [
      'default',
      'photorealism',
      'oil-painting',
      'watercolor',
      'cartoon',
      'anime',
      'abstract-expressionist',
      'minimalist',
    ];

    it.each(validStyles)('should return true for valid style: %s', (style) => {
      expect(isValidStyle(style)).toBe(true);
    });

    it('should return false for invalid style strings', () => {
      expect(isValidStyle('invalid-style')).toBe(false);
      expect(isValidStyle('')).toBe(false);
      expect(isValidStyle('impressionist')).toBe(false);
      expect(isValidStyle('sketch')).toBe(false);
    });

    it('should return false for case-mismatched styles', () => {
      expect(isValidStyle('Default')).toBe(false);
      expect(isValidStyle('WATERCOLOR')).toBe(false);
      expect(isValidStyle('Oil-Painting')).toBe(false);
    });
  });

  describe('getModelInfo', () => {
    it('should return correct info for dall-e-3', () => {
      const info = getModelInfo('dall-e-3');
      expect(info).toBeDefined();
      expect(info?.id).toBe('dall-e-3');
      expect(info?.name).toBe('DALL-E 3');
      expect(info?.provider).toBe('openai');
      expect(info?.costTier).toBe('high');
    });

    it('should return correct info for flux-pro', () => {
      const info = getModelInfo('flux-pro');
      expect(info).toBeDefined();
      expect(info?.id).toBe('flux-pro');
      expect(info?.name).toBe('Flux Pro');
      expect(info?.provider).toBe('openrouter');
      expect(info?.openrouterId).toBe('black-forest-labs/flux-pro-1.1');
    });

    it('should return correct info for gemini-image', () => {
      const info = getModelInfo('gemini-image');
      expect(info).toBeDefined();
      expect(info?.id).toBe('gemini-image');
      expect(info?.name).toBe('Gemini Flash');
      expect(info?.provider).toBe('openrouter');
      expect(info?.openrouterId).toBe('google/gemini-2.0-flash-exp:free');
    });

    it('should return undefined for unknown model', () => {
      // Using type assertion since we're testing runtime behavior
      const result = getModelInfo('unknown' as ImageModel);
      expect(result).toBeUndefined();
    });
  });

  describe('getStyleInfo', () => {
    it('should return correct info for default style', () => {
      const info = getStyleInfo('default');
      expect(info).toBeDefined();
      expect(info?.id).toBe('default');
      expect(info?.name).toBe('Art Therapy');
      expect(info?.promptTemplate).toContain('{description}');
    });

    it('should return correct info for watercolor style', () => {
      const info = getStyleInfo('watercolor');
      expect(info).toBeDefined();
      expect(info?.id).toBe('watercolor');
      expect(info?.name).toBe('Watercolor');
      expect(info?.description).toContain('Soft');
    });

    it('should return correct info for all styles', () => {
      const styles: StylePreset[] = [
        'default',
        'photorealism',
        'oil-painting',
        'watercolor',
        'cartoon',
        'anime',
        'abstract-expressionist',
        'minimalist',
      ];

      styles.forEach((styleId) => {
        const info = getStyleInfo(styleId);
        expect(info).toBeDefined();
        expect(info?.id).toBe(styleId);
      });
    });

    it('should return undefined for unknown style', () => {
      const result = getStyleInfo('unknown' as StylePreset);
      expect(result).toBeUndefined();
    });
  });

  describe('getStylePrompt', () => {
    const testDescription = 'a sharp pain in my shoulder';

    it('should replace {description} placeholder with provided description', () => {
      const result = getStylePrompt('default', testDescription);
      expect(result).toContain(testDescription);
      expect(result).not.toContain('{description}');
    });

    it('should return original description if style not found', () => {
      const description = 'test description';
      const result = getStylePrompt('invalid' as StylePreset, description);
      expect(result).toBe(description);
    });

    it('should handle empty description', () => {
      const result = getStylePrompt('default', '');
      expect(result).not.toContain('{description}');
      expect(result.length).toBeGreaterThan(0);
    });

    it('should produce different prompts for different styles', () => {
      const defaultPrompt = getStylePrompt('default', testDescription);
      const watercolorPrompt = getStylePrompt('watercolor', testDescription);
      const animePrompt = getStylePrompt('anime', testDescription);

      expect(defaultPrompt).not.toBe(watercolorPrompt);
      expect(watercolorPrompt).not.toBe(animePrompt);
      expect(animePrompt).not.toBe(defaultPrompt);
    });

    it('should work for all defined styles', () => {
      const description = 'test pain visualization';

      STYLE_PRESETS.forEach((style) => {
        const result = getStylePrompt(style.id, description);
        expect(result).toContain(description);
        expect(result.length).toBeGreaterThan(description.length);
      });
    });

    it('should include style-specific keywords', () => {
      const description = 'burning sensation';

      const watercolorResult = getStylePrompt('watercolor', description);
      expect(watercolorResult.toLowerCase()).toContain('watercolor');

      const animeResult = getStylePrompt('anime', description);
      expect(animeResult.toLowerCase()).toContain('anime');

      const oilResult = getStylePrompt('oil-painting', description);
      expect(oilResult.toLowerCase()).toContain('oil');
    });
  });
});
