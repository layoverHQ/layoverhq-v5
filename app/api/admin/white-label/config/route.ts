import { NextRequest, NextResponse } from "next/server"
import { headers } from "next/headers"
import { WhiteLabelManager } from "@/lib/services/white-label-manager"
import { adminAuth } from "@/lib/admin-auth"

export async function GET(request: NextRequest) {
  try {
    // Authenticate admin user
    const user = await adminAuth.getCurrentUser()
    if (!user || !adminAuth.hasPermission(user, "manage-white-label")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const whiteLabelManager = new WhiteLabelManager()
    const config = await whiteLabelManager.getWhiteLabelConfig(user.tenant_id || "default")

    return NextResponse.json({ config })
  } catch (error) {
    console.error("Failed to get white-label config:", error)
    return NextResponse.json({ error: "Failed to retrieve configuration" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    // Authenticate admin user
    const user = await adminAuth.getCurrentUser()
    if (!user || !adminAuth.hasPermission(user, "manage-white-label")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { config } = body

    if (!config) {
      return NextResponse.json({ error: "Configuration is required" }, { status: 400 })
    }

    const whiteLabelManager = new WhiteLabelManager()

    // Update white-label configuration
    const updatedConfig = await whiteLabelManager.updateWhiteLabelConfig(
      user.tenant_id || "default",
      config,
      user.id,
    )

    return NextResponse.json({
      config: updatedConfig,
      message: "Configuration updated successfully",
    })
  } catch (error) {
    console.error("Failed to update white-label config:", error)
    return NextResponse.json({ error: "Failed to update configuration" }, { status: 500 })
  }
}
