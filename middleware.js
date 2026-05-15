import { NextResponse } from 'next/server';

export function middleware(request) {
  // Only protect /admin routes
  if (!request.nextUrl.pathname.startsWith('/admin')) {
    return NextResponse.next();
  }

  const authHeader = request.headers.get('authorization');

  if (authHeader) {
    const encoded = authHeader.split(' ')[1];
    const decoded = Buffer.from(encoded, 'base64').toString('utf-8');
    const [user, pass] = decoded.split(':');

    const expectedUser = process.env.ADMIN_USER || 'blacklist';
    const expectedPass = process.env.ADMIN_PASS || 'Blacklist2026!';

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
