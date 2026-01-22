/**
 * AI Generation handlers
 *
 * Handles image generation, prompts, reflections, and inspiration using OpenAI.
 * Supports multi-model image generation via the imageGeneration service.
 */

import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { getOpenAIClient } from '../services/openai.js';
import { generateImageKey, storeImageFromUrl, getPublicUrl } from '../services/storage.js';
import { config } from '../config/index.js';
import { generateImage } from '../services/imageGeneration.js';
import {
  isValidModel,
  isValidStyle,
  isValidAspectRatio,
  isValidColorMood,
  isValidDetailLevel,
  ImageModel,
  StylePreset,
  AspectRatio,
  ColorMood,
  DetailLevel,
} from '../utils/stylePresets.js';

/**
 * Generate an image from a pain description
 *
 * POST /api/generate/image
 * Body: { description: string, model?: ImageModel, style?: StylePreset }
 *
 * Supports multiple models (dall-e-3, flux-pro, gemini-image) and style presets.
 */
export async function handleGenerateImage(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const user = req.user!;
    const painDescription = req.body.description || '';
    const requestedModel = req.body.model as string | undefined;
    const requestedStyle = req.body.style as string | undefined;
    // Enhanced pipeline options
    const requestedAspectRatio = req.body.aspectRatio as string | undefined;
    const requestedColorMood = req.body.colorMood as string | undefined;
    const requestedDetailLevel = req.body.detailLevel as string | undefined;
    const compareMode = req.body.compareMode === true;

    // Validate required fields
    if (!painDescription) {
      res.status(400).json({
        error: 'Description is required',
        code: 'VALIDATION_ERROR',
      });
      return;
    }

    // Validate model if provided (whitelist approach)
    if (requestedModel && !isValidModel(requestedModel)) {
      res.status(400).json({
        error: `Invalid model: ${requestedModel}. Valid models are: dall-e-3, gpt-5-image, gpt-5-image-mini, flux-pro, flux-2-max, gemini-image, gemini-3-pro-image-preview`,
        code: 'INVALID_MODEL',
      });
      return;
    }

    // Validate style if provided (whitelist approach)
    if (requestedStyle && !isValidStyle(requestedStyle)) {
      res.status(400).json({
        error: `Invalid style: ${requestedStyle}. Valid styles are: default, photorealism, oil-painting, watercolor, cartoon, anime, abstract-expressionist, minimalist`,
        code: 'INVALID_STYLE',
      });
      return;
    }

    // Validate enhanced options
    if (requestedAspectRatio && !isValidAspectRatio(requestedAspectRatio)) {
      res.status(400).json({
        error: `Invalid aspect ratio: ${requestedAspectRatio}. Valid ratios are: 1:1, 16:9, 9:16, 4:3, 3:4`,
        code: 'INVALID_ASPECT_RATIO',
      });
      return;
    }

    if (requestedColorMood && !isValidColorMood(requestedColorMood)) {
      res.status(400).json({
        error: `Invalid color mood: ${requestedColorMood}. Valid moods are: warm, neutral, cool`,
        code: 'INVALID_COLOR_MOOD',
      });
      return;
    }

    if (requestedDetailLevel && !isValidDetailLevel(requestedDetailLevel)) {
      res.status(400).json({
        error: `Invalid detail level: ${requestedDetailLevel}. Valid levels are: draft, balanced, max`,
        code: 'INVALID_DETAIL_LEVEL',
      });
      return;
    }

    // Generate image using the multi-model service
    const result = await generateImage({
      description: painDescription,
      model: requestedModel as ImageModel | undefined,
      style: requestedStyle as StylePreset | undefined,
      userId: user.id,
      aspectRatio: requestedAspectRatio as AspectRatio | undefined,
      colorMood: requestedColorMood as ColorMood | undefined,
      detailLevel: requestedDetailLevel as DetailLevel | undefined,
      compareMode,
    });

    if (!result.success) {
      const status = result.errorStatus || 500;
      res.status(status).json({
        error: result.error || 'Failed to generate image',
        code: result.errorCode || 'GENERATION_FAILED',
      });
      return;
    }

    // Return both new format (images array) and legacy fields for backward compatibility
    res.status(200).json({
      success: true,
      // New format: images array
      images: result.images,
      // Legacy fields for backward compatibility
      image_url: result.imageUrl,
      prompt_used: result.promptUsed,
      original_description: painDescription,
      model_used: result.modelUsed,
      style_used: result.styleUsed,
      // Enhanced pipeline metadata
      aspect_ratio_used: result.aspectRatioUsed,
      color_mood_used: result.colorMoodUsed,
      detail_level_used: result.detailLevelUsed,
    });
  } catch (error) {
    console.error('Generate image error:', error);
    res.status(500).json({
      error: 'Failed to generate image',
      code: 'GENERATION_FAILED',
    });
  }
}

