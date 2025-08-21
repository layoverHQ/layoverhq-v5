import { NextRequest, NextResponse } from "next/server"
import { getFeatureFlagsManager } from "@/lib/services/feature-flags-manager"
import { adminAuth } from "@/lib/admin-auth"
import { headers } from "next/headers"

export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const headersList = headers()
    const authHeader = headersList.get("authorization")
    const sessionToken = authHeader?.replace("Bearer ", "")

    const user = await adminAuth.getCurrentUser()
    if (!user || !adminAuth.hasPermission(user, "feature-flags")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const tenantId = searchParams.get("tenant_id")
    const enabled = searchParams.get("enabled")

    const flagsManager = getFeatureFlagsManager()

    // List feature flags
    const flags = await flagsManager.listFeatureFlags(
      tenantId || undefined,
      enabled !== null ? enabled === "true" : undefined,
    )

    return NextResponse.json(flags)
  } catch (error) {
    console.error("Error in feature flags GET:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const headersList = headers()
    const authHeader = headersList.get("authorization")
    const sessionToken = authHeader?.replace("Bearer ", "")

    const user = await adminAuth.getCurrentUser()
    if (!user || !adminAuth.hasPermission(user, "feature-flags")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()

    const flagsManager = getFeatureFlagsManager()

    // Create feature flag
    const result = await flagsManager.createFeatureFlag(body, user.id)

    if (result.success) {
      return NextResponse.json({
        success: true,
        flag_id: result.flag_id,
        message: "Feature flag created successfully",
      })
    } else {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }
  } catch (error) {
    console.error("Error in feature flags POST:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
