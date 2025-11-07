// src/app/api/auth/logout/route.js
import { proxyJson } from '../../_config';
export const dynamic = 'force-dynamic';
export async function POST(request) {
  return proxyJson(request, '/auth/logout', { method: 'POST' });
}