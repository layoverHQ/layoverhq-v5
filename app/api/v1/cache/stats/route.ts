import { type NextRequest, NextResponse } from "next/server"
import { ApiGateway } from "@/lib/api-gateway"
import { cacheManager } from "@/lib/cache-manager"
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
      const timeRange = searchParams.get("timeRange") || "7d"

      // Get current cache statistics
      const currentStats = cacheManager.getStats()

      // Get historical statistics from database
      const supabase = await createClient()
      const daysBack = timeRange === "30d" ? 30 : timeRange === "7d" ? 7 : 1

      const { data: historicalStats, error } = await supabase
        .from("cache_stats")
        .select("*")
        .gte(
          "date",
          new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
        )
        .order("date", { ascending: true })

      if (error) {
        throw error
      }

      return NextResponse.json({
        success: true,
        data: {
          current: currentStats,
          historical: historicalStats || [],
          summary: {
            averageHitRate:
              (historicalStats || []).reduce((sum, stat) => sum + (stat.hit_rate || 0), 0) /
                Math.max((historicalStats || []).length, 1) || 0,
            totalKeysGrowth: calculateGrowth(historicalStats || [], "total_keys"),
            hitRateGrowth: calculateGrowth(historicalStats || [], "hit_rate"),
          },
        },
      })
    } catch (error) {
      console.error("Cache stats fetch error:", error)
      return NextResponse.json({ error: "Failed to fetch cache statistics" }, { status: 500 })
    }
  })
}

function calculateGrowth(data: any[], field: string): number {
  if (data.length < 2) return 0
  const latest = data[data.length - 1][field] || 0
  const previous = data[data.length - 2][field] || 0
  return previous > 0 ? ((latest - previous) / previous) * 100 : 0
}
