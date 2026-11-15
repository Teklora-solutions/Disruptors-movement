import { NextResponse, type NextRequest } from 'next/server';

/**
 * Sends signed-out visitors from member pages to sign-in and back afterwards.
 * Only checks the cookie is present: the API verifies it on every data request,
 * so a forged or expired cookie gets a page with no data, never anyone else's.
 */
export function middleware(request: NextRequest) {
  if (request.cookies.has('dm_session')) return NextResponse.next();
  const url = request.nextUrl.clone();
  url.pathname = '/signin';
  url.search = `?next=${encodeURIComponent(request.nextUrl.pathname)}`;
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ['/dashboard/:path*', '/profile/:path*', '/tickets/:path*', '/admin/:path*'],
};
