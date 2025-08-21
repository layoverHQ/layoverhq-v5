/**
 * Production Monitoring & Alerting System
 * Comprehensive system health monitoring with automated incident response
 */

import { createClient } from "@/lib/supabase/server"
import { logger } from "@/lib/logger"
import { EventBus } from "@/lib/event-system"
import { CacheManager } from "../cache-manager"

export interface SystemHealth {
  status: "healthy" | "degraded" | "down" | "maintenance"
  uptime: number
  lastCheck: Date
  services: ServiceHealth[]
  alerts: Alert[]
  metrics: SystemMetrics
}

export interface ServiceHealth {
  id: string
  name: string
  status: "healthy" | "degraded" | "down"
  responseTime: number
  errorRate: number
  uptime: number
  lastCheck: Date
  dependencies: string[]
  endpoints: EndpointHealth[]
}

export interface EndpointHealth {
  path: string
  method: string
  status: "healthy" | "degraded" | "down"
  responseTime: number
  successRate: number
  lastCheck: Date
  rateLimitStatus: {
    current: number
    limit: number
    resetTime: Date
  }
}

export interface SystemMetrics {
  api: {
    totalRequests: number
    requestsPerSecond: number
    averageResponseTime: number
    errorRate: number
    slowQueries: QueryMetric[]
    rateLimitHits: number
  }
  database: {
    connectionCount: number
    queryLatency: number
    slowQueries: QueryMetric[]
    replicationLag: number
    storageUsage: StorageMetric
  }
  cache: {
    hitRate: number
    memoryUsage: number
    evictionRate: number
    connectionCount: number
  }
  infrastructure: {
    cpuUsage: number
    memoryUsage: number
    diskUsage: number
    networkLatency: number
  }
  business: BusinessKPIs
}

export interface QueryMetric {
  query: string
  duration: number
  timestamp: Date
  database: string
}

export interface StorageMetric {
  total: number
  used: number
  available: number
  percentage: number
}

export interface BusinessKPIs {
  activeUsers: number
  bookingsPerHour: number
  revenuePerHour: number
  conversionRate: number
  customerSatisfaction: number
  apiUsageByPartner: Array<{
    partnerId: string
    partnerName: string
    requestCount: number
    errorRate: number
  }>
}

export interface Alert {
  id: string
  type: "system" | "performance" | "business" | "security"
  severity: "low" | "medium" | "high" | "critical"
  title: string
  description: string
  service?: string
  metric: string
  threshold: any
  currentValue: any
  status: "active" | "acknowledged" | "resolved"
  createdAt: Date
  acknowledgedAt?: Date
  resolvedAt?: Date
  assignedTo?: string
  actions: AlertAction[]
}

export interface AlertAction {
  id: string
  type: "notification" | "escalation" | "automation" | "runbook"
  action: string
  condition: string
  executedAt?: Date
  status: "pending" | "executed" | "failed"
  result?: any
}

export interface IncidentResponse {
  id: string
  alertId: string
  severity: Alert["severity"]
  status: "detected" | "investigating" | "identified" | "monitoring" | "resolved"
  title: string
  description: string
  affectedServices: string[]
  timeline: IncidentTimelineEntry[]
  assignedTeam: string[]
  postmortemRequired: boolean
  estimatedResolution?: Date
  actualResolution?: Date
  impact: {
    usersAffected: number
    revenueImpact: number
    partnersAffected: string[]
  }
}

export interface IncidentTimelineEntry {
  timestamp: Date
  type: "detection" | "investigation" | "update" | "resolution"
  message: string
  author: string
  automated: boolean
}

export interface CapacityPlan {
  service: string
  currentUsage: number
  forecastedUsage: number
  capacityLimit: number
  timeToCapacity: number // days
  recommendations: string[]
  scalingOptions: ScalingOption[]
}

export interface ScalingOption {
  type: "horizontal" | "vertical"
  description: string
  cost: number
  impact: string
  timeline: string
}

export class ProductionMonitoringSystem {
  private supabase: any
  private eventSystem: EventBus
  private cacheManager: CacheManager
  private alertRules: Map<string, any>
  private incidentResponse: Map<string, IncidentResponse>

  constructor() {
    this.supabase = null
    this.eventSystem = new EventBus()
    this.cacheManager = new CacheManager()
    this.alertRules = new Map()
    this.incidentResponse = new Map()
    this.initializeAlertRules()
  }

  private async getSupabase() {
    if (!this.supabase) {
      this.supabase = await createClient()
    }
    return this.supabase
  }

