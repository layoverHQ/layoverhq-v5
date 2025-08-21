/**
 * Real-time Enterprise Metrics API
 * Provides live data for partner dashboards
 */

import { NextRequest, NextResponse } from "next/server"
import { PartnerEnterpriseDashboard } from "@/lib/services/partner-enterprise-dashboard"
import { logger } from "@/lib/logger"
import { createClient } from "@/lib/supabase/server"

// Using imported logger instance

export async function GET(request: NextRequest, { params }: { params: { enterpriseId: string } }) {
  try {
    const { enterpriseId } = params

    // Validate enterprise access
    const supabase = await createClient()
    const { data: enterprise, error: enterpriseError } = await supabase
      .from("enterprises")
      .select("id")
      .eq("id", enterpriseId)
      .single()

    if (enterpriseError || !enterprise) {
      return NextResponse.json({ error: "Enterprise not found or access denied" }, { status: 404 })
    }

    const dashboard = new PartnerEnterpriseDashboard()

    // Get current time windows
    const now = new Date()
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000)
    const oneMinuteAgo = new Date(now.getTime() - 60 * 1000)

    // Fetch real-time metrics in parallel
    const [activeSessions, recentSearches, recentBookings, apiRequests, systemHealth] =
      await Promise.all([
        // Active users (unique sessions in last hour)
        supabase
          .from("analytics_events")
          .select("session_id")
          .eq("enterprise_id", enterpriseId)
          .gte("timestamp", oneHourAgo.toISOString())
          .then(({ data }) => new Set(data?.map((d) => d.session_id)).size),

        // Searches in last hour
        supabase
          .from("analytics_events")
          .select("id")
          .eq("enterprise_id", enterpriseId)
          .eq("event_type", "search")
          .gte("timestamp", oneHourAgo.toISOString())
          .then(({ data }) => data?.length || 0),

        // Bookings in last hour
        supabase
          .from("bookings")
          .select("id")
          .eq("enterprise_id", enterpriseId)
          .gte("created_at", oneHourAgo.toISOString())
          .then(({ data }) => data?.length || 0),

        // API requests in last minute
        supabase
          .from("api_usage_logs")
          .select("id, response_status, response_time_ms")
          .eq("enterprise_id", enterpriseId)
          .gte("timestamp", oneMinuteAgo.toISOString())
          .then(({ data }) => ({
            total: data?.length || 0,
            errors: data?.filter((r) => r.response_status >= 400).length || 0,
            avgResponseTime:
              data?.length > 0
                ? data.reduce((sum, r) => sum + (r.response_time_ms || 0), 0) / data.length
                : 0,
          })),

        // System health check
        checkSystemHealth(enterpriseId),
      ])

    const errorRate = apiRequests.total > 0 ? (apiRequests.errors / apiRequests.total) * 100 : 0

    // Get recent alerts
    const { data: recentAlerts } = await supabase
      .from("enterprise_alerts")
      .select("id, type, severity, title, created_at")
      .eq("enterprise_id", enterpriseId)
      .eq("is_active", true)
      .gte("created_at", new Date(now.getTime() - 10 * 60 * 1000).toISOString()) // Last 10 minutes
      .order("created_at", { ascending: false })
      .limit(5)

    // Calculate performance trends (compared to previous hour)
    const previousHour = new Date(oneHourAgo.getTime() - 60 * 60 * 1000)
    const { data: previousSearches } = await supabase
      .from("analytics_events")
      .select("id")
      .eq("enterprise_id", enterpriseId)
      .eq("event_type", "search")
      .gte("timestamp", previousHour.toISOString())
      .lt("timestamp", oneHourAgo.toISOString())

    const searchTrend =
      previousSearches?.length > 0
        ? ((recentSearches - previousSearches.length) / previousSearches.length) * 100
        : 0

    const realTimeData = {
      activeUsers: activeSessions,
      searchesPerHour: recentSearches,
      bookingsPerHour: recentBookings,
      apiRequestsPerMinute: apiRequests.total,
      errorRate,
      responseTime: apiRequests.avgResponseTime,
      systemHealth,
      trends: {
        searchTrend: Math.round(searchTrend * 10) / 10,
      },
      alerts: recentAlerts || [],
      timestamp: now.toISOString(),
    }

    // Log metrics for monitoring
    logger.info("Real-time metrics retrieved", {
      enterpriseId,
      activeUsers: activeSessions,
      searchesPerHour: recentSearches,
      errorRate: Math.round(errorRate * 100) / 100,
    })

    // Set cache headers for frequent updates
    const response = NextResponse.json({
      success: true,
      data: realTimeData,
    })

    response.headers.set("Cache-Control", "no-cache, no-store, must-revalidate")
    response.headers.set("Pragma", "no-cache")
    response.headers.set("Expires", "0")

    return response
  } catch (error) {
    logger.error("Failed to retrieve real-time metrics", {
      enterpriseId: params.enterpriseId,
      error: error instanceof Error ? error.message : "Unknown error",
    })

    return NextResponse.json(
      {
        error: "Failed to retrieve real-time metrics",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

/**
 * Check system health for the enterprise
 */
async function checkSystemHealth(enterpriseId: string): Promise<{
  status: "healthy" | "degraded" | "down"
  services: Array<{
    name: string
    status: "healthy" | "degraded" | "down"
    responseTime?: number
    lastCheck: string
  }>
}> {
  const now = new Date()
  const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000)

  const supabase = await createClient()

  try {
    // Check API endpoint health
    const { data: apiHealth } = await supabase
      .from("api_usage_logs")
      .select("endpoint, response_status, response_time_ms")
      .eq("enterprise_id", enterpriseId)
      .gte("timestamp", fiveMinutesAgo.toISOString())

    const services = [
      {
        name: "Flight Search API",
        endpoint: "/api/v1/flights/search",
        status: "healthy" as "healthy" | "degraded" | "down",
        responseTime: 0,
        lastCheck: now.toISOString(),
      },
      {
        name: "Experience Booking API",
        endpoint: "/api/v1/experiences/book",
        status: "healthy" as "healthy" | "degraded" | "down",
        responseTime: 0,
        lastCheck: now.toISOString(),
      },
      {
        name: "Webhook Delivery",
        endpoint: "/api/webhooks",
        status: "healthy" as "healthy" | "degraded" | "down",
        responseTime: 0,
        lastCheck: now.toISOString(),
      },
    ]

    // Analyze API health data
    if (apiHealth) {
      const endpointStats = new Map<string, { total: number; errors: number; avgTime: number }>()

      for (const log of apiHealth) {
        if (!endpointStats.has(log.endpoint)) {
          endpointStats.set(log.endpoint, { total: 0, errors: 0, avgTime: 0 })
        }
        const stats = endpointStats.get(log.endpoint)!
        stats.total++
        if (log.response_status >= 400) stats.errors++
        stats.avgTime += log.response_time_ms || 0
      }

      // Update service statuses
      for (const service of services) {
        const stats = endpointStats.get(service.endpoint)
        if (stats) {
          const errorRate = (stats.errors / stats.total) * 100
          const avgResponseTime = stats.avgTime / stats.total

          service.responseTime = Math.round(avgResponseTime)

          if (errorRate > 10 || avgResponseTime > 5000) {
            service.status = "down"
          } else if (errorRate > 5 || avgResponseTime > 2000) {
            service.status = "degraded"
          }
        }
      }
    }

    // Determine overall status
    const hasDownServices = services.some((s) => s.status === "down")
    const hasDegradedServices = services.some((s) => s.status === "degraded")

    const overallStatus = hasDownServices ? "down" : hasDegradedServices ? "degraded" : "healthy"

    return {
      status: overallStatus,
      services: services.map(({ endpoint, ...service }) => service),
    }
  } catch (error) {
    logger.error("Failed to check system health", { enterpriseId, error })

    return {
      status: "degraded",
      services: [
        {
          name: "System Health Check",
          status: "degraded",
          lastCheck: now.toISOString(),
        },
      ],
    }
  }
}
