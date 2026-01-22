/**
 * Image Generation Service
 *
 * Handles multi-model image generation with support for:
 * - OpenAI DALL-E 3 (direct)
 * - OpenRouter models (Flux Pro, Gemini Flash)
 *
 * Abstracts provider differences and handles storage.
 */

import { getOpenAIClient } from './openai.js';
import {
  storeImageFromUrl,
  storeImageFromBase64,
  generateImageKey,
  getPublicUrl,
} from './storage.js';
import { config } from '../config/index.js';
import {
  ImageModel,
  StylePreset,
  getModelInfo,
  getStylePrompt,
  isValidModel,
  isValidStyle,
} from '../utils/stylePresets.js';

/**
 * Options for image generation
 */
export interface GenerateImageOptions {
  description: string;
  model?: ImageModel;
  style?: StylePreset;
  userId: string;
}

/**
 * Result of image generation
 */
export interface GenerateImageResult {
  success: boolean;
  imageUrl?: string;
  promptUsed?: string;
  modelUsed: ImageModel;
  styleUsed: StylePreset;
  error?: string;
}

/**
 * Get list of currently available models based on configuration
 *
 * DALL-E 3 is always available. OpenRouter models require OPENROUTER_API_KEY.
 */
export function getAvailableModels(): ImageModel[] {
  const models: ImageModel[] = ['dall-e-3']; // Always available

  if (config.openrouter?.apiKey) {
    models.push('flux-pro', 'gemini-image');
  }

  return models;
}

/**
 * Generate image using OpenAI DALL-E 3
 */
async function generateWithOpenAI(
  prompt: string
): Promise<{ url: string; revisedPrompt: string }> {
  const openai = getOpenAIClient();
  const response = await openai.images.generate({
    model: 'dall-e-3',
    prompt,
    size: '1024x1024',
    quality: 'standard',
    n: 1,
  });

  const imageData = response.data?.[0];
  if (!imageData?.url) {
    throw new Error('No image URL returned from DALL-E');
  }

  return {
    url: imageData.url,
    revisedPrompt: imageData.revised_prompt || prompt,
  };
}

/**
 * Generate image using OpenRouter API
 *
 * OpenRouter provides access to multiple models through a unified API.
 * Images are typically returned as base64 or URLs in the response.
 */
async function generateWithOpenRouter(
  prompt: string,
  model: ImageModel
): Promise<{ base64?: string; url?: string }> {
  const modelInfo = getModelInfo(model);
  if (!modelInfo?.openrouterId || !config.openrouter?.apiKey) {
    throw new Error(`Model ${model} not available via OpenRouter`);
  }

  const response = await fetch(`${config.openrouter.baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${config.openrouter.apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://arttherapy-plus.com',
      'X-Title': 'ArtTherapy+',
    },
    body: JSON.stringify({
      model: modelInfo.openrouterId,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
      modalities: ['image', 'text'],
      max_tokens: 4096,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenRouter API error: ${response.status} - ${errorText}`);
  }

  // Define expected response structure
  interface OpenRouterResponse {
    choices?: Array<{
      message?: {
        content?: unknown;
        images?: string[];
      };
    }>;
  }

  const data = (await response.json()) as OpenRouterResponse;

  // OpenRouter returns images in various formats depending on the model
  const content = data.choices?.[0]?.message?.content;

  // Handle array content format (common for multimodal responses)
  if (Array.isArray(content)) {
    const imageContent = content.find(
      (c: { type: string }) => c.type === 'image_url' || c.type === 'image'
    ) as { type: string; image_url?: { url?: string } } | undefined;
    if (imageContent?.image_url?.url) {
      const imageUrl = imageContent.image_url.url;
      // Check if it's a data URL (base64) or actual URL
      if (imageUrl.startsWith('data:') || imageUrl.startsWith('/')) {
        return { base64: imageUrl };
      }
      return { url: imageUrl };
    }
  }

  // Handle inline_data format (some models)
  const images = data.choices?.[0]?.message?.images;
  if (images?.[0]) {
    return { base64: images[0] };
  }

  // Handle direct base64 in content
  if (typeof content === 'string' && content.length > 1000) {
    // Likely base64 data
    return { base64: content };
  }

  throw new Error('No image returned from OpenRouter');
}

