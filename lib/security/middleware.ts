import { type NextRequest, NextResponse } from "next/server"
import { RateLimiter } from "./rate-limiter"
import { PermissionManager } from "./permissions"
import { AuditLogger } from "./audit-logger"
import { createServiceRoleClient } from "@/lib/supabase/server"

interface SecurityContext {
  user?: any
  ipAddress: string
  userAgent?: string
  endpoint: string
}

export class SecurityMiddleware {
  private static supabase = createServiceRoleClient()

  static async checkRateLimit(
    request: NextRequest,
    context: SecurityContext,
  ): Promise<NextResponse | null> {
    let limiter: RateLimiter

    // Choose appropriate rate limiter based on endpoint and user role
    if (request.nextUrl.pathname.includes("/api/admin/auth/login")) {
      limiter = RateLimiter.createLoginLimiter()
    } else if (context.user?.role === "admin") {
      limiter = RateLimiter.createAdminLimiter()
    } else {
      limiter = RateLimiter.createUserLimiter()
    }

    const result = await limiter.checkLimit(context)

    if (!result.allowed) {
      // Log rate limit violation
      await AuditLogger.logSecurityEvent(
        "rate_limit_exceeded",
        "medium",
        {
          endpoint: context.endpoint,
          remaining: result.remaining,
          retryAfter: result.retryAfter,
        },
        context.user?.id,
        context.ipAddress,
        context.userAgent,
      )

      return new NextResponse(
        JSON.stringify({
          error: "Rate limit exceeded",
          retryAfter: result.retryAfter,
        }),
        {
          status: 429,
          headers: {
            "Content-Type": "application/json",
            "X-RateLimit-Limit": limiter["config"].maxRequests.toString(),
            "X-RateLimit-Remaining": result.remaining.toString(),
            "X-RateLimit-Reset": result.resetTime.toString(),
            "Retry-After": result.retryAfter?.toString() || "60",
          },
        },
      )
    }

    return null
  }

  static async checkPermissions(
    request: NextRequest,
    context: SecurityContext,
    requiredResource: string,
    requiredAction: string,
  ): Promise<NextResponse | null> {
    if (!context.user) {
      return new NextResponse(JSON.stringify({ error: "Authentication required" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      })
    }

    const hasPermission = PermissionManager.hasPermission(
      context.user.role,
      requiredResource,
      requiredAction,
      {
        userId: context.user.id,
      },
    )

    if (!hasPermission) {
      // Log unauthorized access attempt
      await AuditLogger.logSecurityEvent(
        "unauthorized_access",
        "high",
        {
          endpoint: context.endpoint,
          requiredResource,
          requiredAction,
          userRole: context.user.role,
        },
        context.user.id,
        context.ipAddress,
        context.userAgent,
      )

      return new NextResponse(JSON.stringify({ error: "Insufficient permissions" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      })
    }

    return null
  }

  static async checkIPWhitelist(ipAddress: string): Promise<boolean> {
    try {
      const { data: whitelist, error } = await this.supabase
        .from("ip_whitelist")
        .select("*")
        .eq("is_active", true)

      if (error) {
        console.error("IP whitelist check error:", error)
        return true // Allow access if check fails
      }

      // If no whitelist entries, allow all
      if (!whitelist || whitelist.length === 0) {
        return true
      }

      // Check if IP is whitelisted
      return whitelist.some((entry) => {
        // Simple IP matching - in production, use proper CIDR matching
        return entry.ip_address === ipAddress
      })
    } catch (error) {
      console.error("IP whitelist check failed:", error)
      return true // Allow access if check fails
    }
  }

  static getClientIP(request: NextRequest): string {
    const forwarded = request.headers.get("x-forwarded-for")
    const realIP = request.headers.get("x-real-ip")

    if (forwarded) {
      return forwarded.split(",")[0].trim()
    }

    if (realIP) {
      return realIP
    }

    return request.ip || "unknown"
  }
}
