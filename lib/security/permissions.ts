export interface Permission {
  resource: string
  action: string
  conditions?: Record<string, any>
}

export interface Role {
  name: string
  permissions: Permission[]
  inherits?: string[]
}

export const ROLES: Record<string, Role> = {
  admin: {
    name: "admin",
    permissions: [
      { resource: "*", action: "*" }, // Full access
    ],
  },
  manager: {
    name: "manager",
    permissions: [
      { resource: "users", action: "read" },
      { resource: "users", action: "create" },
      { resource: "users", action: "update" },
      { resource: "flights", action: "*" },
      { resource: "bookings", action: "*" },
      { resource: "integrations", action: "read" },
      { resource: "integrations", action: "update" },
      { resource: "reports", action: "*" },
    ],
  },
  agent: {
    name: "agent",
    permissions: [
      { resource: "users", action: "read" },
      { resource: "flights", action: "read" },
      { resource: "flights", action: "update" },
      { resource: "bookings", action: "*" },
      { resource: "reports", action: "read" },
    ],
  },
  user: {
    name: "user",
    permissions: [
      { resource: "profile", action: "read", conditions: { own: true } },
      { resource: "profile", action: "update", conditions: { own: true } },
      { resource: "bookings", action: "read", conditions: { own: true } },
      { resource: "bookings", action: "create" },
    ],
  },
}

export class PermissionManager {
  static hasPermission(userRole: string, resource: string, action: string, context?: any): boolean {
    const role = ROLES[userRole]
    if (!role) return false

    // Check direct permissions
    for (const permission of role.permissions) {
      if (this.matchesPermission(permission, resource, action, context)) {
        return true
      }
    }

    // Check inherited permissions
    if (role.inherits) {
      for (const inheritedRole of role.inherits) {
        if (this.hasPermission(inheritedRole, resource, action, context)) {
          return true
        }
      }
    }

    return false
  }

  private static matchesPermission(
    permission: Permission,
    resource: string,
    action: string,
    context?: any,
  ): boolean {
    // Check resource match
    if (permission.resource !== "*" && permission.resource !== resource) {
      return false
    }

    // Check action match
    if (permission.action !== "*" && permission.action !== action) {
      return false
    }

    // Check conditions
    if (permission.conditions && context) {
      for (const [key, value] of Object.entries(permission.conditions)) {
        if (key === "own" && value === true) {
          if (
            !context.userId ||
            !context.resourceOwnerId ||
            context.userId !== context.resourceOwnerId
          ) {
            return false
          }
        }
      }
    }

    return true
  }

  static getPermissions(userRole: string): Permission[] {
    const role = ROLES[userRole]
    if (!role) return []

    let permissions = [...role.permissions]

    // Add inherited permissions
    if (role.inherits) {
      for (const inheritedRole of role.inherits) {
        permissions = [...permissions, ...this.getPermissions(inheritedRole)]
      }
    }

    return permissions
  }
}
