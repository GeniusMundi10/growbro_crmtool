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
  '/api/auth/request-password-reset',
  '/api/auth/reset-password',
  '/api/public'
];

// Helper function to check if a path is public
function isPublicPath(pathname: string): boolean {
  // Check exact matches
  if (publicRoutes.includes(pathname)) return true;
  
  // Check path prefixes
  return publicRoutes.some(route => {
    // For paths that should match exactly
    if (!route.endsWith('*') && pathname === route) return true;
    // For paths that should match a prefix
    if (route.endsWith('*') && pathname.startsWith(route.slice(0, -1))) return true;
    return false;
  });
}

export async function middleware(request: NextRequest) {
  console.log('Middleware triggered for path:', request.nextUrl.pathname);
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req: request, res });
  const { pathname } = request.nextUrl;
  
  console.log('Pathname:', pathname);
  console.log('Is public route:', publicRoutes.some(route => 
    pathname === route || pathname.startsWith(route.replace(/\*$/, ''))
  ));

  // If it's a public route, allow access
  if (isPublicPath(pathname)) {
    console.log(`Allowing access to public route: ${pathname}`);
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