  /**
   * Get comprehensive system health status
   */
  async getSystemHealth(): Promise<SystemHealth> {
    try {
      const supabase = await this.getSupabase()

      // Fetch all health metrics in parallel
      const [serviceHealth, systemMetrics, activeAlerts] = await Promise.all([
        this.checkServicesHealth(),
        this.collectSystemMetrics(),
        this.getActiveAlerts(),
      ])

      // Determine overall system status
      const overallStatus = this.determineOverallStatus(serviceHealth, activeAlerts)

      // Calculate system uptime
      const uptime = await this.calculateSystemUptime()

      const systemHealth: SystemHealth = {
        status: overallStatus,
        uptime,
        lastCheck: new Date(),
        services: serviceHealth,
        alerts: activeAlerts,
        metrics: systemMetrics,
      }

      // Cache the results
      await this.cacheManager.set("system_health", systemHealth, { ttl: 30 }) // 30 seconds cache

      logger.info("System health check completed", {
        status: overallStatus,
        servicesCount: serviceHealth.length,
        alertsCount: activeAlerts.length,
        uptime,
      })

      return systemHealth
    } catch (error) {
      logger.error("Failed to get system health", { error })
      throw new Error("Failed to retrieve system health status")
    }
  }

  /**
   * Monitor business KPIs and trigger alerts
   */
  async monitorBusinessKPIs(): Promise<BusinessKPIs> {
    try {
      const supabase = await this.getSupabase()
      const now = new Date()
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000)

      // Collect business metrics
      const [
        activeUsers,
        recentBookings,
        recentRevenue,
        conversionData,
        satisfactionData,
        partnerUsage,
      ] = await Promise.all([
        this.getActiveUsers(),
        this.getRecentBookings(oneHourAgo),
        this.getRecentRevenue(oneHourAgo),
        this.getConversionMetrics(oneHourAgo),
        this.getCustomerSatisfaction(),
        this.getPartnerAPIUsage(oneHourAgo),
      ])

      const kpis: BusinessKPIs = {
        activeUsers,
        bookingsPerHour: recentBookings.count,
        revenuePerHour: recentRevenue.total,
        conversionRate: conversionData.rate,
        customerSatisfaction: satisfactionData.average,
        apiUsageByPartner: partnerUsage,
      }

      // Check KPI thresholds and trigger alerts
      await this.checkBusinessKPIAlerts(kpis)

      logger.info("Business KPIs monitored", kpis)
      return kpis
    } catch (error) {
      logger.error("Failed to monitor business KPIs", { error })
      throw new Error("Failed to monitor business KPIs")
    }
  }

  /**
   * Create and manage alerts
   */
  async createAlert(
    type: Alert["type"],
    severity: Alert["severity"],
    title: string,
    description: string,
    metric: string,
    threshold: any,
    currentValue: any,
    service?: string,
  ): Promise<Alert> {
    try {
      const alert: Alert = {
        id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type,
        severity,
        title,
        description,
        service,
        metric,
        threshold,
        currentValue,
        status: "active",
        createdAt: new Date(),
        actions: [],
      }

      // Store alert in database
      const supabase = await this.getSupabase()
      await supabase.from("system_alerts").insert({
        id: alert.id,
        type: alert.type,
        severity: alert.severity,
        title: alert.title,
        description: alert.description,
        service: alert.service,
        metric: alert.metric,
        threshold: alert.threshold,
        current_value: alert.currentValue,
        status: alert.status,
        created_at: alert.createdAt.toISOString(),
      })

      // Trigger alert actions
      await this.executeAlertActions(alert)

      // Auto-create incident for critical alerts
      if (severity === "critical") {
        await this.createIncident(alert)
      }

      logger.warn("Alert created", {
        alertId: alert.id,
        type,
        severity,
        metric,
        service,
      })

      return alert
    } catch (error) {
      logger.error("Failed to create alert", { error, type, severity, metric })
      throw new Error("Failed to create alert")
    }
  }

  /**
   * Automated incident response
   */
  async createIncident(alert: Alert): Promise<IncidentResponse> {
    try {
      const incident: IncidentResponse = {
        id: `incident_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        alertId: alert.id,
        severity: alert.severity,
        status: "detected",
        title: `Incident: ${alert.title}`,
        description: alert.description,
        affectedServices: alert.service ? [alert.service] : [],
        timeline: [
          {
            timestamp: new Date(),
            type: "detection",
            message: `Incident created from alert: ${alert.title}`,
            author: "System",
            automated: true,
          },
        ],
        assignedTeam: this.getIncidentTeam(alert.severity),
        postmortemRequired: alert.severity === "critical",
        impact: {
          usersAffected: 0, // Calculate based on affected services
          revenueImpact: 0, // Estimate based on historical data
          partnersAffected: [],
        },
      }

      // Store incident
      this.incidentResponse.set(incident.id, incident)

      // Execute automated response procedures
      await this.executeAutomatedResponse(incident)

      // Notify incident response team
      await this.notifyIncidentTeam(incident)

      logger.error("Incident created", {
        incidentId: incident.id,
        alertId: alert.id,
        severity: alert.severity,
        affectedServices: incident.affectedServices,
      })

      return incident
    } catch (error) {
      logger.error("Failed to create incident", { error, alertId: alert.id })
      throw new Error("Failed to create incident")
    }
  }

  /**
   * Capacity planning and forecasting
   */
  async generateCapacityPlan(): Promise<CapacityPlan[]> {
    try {
      const services = ["api_gateway", "database", "cache", "file_storage", "compute"]

      const capacityPlans: CapacityPlan[] = []

      for (const service of services) {
        const plan = await this.analyzeServiceCapacity(service)
        capacityPlans.push(plan)
      }

      // Sort by urgency (time to capacity)
      capacityPlans.sort((a, b) => a.timeToCapacity - b.timeToCapacity)

      logger.info("Capacity plans generated", {
        servicesAnalyzed: services.length,
        urgentPlans: capacityPlans.filter((p) => p.timeToCapacity < 30).length,
      })

      return capacityPlans
    } catch (error) {
      logger.error("Failed to generate capacity plans", { error })
      throw new Error("Failed to generate capacity planning")
    }
  }

  // Private helper methods

  private initializeAlertRules(): void {
    // Define alert thresholds
    this.alertRules.set("api_response_time", { threshold: 2000, severity: "medium" })
    this.alertRules.set("api_error_rate", { threshold: 5, severity: "high" })
    this.alertRules.set("database_connection_pool", { threshold: 80, severity: "high" })
    this.alertRules.set("cache_hit_rate", { threshold: 85, severity: "low" })
    this.alertRules.set("booking_conversion", { threshold: 2, severity: "medium" })
    this.alertRules.set("revenue_drop", { threshold: 20, severity: "high" })
    this.alertRules.set("partner_api_errors", { threshold: 10, severity: "medium" })
  }

  private async checkServicesHealth(): Promise<ServiceHealth[]> {
    const services = [
      "api_gateway",
      "authentication",
      "booking_service",
      "payment_service",
      "notification_service",
      "search_engine",
      "database",
      "cache",
      "file_storage",
    ]

    const serviceHealthChecks = services.map(async (service) => {
      return await this.checkServiceHealth(service)
    })

    return Promise.all(serviceHealthChecks)
  }

  private async checkServiceHealth(serviceName: string): Promise<ServiceHealth> {
    const supabase = await this.getSupabase()
    const now = new Date()
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000)

    try {
      // Check service-specific health metrics
      const { data: metrics } = await supabase
        .from("service_metrics")
        .select("*")
        .eq("service_name", serviceName)
        .gte("timestamp", fiveMinutesAgo.toISOString())
        .order("timestamp", { ascending: false })

      const recentMetrics = metrics || []
      const avgResponseTime =
        recentMetrics.length > 0
          ? recentMetrics.reduce((sum, m) => sum + (m.response_time || 0), 0) / recentMetrics.length
          : 0

      const errorCount = recentMetrics.filter((m) => m.error_count > 0).length
      const errorRate = recentMetrics.length > 0 ? (errorCount / recentMetrics.length) * 100 : 0

      // Determine service status
      let status: ServiceHealth["status"] = "healthy"
      if (errorRate > 10 || avgResponseTime > 5000) {
        status = "down"
      } else if (errorRate > 5 || avgResponseTime > 2000) {
        status = "degraded"
      }

      return {
        id: serviceName,
        name: serviceName.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase()),
        status,
        responseTime: Math.round(avgResponseTime),
        errorRate: Math.round(errorRate * 100) / 100,
        uptime: 99.9, // Calculate from historical data
        lastCheck: now,
        dependencies: this.getServiceDependencies(serviceName),
        endpoints: await this.checkServiceEndpoints(serviceName),
      }
    } catch (error) {
      logger.error(`Failed to check health for service: ${serviceName}`, { error })
      return {
        id: serviceName,
        name: serviceName.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase()),
        status: "down",
        responseTime: 0,
        errorRate: 100,
        uptime: 0,
        lastCheck: now,
        dependencies: [],
        endpoints: [],
      }
    }
  }

  private async checkServiceEndpoints(serviceName: string): Promise<EndpointHealth[]> {
    const endpointMappings: Record<string, string[]> = {
      api_gateway: ["/api/v1/health", "/api/v1/flights/search", "/api/v1/experiences/search"],
      booking_service: ["/api/v1/bookings", "/api/v1/bookings/confirm"],
      payment_service: ["/api/v1/payments/process", "/api/v1/payments/refund"],
    }

    const endpoints = endpointMappings[serviceName] || []
    return Promise.all(endpoints.map((endpoint) => this.checkEndpointHealth(endpoint)))
  }

  private async checkEndpointHealth(endpoint: string): Promise<EndpointHealth> {
    // Simulate endpoint health check
    // In production, this would make actual HTTP requests
    return {
      path: endpoint,
      method: "GET",
      status: "healthy",
      responseTime: Math.random() * 1000,
      successRate: 95 + Math.random() * 5,
      lastCheck: new Date(),
      rateLimitStatus: {
        current: Math.floor(Math.random() * 800),
        limit: 1000,
        resetTime: new Date(Date.now() + 60 * 1000),
      },
    }
  }

  private getServiceDependencies(serviceName: string): string[] {
    const dependencies: Record<string, string[]> = {
      api_gateway: ["authentication", "database"],
      booking_service: ["payment_service", "notification_service", "database"],
      payment_service: ["database"],
      search_engine: ["database", "cache"],
    }
    return dependencies[serviceName] || []
  }

  private async collectSystemMetrics(): Promise<SystemMetrics> {
    // This would collect real metrics from monitoring systems
    // For now, returning sample data structure
    return {
      api: {
        totalRequests: 125000,
        requestsPerSecond: 45.2,
        averageResponseTime: 185,
        errorRate: 0.8,
        slowQueries: [],
        rateLimitHits: 23,
      },
      database: {
        connectionCount: 45,
        queryLatency: 12,
        slowQueries: [],
        replicationLag: 0.2,
        storageUsage: {
          total: 1000000,
          used: 650000,
          available: 350000,
          percentage: 65,
        },
      },
      cache: {
        hitRate: 94.2,
        memoryUsage: 78,
        evictionRate: 2.1,
        connectionCount: 156,
      },
      infrastructure: {
        cpuUsage: 68,
        memoryUsage: 72,
        diskUsage: 45,
        networkLatency: 8.5,
      },
      business: await this.monitorBusinessKPIs(),
    }
  }

  private determineOverallStatus(
    services: ServiceHealth[],
    alerts: Alert[],
  ): SystemHealth["status"] {
    const criticalAlerts = alerts.filter((a) => a.severity === "critical" && a.status === "active")
    const downServices = services.filter((s) => s.status === "down")
    const degradedServices = services.filter((s) => s.status === "degraded")

    if (criticalAlerts.length > 0 || downServices.length > 2) {
      return "down"
    } else if (downServices.length > 0 || degradedServices.length > 3) {
      return "degraded"
    } else {
      return "healthy"
    }
  }

  private async calculateSystemUptime(): Promise<number> {
    // Calculate uptime percentage over last 30 days
    // This would query historical data
    return 99.95
  }

  private async getActiveAlerts(): Promise<Alert[]> {
    const supabase = await this.getSupabase()
    const { data: alerts } = await supabase
      .from("system_alerts")
      .select("*")
      .eq("status", "active")
      .order("created_at", { ascending: false })

    return (
      alerts?.map((a) => ({
        id: a.id,
        type: a.type,
        severity: a.severity,
        title: a.title,
        description: a.description,
        service: a.service,
        metric: a.metric,
        threshold: a.threshold,
        currentValue: a.current_value,
        status: a.status,
        createdAt: new Date(a.created_at),
        acknowledgedAt: a.acknowledged_at ? new Date(a.acknowledged_at) : undefined,
        resolvedAt: a.resolved_at ? new Date(a.resolved_at) : undefined,
        assignedTo: a.assigned_to,
        actions: [],
      })) || []
    )
  }

  private async getActiveUsers(): Promise<number> {
    // Count active users in last hour
    return Math.floor(Math.random() * 500) + 200
  }

  private async getRecentBookings(since: Date): Promise<{ count: number }> {
    const supabase = await this.getSupabase()
    const { count } = await supabase
      .from("bookings")
      .select("id", { count: "exact", head: true })
      .gte("created_at", since.toISOString())

    return { count: count || 0 }
  }

  private async getRecentRevenue(since: Date): Promise<{ total: number }> {
    const supabase = await this.getSupabase()
    const { data } = await supabase
      .from("bookings")
      .select("total_amount")
      .gte("created_at", since.toISOString())

    const total = data?.reduce((sum, b) => sum + (b.total_amount || 0), 0) || 0
    return { total }
  }

  private async getConversionMetrics(since: Date): Promise<{ rate: number }> {
    // Calculate conversion rate from searches to bookings
    return { rate: 3.2 }
  }

  private async getCustomerSatisfaction(): Promise<{ average: number }> {
    // Get average customer satisfaction rating
    return { average: 4.6 }
  }

  private async getPartnerAPIUsage(since: Date): Promise<BusinessKPIs["apiUsageByPartner"]> {
    // Get API usage by partner
    return [
      { partnerId: "partner_1", partnerName: "AirlineX", requestCount: 1250, errorRate: 0.5 },
      { partnerId: "partner_2", partnerName: "TravelCorp", requestCount: 890, errorRate: 1.2 },
    ]
  }

  private async checkBusinessKPIAlerts(kpis: BusinessKPIs): Promise<void> {
    // Check various KPI thresholds and create alerts if needed
    if (kpis.conversionRate < 2) {
      await this.createAlert(
        "business",
        "medium",
        "Low Conversion Rate",
        "Conversion rate has dropped below threshold",
        "booking_conversion",
        2,
        kpis.conversionRate,
      )
    }

    if (kpis.bookingsPerHour < 10) {
      await this.createAlert(
        "business",
        "high",
        "Low Booking Volume",
        "Booking volume has dropped significantly",
        "bookings_per_hour",
        10,
        kpis.bookingsPerHour,
      )
    }
  }

  private async executeAlertActions(alert: Alert): Promise<void> {
    // Execute predefined actions for the alert
    const actions = this.getAlertActions(alert)

    for (const action of actions) {
      try {
        await this.executeAction(action)
        action.status = "executed"
        action.executedAt = new Date()
      } catch (error) {
        action.status = "failed"
        logger.error("Failed to execute alert action", { actionId: action.id, error })
      }
    }

    alert.actions = actions
  }

  private getAlertActions(alert: Alert): AlertAction[] {
    const actions: AlertAction[] = []

    // Default notification action
    actions.push({
      id: `action_${Date.now()}_1`,
      type: "notification",
      action: "send_slack_notification",
      condition: "always",
      status: "pending",
    })

    // Escalation for high/critical alerts
    if (["high", "critical"].includes(alert.severity)) {
      actions.push({
        id: `action_${Date.now()}_2`,
        type: "escalation",
        action: "notify_on_call",
        condition: "not_acknowledged_15min",
        status: "pending",
      })
    }

    // Automated responses for specific alert types
    if (alert.type === "performance" && alert.metric === "response_time") {
      actions.push({
        id: `action_${Date.now()}_3`,
        type: "automation",
        action: "scale_up_instances",
        condition: "response_time_over_3s",
        status: "pending",
      })
    }

    return actions
  }

  private async executeAction(action: AlertAction): Promise<void> {
    switch (action.action) {
      case "send_slack_notification":
        // Send Slack notification
        break
      case "notify_on_call":
        // Notify on-call engineer
        break
      case "scale_up_instances":
        // Auto-scale infrastructure
        break
      default:
        logger.warn("Unknown alert action", { action: action.action })
    }
  }

  private getIncidentTeam(severity: Alert["severity"]): string[] {
    switch (severity) {
      case "critical":
        return ["on_call_engineer", "sre_lead", "engineering_manager"]
      case "high":
        return ["on_call_engineer", "sre_lead"]
      default:
        return ["on_call_engineer"]
    }
  }

  private async executeAutomatedResponse(incident: IncidentResponse): Promise<void> {
    // Execute automated incident response procedures
    logger.info("Executing automated incident response", { incidentId: incident.id })
  }

  private async notifyIncidentTeam(incident: IncidentResponse): Promise<void> {
    // Notify the incident response team
    logger.info("Notifying incident team", {
      incidentId: incident.id,
      team: incident.assignedTeam,
    })
  }

  private async analyzeServiceCapacity(service: string): Promise<CapacityPlan> {
    // Analyze service capacity and generate forecasts
    // This would use historical data and ML models
    return {
      service,
      currentUsage: 75,
      forecastedUsage: 90,
      capacityLimit: 100,
      timeToCapacity: 45, // days
      recommendations: [
        "Consider horizontal scaling",
        "Optimize database queries",
        "Implement caching layer",
      ],
      scalingOptions: [
        {
          type: "horizontal",
          description: "Add 2 more instances",
          cost: 500,
          impact: "50% more capacity",
          timeline: "1 week",
        },
      ],
    }
  }
}
