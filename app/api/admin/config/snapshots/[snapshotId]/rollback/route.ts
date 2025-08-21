import { NextRequest, NextResponse } from "next/server"
import { getConfigManager } from "@/lib/services/config-manager"
import { adminAuth } from "@/lib/admin-auth"
import { headers } from "next/headers"

interface RouteParams {
  params: {
    snapshotId: string
  }
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    // Authenticate user
    const headersList = headers()
    const authHeader = headersList.get("authorization")
    const sessionToken = authHeader?.replace("Bearer ", "")

    const user = await adminAuth.getCurrentUser()
    if (!user || !adminAuth.hasPermission(user, "manage-configs")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { snapshotId } = params

    if (!snapshotId) {
      return NextResponse.json({ error: "Snapshot ID is required" }, { status: 400 })
    }

    const configManager = getConfigManager()

    // Rollback to snapshot
    const success = await configManager.rollbackToSnapshot(snapshotId, user.id)

    if (success) {
      return NextResponse.json({
        success: true,
        message: "Successfully rolled back to snapshot",
      })
    } else {
      return NextResponse.json({ error: "Failed to rollback to snapshot" }, { status: 500 })
    }
  } catch (error) {
    console.error("Error in snapshot rollback:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
