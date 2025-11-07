import { backendUrl, proxyInit } from '../../../_config';
export const dynamic = 'force-dynamic';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const owner = searchParams.get('owner');
  if (!owner) return Response.json({ error: 'Missing ?owner=0x...' }, { status: 400 });

  const r = await fetch(
    `${backendUrl('/agents/hl')}?owner=${encodeURIComponent(owner)}`,
    proxyInit(request, { method: 'GET' })
  );
  const data = await r.json().catch(() => ({}));
  return Response.json(data, { status: r.status });
}
