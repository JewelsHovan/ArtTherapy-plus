import { handleMicrosoftCallback, handleVerifyToken, handleLogout } from './handlers/auth.js';
import { handleCORS, errorResponse, jsonResponse } from './utils/response.js';
import OpenAI from 'openai';

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;

    // CORS preflight
    if (request.method === 'OPTIONS') {
      return handleCORS();
    }

    try {
      // Health check (public)
      if (path === '/api/health' && request.method === 'GET') {
        return jsonResponse({ status: 'ok', timestamp: new Date().toISOString() });
      }

      // Authentication endpoints (public)
      if (path === '/api/auth/microsoft/callback' && request.method === 'POST') {
        return await handleMicrosoftCallback(request, env);
      }

      if (path === '/api/auth/verify' && request.method === 'POST') {
        return await handleVerifyToken(request, env);
      }

      if (path === '/api/auth/logout' && request.method === 'POST') {
        return await handleLogout();
      }

      // TODO: Add protected endpoints for gallery, user, journal in Phase 2 & 3
      // These will use verifyAuth middleware

      // OpenAI endpoints (public for now, will be protected in Phase 2)
      // TODO: These endpoints will require authentication in Phase 2

      // Initialize OpenAI client
      const openai = new OpenAI({
        apiKey: env.OPENAI_API_KEY,
      });

      if (path === '/api/generate/image' && request.method === 'POST') {
        const data = await request.json();
        const painDescription = data.description || '';

        if (!painDescription) {
          return errorResponse('Description is required', 'VALIDATION_ERROR', 400);
        }

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

        const imageUrl = response.data[0].url;
        const revisedPrompt = response.data[0].revised_prompt || artisticPrompt;

        return jsonResponse({
          success: true,
          image_url: imageUrl,
          prompt_used: revisedPrompt,
          original_description: painDescription,
        });
      }

      if (path === '/api/generate/prompt' && request.method === 'POST') {
        const data = await request.json();
        const painDescription = data.description || '';

        if (!painDescription) {
          return errorResponse('Description is required', 'VALIDATION_ERROR', 400);
        }

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

        const responseText = completion.choices[0].message.content;
        const prompts = JSON.parse(responseText);

        return jsonResponse({
          success: true,
          prompts: prompts.prompts || [],
          original_description: painDescription,
        });
      }

      if (path === '/api/reflect' && request.method === 'POST') {
        const data = await request.json();
        const painDescription = data.description || '';
        const imageContext = data.image_context || '';

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

        const responseText = completion.choices[0].message.content;
        const questions = JSON.parse(responseText);

        return jsonResponse({
          success: true,
          questions: questions.questions || [],
          original_description: painDescription,
        });
      }

      if (path === '/api/inspire' && request.method === 'GET') {
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

        const responseText = completion.choices[0].message.content;
        const inspirations = JSON.parse(responseText);

        return jsonResponse({
          success: true,
          inspirations: inspirations.inspirations || [],
        });
      }

      if (path === '/api/edit/image' && request.method === 'POST') {
        const data = await request.json();
        const imageBase64 = data.image;
        const painDescription = data.description || data.prompt || '';

        if (!imageBase64 || !painDescription) {
          return errorResponse('Image and pain description are required', 'VALIDATION_ERROR', 400);
        }

        try {
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

          const styleAnalysis = visionResponse.choices[0].message.content;

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

          const generatedImageUrl = imageResponse.data[0].url;
          const revisedPrompt = imageResponse.data[0].revised_prompt || combinedPrompt;

          return jsonResponse({
            success: true,
            edited_image_url: generatedImageUrl,
            prompt_used: revisedPrompt,
            original_description: painDescription,
            style_analysis: styleAnalysis,
            model_used: 'dall-e-3-with-vision',
          });
        } catch (error) {
          console.error('Image transformation error:', error);
          throw error;
        }
      }

      // 404 for unknown routes
      return errorResponse('Not found', 'NOT_FOUND', 404);

    } catch (error) {
      console.error('Worker error:', error);
      return errorResponse('Internal server error', 'INTERNAL_ERROR', 500);
    }
  }
};
