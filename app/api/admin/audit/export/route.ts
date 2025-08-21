import { NextRequest, NextResponse } from "next/server"
import { createServiceRoleClient } from "@/lib/supabase/service-role"
import { adminAuth } from "@/lib/admin-auth"
import { headers } from "next/headers"

export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const headersList = headers()
    const authHeader = headersList.get("authorization")
    const sessionToken = authHeader?.replace("Bearer ", "")

    const user = await adminAuth.getCurrentUser()
    if (!user || !adminAuth.hasPermission(user, "audit-logs")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { filters = {}, format = "csv" } = body

    const supabase = createServiceRoleClient()

    // Build query with filters
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

    // Apply filters
    if (filters.event_type) {
      query = query.eq("event_type", filters.event_type)
    }

    if (filters.entity_type) {
      query = query.eq("entity_type", filters.entity_type)
    }

    if (filters.actor_id) {
      query = query.eq("actor_id", filters.actor_id)
    }

    if (filters.tenant_id) {
      query = query.eq("tenant_id", filters.tenant_id)
    }

    if (filters.date_from) {
      query = query.gte("created_at", filters.date_from)
    }

    if (filters.date_to) {
      query = query.lte("created_at", filters.date_to)
    }

    if (filters.risk_score_min) {
      query = query.gte("risk_score", parseInt(filters.risk_score_min))
    }

    if (filters.search_query) {
      query = query.or(
        `action.ilike.%${filters.search_query}%,metadata->>action.ilike.%${filters.search_query}%`,
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

    if (format === "csv") {
      // Generate CSV
      const csvHeaders = [
        "ID",
        "Event Type",
        "Entity Type",
        "Entity ID",
        "Action",
        "Actor Name",
        "Tenant Name",
        "IP Address",
        "User Agent",
        "Risk Score",
        "Created At",
        "Metadata",
      ]

      const csvRows = (logs || []).map((log) => [
        log.id,
        log.event_type,
        log.entity_type,
        log.entity_id || "",
        log.action,
        log.profiles?.name || "",
        log.tenants?.name || "",
        log.ip_address || "",
        log.user_agent || "",
        log.risk_score,
        log.created_at,
        JSON.stringify(log.metadata || {}),
      ])

      const csvContent = [
        csvHeaders.join(","),
        ...csvRows.map((row) =>
          row
            .map((field) =>
              typeof field === "string" && field.includes(",")
                ? `"${field.replace(/"/g, '""')}"`
                : field,
            )
            .join(","),
        ),
      ].join("\n")

      return new NextResponse(csvContent, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="audit-logs-${new Date().toISOString().split("T")[0]}.csv"`,
        },
      })
    } else if (format === "json") {
      // Generate JSON
      const jsonContent = JSON.stringify(logs, null, 2)

      return new NextResponse(jsonContent, {
        headers: {
          "Content-Type": "application/json",
          "Content-Disposition": `attachment; filename="audit-logs-${new Date().toISOString().split("T")[0]}.json"`,
        },
      })
    } else {
      return NextResponse.json({ error: "Unsupported format. Use csv or json." }, { status: 400 })
    }
  } catch (error) {
    console.error("Error in audit export POST:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
