import type { NextRequest } from "next/server"

export interface AdminUser {
  id: string
  email: string
  name: string
  role: "admin" | "super-admin"
  permissions: string[]
}

// Mock admin users - in production, this would be from a database
const mockAdminUsers: AdminUser[] = [
  {
    id: "1",
    email: "admin@layoverhq.com",
    name: "Admin User",
    role: "super-admin",
    permissions: [
      "read",
      "write",
      "delete",
      "manage-users",
      "manage-flights",
      "manage-bookings",
      "system-monitor",
    ],
  },
  {
    id: "2",
    email: "manager@layoverhq.com",
    name: "Manager User",
    role: "admin",
    permissions: ["read", "write", "manage-flights", "manage-bookings"],
  },
]

export async function validateAdminCredentials(
  email: string,
  password: string,
): Promise<AdminUser | null> {
  // Mock validation - in production, this would hash and compare passwords
  if (email === "admin@layoverhq.com" && password === "admin123") {
    return mockAdminUsers[0]
  }
  if (email === "manager@layoverhq.com" && password === "manager123") {
    return mockAdminUsers[1]
  }
  return null
}

export async function validateAdminToken(token: string): Promise<AdminUser | null> {
  // Mock token validation - in production, this would verify JWT tokens
  try {
    const decoded = JSON.parse(atob(token))
    return mockAdminUsers.find((user) => user.id === decoded.userId) || null
  } catch {
    return null
  }
}

export function generateAdminToken(user: AdminUser): string {
  // Mock token generation - in production, this would create proper JWT tokens
  return btoa(JSON.stringify({ userId: user.id, exp: Date.now() + 24 * 60 * 60 * 1000 }))
}

export async function requireAdminAuth(request: NextRequest): Promise<AdminUser | Response> {
  const authHeader = request.headers.get("authorization")
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    })
  }

  const token = authHeader.substring(7)
  const user = await validateAdminToken(token)

  if (!user) {
    return new Response(JSON.stringify({ error: "Invalid token" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    })
  }

  return user
}

export function requirePermission(user: AdminUser, permission: string): boolean {
  return user.permissions.includes(permission)
}