/**
 * Generate an image using the specified model and style
 *
 * @param options - Generation options including description, model, style, and userId
 * @returns Result with success status, image URL, and metadata
 */
export async function generateImage(
  options: GenerateImageOptions
): Promise<GenerateImageResult> {
  const { description, userId } = options;
  const model = options.model || 'dall-e-3';
  const style = options.style || 'default';

  // Validate inputs using whitelist approach
  if (!isValidModel(model)) {
    return {
      success: false,
      error: `Invalid model: ${model}. Valid models are: dall-e-3, flux-pro, gemini-image`,
      modelUsed: 'dall-e-3',
      styleUsed: 'default',
    };
  }

  if (!isValidStyle(style)) {
    return {
      success: false,
      error: `Invalid style: ${style}. Valid styles are: default, photorealism, oil-painting, watercolor, cartoon, anime, abstract-expressionist, minimalist`,
      modelUsed: model,
      styleUsed: 'default',
    };
  }

  // Check if model is available based on configuration
  const availableModels = getAvailableModels();
  if (!availableModels.includes(model)) {
    return {
      success: false,
      error: `Model ${model} is not available. Configure OPENROUTER_API_KEY to enable additional models.`,
      modelUsed: 'dall-e-3',
      styleUsed: style,
    };
  }

  // Generate styled prompt
  const styledPrompt = getStylePrompt(style, description);
  const modelInfo = getModelInfo(model);
  const imageKey = generateImageKey(userId, 'generated');

  try {
    let imageUrl: string;
    let promptUsed = styledPrompt;

    if (modelInfo?.provider === 'openai') {
      // Generate with OpenAI DALL-E 3
      const result = await generateWithOpenAI(styledPrompt);
      promptUsed = result.revisedPrompt;

      // Store the image from URL
      if (config.storage.connectionString && config.storage.publicUrl) {
        const storeResult = await storeImageFromUrl(result.url, imageKey, {
          userId,
          description,
          prompt: promptUsed,
          model,
          style,
        });

        if (storeResult.success) {
          imageUrl = getPublicUrl(imageKey);
        } else {
          console.warn('Storage failed, using temporary DALL-E URL:', storeResult.error);
          imageUrl = result.url;
        }
      } else {
        imageUrl = result.url;
      }
    } else {
      // Generate with OpenRouter
      const result = await generateWithOpenRouter(styledPrompt, model);

      // Store the image (from base64 or URL)
      if (config.storage.connectionString && config.storage.publicUrl) {
        let storeResult;

        if (result.url) {
          // Store from URL
          storeResult = await storeImageFromUrl(result.url, imageKey, {
            userId,
            description,
            prompt: styledPrompt,
            model,
            style,
          });
        } else if (result.base64) {
          // Store from base64
          storeResult = await storeImageFromBase64(result.base64, imageKey, {
            userId,
            description,
            prompt: styledPrompt,
            model,
            style,
          });
        } else {
          throw new Error('No image data returned from OpenRouter');
        }

        if (storeResult.success) {
          imageUrl = getPublicUrl(imageKey);
        } else {
          throw new Error(`Failed to store image: ${storeResult.error}`);
        }
      } else {
        // No storage configured - return base64 data URL or URL
        imageUrl = result.url || result.base64 || '';
      }
    }

    return {
      success: true,
      imageUrl,
      promptUsed,
      modelUsed: model,
      styleUsed: style,
    };
  } catch (error) {
    console.error('Image generation error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error during image generation',
      modelUsed: model,
      styleUsed: style,
    };
  }
}
