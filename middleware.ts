import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const COOKIE_NAME = 'polachecks_session';

function getSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET is not set');
  return new TextEncoder().encode(secret);
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isProtected =
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/customers') ||
    pathname.startsWith('/catalog') ||
    pathname.startsWith('/requirements') ||
    pathname.startsWith('/inventory') ||
    pathname.startsWith('/allocations') ||
    pathname.startsWith('/reports') ||
    pathname.startsWith('/admin');

  if (!isProtected) return NextResponse.next();

  const token = request.cookies.get(COOKIE_NAME)?.value;
  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  try {
    await jwtVerify(token, getSecret());
    return NextResponse.next();
  } catch {
    const response = NextResponse.redirect(new URL('/login', request.url));
    response.cookies.delete(COOKIE_NAME);
    return response;
  }
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/customers/:path*',
    '/catalog/:path*',
    '/requirements/:path*',
    '/inventory/:path*',
    '/allocations/:path*',
    '/reports/:path*',
    '/admin/:path*'
  ],
};
