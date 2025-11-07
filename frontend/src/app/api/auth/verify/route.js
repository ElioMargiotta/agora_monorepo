// src/app/api/auth/verify/route.js
import { proxyJson } from '../../_config';

export const dynamic = 'force-dynamic'; // avoid caching, optional but helpful

export async function POST(request) {
  const body = await request.json();
  return proxyJson(request, '/auth/verify', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
}
