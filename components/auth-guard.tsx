"use client"

import { useEffect, type ReactNode } from "react"
import { useRouter } from "next/navigation"
import { useAdminAuth } from "./admin-auth-provider"
import { Loader2 } from "lucide-react"

interface AuthGuardProps {
  children: ReactNode
  requiredPermissions?: string[]
  requiredRoles?: string[]
  fallbackPath?: string
}

export function AuthGuard({
  children,
  requiredPermissions = [],
  requiredRoles = [],
  fallbackPath = "/login",
}: AuthGuardProps) {
  const { user, isLoading, hasPermission, hasRole } = useAdminAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.push(fallbackPath)
        return
      }

      // Check required roles
      if (requiredRoles.length > 0 && !hasRole(requiredRoles)) {
        router.push("/unauthorized")
        return
      }

      // Check required permissions
      if (requiredPermissions.length > 0) {
        const hasAllPermissions = requiredPermissions.every((permission) =>
          hasPermission(permission),
        )
        if (!hasAllPermissions) {
          router.push("/unauthorized")
          return
        }
      }
    }
  }, [
    user,
    isLoading,
    hasPermission,
    hasRole,
    requiredPermissions,
    requiredRoles,
    router,
    fallbackPath,
  ])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-600" />
          <p className="text-slate-600">Authenticating...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null // Will redirect to login
  }

  // Check permissions after loading
  if (requiredRoles.length > 0 && !hasRole(requiredRoles)) {
    return null // Will redirect to unauthorized
  }

  if (requiredPermissions.length > 0) {
    const hasAllPermissions = requiredPermissions.every((permission) => hasPermission(permission))
    if (!hasAllPermissions) {
      return null // Will redirect to unauthorized
    }
  }

  return <>{children}</>
}
