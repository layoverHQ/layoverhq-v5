import { createServerClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"
import { type NextRequest, NextResponse } from "next/server"
import { errorTracker } from "./error-tracking"

export interface AuthUser {
  id: string
  email: string
  name: string
  role: string
  permissions: string[]
  profile: any
}

export class EnhancedAuth {
  static async getCurrentUser(): Promise<AuthUser | null> {
    try {
      const cookieStore = cookies()
      const supabase = createServerClient(cookieStore)

      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser()

      if (authError || !user) {
        return null
      }

      // Get user profile with role and permissions
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single()

      if (profileError || !profile) {
        return null
      }

      return {
        id: user.id,
        email: user.email || profile.email,
        name: profile.full_name,
        role: profile.role,
        permissions: profile.permissions || [],
        profile,
      }
    } catch (error) {
      await errorTracker.trackError(error as Error, {
        service: "enhanced-auth",
        operation: "getCurrentUser",
      })
      return null
    }
  }

  static async requireAuth(request: NextRequest): Promise<AuthUser | NextResponse> {
    try {
      const cookieStore = cookies()
      const supabase = createServerClient(cookieStore)

      const {
        data: { user },
        error,
      } = await supabase.auth.getUser()

      if (error || !user) {
        return NextResponse.json({ error: "Authentication required" }, { status: 401 })
      }

      // Get user profile
      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single()

      if (!profile) {
        return NextResponse.json({ error: "User profile not found" }, { status: 401 })
      }

      return {
        id: user.id,
        email: user.email || profile.email,
        name: profile.full_name,
        role: profile.role,
        permissions: profile.permissions || [],
        profile,
      }
    } catch (error) {
      await errorTracker.trackError(error as Error, {
        service: "enhanced-auth",
        operation: "requireAuth",
      })
      return NextResponse.json({ error: "Authentication failed" }, { status: 500 })
    }
  }

  static async requireRole(user: AuthUser, requiredRoles: string[]): Promise<boolean> {
    return requiredRoles.includes(user.role)
  }

  static async requirePermission(user: AuthUser, requiredPermissions: string[]): Promise<boolean> {
    return requiredPermissions.every((permission) => user.permissions.includes(permission))
  }

  static async createAdminUser(
    email: string,
    password: string,
    name: string,
    role = "admin",
  ): Promise<{ success: boolean; user?: any; error?: string }> {
    try {
      const cookieStore = cookies()
      const supabase = createServerClient(cookieStore)

      // Create user in Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          full_name: name,
          role,
        },
      })

      if (authError || !authData.user) {
        return { success: false, error: authError?.message || "Failed to create user" }
      }

      // Create profile
      const permissions = this.getRolePermissions(role)
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .insert({
          id: authData.user.id,
          email,
          full_name: name,
          role,
          permissions,
        })
        .select()
        .single()

      if (profileError) {
        return { success: false, error: profileError.message }
      }

      return { success: true, user: { ...authData.user, profile } }
    } catch (error) {
      await errorTracker.trackError(error as Error, {
        service: "enhanced-auth",
        operation: "createAdminUser",
      })
      return { success: false, error: "Failed to create admin user" }
    }
  }

  private static getRolePermissions(role: string): string[] {
    const permissions = {
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
    return permissions[role as keyof typeof permissions] || []
  }
}
