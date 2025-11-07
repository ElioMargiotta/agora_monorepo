import { NextResponse } from 'next/server';
import { proxyJson } from '../../../_config'; // from .../active-asset-data to /api/_config.js

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const owner = searchParams.get('owner');
  const coin = searchParams.get('coin');

  if (!owner || !coin) {
    return NextResponse.json({ detail: 'owner and coin are required' }, { status: 400 });
  }

  try {
    return await proxyJson(req, '/agents/hl/active-asset-data', { method: 'GET' });
  } catch (err) {
    return NextResponse.json(
      { detail: 'backend unreachable', error: String(err?.message || err) },
      { status: 502 }
    );
  }
}
