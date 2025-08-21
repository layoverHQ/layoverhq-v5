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

    const { searchParams } = new URL(request.url)
    const category = searchParams.get("category")
    const tenantId = searchParams.get("tenant_id")
    const environment = searchParams.get("environment") || "all"

    const configManager = getConfigManager()

    if (category) {
      // Get configurations for specific category
      const configs = await configManager.getCategory(category, tenantId || undefined)
      return NextResponse.json(configs)
    } else {
      // Get all configurations (with pagination if needed)
      const schema = configManager.getSchema()
      const allConfigs: Record<string, any> = {}

      for (const [key] of Object.entries(schema)) {
        allConfigs[key] = await configManager.get(key, tenantId || undefined)
      }

      return NextResponse.json(allConfigs)
    }
  } catch (error) {
    console.error("Error in config GET:", error)
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
    if (!user || !adminAuth.hasPermission(user, "manage-configs")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { configs, tenant_id, environment = "all" } = body

    if (!configs || typeof configs !== "object") {
      return NextResponse.json({ error: "Invalid configs data" }, { status: 400 })
    }

    const configManager = getConfigManager()

    // Bulk update configurations
    const result = await configManager.setBulk(configs, user.id, tenant_id)

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: `${Object.keys(configs).length} configuration(s) updated successfully`,
      })
    } else {
      return NextResponse.json(
        { error: "Validation failed", details: result.errors },
        { status: 400 },
      )
    }
  } catch (error) {
    console.error("Error in config POST:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Authenticate user
    const headersList = headers()
    const authHeader = headersList.get("authorization")
    const sessionToken = authHeader?.replace("Bearer ", "")

    const user = await adminAuth.getCurrentUser()
    if (!user || !adminAuth.hasPermission(user, "manage-configs")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { key, value, tenant_id, environment = "all" } = body

    if (!key) {
      return NextResponse.json({ error: "Configuration key is required" }, { status: 400 })
    }

    const configManager = getConfigManager()

    // Update single configuration
    const success = await configManager.set(key, value, user.id, tenant_id)

    if (success) {
      return NextResponse.json({
        success: true,
        message: `Configuration '${key}' updated successfully`,
      })
    } else {
      return NextResponse.json({ error: "Failed to update configuration" }, { status: 400 })
    }
  } catch (error) {
    console.error("Error in config PUT:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
