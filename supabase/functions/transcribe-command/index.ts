const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: 'AI is not configured.' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const form = await req.formData();
    const file = form.get('file');
    const language = String(form.get('language') || '');

    if (!(file instanceof File) || file.size < 2048) {
      return new Response(JSON.stringify({ error: 'Recording was empty — please try again.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    if (file.size > 5 * 1024 * 1024) {
      return new Response(JSON.stringify({ error: 'Recording too long.' }), {
        status: 413,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const upstream = new FormData();
    upstream.append('model', 'openai/gpt-4o-mini-transcribe');
    upstream.append('file', file, 'command.wav');
    if (language === 'hi' || language === 'en') upstream.append('language', language);

    const res = await fetch('https://ai.gateway.lovable.dev/v1/audio/transcriptions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}` },
      body: upstream,
    });

    if (!res.ok) {
      const detail = await res.text().catch(() => '');
      console.error('transcription failed', res.status, detail);
      const message =
        res.status === 402
          ? 'AI credits exhausted — please top up to use voice commands.'
          : res.status === 429
            ? 'Too many voice requests — wait a moment and try again.'
            : 'Could not understand the recording.';
      return new Response(JSON.stringify({ error: message }), {
        status: res.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const json = await res.json();
    return new Response(JSON.stringify({ text: json.text ?? '' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('transcribe-command error', e);
    return new Response(JSON.stringify({ error: 'Voice transcription failed.' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