/**
 * Generate artistic prompts from a pain description
 *
 * POST /api/generate/prompt
 * Body: { description: string }
 */
export async function handleGeneratePrompt(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const painDescription = req.body.description || '';

    if (!painDescription) {
      res.status(400).json({
        error: 'Description is required',
        code: 'VALIDATION_ERROR',
      });
      return;
    }

    const openai = getOpenAIClient();

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are an art therapist helping people transform their pain experiences into creative expression.
          Generate 3 different artistic prompts that could help someone process and express their pain through art.
          Each prompt should be encouraging and creative.
          Return the prompts as a JSON array with keys: 'prompt', 'technique', and 'emotional_focus'.`,
        },
        {
          role: 'user',
          content: `My pain experience: ${painDescription}`,
        },
      ],
      response_format: { type: 'json_object' },
    });

    const responseText = completion.choices[0].message.content || '{}';
    const prompts = JSON.parse(responseText);

    res.status(200).json({
      success: true,
      prompts: prompts.prompts || [],
      original_description: painDescription,
    });
  } catch (error) {
    console.error('Generate prompt error:', error);
    res.status(500).json({
      error: 'Failed to generate prompts',
      code: 'GENERATION_FAILED',
    });
  }
}

/**
 * Generate reflection questions for artwork
 *
 * POST /api/reflect
 * Body: { description: string, image_context?: string }
 */
export async function handleReflect(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const painDescription = req.body.description || '';
    const imageContext = req.body.image_context || '';

    const openai = getOpenAIClient();

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are an art therapist guiding someone through reflection on their creative expression of pain.
          Generate 5 thoughtful reflection questions that help them process their experience and find meaning in their artwork.
          Return as a JSON object with a 'questions' array.`,
        },
        {
          role: 'user',
          content: `Pain described: ${painDescription}\nArtwork context: ${imageContext}`,
        },
      ],
      response_format: { type: 'json_object' },
    });

    const responseText = completion.choices[0].message.content || '{}';
    const questions = JSON.parse(responseText);

    res.status(200).json({
      success: true,
      questions: questions.questions || [],
      original_description: painDescription,
    });
  } catch (error) {
    console.error('Reflect error:', error);
    res.status(500).json({
      error: 'Failed to generate reflection questions',
      code: 'GENERATION_FAILED',
    });
  }
}

/**
 * Generate inspirational art therapy prompts
 *
 * GET /api/inspire
 */
export async function handleInspire(
  _req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const openai = getOpenAIClient();

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `Generate 5 inspirational art therapy prompts that help people explore their emotions and experiences through creative expression.
          Focus on themes of transformation, healing, and self-discovery.
          Return as a JSON object with an 'inspirations' array, each containing 'title' and 'prompt'.`,
        },
        {
          role: 'user',
          content: 'Give me inspirational art therapy prompts',
        },
      ],
      response_format: { type: 'json_object' },
    });

    const responseText = completion.choices[0].message.content || '{}';
    const inspirations = JSON.parse(responseText);

    res.status(200).json({
      success: true,
      inspirations: inspirations.inspirations || [],
    });
  } catch (error) {
    console.error('Inspire error:', error);
    res.status(500).json({
      error: 'Failed to generate inspirations',
      code: 'GENERATION_FAILED',
    });
  }
}

/**
 * Edit/transform an image with style transfer
 *
 * Uses GPT-4o-mini Vision to analyze the image style, then generates
 * a new image with DALL-E 3 that combines the style with the pain description.
 *
 * POST /api/edit/image
 * Body: { image: string (base64 or URL), description: string }
 */
