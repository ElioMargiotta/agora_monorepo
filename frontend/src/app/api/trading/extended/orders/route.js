export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function bases() {
  const env = process.env.BACKEND_URL && process.env.BACKEND_URL.trim();
  const list = [];
  if (env) list.push(env);
  list.push('http://127.0.0.1:8000', 'http://host.docker.internal:8000');
  return [...new Set(list)];
}

// GET /api/trading/extended/orders - Get open orders
export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const owner = searchParams.get('owner');
  const market = searchParams.get('market');

  if (!owner) {
    return new Response(JSON.stringify({ error: 'Owner wallet address is required' }), {
      status: 400,
      headers: { 'content-type': 'application/json' },
    });
  }

  const params = new URLSearchParams({ owner });
  if (market) params.append('market', market);

  for (const base of bases()) {
    try {
      const r = await fetch(`${base}/extended/trading/orders/open?${params}`, {
        method: 'GET',
        headers: { 'content-type': 'application/json', cookie: req.headers.get('cookie') || '' },
      });
      const text = await r.text();
      const headers = new Headers({ 'content-type': r.headers.get('content-type') ?? 'application/json' });
      const setCookie = r.headers.get('set-cookie');
      if (setCookie) headers.set('set-cookie', setCookie);
      return new Response(text, { status: r.status, headers });
    } catch {}
  }
  return new Response(JSON.stringify({ detail: 'Proxy error: fetch failed' }), {
    status: 502, headers: { 'content-type': 'application/json' },
  });
}

// POST /api/trading/extended/orders - Place order
export async function POST(req) {
  const body = await req.text();
  const { owner } = JSON.parse(body);

  if (!owner) {
    return new Response(JSON.stringify({ error: 'Owner wallet address is required' }), {
      status: 400,
      headers: { 'content-type': 'application/json' },
    });
  }

  for (const base of bases()) {
    try {
      const r = await fetch(`${base}/extended/trading/orders/place`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', cookie: req.headers.get('cookie') || '' },
        body,
      });
      const text = await r.text();
      const headers = new Headers({ 'content-type': r.headers.get('content-type') ?? 'application/json' });
      const setCookie = r.headers.get('set-cookie');
      if (setCookie) headers.set('set-cookie', setCookie);
      return new Response(text, { status: r.status, headers });
    } catch {}
  }
  return new Response(JSON.stringify({ detail: 'Proxy error: fetch failed' }), {
    status: 502, headers: { 'content-type': 'application/json' },
  });
}

// DELETE /api/trading/extended/orders - Cancel order
export async function DELETE(req) {
  const body = await req.text();
  const { owner } = JSON.parse(body);

  if (!owner) {
    return new Response(JSON.stringify({ error: 'Owner wallet address is required' }), {
      status: 400,
      headers: { 'content-type': 'application/json' },
    });
  }

  for (const base of bases()) {
    try {
      const r = await fetch(`${base}/extended/trading/orders/cancel`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', cookie: req.headers.get('cookie') || '' },
        body,
      });
      const text = await r.text();
      const headers = new Headers({ 'content-type': r.headers.get('content-type') ?? 'application/json' });
      const setCookie = r.headers.get('set-cookie');
      if (setCookie) headers.set('set-cookie', setCookie);
      return new Response(text, { status: r.status, headers });
    } catch {}
  }
  return new Response(JSON.stringify({ detail: 'Proxy error: fetch failed' }), {
    status: 502, headers: { 'content-type': 'application/json' },
  });
}
