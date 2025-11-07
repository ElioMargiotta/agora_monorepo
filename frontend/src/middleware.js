import { NextResponse } from 'next/server';

export function middleware(request) {
  const pathname = request.nextUrl.pathname;
  
  // Allow root path (will redirect via page.js)
  if (pathname === '/') {
    return NextResponse.next();
  }
  
  // Allow Zama game path
  if (pathname.startsWith('/app/zama-game')) {
    return NextResponse.next();
  }
  
  // Allow Next.js internal routes
  if (pathname.startsWith('/_next') || pathname.startsWith('/api')) {
    return NextResponse.next();
  }
  
  // Block everything else - return 404
  return NextResponse.rewrite(new URL('/not-found', request.url));
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
