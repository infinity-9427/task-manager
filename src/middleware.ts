import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Protected routes that require full authentication
const protectedRoutes = ["/settings", "/profile"];

// API routes that require authentication
const protectedApiRoutes = ["/api/tasks/create", "/api/tasks/update", "/api/tasks/delete"];

export function middleware(req: NextRequest) {
  // Check for authentication token in cookies
  const authToken = req.cookies.get("authToken")?.value;
  const isAuthenticated = !!authToken;
  
  // Skip authentication for login/register pages
  if (req.nextUrl.pathname.startsWith("/login") || req.nextUrl.pathname.startsWith("/register")) {
    return NextResponse.next();
  }
  
  // Redirect protected page routes to login
  if (!isAuthenticated && protectedRoutes.some(route => req.nextUrl.pathname.startsWith(route))) {
    const loginUrl = new URL("/login", req.nextUrl.origin);
    return NextResponse.redirect(loginUrl);
  }
  
  // Redirect non-authenticated users from main app to login
  if (!isAuthenticated && req.nextUrl.pathname === "/") {
    const loginUrl = new URL("/login", req.nextUrl.origin);
    return NextResponse.redirect(loginUrl);
  }
  
  // Return 401 for protected API routes
  if (!isAuthenticated && protectedApiRoutes.some(route => req.nextUrl.pathname.startsWith(route))) {
    return NextResponse.json(
      { success: false, message: "Authentication required" },
      { status: 401 }
    );
  }
  
  // Add auth info to headers for client components
  const response = NextResponse.next();
  response.headers.set("x-user-authenticated", isAuthenticated ? "true" : "false");
  
  return response;
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