/**
 * Partner Enterprise Dashboard Service
 * Comprehensive analytics and insights for airline partners
 */

import { createClient } from "@/lib/supabase/server"
import { logger } from "@/lib/logger"
import { EventBus } from "@/lib/event-system"
import { CacheManager } from "../cache-manager"

// Using imported logger instance

export interface DashboardMetrics {
  overview: {
    totalBookings: number
    totalRevenue: number
    totalCustomers: number
    conversionRate: number
    averageOrderValue: number
    periodComparison: {
      bookings: { current: number; previous: number; change: number }
      revenue: { current: number; previous: number; change: number }
      customers: { current: number; previous: number; change: number }
    }
  }

  realTime: {
    activeUsers: number
    searchesPerHour: number
    bookingsPerHour: number
    apiRequestsPerMinute: number
    errorRate: number
    responseTime: number
  }

  bookingAnalytics: {
    bySource: { source: string; count: number; revenue: number }[]
    byDestination: { city: string; count: number; revenue: number }[]
    byExperienceType: { type: string; count: number; revenue: number }[]
    conversionFunnel: {
      searches: number
      clicks: number
      bookings: number
      conversions: number
    }
    revenueByMonth: { month: string; revenue: number; bookings: number }[]
  }

  customerInsights: {
    demographics: {
      ageGroups: { range: string; percentage: number }[]
      countries: { country: string; percentage: number }[]
      loyaltySegments: { segment: string; count: number; value: number }[]
    }
    behavior: {
      averageSessionDuration: number
      pagesPerSession: number
      bounceRate: number
      repeatBookingRate: number
      preferredBookingTimes: { hour: number; percentage: number }[]
    }
    satisfaction: {
      npsScore: number
      satisfactionRating: number
      reviewDistribution: { stars: number; count: number }[]
      topComplaints: { category: string; count: number }[]
    }
  }

  operationalMetrics: {
    apiUsage: {
      requestsPerDay: { date: string; count: number }[]
      topEndpoints: { endpoint: string; requests: number; avgResponseTime: number }[]
      errorsByType: { type: string; count: number }[]
      rateLimitHits: number
    }
    performance: {
      averageResponseTime: number
      uptimePercentage: number
      errorRate: number
      slowestEndpoints: { endpoint: string; avgTime: number }[]
    }
    integrationHealth: {
      providerStatus: {
        provider: string
        status: "healthy" | "degraded" | "down"
        lastCheck: Date
      }[]
      webhookDelivery: {
        successRate: number
        failedDeliveries: number
        averageDeliveryTime: number
      }
    }
  }

  revenueAnalytics: {
    totalRevenue: number
    recurringRevenue: number
    revenueGrowthRate: number
    revenueBySegment: { segment: string; amount: number; percentage: number }[]
    paymentMethods: { method: string; usage: number; success_rate: number }[]
    refunds: {
      total: number
      rate: number
      reasons: { reason: string; count: number }[]
    }
    commissions: {
      earned: number
      pending: number
      paid: number
      nextPayout: Date
      commission_rate: number
    }
  }
}

export interface CustomReport {
  id: string
  name: string
  description: string
  type: "scheduled" | "on_demand"
  format: "pdf" | "csv" | "json" | "excel"
  metrics: string[]
  filters: Record<string, any>
  schedule?: {
    frequency: "daily" | "weekly" | "monthly"
    time: string
    timezone: string
    recipients: string[]
  }
  isActive: boolean
  createdAt: Date
  lastGenerated?: Date
}

export interface DashboardAlert {
  id: string
  type: "performance" | "revenue" | "integration" | "security"
  severity: "low" | "medium" | "high" | "critical"
  title: string
  description: string
  threshold: any
  currentValue: any
  isActive: boolean
  createdAt: Date
  acknowledgedAt?: Date
  resolvedAt?: Date
}

export interface BenchmarkData {
  category: string
  metric: string
  partnerValue: number
  industryAverage: number
  percentile: number
  topPerformerValue: number
  improvement: {
    potential: number
    recommendations: string[]
  }
}

export class PartnerEnterpriseDashboard {
  private supabase: any
  private eventSystem: EventBus
  private cacheManager: CacheManager

  constructor() {
    this.supabase = null // Will be initialized when needed
    this.eventSystem = new EventBus()
    this.cacheManager = new CacheManager()
  }

