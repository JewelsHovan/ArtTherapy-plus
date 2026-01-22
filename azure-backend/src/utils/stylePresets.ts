/**
 * Style Presets and Image Model Definitions
 *
 * Defines available image generation models and artistic style presets
 * for the multi-model image generation system.
 */

/**
 * Available image generation models
 */
export type ImageModel = 'dall-e-3' | 'flux-pro' | 'gemini-image';

/**
 * Available style presets for image generation
 */
export type StylePreset =
  | 'default'
  | 'photorealism'
  | 'oil-painting'
  | 'watercolor'
  | 'cartoon'
  | 'anime'
  | 'abstract-expressionist'
  | 'minimalist';

/**
 * Model information including provider and cost details
 */
export interface ModelInfo {
  id: ImageModel;
  name: string;
  description: string;
  provider: 'openai' | 'openrouter';
  openrouterId?: string;
  costTier: 'low' | 'medium' | 'high';
}

/**
 * Style preset information including prompt template
 */
export interface StylePresetInfo {
  id: StylePreset;
  name: string;
  description: string;
  promptTemplate: string;
}

/**
 * All available image generation models
 */
export const IMAGE_MODELS: ModelInfo[] = [
  {
    id: 'dall-e-3',
    name: 'DALL-E 3',
    description: "OpenAI's flagship image model with excellent prompt understanding",
    provider: 'openai',
    costTier: 'high',
  },
  {
    id: 'flux-pro',
    name: 'Flux Pro',
    description: 'High-quality artistic generation with unique aesthetic',
    provider: 'openrouter',
    openrouterId: 'black-forest-labs/flux-pro-1.1',
    costTier: 'medium',
  },
  {
    id: 'gemini-image',
    name: 'Gemini Flash',
    description: 'Fast, creative image generation (free tier)',
    provider: 'openrouter',
    openrouterId: 'google/gemini-2.0-flash-exp:free',
    costTier: 'low',
  },
];

/**
 * All available style presets with prompt templates
 *
 * The {description} placeholder will be replaced with the user's pain description
 */
export const STYLE_PRESETS: StylePresetInfo[] = [
  {
    id: 'default',
    name: 'Art Therapy',
    description: 'Healing abstract art designed for emotional expression',
    promptTemplate:
      'Create an abstract artistic representation of: {description}. Style: Abstract expressionist art therapy piece with vibrant colors that transform pain into beauty. Use flowing organic shapes, bold brushstrokes, and symbolic elements that represent healing and transformation. The artwork should be uplifting and therapeutic while acknowledging the pain experience.',
  },
  {
    id: 'photorealism',
    name: 'Photorealism',
    description: 'Ultra-realistic imagery with stunning detail',
    promptTemplate:
      'Create a photorealistic image representing: {description}. Ultra-detailed, professional photography quality, natural lighting, sharp focus, 8K resolution. Transform the emotional experience into tangible visual elements while maintaining therapeutic healing qualities.',
  },
  {
    id: 'oil-painting',
    name: 'Oil Painting',
    description: 'Classical painting style reminiscent of the Old Masters',
    promptTemplate:
      'Create an oil painting in classical style expressing: {description}. Rich textures, visible brushstrokes, dramatic lighting, museum quality, reminiscent of the Old Masters. Layer emotions through color and composition to create a therapeutic visual narrative.',
  },
  {
    id: 'watercolor',
    name: 'Watercolor',
    description: 'Soft, flowing art with gentle transitions',
    promptTemplate:
      'Create a soft watercolor painting of: {description}. Delicate washes, flowing colors, gentle blending, artistic interpretation, light and airy feel. Let the colors blend and flow naturally to express emotional healing and transformation.',
  },
  {
    id: 'cartoon',
    name: 'Cartoon',
    description: 'Bold, playful style with expressive elements',
    promptTemplate:
      'Create a bold cartoon illustration expressing: {description}. Clean lines, vibrant colors, expressive style, playful energy, comic book aesthetic. Transform difficult emotions into approachable, expressive visual forms.',
  },
  {
    id: 'anime',
    name: 'Anime',
    description: 'Japanese animation style with dynamic composition',
    promptTemplate:
      'Create an anime-style illustration representing: {description}. Japanese animation aesthetic, vibrant colors, expressive elements, dynamic composition, studio quality. Express emotional depth through the distinctive anime visual language.',
  },
  {
    id: 'abstract-expressionist',
    name: 'Abstract',
    description: 'Emotional abstract art with raw intensity',
    promptTemplate:
      'Create an abstract expressionist artwork representing: {description}. Bold brushstrokes, emotional intensity, non-representational forms, vibrant palette, raw artistic expression. Channel emotions directly into color, form, and gesture.',
  },
  {
    id: 'minimalist',
    name: 'Minimalist',
    description: 'Clean, simple design with essential forms',
    promptTemplate:
      'Create a minimalist artwork representing: {description}. Clean design, limited color palette, essential forms, negative space, elegant simplicity. Distill the emotional essence into pure, simple visual elements.',
  },
];