export async function handleEditImage(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const user = req.user!;
    const imageBase64 = req.body.image;
    const painDescription = req.body.description || req.body.prompt || '';

    if (!imageBase64 || !painDescription) {
      res.status(400).json({
        error: 'Image and pain description are required',
        code: 'VALIDATION_ERROR',
      });
      return;
    }

    const openai = getOpenAIClient();

    // First, analyze the uploaded image to understand its style
    const visionResponse = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'Analyze this artwork/image and describe its artistic style, color palette, composition, medium, and overall aesthetic in detail. Focus on the visual characteristics that define its unique style.',
            },
            {
              type: 'image_url',
              image_url: {
                url: imageBase64,
              },
            },
          ],
        },
      ],
      max_tokens: 300,
    });

    const styleAnalysis = visionResponse.choices[0].message.content || '';

    // Create a prompt that combines the style analysis with the pain description
    const combinedPrompt = `Create an art therapy piece that expresses: "${painDescription}"

    IMPORTANT - Match this exact artistic style: ${styleAnalysis}

    The artwork should:
    - Maintain the same artistic technique, medium appearance, and color palette as described
    - Express the pain experience through symbolic elements, textures, and composition
    - Create a transformation that acknowledges the pain while suggesting healing
    - Use abstract or figurative elements that represent the physical and emotional sensation
    - Keep the overall aesthetic consistent with the original style analysis

    Style: Art therapy piece in the exact style described above, expressing pain through artistic transformation.`;

    // Generate new image with DALL-E 3 based on combined prompt
    const imageResponse = await openai.images.generate({
      model: 'dall-e-3',
      prompt: combinedPrompt,
      size: '1024x1024',
      quality: 'standard',
      n: 1,
    });

    const dalleUrl = imageResponse.data?.[0]?.url;
    if (!dalleUrl) {
      throw new Error('No image URL returned from DALL-E');
    }
    const revisedPrompt = imageResponse.data?.[0]?.revised_prompt || combinedPrompt;

    // Store image in Azure Blob Storage for permanent access
    let editedImageUrl = dalleUrl; // Fallback to DALL-E URL if storage fails

    if (config.storage.connectionString && config.storage.publicUrl) {
      const userId = user.id;
      const imageKey = generateImageKey(userId, 'edited');
      const storeResult = await storeImageFromUrl(dalleUrl, imageKey, {
        userId: userId,
        description: painDescription,
        styleAnalysis: styleAnalysis,
        prompt: revisedPrompt,
      });

      if (storeResult.success) {
        editedImageUrl = getPublicUrl(imageKey);
      } else {
        console.warn('Azure Blob Storage failed, using DALL-E URL:', storeResult.error);
      }
    }

    res.status(200).json({
      success: true,
      edited_image_url: editedImageUrl,
      prompt_used: revisedPrompt,
      original_description: painDescription,
      style_analysis: styleAnalysis,
      model_used: 'dall-e-3-with-vision',
    });
  } catch (error) {
    console.error('Image transformation error:', error);
    res.status(500).json({
      error: 'Failed to transform image',
      code: 'TRANSFORMATION_FAILED',
    });
  }
}


/**
 * Variation adjustment types for creating image variations
 */
export type VariationAdjustment =
  | 'warmer'
  | 'cooler'
  | 'more_abstract'
  | 'more_detailed'
  | 'softer'
  | 'more_intense'
  | 'custom';

/**
 * Adjustment prompts for variation generation
 */
const VARIATION_ADJUSTMENTS: Record<Exclude<VariationAdjustment, 'custom'>, string> = {
  warmer: 'Use a warmer color palette with golden, orange, and sunset tones. Make the overall feeling more inviting and comforting.',
  cooler: 'Use a cooler color palette with blue, teal, and silver tones. Make the overall feeling more calm and serene.',
  more_abstract: 'Make the image more abstract and expressionist. Use bolder brushstrokes, less defined shapes, and more emotional color placement.',
  more_detailed: 'Add more fine details and textures. Make the elements more defined and intricate while maintaining the quality.',
  softer: 'Make the image softer and more gentle. Use lighter colors, smoother transitions, and a more peaceful atmosphere.',
  more_intense: 'Intensify the emotional impact. Use more saturated colors, stronger contrasts, and more dynamic composition.',
};

/**
 * Create a variation of an existing generated image
 *
 * POST /api/generate/variation
 * Body: {
 *   imageUrl: string,
 *   adjustment: VariationAdjustment,
 *   customPrompt?: string,
 *   originalDescription?: string,
 *   model?: ImageModel
 * }
 *
 * Uses GPT-4o-mini to analyze the existing image and regenerate with the adjustment.
 */