  private async getSupabase() {
    if (!this.supabase) {
      this.supabase = await createClient()
    }
    return this.supabase
  }

  /**
   * Get comprehensive dashboard metrics for an enterprise
   */
  async getDashboardMetrics(
    enterpriseId: string,
    timeRange: {
      start: Date
      end: Date
      comparison?: { start: Date; end: Date }
    },
    includeRealTime = true,
  ): Promise<DashboardMetrics> {
    try {
      const cacheKey = `dashboard_metrics:${enterpriseId}:${timeRange.start.getTime()}:${timeRange.end.getTime()}`

      // Check cache first for non-real-time data
      if (!includeRealTime) {
        const cached = await this.cacheManager.get<DashboardMetrics>(cacheKey)
        if (cached) return cached
      }

      // Fetch all metrics in parallel for performance
      const [overview, bookingAnalytics, customerInsights, operationalMetrics, revenueAnalytics] =
        await Promise.all([
          this.getOverviewMetrics(enterpriseId, timeRange),
          this.getBookingAnalytics(enterpriseId, timeRange),
          this.getCustomerInsights(enterpriseId, timeRange),
          this.getOperationalMetrics(enterpriseId, timeRange),
          this.getRevenueAnalytics(enterpriseId, timeRange),
        ])

      let realTime = {
        activeUsers: 0,
        searchesPerHour: 0,
        bookingsPerHour: 0,
        apiRequestsPerMinute: 0,
        errorRate: 0,
        responseTime: 0,
      }

      if (includeRealTime) {
        realTime = await this.getRealTimeMetrics(enterpriseId)
      }

      const metrics: DashboardMetrics = {
        overview,
        realTime,
        bookingAnalytics,
        customerInsights,
        operationalMetrics,
        revenueAnalytics,
      }

      // Cache for 5 minutes (excluding real-time data)
      if (!includeRealTime) {
        await this.cacheManager.set(cacheKey, metrics, { ttl: 300000 })
      }

      logger.info("Dashboard metrics retrieved", {
        enterpriseId,
        timeRange: timeRange.start.toISOString() + " to " + timeRange.end.toISOString(),
      })

      return metrics
    } catch (error) {
      logger.error("Failed to get dashboard metrics", { enterpriseId, timeRange, error })
      throw new Error("Failed to retrieve dashboard metrics")
    }
  }

