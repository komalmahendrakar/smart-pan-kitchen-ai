import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const { prompt } = await req.json();
    if (!prompt || typeof prompt !== 'string' || prompt.length > 500) {
      return new Response(JSON.stringify({ error: 'prompt required (max 500 chars)' }), {
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

    const resp = await fetch('https://ai.gateway.lovable.dev/v1/images/generations', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-3.1-flash-lite-image',
        contents: [
          {
            role: 'user',
            parts: [
              {
                text: `Appetizing overhead food photography of a cooking step: ${prompt}. Warm natural kitchen light, realistic, no text, no watermark.`,
              },
            ],
          },
        ],
        generationConfig: { responseModalities: ['TEXT', 'IMAGE'] },
      }),
    });

    if (!resp.ok) {
      const text = await resp.text();
      console.error('image gateway error', resp.status, text);
      const status = resp.status === 429 || resp.status === 402 ? resp.status : 500;
      return new Response(
        JSON.stringify({ error: status === 429 ? 'Rate limited, try again shortly.' : status === 402 ? 'AI credits exhausted.' : 'Image generation failed' }),
        { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const data = await resp.json();
    const b64 = data?.data?.[0]?.b64_json;
    if (!b64) {
      console.error('no image in response', JSON.stringify(data).slice(0, 500));
      return new Response(JSON.stringify({ error: 'No image returned' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ image: `data:image/png;base64,${b64}` }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('generate-step-image error', err);
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
