import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

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

export function middleware(req: NextRequest) {
  const url = req.nextUrl;
  const path = url.pathname;
  
  // Get role from cookie
  const role = req.cookies.get('role')?.value;

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