  /**
   * Generate custom report
   */
  async generateCustomReport(
    enterpriseId: string,
    reportConfig: Omit<CustomReport, "id" | "createdAt" | "lastGenerated">,
  ): Promise<{ reportId: string; downloadUrl: string; data: any }> {
    try {
      const reportId = `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

      // Collect data based on metrics requested
      const reportData = await this.collectReportData(enterpriseId, reportConfig)

      // Format data based on requested format
      const formattedData = await this.formatReportData(reportData, reportConfig.format)

      // Store report
      const report: CustomReport = {
        ...reportConfig,
        id: reportId,
        createdAt: new Date(),
        lastGenerated: new Date(),
      }

      await this.storeCustomReport(enterpriseId, report, formattedData)

      // Generate download URL
      const downloadUrl = await this.generateDownloadUrl(reportId, reportConfig.format)

      // Log report generation
      await this.logReportGeneration(enterpriseId, report)

      return {
        reportId,
        downloadUrl,
        data: formattedData,
      }
    } catch (error) {
      logger.error("Failed to generate custom report", { enterpriseId, reportConfig, error })
      throw new Error("Failed to generate custom report")
    }
  }

  /**
   * Setup automated alerts
   */
  async setupAlert(
    enterpriseId: string,
    alertConfig: {
      type: DashboardAlert["type"]
      metric: string
      operator: ">" | "<" | "=" | ">=" | "<="
      threshold: number
      severity: DashboardAlert["severity"]
      notification: {
        email: boolean
        webhook: boolean
        slack: boolean
      }
      recipients: string[]
    },
  ): Promise<DashboardAlert> {
    try {
      const alert: DashboardAlert = {
        id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: alertConfig.type,
        severity: alertConfig.severity,
        title: `${alertConfig.metric} ${alertConfig.operator} ${alertConfig.threshold}`,
        description: `Alert when ${alertConfig.metric} ${alertConfig.operator} ${alertConfig.threshold}`,
        threshold: {
          metric: alertConfig.metric,
          operator: alertConfig.operator,
          value: alertConfig.threshold,
        },
        currentValue: null,
        isActive: true,
        createdAt: new Date(),
      }

      // Store alert configuration
      await this.storeAlert(enterpriseId, alert, alertConfig)

      // Schedule alert monitoring
      await this.scheduleAlertMonitoring(enterpriseId, alert)

      logger.info("Alert setup completed", { enterpriseId, alertId: alert.id })
      return alert
    } catch (error) {
      logger.error("Failed to setup alert", { enterpriseId, alertConfig, error })
      throw new Error("Failed to setup alert")
    }
  }

  /**
   * Get industry benchmarks
   */
  async getIndustryBenchmarks(enterpriseId: string, metrics: string[]): Promise<BenchmarkData[]> {
    try {
      // Get enterprise data
      const enterpriseMetrics = await this.getEnterpriseMetricsForBenchmark(enterpriseId, metrics)

      // Get industry averages and benchmarks
      const industryData = await this.getIndustryBenchmarkData(metrics)

      const benchmarks: BenchmarkData[] = []

      for (const metric of metrics) {
        const partnerValue = enterpriseMetrics[metric]
        const industryStats = industryData[metric]

        if (partnerValue !== undefined && industryStats) {
          benchmarks.push({
            category: industryStats.category,
            metric,
            partnerValue,
            industryAverage: industryStats.average,
            percentile: this.calculatePercentile(partnerValue, industryStats.distribution),
            topPerformerValue: industryStats.topPercentile,
            improvement: {
              potential: Math.max(0, industryStats.topPercentile - partnerValue),
              recommendations: this.generateImprovementRecommendations(
                metric,
                partnerValue,
                industryStats,
              ),
            },
          })
        }
      }

      return benchmarks
    } catch (error) {
      logger.error("Failed to get industry benchmarks", { enterpriseId, metrics, error })
      throw new Error("Failed to retrieve industry benchmarks")
    }
  }

  /**
   * Export dashboard data
   */
  async exportDashboardData(
    enterpriseId: string,
    exportConfig: {
      format: "csv" | "json" | "pdf" | "excel"
      metrics: string[]
      timeRange: { start: Date; end: Date }
      includeCharts: boolean
    },
  ): Promise<{ downloadUrl: string; filename: string }> {
    try {
      // Get dashboard data
      const metrics = await this.getDashboardMetrics(enterpriseId, exportConfig.timeRange, false)

      // Filter requested metrics
      const filteredData = this.filterMetrics(metrics, exportConfig.metrics)

      // Format for export
      const exportData = await this.formatForExport(
        filteredData,
        exportConfig.format,
        exportConfig.includeCharts,
      )

      // Generate filename
      const timestamp = new Date().toISOString().split("T")[0]
      const filename = `dashboard-export-${enterpriseId}-${timestamp}.${exportConfig.format}`

      // Store export file
      const downloadUrl = await this.storeExportFile(filename, exportData)

      return { downloadUrl, filename }
    } catch (error) {
      logger.error("Failed to export dashboard data", { enterpriseId, exportConfig, error })
      throw new Error("Failed to export dashboard data")
    }
  }

  // Private helper methods

  private async getOverviewMetrics(
    enterpriseId: string,
    timeRange: { start: Date; end: Date; comparison?: { start: Date; end: Date } },
  ): Promise<DashboardMetrics["overview"]> {
    const { data: bookings } = await this.supabase
      .from("bookings")
      .select("id, total_amount, created_at, user_id")
      .eq("enterprise_id", enterpriseId)
      .gte("created_at", timeRange.start.toISOString())
      .lte("created_at", timeRange.end.toISOString())

    const totalBookings = bookings?.length || 0
    const totalRevenue = bookings?.reduce((sum, b) => sum + (b.total_amount || 0), 0) || 0
    const uniqueCustomers = new Set(bookings?.map((b) => b.user_id)).size
    const averageOrderValue = totalBookings > 0 ? totalRevenue / totalBookings : 0

    // Get search data for conversion rate
    const { data: searches } = await this.supabase
      .from("analytics_events")
      .select("id")
      .eq("enterprise_id", enterpriseId)
      .eq("event_type", "search")
      .gte("timestamp", timeRange.start.toISOString())
      .lte("timestamp", timeRange.end.toISOString())

    const conversionRate = searches?.length ? (totalBookings / searches.length) * 100 : 0

    // Calculate period comparison if requested
    let periodComparison = {
      bookings: { current: totalBookings, previous: 0, change: 0 },
      revenue: { current: totalRevenue, previous: 0, change: 0 },
      customers: { current: uniqueCustomers, previous: 0, change: 0 },
    }

    if (timeRange.comparison) {
      const { data: previousBookings } = await this.supabase
        .from("bookings")
        .select("id, total_amount, user_id")
        .eq("enterprise_id", enterpriseId)
        .gte("created_at", timeRange.comparison.start.toISOString())
        .lte("created_at", timeRange.comparison.end.toISOString())

      const prevBookingsCount = previousBookings?.length || 0
      const prevRevenue = previousBookings?.reduce((sum, b) => sum + (b.total_amount || 0), 0) || 0
      const prevCustomers = new Set(previousBookings?.map((b) => b.user_id)).size

      periodComparison = {
        bookings: {
          current: totalBookings,
          previous: prevBookingsCount,
          change:
            prevBookingsCount > 0
              ? ((totalBookings - prevBookingsCount) / prevBookingsCount) * 100
              : 0,
        },
        revenue: {
          current: totalRevenue,
          previous: prevRevenue,
          change: prevRevenue > 0 ? ((totalRevenue - prevRevenue) / prevRevenue) * 100 : 0,
        },
        customers: {
          current: uniqueCustomers,
          previous: prevCustomers,
          change: prevCustomers > 0 ? ((uniqueCustomers - prevCustomers) / prevCustomers) * 100 : 0,
        },
      }
    }

    return {
      totalBookings,
      totalRevenue,
      totalCustomers: uniqueCustomers,
      conversionRate,
      averageOrderValue,
      periodComparison,
    }
  }

  private async getRealTimeMetrics(enterpriseId: string): Promise<DashboardMetrics["realTime"]> {
    const now = new Date()
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000)
    const oneMinuteAgo = new Date(now.getTime() - 60 * 1000)

    // Active users (unique sessions in last hour)
    const { data: activeSessions } = await this.supabase
      .from("analytics_events")
      .select("session_id")
      .eq("enterprise_id", enterpriseId)
      .gte("timestamp", oneHourAgo.toISOString())
      .distinct()

    // API requests per minute
    const { data: recentApiRequests } = await this.supabase
      .from("api_usage_logs")
      .select("id, response_status, response_time_ms")
      .eq("enterprise_id", enterpriseId)
      .gte("timestamp", oneMinuteAgo.toISOString())

    // Searches and bookings per hour
    const { data: recentSearches } = await this.supabase
      .from("analytics_events")
      .select("id")
      .eq("enterprise_id", enterpriseId)
      .eq("event_type", "search")
      .gte("timestamp", oneHourAgo.toISOString())

    const { data: recentBookings } = await this.supabase
      .from("bookings")
      .select("id")
      .eq("enterprise_id", enterpriseId)
      .gte("created_at", oneHourAgo.toISOString())

    const errorRequests = recentApiRequests?.filter((r) => r.response_status >= 400).length || 0
    const totalRequests = recentApiRequests?.length || 0
    const errorRate = totalRequests > 0 ? (errorRequests / totalRequests) * 100 : 0

    const avgResponseTime =
      recentApiRequests?.length > 0
        ? recentApiRequests.reduce((sum, r) => sum + (r.response_time_ms || 0), 0) /
          recentApiRequests.length
        : 0

    return {
      activeUsers: activeSessions?.length || 0,
      searchesPerHour: recentSearches?.length || 0,
      bookingsPerHour: recentBookings?.length || 0,
      apiRequestsPerMinute: totalRequests,
      errorRate,
      responseTime: avgResponseTime,
    }
  }

  private async getBookingAnalytics(
    enterpriseId: string,
    timeRange: { start: Date; end: Date },
  ): Promise<DashboardMetrics["bookingAnalytics"]> {
    // Implementation for booking analytics
    return {
      bySource: [],
      byDestination: [],
      byExperienceType: [],
      conversionFunnel: {
        searches: 0,
        clicks: 0,
        bookings: 0,
        conversions: 0,
      },
      revenueByMonth: [],
    }
  }

  private async getCustomerInsights(
    enterpriseId: string,
    timeRange: { start: Date; end: Date },
  ): Promise<DashboardMetrics["customerInsights"]> {
    // Implementation for customer insights
    return {
      demographics: {
        ageGroups: [],
        countries: [],
        loyaltySegments: [],
      },
      behavior: {
        averageSessionDuration: 0,
        pagesPerSession: 0,
        bounceRate: 0,
        repeatBookingRate: 0,
        preferredBookingTimes: [],
      },
      satisfaction: {
        npsScore: 0,
        satisfactionRating: 0,
        reviewDistribution: [],
        topComplaints: [],
      },
    }
  }

  private async getOperationalMetrics(
    enterpriseId: string,
    timeRange: { start: Date; end: Date },
  ): Promise<DashboardMetrics["operationalMetrics"]> {
    // Implementation for operational metrics
    return {
      apiUsage: {
        requestsPerDay: [],
        topEndpoints: [],
        errorsByType: [],
        rateLimitHits: 0,
      },
      performance: {
        averageResponseTime: 0,
        uptimePercentage: 0,
        errorRate: 0,
        slowestEndpoints: [],
      },
      integrationHealth: {
        providerStatus: [],
        webhookDelivery: {
          successRate: 0,
          failedDeliveries: 0,
          averageDeliveryTime: 0,
        },
      },
    }
  }

  private async getRevenueAnalytics(
    enterpriseId: string,
    timeRange: { start: Date; end: Date },
  ): Promise<DashboardMetrics["revenueAnalytics"]> {
    // Implementation for revenue analytics
    return {
      totalRevenue: 0,
      recurringRevenue: 0,
      revenueGrowthRate: 0,
      revenueBySegment: [],
      paymentMethods: [],
      refunds: {
        total: 0,
        rate: 0,
        reasons: [],
      },
      commissions: {
        earned: 0,
        pending: 0,
        paid: 0,
        nextPayout: new Date(),
        commission_rate: 0,
      },
    }
  }

  private async collectReportData(
    enterpriseId: string,
    reportConfig: Omit<CustomReport, "id" | "createdAt" | "lastGenerated">,
  ): Promise<any> {
    // Implementation for collecting report data
    return {}
  }

  private async formatReportData(data: any, format: string): Promise<any> {
    // Implementation for formatting report data
    return data
  }

  private async storeCustomReport(
    enterpriseId: string,
    report: CustomReport,
    data: any,
  ): Promise<void> {
    // Implementation for storing custom report
  }

  private async generateDownloadUrl(reportId: string, format: string): Promise<string> {
    // Implementation for generating download URL
    return `${process.env.NEXT_PUBLIC_BASE_URL}/api/reports/${reportId}/download`
  }

  private async logReportGeneration(enterpriseId: string, report: CustomReport): Promise<void> {
    await this.eventSystem.publish({
      type: "report.generated",
      source: "dashboard-service",
      data: {
        enterpriseId,
        reportId: report.id,
        type: report.type,
        format: report.format,
        timestamp: new Date(),
      },
    })
  }

  // Additional helper methods...
  private async storeAlert(
    enterpriseId: string,
    alert: DashboardAlert,
    config: any,
  ): Promise<void> {}
  private async scheduleAlertMonitoring(
    enterpriseId: string,
    alert: DashboardAlert,
  ): Promise<void> {}
  private async getEnterpriseMetricsForBenchmark(
    enterpriseId: string,
    metrics: string[],
  ): Promise<any> {
    return {}
  }
  private async getIndustryBenchmarkData(metrics: string[]): Promise<any> {
    return {}
  }
  private calculatePercentile(value: number, distribution: number[]): number {
    return 50
  }
  private generateImprovementRecommendations(
    metric: string,
    value: number,
    industryStats: any,
  ): string[] {
    return []
  }
  private filterMetrics(metrics: DashboardMetrics, requestedMetrics: string[]): any {
    return metrics
  }
  private async formatForExport(data: any, format: string, includeCharts: boolean): Promise<any> {
    return data
  }
  private async storeExportFile(filename: string, data: any): Promise<string> {
    return `${process.env.NEXT_PUBLIC_BASE_URL}/exports/${filename}`
  }
}
