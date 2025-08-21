import { NextRequest, NextResponse } from "next/server"
import { getConfigManager } from "@/lib/services/config-manager"
import { adminAuth } from "@/lib/admin-auth"
import { createServiceRoleClient } from "@/lib/supabase/service-role"
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
    const tenantId = searchParams.get("tenant_id")

    const supabase = createServiceRoleClient()

    let query = supabase
      .from("config_snapshots")
      .select("id, name, description, created_at, created_by")
      .order("created_at", { ascending: false })

    if (tenantId) {
      query = query.eq("tenant_id", tenantId)
    } else {
      query = query.is("tenant_id", null)
    }

    const { data: snapshots, error } = await query

    if (error) {
      throw error
    }

    return NextResponse.json(snapshots || [])
  } catch (error) {
    console.error("Error in snapshots GET:", error)
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
    const { name, description, tenant_id } = body

    if (!name) {
      return NextResponse.json({ error: "Snapshot name is required" }, { status: 400 })
    }

    const configManager = getConfigManager()

    // Create snapshot
    const snapshotId = await configManager.createSnapshot(name, user.id, tenant_id)

    if (snapshotId) {
      return NextResponse.json({
        success: true,
        snapshot_id: snapshotId,
        message: "Configuration snapshot created successfully",
      })
    } else {
      return NextResponse.json({ error: "Failed to create snapshot" }, { status: 500 })
    }
  } catch (error) {
    console.error("Error in snapshots POST:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
