// src/app/api/_config.js
import { NextResponse } from 'next/server';

export const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';

export function backendUrl(path, req) {
  // normalize path to always start with '/'
  const suffix = path.startsWith('/') ? path : `/${path}`;
  // keep the original query string (e.g. ?path=%2Fapi%2Fv1%2Fuser%2Faccounts)
  const search = req?.nextUrl?.search || '';
  return `${BACKEND_URL}${suffix}${search}`;
}

export function sessionHeaders(req) {
  const cookie = req.headers.get('cookie');
  return cookie ? { cookie } : {};
}

export function proxyInit(req, init = {}) {
  return {
    ...init,
    headers: { ...(init.headers || {}), ...sessionHeaders(req) },
    // Important: never cache auth/agent responses
    cache: 'no-store',
  };
}

export async function proxyJson(req, path, init = {}) {
  const r = await fetch(backendUrl(path, req), proxyInit(req, init));
  const data = await r.json().catch(() => ({}));
  const res = NextResponse.json(data, { status: r.status });

  // forward Set-Cookie from backend so the browser gets the session cookie
  const setCookie = r.headers.get('set-cookie');
  if (setCookie) res.headers.set('set-cookie', setCookie);

  return res;
}
