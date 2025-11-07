import { proxyJson } from '../../_config';
export const dynamic = 'force-dynamic';
export async function GET(request) {
  return proxyJson(request, '/auth/nonce', { method: 'GET' });
}