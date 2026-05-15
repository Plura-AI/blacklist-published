import { NextResponse } from 'next/server';

export function middleware(request) {
  // Only protect /admin routes
  if (!request.nextUrl.pathname.startsWith('/admin')) {
    return NextResponse.next();
  }

  const expectedUser = (process.env.ADMIN_USER || 'blacklist').trim();
  const expectedPass = (process.env.ADMIN_PASS || 'Blacklist2026!').trim();

  // Cookie-based auth — set by /api/admin-login
  const cookieRaw = request.cookies.get('bapp_admin')?.value;
  if (cookieRaw) {
    let decoded = cookieRaw;
    try { decoded = decodeURIComponent(cookieRaw); } catch (_) {}
    if (decoded === expectedPass) {
      return NextResponse.next();
    }
  }

  // HTTP Basic Auth fallback
  const authHeader = request.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Basic ')) {
    const encoded = authHeader.split(' ')[1];
    // Edge Runtime doesn't have Buffer — use atob (Web API)
    const decoded = atob(encoded);
    // Split on first colon only so passwords with colons aren't truncated
    const colonIdx = decoded.indexOf(':');
    const user = decoded.substring(0, colonIdx);
    const pass = decoded.substring(colonIdx + 1);

    if (user === expectedUser && pass === expectedPass) {
      return NextResponse.next();
    }
  }

  return new NextResponse('Unauthorized', {
    status: 401,
    headers: {
      'WWW-Authenticate': 'Basic realm="BAPP Admin — Blacklist Alliance"',
    },
  });
}

export const config = {
  matcher: '/admin/:path*',
};
