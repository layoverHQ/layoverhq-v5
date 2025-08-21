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
    if (!user || !adminAuth.hasPermission(user, "audit-logs")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get("limit") || "50")
    const offset = parseInt(searchParams.get("offset") || "0")
    const eventType = searchParams.get("event_type")
    const entityType = searchParams.get("entity_type")
    const actorId = searchParams.get("actor_id")
    const tenantId = searchParams.get("tenant_id")
    const dateFrom = searchParams.get("date_from")
    const dateTo = searchParams.get("date_to")
    const riskScoreMin = searchParams.get("risk_score_min")
    const searchQuery = searchParams.get("search_query")

    const supabase = createServiceRoleClient()

    // Build query
    let query = supabase
      .from("enterprise_audit_logs")
      .select(
        `
        *,
        profiles!enterprise_audit_logs_actor_id_fkey(name),
        tenants!enterprise_audit_logs_tenant_id_fkey(name)
      `,
      )
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1)

    // Apply filters
    if (eventType) {
      query = query.eq("event_type", eventType)
    }

    if (entityType) {
      query = query.eq("entity_type", entityType)
    }

    if (actorId) {
      query = query.eq("actor_id", actorId)
    }

    if (tenantId) {
      query = query.eq("tenant_id", tenantId)
    }

    if (dateFrom) {
      query = query.gte("created_at", dateFrom)
    }

    if (dateTo) {
      query = query.lte("created_at", dateTo)
    }

    if (riskScoreMin) {
      query = query.gte("risk_score", parseInt(riskScoreMin))
    }

    if (searchQuery) {
      query = query.or(
        `action.ilike.%${searchQuery}%,metadata->>action.ilike.%${searchQuery}%,metadata->>resource.ilike.%${searchQuery}%`,
      )
    }

    // Tenant isolation for non-admin users
    if (!adminAuth.isSuperAdmin(user) && user.tenant_id) {
      query = query.eq("tenant_id", user.tenant_id)
    }

    const { data: logs, error } = await query

    if (error) {
      throw error
    }

    // Format the response
    const formattedLogs = (logs || []).map((log) => ({
      ...log,
      actor_name: log.profiles?.name || null,
      tenant_name: log.tenants?.name || null,
    }))

    return NextResponse.json(formattedLogs)
  } catch (error) {
    console.error("Error in audit logs GET:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
