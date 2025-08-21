import { NextRequest, NextResponse } from "next/server"
import { headers } from "next/headers"
import { WhiteLabelManager } from "@/lib/services/white-label-manager"
import { adminAuth } from "@/lib/admin-auth"

export async function POST(request: NextRequest) {
  try {
    // Authenticate admin user
    const headersList = headers()
    const authHeader = headersList.get("authorization")

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

    // Generate preview with the provided configuration
    const preview = await whiteLabelManager.generatePreview(user.tenant_id || "default", config)

    return NextResponse.json({
      previewUrl: preview.previewUrl,
      status: preview.status,
      expiresAt: preview.expiresAt,
    })
  } catch (error) {
    console.error("White-label preview generation failed:", error)
    return NextResponse.json({ error: "Failed to generate preview" }, { status: 500 })
  }
}
