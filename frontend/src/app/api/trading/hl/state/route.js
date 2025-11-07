import { NextResponse } from 'next/server';
import { proxyJson } from '../../../_config'; // from .../state to /api/_config.js

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const owner = searchParams.get('owner');
  const agentName = searchParams.get('agent_name') ?? 'aeq-agent';

  if (!owner) {
    return NextResponse.json({ detail: 'owner is required' }, { status: 400 });
  }

  try {
    // proxyJson keeps the original query string via backendUrl()
    return await proxyJson(req, '/agents/hl/state', { method: 'GET' });
  } catch (err) {
    return NextResponse.json(
      { detail: 'backend unreachable', error: String(err?.message || err) },
      { status: 502 }
    );
  }
}
