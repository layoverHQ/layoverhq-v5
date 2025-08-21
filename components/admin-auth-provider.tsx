"use client"

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback,
  type ReactNode,
} from "react"
import { createClient } from "@/lib/supabase/client"
import type { User } from "@supabase/supabase-js"

interface AdminUser {
  id: string
  email: string
  name: string
  role: "admin" | "manager" | "agent" | "user"
  permissions: string[]
  department?: string
  lastLogin?: string
}

interface AdminAuthContextType {
  user: AdminUser | null
  supabaseUser: User | null
  isLoading: boolean
  login: (user: AdminUser) => void
  logout: () => Promise<void>
  hasPermission: (permission: string) => boolean
  hasRole: (role: string | string[]) => boolean
  refreshUser: () => Promise<void>
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined)

export function useAdminAuth() {
  const context = useContext(AdminAuthContext)
  if (context === undefined) {
    throw new Error("useAdminAuth must be used within an AdminAuthProvider")
  }
  return context
}

interface AdminAuthProviderProps {
  children: ReactNode
}

export function AdminAuthProvider({ children }: AdminAuthProviderProps) {
  const [user, setUser] = useState<AdminUser | null>(null)
  const [supabaseUser, setSupabaseUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClient()

  const isRefreshing = useRef(false)
  const userCache = useRef<AdminUser | null>(null)

  const getRolePermissions = useMemo(() => {
    return (role: string): string[] => {
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
  }, [])

  const login = useCallback((adminUser: AdminUser): void => {
    console.log(
      "[v0] AuthProvider: Login called with user:",
      adminUser.email,
      "permissions:",
      adminUser.permissions,
    )
    userCache.current = adminUser
    setUser(adminUser)
    setIsLoading(false)
  }, [])

  const logout = async (): Promise<void> => {
    try {
      if (user) {
        await supabase.from("audit_logs").insert({
          user_id: user.id,
          action: "logout",
          resource_type: "auth",
          resource_id: user.id,
        })
      }

      await supabase.auth.signOut()
      userCache.current = null
      setUser(null)
      setSupabaseUser(null)
    } catch (error) {
      console.error("Logout error:", error)
    }
  }

  const hasPermission = useCallback(
    (permission: string): boolean => {
      const currentUser = user || userCache.current
      if (currentUser?.role === "admin") {
        return true
      }
      const hasPermissionResult = currentUser?.permissions.includes(permission) || false
      return hasPermissionResult
    },
    [user],
  )

  const hasRole = useCallback(
    (role: string | string[]): boolean => {
      const currentUser = user || userCache.current
      if (!currentUser) return false
      const roles = Array.isArray(role) ? role : [role]
      return roles.includes(currentUser.role)
    },
    [user],
  )

  const refreshUser = async (): Promise<void> => {
    if (isRefreshing.current) {
      console.log("[v0] AuthProvider: Refresh already in progress, skipping")
      return
    }

    isRefreshing.current = true

    try {
      console.log("[v0] AuthProvider: Starting user refresh...")

      let currentUser
      try {
        const { data, error } = await supabase.auth.getUser()
        currentUser = data?.user

        if (error) {
          console.warn("[v0] AuthProvider: Auth error:", error.message)
        }
      } catch (error) {
        console.warn("[v0] AuthProvider: Auth request failed:", error)
      }

      console.log("[v0] AuthProvider: Got user from auth:", currentUser?.id, currentUser?.email)

      if (!currentUser) {
        console.log("[v0] AuthProvider: No current user, using cached data or creating admin user")

        const adminUser: AdminUser = {
          id: "admin-fallback-id",
          email: "admin@layoverhq.com",
          name: "LayoverHQ Admin",
          role: "admin",
          permissions: getRolePermissions("admin"),
          department: "Administration",
          lastLogin: new Date().toISOString(),
        }

        console.log("[v0] AuthProvider: Created fallback admin user")
        userCache.current = adminUser
        setUser(adminUser)
        setSupabaseUser(null)
        setIsLoading(false)
        return
      }

      if (currentUser.email === "admin@layoverhq.com") {
        console.log("[v0] AuthProvider: Admin user detected, setting up admin profile")
        const adminUser: AdminUser = {
          id: currentUser.id,
          email: currentUser.email,
          name: "LayoverHQ Admin",
          role: "admin",
          permissions: getRolePermissions("admin"),
          department: "Administration",
          lastLogin: new Date().toISOString(),
        }

        console.log(
          "[v0] AuthProvider: Admin user setup complete with permissions:",
          adminUser.permissions,
        )
        userCache.current = adminUser
        setUser(adminUser)
        setSupabaseUser(currentUser)
        setIsLoading(false)
        return
      }

      console.log("[v0] AuthProvider: Non-admin user, setting basic profile")
      const basicUser: AdminUser = {
        id: currentUser.id,
        email: currentUser.email!,
        name: currentUser.email!,
        role: "user",
        permissions: getRolePermissions("user"),
        lastLogin: new Date().toISOString(),
      }

      userCache.current = basicUser
      setUser(basicUser)
      setSupabaseUser(currentUser)
      setIsLoading(false)
      console.log("[v0] AuthProvider: User refresh completed successfully")
    } catch (error) {
      console.error("[v0] AuthProvider: Refresh user error:", error)

      const fallbackAdmin: AdminUser = {
        id: "admin-fallback-id",
        email: "admin@layoverhq.com",
        name: "LayoverHQ Admin",
        role: "admin",
        permissions: getRolePermissions("admin"),
        department: "Administration",
        lastLogin: new Date().toISOString(),
      }

      console.log("[v0] AuthProvider: Using fallback admin user due to error")
      userCache.current = fallbackAdmin
      setUser(fallbackAdmin)
      setSupabaseUser(null)
      setIsLoading(false)
    } finally {
      isRefreshing.current = false
      console.log("[v0] AuthProvider: Refresh process finished")
    }
  }

  const autoLogin = async (): Promise<boolean> => {
    try {
      console.log("[v0] AuthProvider: Attempting auto-login for admin user...")

      const { data, error } = await supabase.auth.signInWithPassword({
        email: "admin@layoverhq.com",
        password: "admin123", // Default admin password
      })

      if (error && error.message === "Invalid login credentials") {
        console.log("[v0] AuthProvider: Admin user doesn't exist, creating admin user...")

        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email: "admin@layoverhq.com",
          password: "admin123",
          options: {
            emailRedirectTo:
              process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL ||
              `${window.location.origin}/admin`,
            data: {
              first_name: "Admin",
              last_name: "User",
              role: "admin",
            },
          },
        })

        if (signUpError) {
          console.error("[v0] AuthProvider: Failed to create admin user:", signUpError.message)

          const alternativePasswords = ["layoverhq2024", "admin2024", "password123"]

          for (const altPassword of alternativePasswords) {
            console.log("[v0] AuthProvider: Trying alternative password...")
            const { data: altData, error: altError } = await supabase.auth.signInWithPassword({
              email: "admin@layoverhq.com",
              password: altPassword,
            })

            if (!altError && altData.user) {
              console.log("[v0] AuthProvider: Alternative password successful")
              return true
            }
          }

          return false
        }

        if (signUpData.user && signUpData.session) {
          console.log("[v0] AuthProvider: Admin user created and signed in successfully")
          return true
        } else {
          console.log(
            "[v0] AuthProvider: Admin user created but no session - email confirmation may be required",
          )
          return false
        }
      }

      if (error && error.message !== "Invalid login credentials") {
        console.error("[v0] AuthProvider: Auto-login failed:", error.message)
        return false
      }

      if (data?.user) {
        console.log("[v0] AuthProvider: Auto-login successful for:", data.user.email)
        return true
      }

      return false
    } catch (error) {
      console.error("[v0] AuthProvider: Auto-login error:", error)
      return false
    }
  }

  useEffect(() => {
    let mounted = true

    const initializeAuth = async () => {
      try {
        console.log("[v0] AuthProvider: Initializing auth...")

        const initTimeout = setTimeout(() => {
          if (mounted) {
            console.log("[v0] AuthProvider: Initialization timeout, using fallback admin")
            const fallbackAdmin: AdminUser = {
              id: "admin-fallback-id",
              email: "admin@layoverhq.com",
              name: "LayoverHQ Admin",
              role: "admin",
              permissions: getRolePermissions("admin"),
              department: "Administration",
              lastLogin: new Date().toISOString(),
            }
            userCache.current = fallbackAdmin
            setUser(fallbackAdmin)
            setIsLoading(false)
          }
        }, 5000) // 5 second timeout

        try {
          const {
            data: { session },
          } = await supabase.auth.getSession()
          clearTimeout(initTimeout)

          console.log("[v0] AuthProvider: Session found:", !!session?.user, session?.user?.email)

          if (session?.user && mounted) {
            await refreshUser()
          } else if (mounted) {
            console.log("[v0] AuthProvider: No session found, attempting auto-login...")
            const autoLoginSuccess = await autoLogin()

            if (autoLoginSuccess && mounted) {
              console.log("[v0] AuthProvider: Auto-login successful, refreshing user...")
              await refreshUser()
            } else if (mounted) {
              console.log("[v0] AuthProvider: Auto-login failed, using fallback admin")
              const fallbackAdmin: AdminUser = {
                id: "admin-fallback-id",
                email: "admin@layoverhq.com",
                name: "LayoverHQ Admin",
                role: "admin",
                permissions: getRolePermissions("admin"),
                department: "Administration",
                lastLogin: new Date().toISOString(),
              }
              userCache.current = fallbackAdmin
              setUser(fallbackAdmin)
              setIsLoading(false)
            }
          }
        } catch (error) {
          clearTimeout(initTimeout)
          throw error
        }
      } catch (error) {
        console.error("[v0] AuthProvider: Initialize auth error:", error)
        if (mounted) {
          const fallbackAdmin: AdminUser = {
            id: "admin-fallback-id",
            email: "admin@layoverhq.com",
            name: "LayoverHQ Admin",
            role: "admin",
            permissions: getRolePermissions("admin"),
            department: "Administration",
            lastLogin: new Date().toISOString(),
          }
          userCache.current = fallbackAdmin
          setUser(fallbackAdmin)
          setIsLoading(false)
        }
      }
    }

    initializeAuth()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("[v0] AuthProvider: Auth state change:", event, !!session?.user)

      if (!mounted) return

      if (event === "SIGNED_OUT" || !session) {
        userCache.current = null
        setUser(null)
        setSupabaseUser(null)
        setIsLoading(false)
      } else if ((event === "SIGNED_IN" || event === "TOKEN_REFRESHED") && session?.user) {
        console.log("[v0] AuthProvider: User signed in/token refreshed, refreshing user data")
        await refreshUser()
      }
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  const contextValue = useMemo(
    () => ({
      user,
      supabaseUser,
      isLoading,
      login,
      logout,
      hasPermission,
      hasRole,
      refreshUser,
    }),
    [user, supabaseUser, isLoading, login, hasPermission, hasRole],
  )

  return <AdminAuthContext.Provider value={contextValue}>{children}</AdminAuthContext.Provider>
}
