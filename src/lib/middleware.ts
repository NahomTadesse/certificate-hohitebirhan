// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getCurrentUser } from '../services/authService';

export function middleware(request: NextRequest) {
  // Skip for API routes, static files, and login page
  if (
    request.nextUrl.pathname.startsWith('/api') ||
    request.nextUrl.pathname.startsWith('/_next') ||
    request.nextUrl.pathname.startsWith('/login') ||
    request.nextUrl.pathname.startsWith('/_vercel')
  ) {
    return NextResponse.next();
  }

  // Check if user is authenticated
  const user = getCurrentUser();
  if (!user) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Get routes from cookies
  const routesCookie = request.cookies.get('user_routes')?.value;
  const enableProtection = request.cookies.get('enable_route_protection')?.value;
  
  // If protection is disabled, allow access
  if (enableProtection === 'false') {
    return NextResponse.next();
  }

  // If no routes defined yet (initial load), allow access
  if (!routesCookie) {
    return NextResponse.next();
  }

  try {
    const routes: string[] = JSON.parse(routesCookie);
    const currentPath = request.nextUrl.pathname.slice(1); // Remove leading slash
    const pathSegment = currentPath.split('/')[0];
    
    // Always allowed routes
    const alwaysAllowed = ['dashboard', 'profile', 'settings', 'notifications'];
    if (alwaysAllowed.includes(pathSegment)) {
      return NextResponse.next();
    }

    // Check if user has access to this route
    const hasAccess = routes.some(route => {
      const routeSegment = route.startsWith('/') ? route.slice(1) : route;
      return routeSegment.toLowerCase() === pathSegment.toLowerCase();
    });

    if (!hasAccess) {
      // Redirect to not-found page
      return NextResponse.rewrite(new URL('/not-found', request.url));
    }
  } catch (error) {
    console.error('Route validation error:', error);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};