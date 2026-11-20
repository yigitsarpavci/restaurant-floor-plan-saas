import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { SESSION_COOKIE, verifySession } from '@/lib/session';

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, sitemap.xml, robots.txt (metadata files)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)',
  ],
};

export async function middleware(req: NextRequest) {
  const url = req.nextUrl;
  const path = url.pathname;
  
  // Role comes from a signed, httpOnly session cookie (never from a client-editable value)
  const session = await verifySession(req.cookies.get(SESSION_COOKIE)?.value);
  const role = session?.role === 'admin' ? 'admin' : session?.role === 'owner' ? 'owner' : undefined;

  // Protect /manage route (only admin)
  if (path.startsWith('/manage')) {
    if (role !== 'admin') {
      return NextResponse.redirect(new URL('/', req.url));
    }
  }

  // Protect /liveops route (owner or admin)
  if (path.startsWith('/liveops')) {
    if (role !== 'owner' && role !== 'admin') {
      return NextResponse.redirect(new URL('/', req.url));
    }
  }

  // If logged in and on the root page, redirect to appropriate dashboard
  if (path === '/') {
    if (role === 'admin') {
      return NextResponse.redirect(new URL('/manage', req.url));
    } else if (role === 'owner') {
      return NextResponse.redirect(new URL('/liveops', req.url));
    }
  }

  // Allow all other routes (like /booking/...)
  return NextResponse.next();
}
