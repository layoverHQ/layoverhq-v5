import { createClient } from "@/lib/supabase/client"
import { createServiceRoleClient } from "@/lib/supabase/service-role"

export interface AdminUser {
  id: string
  email: string
  role: string
  permissions: string[]
  name: string
  created_at: string
  last_login?: string
  tenant_id?: string
}

export interface AuthResult {
  success: boolean
  user?: AdminUser
  error?: string
}

export class AdminAuth {
  private supabase = createClient()
  private serviceClient = createServiceRoleClient()

  async signIn(email: string, password: string): Promise<AuthResult> {
    try {
      const { data, error } = await this.supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        return { success: false, error: error.message }
      }

      if (!data.user) {
        return { success: false, error: "No user returned" }
      }

      // Get user profile
      const profile = await this.getUserProfile(data.user.id)
      if (!profile) {
        return { success: false, error: "User profile not found" }
      }

      return { success: true, user: profile }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }
    }
  }

  async signOut(): Promise<void> {
    await this.supabase.auth.signOut()
  }

  async getCurrentUser(): Promise<AdminUser | null> {
    try {
      const {
        data: { user },
      } = await this.supabase.auth.getUser()
      if (!user) return null

      return await this.getUserProfile(user.id)
    } catch (error) {
      console.error("Error getting current user:", error)
      return null
    }
  }

  private async getUserProfile(userId: string): Promise<AdminUser | null> {
    try {
      const { data, error } = await this.serviceClient
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single()

      if (error || !data) {
        console.error("Error fetching user profile:", error)
        return null
      }

      return {
        id: data.id,
        email: data.email,
        role: data.role || "user",
        permissions: data.permissions || [],
        name: data.name || data.email,
        created_at: data.created_at,
        last_login: data.last_login,
        tenant_id: data.tenant_id,
      }
    } catch (error) {
      console.error("Error in getUserProfile:", error)
      return null
    }
  }

  getRolePermissions(role: string): string[] {
    const rolePermissions: Record<string, string[]> = {
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
      manager: ["read", "write", "manage-flights", "manage-bookings", "view-analytics"],
      user: ["read"],
    }

    return rolePermissions[role] || rolePermissions.user
  }

  hasPermission(user: AdminUser | null, permission: string): boolean {
    if (!user) return false
    return user.permissions.includes(permission)
  }

  isAdmin(user: AdminUser | null): boolean {
    return user?.role === "admin"
  }

  isSuperAdmin(user: AdminUser | null): boolean {
    return user?.role === "super_admin" || (user?.role === "admin" && !user?.tenant_id)
  }
}

export const adminAuth = new AdminAuth()

// Helper function for verifying admin authentication in API routes
export async function verifyAdminAuth(): Promise<{
  success: boolean
  user?: AdminUser
  error?: string
}> {
  try {
    const user = await adminAuth.getCurrentUser()

    if (!user) {
      return { success: false, error: "Not authenticated" }
    }

    if (!adminAuth.isAdmin(user)) {
      return { success: false, error: "Insufficient permissions" }
    }

    return { success: true, user }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Authentication failed",
    }
  }
}
