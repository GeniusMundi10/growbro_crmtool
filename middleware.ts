import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const publicRoutes = [
  '/login',
  '/signup',
  '/verify',
  '/forgot-password',
  '/reset-password',
  '/favicon.ico',
  '/_next',
  '/api/auth',
  '/api/public'
];

export async function middleware(request: NextRequest) {
  console.log('Middleware triggered for path:', request.nextUrl.pathname);
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req: request, res });
  const { pathname } = request.nextUrl;
  
  console.log('Pathname:', pathname);
  console.log('Is public route:', publicRoutes.some(route => 
    pathname === route || pathname.startsWith(route.replace(/\*$/, ''))
  ));

  // Check if the current path is public
  const isPublicRoute = publicRoutes.some(route => {
    // For exact matches
    if (pathname === route) return true;
    // For path prefixes (like /api/auth/...)
    if (route.endsWith('*') && pathname.startsWith(route.slice(0, -1))) return true;
    return false;
  });

  // If it's a public route, allow access
  if (isPublicRoute) {
    return res;
  }

  // For non-public routes, check authentication
  const { data: { session } } = await supabase.auth.getSession();

  // If user is authenticated, allow access
  if (session) {
    return res;
  }

  // If not authenticated and trying to access protected route, redirect to login
  const redirectUrl = new URL('/login', request.url);
  redirectUrl.searchParams.set('redirectedFrom', pathname);
  return NextResponse.redirect(redirectUrl);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
};
