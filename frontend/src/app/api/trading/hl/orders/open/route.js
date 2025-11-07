import { proxyJson } from '../../../../_config';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  const body = await request.json();
  return proxyJson(request, '/agents/hl/trade', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
}
