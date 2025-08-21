import { type NextRequest, NextResponse } from "next/server"
import { ApiGateway } from "@/lib/api-gateway"
import { performanceMonitor } from "@/lib/performance-monitor"
import { errorTracker } from "@/lib/error-tracking"
import { createClient } from "@/lib/supabase/server"

const gateway = new ApiGateway({
  requireAuth: true,
  requiredRoles: ["admin", "manager"],
  rateLimit: { windowMs: 60000, maxRequests: 60 },
})

export async function GET(request: NextRequest) {
  return gateway.middleware(request, async (req) => {
    try {
      const { searchParams } = new URL(req.url)
      const timeRange = searchParams.get("timeRange") || "24h"

      // Get performance metrics
      const performanceMetrics = performanceMonitor.getMetrics()
      const percentiles = performanceMonitor.getPercentiles()

      // Get error statistics
      const errorStats = await errorTracker.getErrorStats(timeRange)

      // Get system health
      const supabase = await createClient()
      const { data: healthChecks } = await supabase
        .from("health_checks")
        .select("*")
        .gte("checked_at", new Date(Date.now() - 60 * 60 * 1000).toISOString()) // Last hour
        .order("checked_at", { ascending: false })

      // Get active alerts
      const { data: activeAlerts } = await supabase
        .from("alerts")
        .select("*")
        .eq("status", "active")
        .order("triggered_at", { ascending: false })
        .limit(10)

      // Get recent system metrics
      const { data: recentMetrics } = await supabase
        .from("system_metrics")
        .select("*")
        .gte("timestamp", new Date(Date.now() - 60 * 60 * 1000).toISOString()) // Last hour
        .order("timestamp", { ascending: false })
        .limit(100)

      // Aggregate metrics by service
      const metricsByService = (recentMetrics || []).reduce((acc: any, metric) => {
        if (!acc[metric.service_name]) {
          acc[metric.service_name] = {
            responseTime: [],
            errorRate: [],
            throughput: [],
          }
        }

        switch (metric.metric_type) {
          case "response_time":
            acc[metric.service_name].responseTime.push({
              timestamp: metric.timestamp,
              value: metric.value,
            })
            break
          case "error_rate":
            acc[metric.service_name].errorRate.push({
              timestamp: metric.timestamp,
              value: metric.value,
            })
            break
          case "throughput":
            acc[metric.service_name].throughput.push({
              timestamp: metric.timestamp,
              value: metric.value,
            })
            break
        }

        return acc
      }, {})

      return NextResponse.json({
        success: true,
        data: {
          performance: {
            ...performanceMetrics,
            percentiles,
          },
          errors: errorStats,
          health: {
            services: healthChecks || [],
            overall: calculateOverallHealth(healthChecks || []),
          },
          alerts: {
            active: activeAlerts || [],
            count: (activeAlerts || []).length,
          },
          metrics: metricsByService,
          timestamp: new Date().toISOString(),
        },
      })
    } catch (error) {
      console.error("Monitoring dashboard error:", error)
      return NextResponse.json({ error: "Failed to fetch monitoring data" }, { status: 500 })
    }
  })
}

function calculateOverallHealth(healthChecks: any[]): string {
  if (healthChecks.length === 0) return "unknown"

  const latest = healthChecks.reduce((acc: any, check) => {
    if (
      !acc[check.service_name] ||
      new Date(check.checked_at) > new Date(acc[check.service_name].checked_at)
    ) {
      acc[check.service_name] = check
    }
    return acc
  }, {})

  const services = Object.values(latest) as any[]
  const unhealthyCount = services.filter((s) => s.status === "unhealthy").length
  const degradedCount = services.filter((s) => s.status === "degraded").length

  if (unhealthyCount > 0) return "unhealthy"
  if (degradedCount > 0) return "degraded"
  return "healthy"
}
