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

    const supabase = createServiceRoleClient()

    // Get security events from audit logs
    let query = supabase
      .from("enterprise_audit_logs")
      .select(
        `
        id,
        action,
        actor_id,
        ip_address,
        user_agent,
        metadata,
        risk_score,
        created_at
      `,
      )
      .eq("event_type", "security")
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1)

    // Tenant isolation for non-admin users
    if (!adminAuth.isSuperAdmin(user) && user.tenant_id) {
      query = query.eq("tenant_id", user.tenant_id)
    }

    const { data: events, error } = await query

    if (error) {
      throw error
    }

    // Format the response
    const formattedEvents = (events || []).map((event: any) => ({
      id: event.id,
      type: event.action,
      user_id: event.actor_id,
      user_name: null, // Would need separate query to get user name
      ip_address: event.ip_address,
      user_agent: event.user_agent,
      metadata: event.metadata || {},
      risk_score: event.risk_score,
      created_at: event.created_at,
    }))

    return NextResponse.json(formattedEvents)
  } catch (error) {
    console.error("Error in security events GET:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
