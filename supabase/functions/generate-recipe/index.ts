import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

function extractYouTubeId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/|youtube\.com\/embed\/)([A-Za-z0-9_-]{11})/,
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m) return m[1];
  }
  return null;
}

function isInstagramUrl(url: string): boolean {
  return /instagram\.com\/(reel|p|tv)\//i.test(url);
}

// Fetch the real video title/description via YouTube oEmbed (free, no key)
async function fetchVideoTitle(videoUrl: string): Promise<string | null> {
  try {
    const resp = await fetch(
      `https://www.youtube.com/oembed?url=${encodeURIComponent(videoUrl)}&format=json`,
    );
    if (!resp.ok) return null;
    const data = await resp.json();
    const title = typeof data?.title === 'string' ? data.title.trim() : '';
    const author = typeof data?.author_name === 'string' ? data.author_name.trim() : '';
    if (!title) return null;
    return author ? `${title} (by ${author})` : title;
  } catch {
    return null;
  }
}

async function fetchSupadataTranscript(
  videoUrl: string,
  apiKey: string,
): Promise<{ text: string | null; error?: string }> {
  try {
    // Supadata transcript endpoint — works for YouTube, Instagram, TikTok, etc.
    // Docs: https://supadata.ai/documentation/transcript
    const endpoint = `https://api.supadata.ai/v1/transcript?url=${encodeURIComponent(videoUrl)}&text=true`;
    const resp = await fetch(endpoint, {
      headers: { 'x-api-key': apiKey },
    });
    if (!resp.ok) {
      const body = await resp.text();
      console.error('Supadata error', resp.status, body);
      return { text: null, error: `Supadata ${resp.status}` };
    }
    const data = await resp.json();
    // Response shape: { content: string, lang: string, ... } when text=true
    // or { content: [{text,...}], ... } when text=false. Handle both.
    let text: string | null = null;
    if (typeof data?.content === 'string') {
      text = data.content;
    } else if (Array.isArray(data?.content)) {
      text = data.content.map((c: { text?: string }) => c.text ?? '').join(' ');
    } else if (typeof data?.transcript === 'string') {
      text = data.transcript;
    }
    text = text?.replace(/\s+/g, ' ').trim() || null;
    return { text };
  } catch (e) {
    console.error('Supadata fetch failed', e);
    return { text: null, error: (e as Error).message };
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const { videoUrl, language } = await req.json();
    if (!videoUrl || typeof videoUrl !== 'string') {
      return new Response(JSON.stringify({ error: 'videoUrl required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const lang: 'en' | 'hi' = language === 'hi' ? 'hi' : 'en';

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: 'LOVABLE_API_KEY not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Try to extract a real transcript
    let transcript: string | null = null;
    let source: 'supadata-youtube' | 'supadata-instagram' | 'supadata-other' | 'url-only' = 'url-only';

    const SUPADATA_API_KEY = Deno.env.get('SUPADATA_API_KEY');
    const ytId = extractYouTubeId(videoUrl);
    const isIg = isInstagramUrl(videoUrl);

    if (SUPADATA_API_KEY) {
      const { text } = await fetchSupadataTranscript(videoUrl, SUPADATA_API_KEY);
      if (text) {
        transcript = text;
        source = ytId ? 'supadata-youtube' : isIg ? 'supadata-instagram' : 'supadata-other';
      }
    } else {
      console.warn('SUPADATA_API_KEY not set — falling back to URL-only inference');
    }

    // Cap transcript length to keep prompt reasonable
    if (transcript && transcript.length > 16000) {
      transcript = transcript.slice(0, 16000) + '…';
    }

    const recipeSchema = {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Name of the dish' },
        cookingTime: { type: 'string', description: 'Total time, e.g. "30 mins"' },
        difficulty: { type: 'string', enum: ['Easy', 'Medium', 'Hard'] },
        servings: { type: 'number' },
        ingredients: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              quantity: { type: 'string' },
              unit: { type: 'string' },
            },
            required: ['name', 'quantity', 'unit'],
            additionalProperties: false,
          },
        },
        steps: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              number: { type: 'number' },
              instruction: { type: 'string' },
              duration: { type: 'number', description: 'Optional timer in seconds' },
              tip: { type: 'string', description: 'Warm grandma-style cooking tip' },
              imageQuery: { type: 'string', description: 'A short 4-8 word visual description of this step for image generation, e.g. "chopping onions on wooden board" or "golden brown caramelizing onions in pan"' },
            },
            required: ['number', 'instruction', 'tip', 'imageQuery'],
            additionalProperties: false,
          },
        },
        nutrition: {
          type: 'object',
          properties: {
            calories: { type: 'number' },
            protein: { type: 'number' },
            carbohydrates: { type: 'number' },
            fat: { type: 'number' },
          },
          required: ['calories', 'protein', 'carbohydrates', 'fat'],
          additionalProperties: false,
        },
      },
      required: ['name', 'cookingTime', 'difficulty', 'servings', 'ingredients', 'steps', 'nutrition'],
      additionalProperties: false,
    };

    const languageInstruction = lang === 'hi'
      ? `IMPORTANT LANGUAGE RULE: Write ALL output (dish name, ingredient names, step instructions, tips) in natural conversational Hindi using Devanagari script (हिन्दी). Keep "difficulty" as one of Easy/Medium/Hard (English) and keep "imageQuery" in English (it is used for image search). Units may stay in common Hindi/English mix (e.g. "कप", "चम्मच", "ग्राम").`
      : `Write everything in clear, friendly English.`;

    const systemPrompt = `You are CookMate AI, a warm, knowledgeable cooking assistant — like a grandma guiding someone in the kitchen.
Produce a complete, realistic, structured recipe.
${languageInstruction}
Rules:
- If a transcript is provided, base the recipe STRICTLY on what is actually said/shown in the video. Extract the real dish name, ingredients, quantities, and steps from the transcript. Fill obvious gaps (e.g. salt to taste) sensibly but do not invent unrelated ingredients.
- If no transcript is provided, infer the most likely dish from the URL slug/title.
- Provide accurate ingredient quantities and units for the given servings.
- Steps must be clear and ordered. Add a "duration" in seconds for steps that involve waiting/cooking time (omit for quick prep steps).
- Every step MUST include a short, warm "tip" — a grandma-style insight or trick.
- Every step MUST include an "imageQuery": a vivid 4-8 word visual phrase describing what that step looks like (used to fetch a step image). Be specific and visual.
- Estimate nutrition per serving in realistic numbers.`;

    const userPrompt = transcript
      ? `Cooking video URL: ${videoUrl}\n\nFull spoken transcript from the video:\n"""\n${transcript}\n"""\n\nGenerate the structured recipe based on this transcript.`
      : `Generate a structured recipe for this cooking video URL: ${videoUrl}\n(No transcript available — infer from the URL.)`;

    const aiResp = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        tools: [{
          type: 'function',
          function: {
            name: 'return_recipe',
            description: 'Return the structured recipe',
            parameters: recipeSchema,
          },
        }],
        tool_choice: { type: 'function', function: { name: 'return_recipe' } },
      }),
    });

    if (!aiResp.ok) {
      const text = await aiResp.text();
      console.error('AI gateway error', aiResp.status, text);
      if (aiResp.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit reached. Please try again shortly.' }), {
          status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (aiResp.status === 402) {
        return new Response(JSON.stringify({ error: 'AI credits exhausted. Please add credits in workspace settings.' }), {
          status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      return new Response(JSON.stringify({ error: 'AI request failed' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const data = await aiResp.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall?.function?.arguments) {
      console.error('No tool call in response', JSON.stringify(data));
      return new Response(JSON.stringify({ error: 'AI did not return a recipe' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const recipe = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify({ recipe, transcriptSource: source }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('generate-recipe error', err);
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});