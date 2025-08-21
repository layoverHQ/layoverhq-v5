import { NextRequest, NextResponse } from "next/server"
import { createServiceRoleClient } from "@/lib/supabase/service-role"
import { adminAuth } from "@/lib/admin-auth"
import { headers } from "next/headers"

export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const headersList = headers()
    const authHeader = headersList.get("authorization")
    const sessionToken = authHeader?.replace("Bearer ", "")

    const user = await adminAuth.getCurrentUser()
    if (!user || !adminAuth.hasPermission(user, "system-monitor")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get("limit") || "50")
    const offset = parseInt(searchParams.get("offset") || "0")
    const metricName = searchParams.get("metric_name")
    const tenantId = searchParams.get("tenant_id")

    const supabase = createServiceRoleClient()

    // Build query
    let query = supabase
      .from("performance_metrics")
      .select("*")
      .order("recorded_at", { ascending: false })
      .range(offset, offset + limit - 1)

    // Apply filters
    if (metricName) {
      query = query.eq("metric_name", metricName)
    }

    if (tenantId) {
      query = query.eq("tenant_id", tenantId)
    }

    // Tenant isolation for non-admin users
    if (!adminAuth.isSuperAdmin(user) && user.tenant_id) {
      query = query.eq("tenant_id", user.tenant_id)
    }

    const { data: metrics, error } = await query

    if (error) {
      throw error
    }

    return NextResponse.json(metrics || [])
  } catch (error) {
    console.error("Error in metrics GET:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
