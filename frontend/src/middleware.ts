import { NextRequest, NextResponse } from 'next/server'

export function middleware(request: NextRequest) {
  // Get authentication token from cookies
  const authToken = request.cookies.get('auth_token')?.value
  const authUser = request.cookies.get('auth_user')?.value
  const isLoggedIn = !!(authToken && authUser)

  // Define protected and public paths
  const protectedPaths = ['/tasks', '/dashboard', '/']
  const authPaths = ['/auth']
  
  const { pathname } = request.nextUrl
  
  // Check if current path is protected
  const isProtectedPath = protectedPaths.some(path => 
    pathname === path || pathname.startsWith(path + '/')
  )
  
  // Check if current path is an auth path
  const isAuthPath = authPaths.some(path => 
    pathname === path || pathname.startsWith(path + '/')
  )

  // Redirect unauthenticated users away from protected routes
  if (isProtectedPath && !isLoggedIn) {
    const url = request.nextUrl.clone()
    url.pathname = '/auth'
    url.searchParams.set('redirect', pathname)
    return NextResponse.redirect(url)
  }

  // Redirect authenticated users away from auth pages
  if (isAuthPath && isLoggedIn) {
    const redirectTo = request.nextUrl.searchParams.get('redirect') || '/tasks'
    const url = request.nextUrl.clone()
    url.pathname = redirectTo
    url.searchParams.delete('redirect')
    return NextResponse.redirect(url)
  }

  // Add security headers for protected routes
  if (isProtectedPath) {
    const response = NextResponse.next()
    
    // Add security headers
    response.headers.set('X-Frame-Options', 'DENY')
    response.headers.set('X-Content-Type-Options', 'nosniff')
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
    response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
    
    // Add custom headers for task routes
    if (pathname.startsWith('/tasks')) {
      response.headers.set('X-Protected-Route', 'tasks')
      response.headers.set('Cache-Control', 'private, no-cache, no-store, must-revalidate')
    }
    
    return response
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public (public files)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|public).*)',
  ],
}