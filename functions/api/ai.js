export async function onRequest(context) {
  const { request, env } = context;

  // Только POST
  if (request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  // Только с твоего сайта
  const origin = request.headers.get('Origin');
  const allowedOrigins = [
    'https://dreamsaver-*.pages.dev',
    'http://localhost:5173',
    'http://localhost:4173',
  ];

  const isAllowed = allowedOrigins.some((pattern) => {
    if (pattern.includes('*')) {
      const regex = new RegExp('^' + pattern.replace('*', '[a-zA-Z0-9-]+') + '$');
      return regex.test(origin);
    }
    return origin === pattern;
  });

  if (!isAllowed) {
    return new Response('Forbidden', { status: 403 });
  }

  try {
    const body = await request.json();
    const { messages } = body;

    if (!messages || !Array.isArray(messages)) {
      return new Response('Bad request: messages required', { status: 400 });
    }

    // Пробуем DeepSeek
    if (env.DEEPSEEK_KEY) {
      const res = await fetch('https://api.deepseek.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${env.DEEPSEEK_KEY}`,
        },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages,
          max_tokens: 600,
          temperature: 0.8,
        }),
      });

      if (res.ok) {
        return new Response(await res.text(), {
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': origin },
        });
      }
    }

    // Fallback: OpenRouter
    if (env.OPENROUTER_KEY) {
      const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${env.OPENROUTER_KEY}`,
          'HTTP-Referer': origin,
          'X-Title': 'DreamSaver',
        },
        body: JSON.stringify({
          model: 'openrouter/free',
          messages,
          max_tokens: 600,
          temperature: 0.8,
        }),
      });

      if (res.ok) {
        return new Response(await res.text(), {
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': origin },
        });
      }
    }

    return new Response('All AI providers failed', { status: 502 });
  } catch (err) {
    return new Response('Internal error: ' + err.message, { status: 500 });
  }
}

// Обработка OPTIONS (CORS preflight)
export async function onRequestOptions(context) {
  const origin = context.request.headers.get('Origin') || '*';
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}