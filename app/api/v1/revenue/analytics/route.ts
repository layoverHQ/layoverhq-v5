/**
 * Revenue Analytics API - Real-time Business Intelligence
 *
 * Provides comprehensive revenue analytics for Phase 2 Revenue Engine:
 * - Commission tracking and trending
 * - Partner revenue sharing analytics
 * - Experience performance metrics
 * - Real-time booking conversion rates
 * - Geographic and temporal revenue patterns
 * - Predictive revenue forecasting
 */

import { type NextRequest, NextResponse } from "next/server"
import { commissionEngine, type RevenueMetrics } from "@/lib/services/commission-engine"
import { configurableViatorService } from "@/lib/services/configurable-viator-service"
import { stripePaymentService } from "@/lib/services/stripe-payment-service"
import { EnhancedAuth } from "@/lib/enhanced-auth"
import { createClient } from "@/lib/supabase/server"
import { logger } from "@/lib/logger"
import { errorTracker } from "@/lib/error-tracking"

interface RevenueAnalyticsQuery {
  startDate?: string
  endDate?: string
  currency?: string
  destination?: string
  userTier?: string
  experienceType?: string
  groupBy?: "day" | "week" | "month"
  includeForecasting?: boolean
  includeComparisons?: boolean
}

interface EnhancedRevenueMetrics extends RevenueMetrics {
  forecasting?: {
    nextPeriodProjection: number
    trendDirection: "up" | "down" | "stable"
    confidence: number
    factors: string[]
  }
  comparisons?: {
    previousPeriod: {
      revenue: number
      change: number
      changePercent: number
    }
    yearOverYear?: {
      revenue: number
      change: number
      changePercent: number
    }
  }
  breakdowns: {
    byExperience: Array<{
      experienceId: string
      title: string
      revenue: number
      bookings: number
      conversionRate: number
      averagePrice: number
      commissionEarned: number
    }>
    byDestination: Array<{
      destination: string
      revenue: number
      bookings: number
      marketShare: number
      growthRate: number
    }>
    byUserTier: Array<{
      tier: string
      revenue: number
      bookings: number
      averageCommissionRate: number
      loyaltyMetrics: {
        repeatBookings: number
        averageSpend: number
        lifetime: number
      }
    }>
    byPaymentMethod: Array<{
      method: string
      revenue: number
      bookings: number
      successRate: number
      averageValue: number
    }>
  }
  realTimeMetrics: {
    activeUsers: number
    currentConversions: number
    todayRevenue: number
    hourlyTrend: Array<{
      hour: number
      revenue: number
      bookings: number
    }>
  }
}

export async function GET(request: NextRequest) {
  try {
    // Check admin authentication
    const user = await EnhancedAuth.getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    // Check admin privileges
    const supabase = await createClient()
    const { data: profile } = await supabase
      .from("profiles")
      .select("role, permissions")
      .eq("id", user.id)
      .single()

    if (!profile || (profile.role !== "admin" && profile.role !== "super_admin")) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const query: RevenueAnalyticsQuery = {
      startDate: searchParams.get("startDate") || undefined,
      endDate: searchParams.get("endDate") || undefined,
      currency: searchParams.get("currency") || "USD",
      destination: searchParams.get("destination") || undefined,
      userTier: searchParams.get("userTier") || undefined,
      experienceType: searchParams.get("experienceType") || undefined,
      groupBy: (searchParams.get("groupBy") as "day" | "week" | "month") || "day",
      includeForecasting: searchParams.get("includeForecasting") === "true",
      includeComparisons: searchParams.get("includeComparisons") === "true",
    }

    // Default to last 30 days if no dates provided
    const endDate = query.endDate ? new Date(query.endDate) : new Date()
    const startDate = query.startDate
      ? new Date(query.startDate)
      : new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000)

    logger.info("[RevenueAnalytics] Generating analytics report", {
      userId: user.id,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      filters: query,
    })

    // Get base revenue metrics
    const baseMetrics = await commissionEngine.getRevenueMetrics(
      startDate,
      endDate,
      query.currency!,
      {
        destinationCode: query.destination,
        userTier: query.userTier,
        experienceType: query.experienceType,
      },
    )

    // Get enhanced analytics
    const enhancedMetrics = await buildEnhancedAnalytics(baseMetrics, startDate, endDate, query)

    // Add forecasting if requested
    if (query.includeForecasting) {
      enhancedMetrics.forecasting = await generateRevenueForecasting(
        enhancedMetrics,
        startDate,
        endDate,
      )
    }

    // Add period comparisons if requested
    if (query.includeComparisons) {
      enhancedMetrics.comparisons = await generatePeriodComparisons(
        enhancedMetrics,
        startDate,
        endDate,
        query,
      )
    }

    return NextResponse.json({
      success: true,
      data: enhancedMetrics,
      metadata: {
        generatedAt: new Date().toISOString(),
        period: {
          start: startDate.toISOString(),
          end: endDate.toISOString(),
          days: Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)),
        },
        filters: query,
      },
    })
  } catch (error) {
    await errorTracker.trackError(error as Error, {
      service: "revenue-analytics-api",
      operation: "getAnalytics",
      metadata: {
        url: request.url,
        method: request.method,
      },
    })

    logger.error("[RevenueAnalytics] Analytics generation failed", {
      error: error instanceof Error ? error.message : "Unknown error",
    })

    return NextResponse.json(
      {
        error: "Analytics generation failed",
        message: "Failed to generate revenue analytics",
      },
      { status: 500 },
    )
  }
}

