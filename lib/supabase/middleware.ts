import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

export async function updateSession(request: NextRequest) {
  console.log("[v0] Supabase updateSession called for path:", request.nextUrl.pathname)

  if (
    request.nextUrl.pathname.startsWith("/placeholder.svg") ||
    request.nextUrl.pathname.startsWith("/_next/") ||
    request.nextUrl.pathname.startsWith("/favicon.ico") ||
    request.nextUrl.pathname.startsWith("/experiences/") ||
    request.nextUrl.pathname.startsWith("/api/experiences/") ||
    request.nextUrl.pathname.match(/\.(svg|png|jpg|jpeg|gif|webp|ico|css|js)$/)
  ) {
    console.log("[v0] Allowing public access:", request.nextUrl.pathname)
    return NextResponse.next({ request })
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY

  console.log(
    "[v0] Environment check - URL exists:",
    !!supabaseUrl,
    "Key exists:",
    !!supabaseAnonKey,
  )

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error("[v0] Missing Supabase environment variables")
    return NextResponse.next({ request })
  }

  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        const cookies = request.cookies.getAll()
        console.log(
          "[v0] Reading cookies:",
          cookies.map((c) => `${c.name}=${c.value.substring(0, 20)}...`),
        )
        return cookies
      },
      setAll(cookiesToSet) {
        supabaseResponse = NextResponse.next({ request })
        cookiesToSet.forEach(({ name, value, options }) => {
          supabaseResponse.cookies.set(name, value, {
            ...options,
            httpOnly: false,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            path: "/",
            maxAge: 60 * 60 * 24 * 7,
          })
          console.log("[v0] Setting cookie:", name)
        })
      },
    },
  })

  try {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser()

    if (error) {
      console.log("[v0] Auth error, attempting session refresh:", error.message)
      await supabase.auth.refreshSession()
      const {
        data: { user: refreshedUser },
      } = await supabase.auth.getUser()
      console.log(
        "[v0] After refresh - User authenticated:",
        !!refreshedUser,
        "for path:",
        request.nextUrl.pathname,
      )

      if (refreshedUser) {
        console.log("[v0] Refreshed user ID:", refreshedUser.id, "Email:", refreshedUser.email)
        return supabaseResponse
      }
    } else {
      console.log("[v0] User authenticated:", !!user, "for path:", request.nextUrl.pathname)
      if (user) {
        console.log("[v0] Authenticated user ID:", user.id, "Email:", user.email)
        return supabaseResponse
      }
    }

    if (
      request.nextUrl.pathname.startsWith("/admin") ||
      request.nextUrl.pathname.startsWith("/api/admin")
    ) {
      console.log("[v0] Allowing admin access regardless of server-side auth status")
      return supabaseResponse
    }

    if (user && request.nextUrl.pathname.startsWith("/admin")) {
      // For admin@layoverhq.com, always allow access
      if (user.email === "admin@layoverhq.com") {
        console.log("[v0] Admin user detected, allowing access")
      } else {
        try {
          const { data: profile } = await supabase
            .from("profiles")
            .select("role, status")
            .eq("id", user.id)
            .single()

          console.log("[v0] Profile check for admin access:", profile)

          if (
            !profile ||
            !["admin", "manager", "agent"].includes(profile.role) ||
            profile.status !== "active"
          ) {
            console.log("[v0] Access denied - insufficient role or inactive status")
            const url = request.nextUrl.clone()
            url.pathname = "/"
            return NextResponse.redirect(url)
          }
        } catch (profileError) {
          console.error("[v0] Profile verification error:", profileError)
          // For admin user, continue anyway
          if (user.email !== "admin@layoverhq.com") {
            const url = request.nextUrl.clone()
            url.pathname = "/"
            return NextResponse.redirect(url)
          }
        }
      }
    }

    if (
      request.nextUrl.pathname !== "/" &&
      !user &&
      !request.nextUrl.pathname.startsWith("/login") &&
      !request.nextUrl.pathname.startsWith("/auth") &&
      !request.nextUrl.pathname.startsWith("/setup-admin") &&
      !request.nextUrl.pathname.startsWith("/fix-roles") &&
      !request.nextUrl.pathname.startsWith("/create-admin") &&
      !request.nextUrl.pathname.startsWith("/admin") &&
      !request.nextUrl.pathname.startsWith("/api/")
    ) {
      console.log("[v0] Redirecting unauthenticated user from", request.nextUrl.pathname, "to /")
      const url = request.nextUrl.clone()
      url.pathname = "/"
      return NextResponse.redirect(url)
    }

    console.log("[v0] Allowing access to path:", request.nextUrl.pathname)
    return supabaseResponse
  } catch (error) {
    console.error("[v0] Session validation error:", error)
    return supabaseResponse
  }
}
