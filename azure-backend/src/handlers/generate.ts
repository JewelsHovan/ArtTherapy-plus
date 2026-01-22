/**
 * AI Generation handlers
 *
 * Handles image generation, prompts, reflections, and inspiration using OpenAI.
 * Ported from Cloudflare Worker implementation.
 */

import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { getOpenAIClient } from '../services/openai.js';
import { generateImageKey, storeImageFromUrl, getPublicUrl } from '../services/storage.js';
import { config } from '../config/index.js';

/**
 * Generate an image from a pain description
 *
 * POST /api/generate/image
 * Body: { description: string }
 */
export async function handleGenerateImage(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const user = req.user!;
    const painDescription = req.body.description || '';

    if (!painDescription) {
      res.status(400).json({
        error: 'Description is required',
        code: 'VALIDATION_ERROR',
      });
      return;
    }

    const openai = getOpenAIClient();

    const artisticPrompt = `Create an abstract artistic representation of: ${painDescription}.
    Style: Abstract expressionist art therapy piece with vibrant colors that transform pain into beauty.
    Use flowing organic shapes, bold brushstrokes, and symbolic elements that represent healing and transformation.
    The artwork should be uplifting and therapeutic while acknowledging the pain experience.`;

    const response = await openai.images.generate({
      model: 'dall-e-3',
      prompt: artisticPrompt,
      size: '1024x1024',
      quality: 'standard',
      n: 1,
    });

    const dalleUrl = response.data?.[0]?.url;
    if (!dalleUrl) {
      throw new Error('No image URL returned from DALL-E');
    }
    const revisedPrompt = response.data?.[0]?.revised_prompt || artisticPrompt;

    // Store image in Azure Blob Storage for permanent access (DALL-E URLs expire after ~1 hour)
    let imageUrl = dalleUrl; // Fallback to DALL-E URL if storage fails

    if (config.storage.connectionString && config.storage.publicUrl) {
      const userId = user.id;
      const imageKey = generateImageKey(userId, 'generated');
      const storeResult = await storeImageFromUrl(dalleUrl, imageKey, {
        userId: userId,
        description: painDescription,
        prompt: revisedPrompt,
      });

      if (storeResult.success) {
        imageUrl = getPublicUrl(imageKey);
      } else {
        console.warn('Azure Blob Storage failed, using DALL-E URL:', storeResult.error);
      }
    }

    res.status(200).json({
      success: true,
      image_url: imageUrl,
      prompt_used: revisedPrompt,
      original_description: painDescription,
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
          Each prompt should be encouraging, creative, and therapeutic.
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
    - Create a therapeutic transformation that acknowledges the pain while suggesting healing
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
