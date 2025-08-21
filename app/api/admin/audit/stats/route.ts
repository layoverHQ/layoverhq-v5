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

    const supabase = createServiceRoleClient()
    const now = new Date()
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000)

    // Get various statistics for the last 24 hours
    const queries = await Promise.allSettled([
      // Total events in last 24h
      supabase
        .from("enterprise_audit_logs")
        .select("id", { count: "exact", head: true })
        .gte("created_at", yesterday.toISOString()),

      // Security events in last 24h
      supabase
        .from("enterprise_audit_logs")
        .select("id", { count: "exact", head: true })
        .eq("event_type", "security")
        .gte("created_at", yesterday.toISOString()),

      // High risk events in last 24h
      supabase
        .from("enterprise_audit_logs")
        .select("id", { count: "exact", head: true })
        .gte("risk_score", 6)
        .gte("created_at", yesterday.toISOString()),

      // Unique users in last 24h
      supabase
        .from("enterprise_audit_logs")
        .select("actor_id")
        .gte("created_at", yesterday.toISOString())
        .not("actor_id", "is", null),

      // Failed logins in last 24h
      supabase
        .from("enterprise_audit_logs")
        .select("id", { count: "exact", head: true })
        .eq("event_type", "security")
        .eq("action", "failed_login")
        .gte("created_at", yesterday.toISOString()),

      // Config changes in last 24h
      supabase
        .from("config_audit_logs")
        .select("id", { count: "exact", head: true })
        .gte("created_at", yesterday.toISOString()),

      // Average risk score
      supabase
        .from("enterprise_audit_logs")
        .select("risk_score")
        .gte("created_at", yesterday.toISOString()),

      // Most active user
      supabase
        .from("enterprise_audit_logs")
        .select("actor_id")
        .gte("created_at", yesterday.toISOString())
        .not("actor_id", "is", null),

      // Most accessed resource
      supabase
        .from("enterprise_audit_logs")
        .select("entity_type")
        .gte("created_at", yesterday.toISOString()),
    ])

    // Process results
    const totalEvents24h = queries[0].status === "fulfilled" ? queries[0].value.count || 0 : 0
    const securityEvents24h = queries[1].status === "fulfilled" ? queries[1].value.count || 0 : 0
    const highRiskEvents24h = queries[2].status === "fulfilled" ? queries[2].value.count || 0 : 0

    // Calculate unique users
    let uniqueUsers24h = 0
    if (queries[3].status === "fulfilled") {
      const uniqueActors = new Set(queries[3].value.data?.map((d) => d.actor_id))
      uniqueUsers24h = uniqueActors.size
    }

    const failedLogins24h = queries[4].status === "fulfilled" ? queries[4].value.count || 0 : 0
    const configChanges24h = queries[5].status === "fulfilled" ? queries[5].value.count || 0 : 0

    // Calculate average risk score
    let avgRiskScore = 0
    if (queries[6].status === "fulfilled" && queries[6].value.data) {
      const riskScores = queries[6].value.data.map((d) => d.risk_score)
      avgRiskScore =
        riskScores.length > 0
          ? riskScores.reduce((sum, score) => sum + score, 0) / riskScores.length
          : 0
    }

    // Find most active user
    let mostActiveUser = "N/A"
    if (queries[7].status === "fulfilled" && queries[7].value.data) {
      const userCounts = queries[7].value.data.reduce(
        (acc: Record<string, number>, record: any) => {
          const userId = record.actor_id || "Unknown"
          acc[userId] = (acc[userId] || 0) + 1
          return acc
        },
        {} as Record<string, number>,
      )

      const sortedUsers = Object.entries(userCounts).sort(([, a], [, b]) => b - a)
      mostActiveUser = sortedUsers[0]?.[0] || "N/A"
    }

    // Find most accessed resource
    let mostAccessedResource = "N/A"
    if (queries[8].status === "fulfilled" && queries[8].value.data) {
      const resourceCounts = queries[8].value.data.reduce(
        (acc, record) => {
          acc[record.entity_type] = (acc[record.entity_type] || 0) + 1
          return acc
        },
        {} as Record<string, number>,
      )

      const sortedResources = Object.entries(resourceCounts).sort(([, a], [, b]) => b - a)
      mostAccessedResource = sortedResources[0]?.[0] || "N/A"
    }

    const stats = {
      total_events_24h: totalEvents24h,
      security_events_24h: securityEvents24h,
      high_risk_events_24h: highRiskEvents24h,
      unique_users_24h: uniqueUsers24h,
      failed_logins_24h: failedLogins24h,
      config_changes_24h: configChanges24h,
      avg_risk_score: Number(avgRiskScore.toFixed(2)),
      most_active_user: mostActiveUser,
      most_accessed_resource: mostAccessedResource,
    }

    return NextResponse.json(stats)
  } catch (error) {
    console.error("Error in audit stats GET:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
