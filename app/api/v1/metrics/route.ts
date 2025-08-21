import { type NextRequest, NextResponse } from "next/server"
import { ApiGateway } from "@/lib/api-gateway"
import { createClient } from "@/lib/supabase/server"

const gateway = new ApiGateway({
  requireAuth: true,
  requiredRoles: ["admin", "manager"],
  rateLimit: { windowMs: 60000, maxRequests: 30 },
})

export async function GET(request: NextRequest) {
  return gateway.middleware(request, async (req) => {
    try {
      const { searchParams } = new URL(req.url)
      const service = searchParams.get("service")
      const metric = searchParams.get("metric")
      const timeRange = searchParams.get("timeRange") || "1h"

      const supabase = await createClient()

      // Calculate time range
      const now = new Date()
      const timeRangeMs =
        {
          "5m": 5 * 60 * 1000,
          "15m": 15 * 60 * 1000,
          "1h": 60 * 60 * 1000,
          "6h": 6 * 60 * 60 * 1000,
          "24h": 24 * 60 * 60 * 1000,
          "7d": 7 * 24 * 60 * 60 * 1000,
        }[timeRange] || 60 * 60 * 1000

      const startTime = new Date(now.getTime() - timeRangeMs)

      let query = supabase
        .from("system_metrics")
        .select("*")
        .gte("timestamp", startTime.toISOString())
        .order("timestamp", { ascending: true })

      if (service) {
        query = query.eq("service_name", service)
      }

      if (metric) {
        query = query.eq("metric_type", metric)
      }

      const { data: metrics, error } = await query

      if (error) {
        throw error
      }

      // Aggregate metrics by service and type
      const aggregated = (metrics || []).reduce((acc: any, metric) => {
        const key = `${metric.service_name}.${metric.metric_type}`
        if (!acc[key]) {
          acc[key] = {
            service: metric.service_name,
            metric: metric.metric_type,
            unit: metric.unit,
            values: [],
            avg: 0,
            min: Number.POSITIVE_INFINITY,
            max: Number.NEGATIVE_INFINITY,
          }
        }

        acc[key].values.push({
          timestamp: metric.timestamp,
          value: metric.value,
        })

        acc[key].min = Math.min(acc[key].min, metric.value)
        acc[key].max = Math.max(acc[key].max, metric.value)

        return acc
      }, {})

      // Calculate averages
      Object.values(aggregated).forEach((agg: any) => {
        agg.avg = agg.values.reduce((sum: number, v: any) => sum + v.value, 0) / agg.values.length
      })

      return NextResponse.json({
        success: true,
        data: Object.values(aggregated),
        timeRange: {
          start: startTime.toISOString(),
          end: now.toISOString(),
          duration: timeRange,
        },
      })
    } catch (error) {
      console.error("Metrics fetch error:", error)
      return NextResponse.json({ error: "Failed to fetch metrics" }, { status: 500 })
    }
  })
}
