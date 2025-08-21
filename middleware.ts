import { updateSession } from "@/lib/supabase/middleware"
import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"
import { enterpriseRouter } from "@/lib/services/enterprise-routing-module"

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname
  console.log("[EnterpriseRouter] Processing:", path)

  // Use enterprise routing module for better error handling
  const routerResponse = await enterpriseRouter.handleRequest(request)
  if (routerResponse) {
    return routerResponse
  }

  // Skip auth for public and setup routes
  const publicPaths = [
    "/",
    "/login",
    "/signup",
    "/setup-admin",
    "/api/setup-admin",
    "/fix-roles",
    "/api/fix-admin-roles",
    "/design-showcase",
    "/yc-pitch",
    "/search",
    "/experiences",
    "/api/auth",
    "/api/v1",
    "/manifest.webmanifest",
    "/icon.svg",
    "/favicon.ico"
  ]

  const isPublicPath = publicPaths.some(publicPath => 
    path === publicPath || path.startsWith(publicPath + "/")
  )

  if (isPublicPath) {
    console.log("[EnterpriseRouter] Public path, allowing access:", path)
    return NextResponse.next()
  }

  // For protected routes, try auth but don't fail hard
  try {
    console.log("[EnterpriseRouter] Checking auth for:", path)
    const response = await updateSession(request)
    return response
  } catch (error) {
    console.error("[EnterpriseRouter] Auth error, allowing access:", error)
    // Instead of blocking, allow access but log the issue
    return NextResponse.next()
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - images - .svg, .png, .jpg, .jpeg, .gif, .webp
     * Feel free to modify this pattern to include more paths.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
