import { NextResponse } from "next/server"
import { createServiceRoleClient } from "@/lib/supabase/server"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = Number.parseInt(searchParams.get("limit") || "50")
    const service = searchParams.get("service")
    const level = searchParams.get("level")

    const supabase = createServiceRoleClient()

    let query = supabase
      .from("audit_logs")
      .select("*")
      .order("timestamp", { ascending: false })
      .limit(limit)

    if (service) {
      query = query.eq("resource_type", service)
    }

    if (level) {
      query = query.eq("level", level)
    }

    const { data: auditLogs, error } = await query

    if (error) {
      console.error("[v0] Database error:", error.message)
      return NextResponse.json({ error: "Failed to fetch logs" }, { status: 500 })
    }

    // Transform audit logs to log format expected by frontend
    const logs = (auditLogs || []).map((log) => ({
      id: log.id,
      service: log.resource_type || "system",
      level: log.level || "info",
      message: log.action || "System event",
      timestamp: new Date(log.timestamp).toLocaleString(),
      details: log.new_values || log.old_values,
    }))

    return NextResponse.json({
      logs,
      total: logs.length,
      timestamp: new Date().toISOString(),
    })
  } catch (error: any) {
    console.error("[v0] API error:", error.message)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
