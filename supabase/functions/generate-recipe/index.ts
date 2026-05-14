import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const { videoUrl } = await req.json();
    if (!videoUrl || typeof videoUrl !== 'string') {
      return new Response(JSON.stringify({ error: 'videoUrl required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: 'LOVABLE_API_KEY not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
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
            },
            required: ['number', 'instruction', 'tip'],
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

    const systemPrompt = `You are CookMate AI, a warm, knowledgeable cooking assistant — like a grandma guiding someone in the kitchen.
Given a cooking video URL, infer the most likely dish and produce a complete, realistic recipe.
Rules:
- Pick a plausible specific dish based on the URL slug/title if any hints exist; otherwise pick a popular dish.
- Provide accurate ingredient quantities and units for the given servings.
- Steps must be clear and ordered. Add a "duration" in seconds for steps that involve waiting/cooking time (omit for quick prep steps).
- Every step MUST include a short, warm "tip" — a grandma-style insight or trick.
- Estimate nutrition per serving in realistic numbers.`;

    const userPrompt = `Generate a structured recipe for this cooking video URL: ${videoUrl}`;

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

    return new Response(JSON.stringify({ recipe }), {
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