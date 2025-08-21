import { NextRequest, NextResponse } from "next/server"
import { getConfigManager } from "@/lib/services/config-manager"
import { adminAuth } from "@/lib/admin-auth"
import { headers } from "next/headers"

export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const headersList = headers()
    const authHeader = headersList.get("authorization")
    const sessionToken = authHeader?.replace("Bearer ", "")

    const user = await adminAuth.getCurrentUser()
    if (!user || !adminAuth.hasPermission(user, "manage-configs")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const configManager = getConfigManager()
    const schema = configManager.getSchema()

    return NextResponse.json(schema)
  } catch (error) {
    console.error("Error in config schema GET:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