export async function handleCreateVariation(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const user = req.user!;
    const imageUrl = req.body.imageUrl as string | undefined;
    const adjustment = req.body.adjustment as VariationAdjustment | undefined;
    const customPrompt = req.body.customPrompt as string | undefined;
    const originalDescription = req.body.originalDescription as string | undefined;
    const requestedModel = req.body.model as string | undefined;

    // Validate required fields
    if (!imageUrl) {
      res.status(400).json({
        error: 'Image URL is required',
        code: 'VALIDATION_ERROR',
      });
      return;
    }

    if (!adjustment) {
      res.status(400).json({
        error: 'Adjustment type is required',
        code: 'VALIDATION_ERROR',
      });
      return;
    }

    // Validate adjustment type
    const validAdjustments = ['warmer', 'cooler', 'more_abstract', 'more_detailed', 'softer', 'more_intense', 'custom'];
    if (!validAdjustments.includes(adjustment)) {
      res.status(400).json({
        error: `Invalid adjustment: ${adjustment}. Valid adjustments are: ${validAdjustments.join(', ')}`,
        code: 'INVALID_ADJUSTMENT',
      });
      return;
    }

    // For custom adjustment, require customPrompt
    if (adjustment === 'custom' && !customPrompt) {
      res.status(400).json({
        error: 'Custom prompt is required when using custom adjustment',
        code: 'VALIDATION_ERROR',
      });
      return;
    }

    // Validate model if provided
    if (requestedModel && !isValidModel(requestedModel)) {
      res.status(400).json({
        error: `Invalid model: ${requestedModel}. Valid models are: dall-e-3, flux-pro, gemini-image`,
        code: 'INVALID_MODEL',
      });
      return;
    }

    const openai = getOpenAIClient();

    // Analyze the existing image to understand its content and style
    const visionResponse = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `Analyze this artwork and describe:
1. The subject matter and what it represents
2. The artistic style, technique, and medium
3. The color palette and mood
4. The composition and key visual elements

Be detailed but concise. This will be used to recreate a similar image with adjustments.`,
            },
            {
              type: 'image_url',
              image_url: {
                url: imageUrl,
              },
            },
          ],
        },
      ],
      max_tokens: 500,
    });

    const imageAnalysis = visionResponse.choices[0].message.content || '';

    // Build the variation prompt
    const adjustmentInstruction = adjustment === 'custom'
      ? customPrompt
      : VARIATION_ADJUSTMENTS[adjustment];

    const variationPrompt = `Create an art piece based on this analysis:

${imageAnalysis}

${originalDescription ? `Original context: ${originalDescription}` : ''}

IMPORTANT VARIATION: ${adjustmentInstruction}

Maintain the core subject and intent while applying the specified adjustment.
The result should feel like a variation of the original, not a completely different image.`;

    // Generate the variation with DALL-E 3
    const imageResponse = await openai.images.generate({
      model: 'dall-e-3',
      prompt: variationPrompt,
      size: '1024x1024',
      quality: 'standard',
      n: 1,
    });

    const dalleUrl = imageResponse.data?.[0]?.url;
    if (!dalleUrl) {
      throw new Error('No image URL returned from DALL-E');
    }
    const revisedPrompt = imageResponse.data?.[0]?.revised_prompt || variationPrompt;

    // Store image in Azure Blob Storage for permanent access
    let variationImageUrl = dalleUrl;

    if (config.storage.connectionString && config.storage.publicUrl) {
      const imageKey = generateImageKey(user.id, 'variation');
      // Build metadata object, filtering out undefined values
      const metadata: Record<string, string> = {
        userId: user.id,
        adjustment,
        imageAnalysis,
        prompt: revisedPrompt,
      };
      if (customPrompt) metadata.customPrompt = customPrompt;
      if (originalDescription) metadata.originalDescription = originalDescription;
      
      const storeResult = await storeImageFromUrl(dalleUrl, imageKey, metadata);

      if (storeResult.success) {
        variationImageUrl = getPublicUrl(imageKey);
      } else {
        console.warn('Azure Blob Storage failed, using DALL-E URL:', storeResult.error);
      }
    }

    res.status(200).json({
      success: true,
      image_url: variationImageUrl,
      prompt_used: revisedPrompt,
      adjustment_applied: adjustment,
      custom_prompt: customPrompt || null,
      model_used: 'dall-e-3',
      image_analysis: imageAnalysis,
    });
  } catch (error) {
    console.error('Create variation error:', error);
    res.status(500).json({
      error: 'Failed to create variation',
      code: 'VARIATION_FAILED',
    });
  }
}
