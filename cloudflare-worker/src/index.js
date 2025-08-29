import OpenAI from 'openai';

export default {
  async fetch(request, env, ctx) {
    // CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    };

    // Handle OPTIONS request for CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    const url = new URL(request.url);
    const path = url.pathname;

    // Initialize OpenAI client
    const openai = new OpenAI({
      apiKey: env.OPENAI_API_KEY,
    });

    try {
      // Route handling
      if (path === '/api/health' && request.method === 'GET') {
        return new Response(
          JSON.stringify({ status: 'healthy', message: 'API is running on Cloudflare Workers' }),
          {
            headers: {
              'Content-Type': 'application/json',
              ...corsHeaders,
            },
          }
        );
      }

      if (path === '/api/generate/image' && request.method === 'POST') {
        const data = await request.json();
        const painDescription = data.description || '';

        if (!painDescription) {
          return new Response(
            JSON.stringify({ error: 'Description is required' }),
            {
              status: 400,
              headers: {
                'Content-Type': 'application/json',
                ...corsHeaders,
              },
            }
          );
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

        return new Response(
          JSON.stringify({
            success: true,
            image_url: imageUrl,
            prompt_used: revisedPrompt,
            original_description: painDescription,
          }),
          {
            headers: {
              'Content-Type': 'application/json',
              ...corsHeaders,
            },
          }
        );
      }

      if (path === '/api/generate/prompt' && request.method === 'POST') {
        const data = await request.json();
        const painDescription = data.description || '';

        if (!painDescription) {
          return new Response(
            JSON.stringify({ error: 'Description is required' }),
            {
              status: 400,
              headers: {
                'Content-Type': 'application/json',
                ...corsHeaders,
              },
            }
          );
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

        return new Response(
          JSON.stringify({
            success: true,
            prompts: prompts.prompts || [],
            original_description: painDescription,
          }),
          {
            headers: {
              'Content-Type': 'application/json',
              ...corsHeaders,
            },
          }
        );
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

        return new Response(
          JSON.stringify({
            success: true,
            questions: questions.questions || [],
            original_description: painDescription,
          }),
          {
            headers: {
              'Content-Type': 'application/json',
              ...corsHeaders,
            },
          }
        );
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

        return new Response(
          JSON.stringify({
            success: true,
            inspirations: inspirations.inspirations || [],
          }),
          {
            headers: {
              'Content-Type': 'application/json',
              ...corsHeaders,
            },
          }
        );
      }

      if (path === '/api/edit/image' && request.method === 'POST') {
        const data = await request.json();
        const imageBase64 = data.image;
        const painDescription = data.description || data.prompt || '';

        if (!imageBase64 || !painDescription) {
          return new Response(
            JSON.stringify({ error: 'Image and pain description are required' }),
            {
              status: 400,
              headers: {
                'Content-Type': 'application/json',
                ...corsHeaders,
              },
            }
          );
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

          return new Response(
            JSON.stringify({
              success: true,
              edited_image_url: generatedImageUrl,
              prompt_used: revisedPrompt,
              original_description: painDescription,
              style_analysis: styleAnalysis,
              model_used: 'dall-e-3-with-vision',
            }),
            {
              headers: {
                'Content-Type': 'application/json',
                ...corsHeaders,
              },
            }
          );
        } catch (error) {
          console.error('Image transformation error:', error);
          throw error;
        }
      }

      // 404 for unmatched routes
      return new Response(
        JSON.stringify({ error: 'Not found' }),
        {
          status: 404,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders,
          },
        }
      );
    } catch (error) {
      console.error('Error:', error);
      return new Response(
        JSON.stringify({ error: error.message || 'Internal server error' }),
        {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders,
          },
        }
      );
    }
  },
};