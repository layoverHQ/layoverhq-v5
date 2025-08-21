import { createServerClient } from "@supabase/ssr"
import type { NextRequest } from "next/server"

export interface SecurityContext {
  user: any
  profile: any
  permissions: string[]
  ipAddress: string
  userAgent: string
}

export class AuthGuard {
  private supabase: any

  constructor(request: NextRequest) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

    this.supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll() {
          // No-op for server-side
        },
      },
    })
  }

  async validateSession(): Promise<SecurityContext | null> {
    try {
      const {
        data: { user },
        error,
      } = await this.supabase.auth.getUser()

      if (error || !user) {
        return null
      }

      const { data: profile } = await this.supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single()

      if (!profile || profile.status !== "active") {
        return null
      }

      const permissions = this.getRolePermissions(profile.role)

      return {
        user,
        profile,
        permissions,
        ipAddress: this.getClientIP(),
        userAgent: this.getUserAgent(),
      }
    } catch (error) {
      console.error("Session validation error:", error)
      return null
    }
  }

  private getRolePermissions(role: string): string[] {
    const rolePermissions = {
      admin: [
        "read",
        "write",
        "delete",
        "manage-users",
        "manage-flights",
        "manage-bookings",
        "system-monitor",
        "manage-integrations",
        "view-analytics",
        "manage-roles",
        "audit-logs",
        "security-settings",
      ],
      manager: [
        "read",
        "write",
        "manage-flights",
        "manage-bookings",
        "view-analytics",
        "system-monitor",
      ],
      agent: ["read", "write", "manage-bookings", "view-analytics"],
      user: ["read"],
    }
    return rolePermissions[role as keyof typeof rolePermissions] || []
  }

  private getClientIP(): string {
    // Implementation would extract real IP from headers
    return "127.0.0.1"
  }

  private getUserAgent(): string {
    // Implementation would extract user agent
    return "Unknown"
  }

  hasPermission(context: SecurityContext, permission: string): boolean {
    return context.permissions.includes(permission)
  }

  hasRole(context: SecurityContext, roles: string | string[]): boolean {
    const roleArray = Array.isArray(roles) ? roles : [roles]
    return roleArray.includes(context.profile.role)
  }
}
