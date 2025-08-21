/**
 * Enterprise Partner Dashboard API
 * Provides comprehensive analytics and metrics for airline partners
 */

import { NextRequest, NextResponse } from "next/server"
import { PartnerEnterpriseDashboard } from "@/lib/services/partner-enterprise-dashboard"
import { logger } from "@/lib/logger"
import { createClient } from "@/lib/supabase/server"

// Using imported logger instance

export async function GET(request: NextRequest, { params }: { params: { enterpriseId: string } }) {
  try {
    const { searchParams } = new URL(request.url)
    const timeRange = searchParams.get("timeRange") || "7d"
    const includeRealTime = searchParams.get("realTime") !== "false"

    const { enterpriseId } = params

    // Validate enterprise access
    const supabase = await createClient()
    const { data: enterprise, error: enterpriseError } = await supabase
      .from("enterprises")
      .select("id, name, subscription_plan")
      .eq("id", enterpriseId)
      .single()

    if (enterpriseError || !enterprise) {
      return NextResponse.json({ error: "Enterprise not found or access denied" }, { status: 404 })
    }

    // Calculate time range
    const timeRanges = {
      "24h": { hours: 24 },
      "7d": { days: 7 },
      "30d": { days: 30 },
      "90d": { days: 90 },
    }

    const range = timeRanges[timeRange as keyof typeof timeRanges] || timeRanges["7d"]
    const endDate = new Date()
    const startDate = new Date()

    if ("hours" in range) {
      startDate.setHours(startDate.getHours() - range.hours)
    } else {
      startDate.setDate(startDate.getDate() - range.days)
    }

    // Calculate comparison period (same duration, previous period)
    const comparisonStart = new Date(startDate)
    const comparisonEnd = new Date(startDate)

    if ("hours" in range) {
      comparisonStart.setHours(comparisonStart.getHours() - range.hours)
    } else {
      comparisonStart.setDate(comparisonStart.getDate() - range.days)
    }

    const dashboard = new PartnerEnterpriseDashboard()

    // Get dashboard metrics
    const metrics = await dashboard.getDashboardMetrics(
      enterpriseId,
      {
        start: startDate,
        end: endDate,
        comparison: {
          start: comparisonStart,
          end: comparisonEnd,
        },
      },
      includeRealTime,
    )

    // Get active alerts
    const { data: alerts } = await supabase
      .from("enterprise_alerts")
      .select("*")
      .eq("enterprise_id", enterpriseId)
      .eq("is_active", true)
      .order("severity", { ascending: false })
      .order("created_at", { ascending: false })

    // Get recent activity
    const { data: recentActivity } = await supabase
      .from("analytics_events")
      .select("event_type, data, timestamp")
      .eq("enterprise_id", enterpriseId)
      .gte("timestamp", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      .order("timestamp", { ascending: false })
      .limit(50)

    logger.info("Dashboard data retrieved successfully", {
      enterpriseId,
      timeRange,
      metricsIncluded: Object.keys(metrics),
      alertsCount: alerts?.length || 0,
    })

    return NextResponse.json({
      success: true,
      data: {
        enterprise: {
          id: enterprise.id,
          name: enterprise.name,
          plan: enterprise.subscription_plan,
        },
        metrics,
        alerts: alerts || [],
        recentActivity: recentActivity || [],
        timeRange: {
          start: startDate.toISOString(),
          end: endDate.toISOString(),
          comparison: {
            start: comparisonStart.toISOString(),
            end: comparisonEnd.toISOString(),
          },
        },
        refreshedAt: new Date().toISOString(),
      },
    })
  } catch (error) {
    logger.error("Failed to retrieve dashboard data", {
      enterpriseId: params.enterpriseId,
      error: error instanceof Error ? error.message : "Unknown error",
    })

    return NextResponse.json(
      {
        error: "Failed to retrieve dashboard data",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest, { params }: { params: { enterpriseId: string } }) {
  try {
    const { enterpriseId } = params
    const body = await request.json()
    const { action, config } = body

    const dashboard = new PartnerEnterpriseDashboard()

    switch (action) {
      case "setup_alert":
        const alert = await dashboard.setupAlert(enterpriseId, config)
        return NextResponse.json({
          success: true,
          data: { alert },
        })

      case "generate_report":
        const report = await dashboard.generateCustomReport(enterpriseId, config)
        return NextResponse.json({
          success: true,
          data: { report },
        })

      case "export_data":
        const exportResult = await dashboard.exportDashboardData(enterpriseId, config)
        return NextResponse.json({
          success: true,
          data: { export: exportResult },
        })

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 })
    }
  } catch (error) {
    logger.error("Failed to process dashboard action", {
      enterpriseId: params.enterpriseId,
      error: error instanceof Error ? error.message : "Unknown error",
    })

    return NextResponse.json(
      {
        error: "Failed to process dashboard action",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
