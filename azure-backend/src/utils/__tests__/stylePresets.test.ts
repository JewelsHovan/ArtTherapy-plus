/**
 * Unit tests for stylePresets utility functions
 *
 * Tests model validation, style validation, and prompt generation.
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
  describe('IMAGE_MODELS constant', () => {
    it('should have exactly 3 models', () => {
      expect(IMAGE_MODELS).toHaveLength(3);
    });

    it('should contain dall-e-3, flux-pro, and gemini-image', () => {
      const modelIds = IMAGE_MODELS.map((m) => m.id);
      expect(modelIds).toContain('dall-e-3');
      expect(modelIds).toContain('flux-pro');
      expect(modelIds).toContain('gemini-image');
    });

    it('should have correct structure for each model', () => {
      for (const model of IMAGE_MODELS) {
        expect(model).toHaveProperty('id');
        expect(model).toHaveProperty('name');
        expect(model).toHaveProperty('description');
        expect(model).toHaveProperty('provider');
        expect(model).toHaveProperty('costTier');
        expect(['openai', 'openrouter']).toContain(model.provider);
        expect(['low', 'medium', 'high']).toContain(model.costTier);
      }
    });

    it('should have openrouterId for openrouter provider models', () => {
      const openrouterModels = IMAGE_MODELS.filter(
        (m) => m.provider === 'openrouter'
      );
      for (const model of openrouterModels) {
        expect(model.openrouterId).toBeDefined();
        expect(typeof model.openrouterId).toBe('string');
        expect(model.openrouterId!.length).toBeGreaterThan(0);
      }
    });

    it('should not have openrouterId for openai provider models', () => {
      const openaiModels = IMAGE_MODELS.filter((m) => m.provider === 'openai');
      for (const model of openaiModels) {
        expect(model.openrouterId).toBeUndefined();
      }
    });
  });

  describe('STYLE_PRESETS constant', () => {
    it('should have exactly 8 styles', () => {
      expect(STYLE_PRESETS).toHaveLength(8);
    });

    it('should contain all expected styles', () => {
      const styleIds = STYLE_PRESETS.map((s) => s.id);
      expect(styleIds).toContain('default');
      expect(styleIds).toContain('photorealism');
      expect(styleIds).toContain('oil-painting');
      expect(styleIds).toContain('watercolor');
      expect(styleIds).toContain('cartoon');
      expect(styleIds).toContain('anime');
      expect(styleIds).toContain('abstract-expressionist');
      expect(styleIds).toContain('minimalist');
    });

    it('should have correct structure for each style', () => {
      for (const style of STYLE_PRESETS) {
        expect(style).toHaveProperty('id');
        expect(style).toHaveProperty('name');
        expect(style).toHaveProperty('description');
        expect(style).toHaveProperty('promptTemplate');
        expect(typeof style.id).toBe('string');
        expect(typeof style.name).toBe('string');
        expect(typeof style.description).toBe('string');
        expect(typeof style.promptTemplate).toBe('string');
      }
    });

    it('should have {description} placeholder in all prompt templates', () => {
      for (const style of STYLE_PRESETS) {
        expect(style.promptTemplate).toContain('{description}');
      }
    });
  });

  describe('isValidModel()', () => {
    it('should return true for valid models', () => {
      expect(isValidModel('dall-e-3')).toBe(true);
      expect(isValidModel('flux-pro')).toBe(true);
      expect(isValidModel('gemini-image')).toBe(true);
    });

    it('should return false for invalid models', () => {
      expect(isValidModel('invalid-model')).toBe(false);
      expect(isValidModel('')).toBe(false);
      expect(isValidModel('DALL-E-3')).toBe(false); // Case sensitive
      expect(isValidModel('gpt-4')).toBe(false);
      expect(isValidModel('midjourney')).toBe(false);
    });
  });

  describe('isValidStyle()', () => {
    it('should return true for all 8 valid styles', () => {
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

      for (const style of validStyles) {
        expect(isValidStyle(style)).toBe(true);
      }
    });

    it('should return false for invalid styles', () => {
      expect(isValidStyle('invalid-style')).toBe(false);
      expect(isValidStyle('')).toBe(false);
      expect(isValidStyle('DEFAULT')).toBe(false); // Case sensitive
      expect(isValidStyle('impressionist')).toBe(false);
      expect(isValidStyle('pixel-art')).toBe(false);
    });
  });

  describe('getModelInfo()', () => {
    it('should return correct ModelInfo for dall-e-3', () => {
      const info = getModelInfo('dall-e-3');
      expect(info).toBeDefined();
      expect(info!.id).toBe('dall-e-3');
      expect(info!.name).toBe('DALL-E 3');
      expect(info!.provider).toBe('openai');
      expect(info!.costTier).toBe('high');
      expect(info!.openrouterId).toBeUndefined();
    });

    it('should return correct ModelInfo for flux-pro', () => {
      const info = getModelInfo('flux-pro');
      expect(info).toBeDefined();
      expect(info!.id).toBe('flux-pro');
      expect(info!.name).toBe('Flux Pro');
      expect(info!.provider).toBe('openrouter');
      expect(info!.costTier).toBe('medium');
      expect(info!.openrouterId).toBe('black-forest-labs/flux-pro-1.1');
    });

    it('should return correct ModelInfo for gemini-image', () => {
      const info = getModelInfo('gemini-image');
      expect(info).toBeDefined();
      expect(info!.id).toBe('gemini-image');
      expect(info!.name).toBe('Gemini Flash');
      expect(info!.provider).toBe('openrouter');
      expect(info!.costTier).toBe('low');
      expect(info!.openrouterId).toBe('google/gemini-2.0-flash-exp:free');
    });

    it('should return undefined for invalid model', () => {
      // Type assertion needed since we're testing invalid input
      const info = getModelInfo('invalid-model' as ImageModel);
      expect(info).toBeUndefined();
    });
  });

  describe('getStyleInfo()', () => {
    it('should return correct StylePresetInfo for default style', () => {
      const info = getStyleInfo('default');
      expect(info).toBeDefined();
      expect(info!.id).toBe('default');
      expect(info!.name).toBe('Art Therapy');
      expect(info!.promptTemplate).toContain('{description}');
    });

    it('should return correct StylePresetInfo for photorealism', () => {
      const info = getStyleInfo('photorealism');
      expect(info).toBeDefined();
      expect(info!.id).toBe('photorealism');
      expect(info!.name).toBe('Photorealism');
      expect(info!.description).toContain('realistic');
    });

    it('should return correct StylePresetInfo for all valid styles', () => {
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

      for (const styleId of validStyles) {
        const info = getStyleInfo(styleId);
        expect(info).toBeDefined();
        expect(info!.id).toBe(styleId);
      }
    });

    it('should return undefined for invalid style', () => {
      // Type assertion needed since we're testing invalid input
      const info = getStyleInfo('invalid-style' as StylePreset);
      expect(info).toBeUndefined();
    });
  });

  describe('getStylePrompt()', () => {
    const testDescription = 'a sharp pain in my lower back';

    it('should replace {description} placeholder with user description', () => {
      const prompt = getStylePrompt('default', testDescription);
      expect(prompt).toContain(testDescription);
      expect(prompt).not.toContain('{description}');
    });

    it('should return styled prompt for valid styles', () => {
      const prompt = getStylePrompt('watercolor', testDescription);
      expect(prompt).toContain(testDescription);
      expect(prompt.toLowerCase()).toContain('watercolor');
    });

    it('should return raw description for invalid style', () => {
      // Type assertion needed since we're testing invalid input
      const prompt = getStylePrompt('invalid-style' as StylePreset, testDescription);
      expect(prompt).toBe(testDescription);
    });

    it('should handle empty description', () => {
      const prompt = getStylePrompt('default', '');
      expect(prompt).not.toContain('{description}');
      // The prompt template should be applied, just with empty description
      expect(prompt.length).toBeGreaterThan(0);
    });

    it('should handle description with special characters', () => {
      const specialDescription = 'pain like $100 worth of {curly} and [brackets]';
      const prompt = getStylePrompt('default', specialDescription);
      expect(prompt).toContain(specialDescription);
    });

    it('should preserve prompt template content for each style', () => {
      // Test that oil-painting style includes relevant keywords
      const oilPrompt = getStylePrompt('oil-painting', testDescription);
      expect(oilPrompt.toLowerCase()).toContain('oil');
      expect(oilPrompt.toLowerCase()).toContain('painting');

      // Test that anime style includes relevant keywords
      const animePrompt = getStylePrompt('anime', testDescription);
      expect(animePrompt.toLowerCase()).toContain('anime');

      // Test that minimalist style includes relevant keywords
      const minimalistPrompt = getStylePrompt('minimalist', testDescription);
      expect(minimalistPrompt.toLowerCase()).toContain('minimalist');
    });
  });
});