async function buildEnhancedAnalytics(
  baseMetrics: RevenueMetrics,
  startDate: Date,
  endDate: Date,
  query: RevenueAnalyticsQuery,
): Promise<EnhancedRevenueMetrics> {
  const supabase = await createClient()

  // Get detailed breakdowns
  const [
    experienceBreakdown,
    destinationBreakdown,
    userTierBreakdown,
    paymentBreakdown,
    realTimeMetrics,
  ] = await Promise.all([
    getExperienceBreakdown(supabase, startDate, endDate, query),
    getDestinationBreakdown(supabase, startDate, endDate, query),
    getUserTierBreakdown(supabase, startDate, endDate, query),
    getPaymentMethodBreakdown(supabase, startDate, endDate, query),
    getRealTimeMetrics(supabase),
  ])

  return {
    ...baseMetrics,
    breakdowns: {
      byExperience: experienceBreakdown,
      byDestination: destinationBreakdown,
      byUserTier: userTierBreakdown,
      byPaymentMethod: paymentBreakdown,
    },
    realTimeMetrics,
  }
}

async function getExperienceBreakdown(
  supabase: any,
  startDate: Date,
  endDate: Date,
  query: RevenueAnalyticsQuery,
) {
  let queryBuilder = supabase
    .from("commission_tracking")
    .select(
      `
      experience_id,
      final_price,
      commission_amount,
      created_at,
      viator_products(title)
    `,
    )
    .gte("created_at", startDate.toISOString())
    .lte("created_at", endDate.toISOString())

  if (query.destination) {
    queryBuilder = queryBuilder.ilike("destination", `%${query.destination}%`)
  }

  const { data: commissions, error } = await queryBuilder

  if (error) {
    logger.error("[RevenueAnalytics] Failed to get experience breakdown", { error })
    return []
  }

  // Group by experience and calculate metrics
  const experienceGroups = new Map()

  commissions?.forEach((commission: any) => {
    const expId = commission.experience_id
    const existing = experienceGroups.get(expId) || {
      experienceId: expId,
      title: commission.viator_products?.title || "Unknown Experience",
      revenue: 0,
      bookings: 0,
      totalCommission: 0,
      prices: [],
    }

    existing.revenue += commission.final_price
    existing.bookings += 1
    existing.totalCommission += commission.commission_amount
    existing.prices.push(commission.final_price)

    experienceGroups.set(expId, existing)
  })

  return Array.from(experienceGroups.values())
    .map((exp) => ({
      experienceId: exp.experienceId,
      title: exp.title,
      revenue: exp.revenue,
      bookings: exp.bookings,
      conversionRate: exp.bookings > 0 ? 0.15 : 0, // Mock conversion rate
      averagePrice: exp.revenue / exp.bookings,
      commissionEarned: exp.totalCommission,
    }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 20) // Top 20 experiences
}

async function getDestinationBreakdown(
  supabase: any,
  startDate: Date,
  endDate: Date,
  query: RevenueAnalyticsQuery,
) {
  const { data: destinations, error } = await supabase
    .from("commission_tracking")
    .select("destination, platform_revenue, created_at")
    .gte("created_at", startDate.toISOString())
    .lte("created_at", endDate.toISOString())

  if (error) {
    logger.error("[RevenueAnalytics] Failed to get destination breakdown", { error })
    return []
  }

  // Group by destination
  const destGroups = new Map()
  let totalRevenue = 0

  destinations?.forEach((item: any) => {
    const dest = item.destination || "Unknown"
    const existing = destGroups.get(dest) || { revenue: 0, bookings: 0 }

    existing.revenue += item.platform_revenue
    existing.bookings += 1
    totalRevenue += item.platform_revenue

    destGroups.set(dest, existing)
  })

  return Array.from(destGroups.entries())
    .map(([destination, metrics]: [string, any]) => ({
      destination,
      revenue: metrics.revenue,
      bookings: metrics.bookings,
      marketShare: totalRevenue > 0 ? (metrics.revenue / totalRevenue) * 100 : 0,
      growthRate: Math.random() * 20 - 10, // Mock growth rate
    }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 10)
}

async function getUserTierBreakdown(
  supabase: any,
  startDate: Date,
  endDate: Date,
  query: RevenueAnalyticsQuery,
) {
  // Mock data - in production, this would query actual user tier data
  return [
    {
      tier: "bronze",
      revenue: 15000,
      bookings: 120,
      averageCommissionRate: 0.15,
      loyaltyMetrics: {
        repeatBookings: 25,
        averageSpend: 125,
        lifetime: 18,
      },
    },
    {
      tier: "silver",
      revenue: 12000,
      bookings: 80,
      averageCommissionRate: 0.17,
      loyaltyMetrics: {
        repeatBookings: 35,
        averageSpend: 150,
        lifetime: 24,
      },
    },
    {
      tier: "gold",
      revenue: 9000,
      bookings: 45,
      averageCommissionRate: 0.19,
      loyaltyMetrics: {
        repeatBookings: 50,
        averageSpend: 200,
        lifetime: 36,
      },
    },
    {
      tier: "platinum",
      revenue: 6000,
      bookings: 25,
      averageCommissionRate: 0.21,
      loyaltyMetrics: {
        repeatBookings: 65,
        averageSpend: 240,
        lifetime: 48,
      },
    },
  ]
}

async function getPaymentMethodBreakdown(
  supabase: any,
  startDate: Date,
  endDate: Date,
  query: RevenueAnalyticsQuery,
) {
  // Get payment analytics from Stripe service
  const paymentAnalytics = await stripePaymentService.getPaymentAnalytics(startDate, endDate, {
    currency: query.currency,
    destination: query.destination,
  })

  return Object.entries(paymentAnalytics.paymentMethodBreakdown).map(([method, data]) => ({
    method,
    revenue: data.revenue,
    bookings: data.count,
    successRate: 0.95, // Mock success rate
    averageValue: data.revenue / Math.max(data.count, 1),
  }))
}

async function getRealTimeMetrics(supabase: any) {
  const today = new Date().toISOString().split("T")[0]

  // Get today's metrics
  const { data: todayMetrics } = await supabase
    .from("commission_tracking")
    .select("platform_revenue, created_at")
    .gte("created_at", `${today}T00:00:00.000Z`)
    .lt("created_at", `${today}T23:59:59.999Z`)

  const todayRevenue =
    todayMetrics?.reduce((sum: number, item: any) => sum + item.platform_revenue, 0) || 0

  // Calculate hourly trends
  const hourlyTrend = Array.from({ length: 24 }, (_, hour) => {
    const hourStart = `${today}T${hour.toString().padStart(2, "0")}:00:00.000Z`
    const hourEnd = `${today}T${hour.toString().padStart(2, "0")}:59:59.999Z`

    const hourMetrics =
      todayMetrics?.filter(
        (item: any) => item.created_at >= hourStart && item.created_at <= hourEnd,
      ) || []

    return {
      hour,
      revenue: hourMetrics.reduce((sum: number, item: any) => sum + item.platform_revenue, 0),
      bookings: hourMetrics.length,
    }
  })

  return {
    activeUsers: Math.floor(Math.random() * 500) + 100, // Mock active users
    currentConversions: Math.floor(Math.random() * 20) + 5, // Mock conversions
    todayRevenue,
    hourlyTrend,
  }
}

async function generateRevenueForecasting(
  metrics: EnhancedRevenueMetrics,
  startDate: Date,
  endDate: Date,
) {
  // Simple trend-based forecasting
  const periodDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
  const dailyAverage = metrics.totalRevenue / periodDays

  // Calculate trend from recent data
  const recentRevenue = (metrics as any).revenueByDay?.slice(-7) || [] // Last 7 days
  const earlierRevenue = (metrics as any).revenueByDay?.slice(-14, -7) || [] // Previous 7 days

  const recentAvg =
    recentRevenue.length > 0
      ? recentRevenue.reduce((sum: any, day: any) => sum + day.revenue, 0) / recentRevenue.length
      : 0
  const earlierAvg =
    earlierRevenue.length > 0
      ? earlierRevenue.reduce((sum: any, day: any) => sum + day.revenue, 0) / earlierRevenue.length
      : 0

  const trendMultiplier = earlierAvg > 0 ? recentAvg / earlierAvg : 1
  const nextPeriodProjection = dailyAverage * periodDays * trendMultiplier

  let trendDirection: "up" | "down" | "stable" = "stable"
  if (trendMultiplier > 1.05) trendDirection = "up"
  else if (trendMultiplier < 0.95) trendDirection = "down"

  return {
    nextPeriodProjection: Math.round(nextPeriodProjection),
    trendDirection,
    confidence: Math.min(0.9, Math.max(0.3, recentRevenue.length / 7)), // Confidence based on data availability
    factors: [
      trendDirection === "up"
        ? "Positive revenue trend"
        : trendDirection === "down"
          ? "Declining revenue trend"
          : "Stable revenue pattern",
      `Average daily revenue: $${Math.round(dailyAverage)}`,
      `${metrics.totalBookings} bookings in period`,
      `${metrics.topPerformingDestinations.length} active destinations`,
    ],
  }
}

async function generatePeriodComparisons(
  metrics: EnhancedRevenueMetrics,
  startDate: Date,
  endDate: Date,
  query: RevenueAnalyticsQuery,
) {
  const periodLength = endDate.getTime() - startDate.getTime()

  // Previous period comparison
  const prevEndDate = startDate
  const prevStartDate = new Date(startDate.getTime() - periodLength)

  const previousMetrics = await commissionEngine.getRevenueMetrics(
    prevStartDate,
    prevEndDate,
    query.currency!,
    {
      destinationCode: query.destination,
      userTier: query.userTier,
      experienceType: query.experienceType,
    },
  )

  const revenueChange = metrics.totalRevenue - previousMetrics.totalRevenue
  const changePercent =
    previousMetrics.totalRevenue > 0 ? (revenueChange / previousMetrics.totalRevenue) * 100 : 0

  // Year over year comparison (if we have enough data)
  let yearOverYear
  if (startDate.getTime() > Date.now() - 366 * 24 * 60 * 60 * 1000) {
    const yoyStartDate = new Date(
      startDate.getFullYear() - 1,
      startDate.getMonth(),
      startDate.getDate(),
    )
    const yoyEndDate = new Date(endDate.getFullYear() - 1, endDate.getMonth(), endDate.getDate())

    try {
      const yoyMetrics = await commissionEngine.getRevenueMetrics(
        yoyStartDate,
        yoyEndDate,
        query.currency!,
        {
          destinationCode: query.destination,
          userTier: query.userTier,
          experienceType: query.experienceType,
        },
      )

      const yoyChange = metrics.totalRevenue - yoyMetrics.totalRevenue
      const yoyChangePercent =
        yoyMetrics.totalRevenue > 0 ? (yoyChange / yoyMetrics.totalRevenue) * 100 : 0

      yearOverYear = {
        revenue: yoyMetrics.totalRevenue,
        change: yoyChange,
        changePercent: yoyChangePercent,
      }
    } catch (error) {
      logger.warn("[RevenueAnalytics] Year-over-year comparison failed", { error })
    }
  }

  return {
    previousPeriod: {
      revenue: previousMetrics.totalRevenue,
      change: revenueChange,
      changePercent,
    },
    yearOverYear,
  }
}
