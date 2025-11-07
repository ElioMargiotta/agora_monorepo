// app/api/extended/agents/route.js
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function bases() {
  const env = process.env.BACKEND_URL && process.env.BACKEND_URL.trim();
  const list = [];
  if (env) list.push(env);
  list.push('http://127.0.0.1:8000', 'http://host.docker.internal:8000');
  return [...new Set(list)];
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const owner = searchParams.get('owner');
  const description = searchParams.get('description'); // optional

  if (!owner) {
    return new Response(JSON.stringify({ detail: 'Missing ?owner=0x...' }), {
      status: 400,
      headers: { 'content-type': 'application/json' },
    });
  }

  for (const base of bases()) {
    try {
      const url =
        `${base}/extended/agents` +
        `?owner=${encodeURIComponent(owner)}` +
        (description ? `&description=${encodeURIComponent(description)}` : '');

      const r = await fetch(url, {
        headers: { cookie: request.headers.get('cookie') || '' },
        cache: 'no-store',
      });

      const text = await r.text();
      const headers = new Headers({
        'content-type': r.headers.get('content-type') ?? 'application/json',
      });
      const setCookie = r.headers.get('set-cookie');
      if (setCookie) headers.set('set-cookie', setCookie);

      return new Response(text, { status: r.status, headers });
    } catch {
      // try next base
    }
  }

  return new Response(JSON.stringify({ detail: 'Proxy error: fetch failed' }), {
    status: 502,
    headers: { 'content-type': 'application/json' },
  });
}