/**
 * Validates if a string is a valid ImageModel
 */
export function isValidModel(model: string): model is ImageModel {
  return IMAGE_MODELS.some((m) => m.id === model);
}

/**
 * Validates if a string is a valid StylePreset
 */
export function isValidStyle(style: string): style is StylePreset {
  return STYLE_PRESETS.some((s) => s.id === style);
}

/**
 * Get model info by ID
 */
export function getModelInfo(modelId: ImageModel): ModelInfo | undefined {
  return IMAGE_MODELS.find((m) => m.id === modelId);
}

/**
 * Get style preset info by ID
 */
export function getStyleInfo(styleId: StylePreset): StylePresetInfo | undefined {
  return STYLE_PRESETS.find((s) => s.id === styleId);
}

/**
 * Generate a styled prompt by replacing the description placeholder
 */
export function getStylePrompt(styleId: StylePreset, description: string): string {
  const style = STYLE_PRESETS.find((s) => s.id === styleId);
  if (!style) return description;
  return style.promptTemplate.replace('{description}', description);
}


// ============================================
// Enhanced Image Generation Pipeline Types
// ============================================

/**
 * Available aspect ratios for image generation
 */
export type AspectRatio = '1:1' | '16:9' | '9:16' | '4:3' | '3:4';

/**
 * Color mood options for image generation
 */
export type ColorMood = 'warm' | 'neutral' | 'cool';

/**
 * Detail level options for image generation
 */
export type DetailLevel = 'draft' | 'balanced' | 'max';

/**
 * Aspect ratio configuration with DALL-E size mapping
 */
export interface AspectRatioInfo {
  id: AspectRatio;
  label: string;
  dalleSize: '1024x1024' | '1792x1024' | '1024x1792';
}

/**
 * All available aspect ratios with their DALL-E size mappings
 */
export const ASPECT_RATIOS: AspectRatioInfo[] = [
  { id: '1:1', label: 'Square', dalleSize: '1024x1024' },
  { id: '16:9', label: 'Landscape', dalleSize: '1792x1024' },
  { id: '9:16', label: 'Portrait', dalleSize: '1024x1792' },
  { id: '4:3', label: 'Classic', dalleSize: '1024x1024' },
  { id: '3:4', label: 'Portrait Classic', dalleSize: '1024x1792' },
];

/**
 * Color mood modifiers to append to prompts
 */
export const COLOR_MOOD_MODIFIERS: Record<ColorMood, string> = {
  warm: 'warm color palette with golden, amber, and sunset tones',
  neutral: '',
  cool: 'cool color palette with blue, teal, and silver tones',
};

/**
 * Detail level quality settings
 */
export const DETAIL_LEVEL_CONFIG: Record<DetailLevel, { quality: 'standard' | 'hd'; description: string }> = {
  draft: { quality: 'standard', description: 'Quick generation' },
  balanced: { quality: 'standard', description: 'Good quality, faster' },
  max: { quality: 'hd', description: 'Maximum detail' },
};

/**
 * Validates if a string is a valid AspectRatio
 */
export function isValidAspectRatio(ratio: string): ratio is AspectRatio {
  return ASPECT_RATIOS.some((ar) => ar.id === ratio);
}

/**
 * Validates if a string is a valid ColorMood
 */
export function isValidColorMood(mood: string): mood is ColorMood {
  return ['warm', 'neutral', 'cool'].includes(mood);
}

/**
 * Validates if a string is a valid DetailLevel
 */
export function isValidDetailLevel(level: string): level is DetailLevel {
  return ['draft', 'balanced', 'max'].includes(level);
}

/**
 * Get aspect ratio info by ID
 */
export function getAspectRatioInfo(ratioId: AspectRatio): AspectRatioInfo | undefined {
  return ASPECT_RATIOS.find((ar) => ar.id === ratioId);
}

/**
 * Get DALL-E size for a given aspect ratio
 */
export function getDalleSizeForAspectRatio(ratioId: AspectRatio): '1024x1024' | '1792x1024' | '1024x1792' {
  const info = getAspectRatioInfo(ratioId);
  return info?.dalleSize || '1024x1024';
}

/**
 * Apply color mood modifier to a prompt
 */
export function applyColorMoodToPrompt(prompt: string, mood: ColorMood): string {
  const modifier = COLOR_MOOD_MODIFIERS[mood];
  if (!modifier) return prompt;
  return `${prompt}. Use a ${modifier}.`;
}
