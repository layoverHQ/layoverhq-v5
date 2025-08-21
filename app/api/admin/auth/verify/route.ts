import { type NextRequest, NextResponse } from "next/server"
import { requireAdminAuth } from "@/lib/api-auth"

export async function GET(request: NextRequest) {
  const authResult = await requireAdminAuth(request)

  if (authResult instanceof Response) {
    return authResult
  }

  return NextResponse.json({
    success: true,
    user: {
      id: authResult.id,
      email: authResult.email,
      name: authResult.name,
      role: authResult.role,
      permissions: authResult.permissions,
    },
  })
}
