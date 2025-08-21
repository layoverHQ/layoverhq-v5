/**
 * Enterprise Monitoring System for LayoverHQ
 *
 * Comprehensive monitoring solution providing:
 * - Real-time performance metrics
 * - Automated alerting and escalation
 * - Capacity planning and forecasting
 * - SLA monitoring and reporting
 * - Multi-tenant performance isolation tracking
 */

import { getConnectionPoolManager } from "@/lib/database/connection-pool-manager"
import { getEnterpriseCacheManager } from "@/lib/cache/enterprise-cache-manager"
import { getConfigManager } from "@/lib/services/config-manager"

export interface MonitoringConfig {
  // Collection settings
  metricsCollectionInterval: number // seconds
  retentionPeriods: {
    realtime: number // minutes
    shortTerm: number // hours
    longTerm: number // days
  }

  // Performance thresholds
  thresholds: {
    responseTime: {
      warning: number // ms
      critical: number // ms
    }
    errorRate: {
      warning: number // percentage
      critical: number // percentage
    }
    cpuUsage: {
      warning: number // percentage
      critical: number // percentage
    }
    memoryUsage: {
      warning: number // percentage
      critical: number // percentage
    }
    diskUsage: {
      warning: number // percentage
      critical: number // percentage
    }
    connectionPoolUsage: {
      warning: number // percentage
      critical: number // percentage
    }
  }

  // Alerting configuration
  alerting: {
    enabled: boolean
    channels: AlertChannel[]
    escalationRules: EscalationRule[]
    suppressionRules: SuppressionRule[]
  }

  // SLA configuration
  slaTargets: {
    availability: number // percentage (99.99%)
    responseTime: number // ms (50ms average)
    errorRate: number // percentage (0.1%)
  }

  // Capacity planning
  capacityPlanning: {
    enabled: boolean
    forecastDays: number
    growthModels: string[]
  }
}

export interface Metric {
  id: string
  name: string
  value: number
  unit: string
  timestamp: Date
  tags: Record<string, string>
  labels: Record<string, string>
}

export interface Alert {
  id: string
  severity: "info" | "warning" | "critical"
  title: string
  description: string
  source: string
  metric: string
  threshold: number
  currentValue: number
  startTime: Date
  acknowledgedAt?: Date
  resolvedAt?: Date
  escalationLevel: number
  tags: Record<string, string>
}

export interface AlertChannel {
  type: "email" | "slack" | "webhook" | "pagerduty" | "sms"
  config: Record<string, any>
  severityFilter: string[]
  enabled: boolean
}

export interface EscalationRule {
  id: string
  name: string
  conditions: string[]
  escalationDelay: number // minutes
  targetChannels: string[]
  maxEscalations: number
}

export interface SuppressionRule {
  id: string
  name: string
  conditions: string[]
  duration: number // minutes
  reason: string
}

export interface PerformanceReport {
  period: {
    start: Date
    end: Date
  }
  summary: {
    availability: number
    averageResponseTime: number
    errorRate: number
    totalRequests: number
    uniqueUsers: number
  }
  slaCompliance: {
    availability: { target: number; actual: number; compliant: boolean }
    responseTime: { target: number; actual: number; compliant: boolean }
    errorRate: { target: number; actual: number; compliant: boolean }
  }
  trends: {
    metric: string
    trend: "increasing" | "decreasing" | "stable"
    changePercent: number
  }[]
  alerts: {
    total: number
    bySeverity: Record<string, number>
    topSources: Array<{ source: string; count: number }>
  }
  recommendations: string[]
}

export interface CapacityForecast {
  metric: string
  currentUsage: number
  projectedUsage: {
    days30: number
    days60: number
    days90: number
  }
  capacityLimit: number
  estimatedFullCapacityDate?: Date
  recommendations: string[]
  confidence: number
}

class EnterpriseMonitoringSystem {
  private connectionPool = getConnectionPoolManager()
  private cacheManager = getEnterpriseCacheManager()
  private configManager = getConfigManager()

  private metrics: Map<string, Metric[]> = new Map()
  private activeAlerts: Map<string, Alert> = new Map()
  private isCollecting = false

  private readonly DEFAULT_CONFIG: MonitoringConfig = {
    metricsCollectionInterval: 30,
    retentionPeriods: {
      realtime: 60, // 1 hour
      shortTerm: 24, // 24 hours
      longTerm: 90, // 90 days
    },
    thresholds: {
      responseTime: { warning: 100, critical: 500 },
      errorRate: { warning: 1, critical: 5 },
      cpuUsage: { warning: 75, critical: 90 },
      memoryUsage: { warning: 80, critical: 95 },
      diskUsage: { warning: 80, critical: 95 },
      connectionPoolUsage: { warning: 75, critical: 90 },
    },
    alerting: {
      enabled: true,
      channels: [
        { type: "email", config: {}, severityFilter: ["warning", "critical"], enabled: true },
        { type: "slack", config: {}, severityFilter: ["critical"], enabled: true },
      ],
      escalationRules: [],
      suppressionRules: [],
    },
    slaTargets: {
      availability: 99.99,
      responseTime: 50,
      errorRate: 0.1,
    },
    capacityPlanning: {
      enabled: true,
      forecastDays: 90,
      growthModels: ["linear", "exponential"],
    },
  }

  /**
   * Initialize the monitoring system
   */
  async initialize(config?: Partial<MonitoringConfig>): Promise<void> {
    try {
      const finalConfig = { ...this.DEFAULT_CONFIG, ...config }

      // Set up monitoring tables
      await this.setupMonitoringTables()

      // Start metrics collection
      await this.startMetricsCollection(finalConfig)

      // Initialize alerting system
      await this.initializeAlerting(finalConfig)

      // Set up automated reporting
      await this.setupAutomatedReporting()

      console.log("Enterprise monitoring system initialized successfully")
    } catch (error) {
      console.error("Failed to initialize monitoring system:", error)
      throw error
    }
  }

  /**
   * Collect comprehensive system metrics
   */
  async collectMetrics(): Promise<Metric[]> {
    const timestamp = new Date()
    const metrics: Metric[] = []

    try {
      // Database metrics
      const dbMetrics = await this.collectDatabaseMetrics(timestamp)
      metrics.push(...dbMetrics)

      // Cache metrics
      const cacheMetrics = await this.collectCacheMetrics(timestamp)
      metrics.push(...cacheMetrics)

      // API performance metrics
      const apiMetrics = await this.collectApiMetrics(timestamp)
      metrics.push(...apiMetrics)

      // System resource metrics
      const systemMetrics = await this.collectSystemMetrics(timestamp)
      metrics.push(...systemMetrics)

      // Business metrics
      const businessMetrics = await this.collectBusinessMetrics(timestamp)
      metrics.push(...businessMetrics)

      // Store metrics in database
      await this.storeMetrics(metrics)

      // Check thresholds and generate alerts
      await this.checkThresholds(metrics)

      return metrics
    } catch (error) {
      console.error("Error collecting metrics:", error)
      return []
    }
  }

  /**
   * Generate comprehensive performance report
   */
  async generatePerformanceReport(
    startDate: Date,
    endDate: Date,
    options: {
      includeDetails?: boolean
      tenantId?: string
      format?: "json" | "pdf" | "csv"
    } = {},
  ): Promise<PerformanceReport> {
    const { includeDetails = true, tenantId, format = "json" } = options

    try {
      const client = await this.connectionPool.getConnection("analytics")

      // Get summary metrics
      const summaryQuery = `
        SELECT 
          COUNT(*) as total_requests,
          AVG(response_time_ms) as avg_response_time,
          COUNT(CASE WHEN response_status >= 400 THEN 1 END)::float / COUNT(*) * 100 as error_rate,
          COUNT(DISTINCT user_id) as unique_users
        FROM api_usage_logs 
        WHERE timestamp BETWEEN $1 AND $2
        ${tenantId ? "AND enterprise_id = $3" : ""}
      `

      const summaryParams = tenantId ? [startDate, endDate, tenantId] : [startDate, endDate]
      const summaryResult = await client.query(summaryQuery, summaryParams)
      const summary = summaryResult.rows[0]

      // Calculate availability
      const availabilityQuery = `
        SELECT 
          (1 - COUNT(CASE WHEN response_status >= 500 THEN 1 END)::float / COUNT(*)) * 100 as availability
        FROM api_usage_logs 
        WHERE timestamp BETWEEN $1 AND $2
        ${tenantId ? "AND enterprise_id = $3" : ""}
      `

      const availabilityResult = await client.query(availabilityQuery, summaryParams)
      const availability = availabilityResult.rows[0]?.availability || 0

      // Get alerts for the period
      const alertsQuery = `
        SELECT severity, COUNT(*) as count
        FROM monitoring_alerts 
        WHERE start_time BETWEEN $1 AND $2
        GROUP BY severity
      `

      const alertsResult = await client.query(alertsQuery, [startDate, endDate])
      const alertsBySeverity = alertsResult.rows.reduce((acc, row) => {
        acc[row.severity] = parseInt(row.count)
        return acc
      }, {})

      client.release()

      // Calculate SLA compliance
      const slaCompliance = {
        availability: {
          target: this.DEFAULT_CONFIG.slaTargets.availability,
          actual: availability,
          compliant: availability >= this.DEFAULT_CONFIG.slaTargets.availability,
        },
        responseTime: {
          target: this.DEFAULT_CONFIG.slaTargets.responseTime,
          actual: summary.avg_response_time,
          compliant: summary.avg_response_time <= this.DEFAULT_CONFIG.slaTargets.responseTime,
        },
        errorRate: {
          target: this.DEFAULT_CONFIG.slaTargets.errorRate,
          actual: summary.error_rate,
          compliant: summary.error_rate <= this.DEFAULT_CONFIG.slaTargets.errorRate,
        },
      }

      // Generate recommendations
      const recommendations = await this.generateRecommendations(summary, slaCompliance)

      const report: PerformanceReport = {
        period: { start: startDate, end: endDate },
        summary: {
          availability,
          averageResponseTime: summary.avg_response_time,
          errorRate: summary.error_rate,
          totalRequests: summary.total_requests,
          uniqueUsers: summary.unique_users,
        },
        slaCompliance,
        trends: await this.calculateTrends(startDate, endDate, tenantId),
        alerts: {
          total: Object.values(alertsBySeverity).reduce(
            (sum: number, count: unknown) => sum + (count as number),
            0,
          ) as number,
          bySeverity: alertsBySeverity,
          topSources: await this.getTopAlertSources(startDate, endDate),
        },
        recommendations,
      }

      return report
    } catch (error) {
      console.error("Error generating performance report:", error)
      throw error
    }
  }

  /**
   * Generate capacity forecasts
   */
  async generateCapacityForecast(
    metrics: string[] = ["cpu_usage", "memory_usage", "disk_usage", "connections"],
  ): Promise<CapacityForecast[]> {
    try {
      const forecasts: CapacityForecast[] = []

      for (const metric of metrics) {
        const forecast = await this.forecastMetric(metric)
        forecasts.push(forecast)
      }

      return forecasts
    } catch (error) {
      console.error("Error generating capacity forecast:", error)
      return []
    }
  }

  /**
   * Get real-time dashboard data
   */
  async getDashboardData(tenantId?: string): Promise<{
    overview: Record<string, number>
    activeAlerts: Alert[]
    recentMetrics: Metric[]
    healthChecks: Record<string, "healthy" | "warning" | "critical">
  }> {
    try {
      // Get overview metrics
      const overview = await this.getOverviewMetrics(tenantId)

      // Get active alerts
      const activeAlerts = Array.from(this.activeAlerts.values())
        .filter((alert) => !alert.resolvedAt)
        .sort((a, b) => b.startTime.getTime() - a.startTime.getTime())

      // Get recent metrics
      const recentMetrics = await this.getRecentMetrics(tenantId)

      // Perform health checks
      const healthChecks = await this.performHealthChecks()

      return {
        overview,
        activeAlerts,
        recentMetrics,
        healthChecks,
      }
    } catch (error) {
      console.error("Error getting dashboard data:", error)
      return {
        overview: {},
        activeAlerts: [],
        recentMetrics: [],
        healthChecks: {},
      }
    }
  }

  /**
   * Acknowledge an alert
   */
  async acknowledgeAlert(alertId: string, userId: string, note?: string): Promise<void> {
    try {
      const alert = this.activeAlerts.get(alertId)
      if (!alert) {
        throw new Error(`Alert ${alertId} not found`)
      }

      alert.acknowledgedAt = new Date()

      // Update in database
      const client = await this.connectionPool.getConnection("main")
      await client.query(
        "UPDATE monitoring_alerts SET acknowledged_at = $1, acknowledged_by = $2, acknowledgment_note = $3 WHERE id = $4",
        [alert.acknowledgedAt, userId, note, alertId],
      )
      client.release()

      console.log(`Alert ${alertId} acknowledged by ${userId}`)
    } catch (error) {
      console.error(`Error acknowledging alert ${alertId}:`, error)
      throw error
    }
  }

  /**
   * Private helper methods
   */

  private async setupMonitoringTables(): Promise<void> {
    const client = await this.connectionPool.getConnection("main")

    try {
      // Metrics storage table
      await client.query(`
        CREATE TABLE IF NOT EXISTS monitoring_metrics (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          metric_name VARCHAR(255) NOT NULL,
          metric_value NUMERIC NOT NULL,
          unit VARCHAR(50),
          tags JSONB DEFAULT '{}',
          labels JSONB DEFAULT '{}',
          timestamp TIMESTAMPTZ NOT NULL,
          tenant_id UUID,
          created_at TIMESTAMPTZ DEFAULT NOW()
        ) PARTITION BY RANGE (timestamp)
      `)

      // Alerts table
      await client.query(`
        CREATE TABLE IF NOT EXISTS monitoring_alerts (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          severity VARCHAR(20) NOT NULL,
          title VARCHAR(255) NOT NULL,
          description TEXT,
          source VARCHAR(100) NOT NULL,
          metric VARCHAR(255) NOT NULL,
          threshold NUMERIC,
          current_value NUMERIC,
          start_time TIMESTAMPTZ NOT NULL,
          acknowledged_at TIMESTAMPTZ,
          acknowledged_by UUID,
          acknowledgment_note TEXT,
          resolved_at TIMESTAMPTZ,
          escalation_level INTEGER DEFAULT 0,
          tags JSONB DEFAULT '{}',
          created_at TIMESTAMPTZ DEFAULT NOW()
        )
      `)

      // SLA tracking table
      await client.query(`
        CREATE TABLE IF NOT EXISTS sla_tracking (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          tenant_id UUID,
          period_start TIMESTAMPTZ NOT NULL,
          period_end TIMESTAMPTZ NOT NULL,
          availability_target NUMERIC NOT NULL,
          availability_actual NUMERIC NOT NULL,
          response_time_target NUMERIC NOT NULL,
          response_time_actual NUMERIC NOT NULL,
          error_rate_target NUMERIC NOT NULL,
          error_rate_actual NUMERIC NOT NULL,
          sla_breaches JSONB DEFAULT '[]',
          created_at TIMESTAMPTZ DEFAULT NOW()
        )
      `)

      // Create indexes
      await client.query(
        "CREATE INDEX IF NOT EXISTS idx_monitoring_metrics_name_timestamp ON monitoring_metrics(metric_name, timestamp)",
      )
      await client.query(
        "CREATE INDEX IF NOT EXISTS idx_monitoring_metrics_tenant_timestamp ON monitoring_metrics(tenant_id, timestamp)",
      )
      await client.query(
        "CREATE INDEX IF NOT EXISTS idx_monitoring_alerts_severity_start_time ON monitoring_alerts(severity, start_time)",
      )
      await client.query(
        "CREATE INDEX IF NOT EXISTS idx_monitoring_alerts_resolved ON monitoring_alerts(resolved_at) WHERE resolved_at IS NULL",
      )
    } finally {
      client.release()
    }
  }

  private async startMetricsCollection(config: MonitoringConfig): Promise<void> {
    if (this.isCollecting) return

    this.isCollecting = true

    const collectAndStore = async () => {
      try {
        await this.collectMetrics()
      } catch (error) {
        console.error("Metrics collection error:", error)
      }
    }

    // Start immediate collection
    await collectAndStore()

    // Schedule regular collection
    setInterval(collectAndStore, config.metricsCollectionInterval * 1000)

    console.log(`Metrics collection started with ${config.metricsCollectionInterval}s interval`)
  }

  private async collectDatabaseMetrics(timestamp: Date): Promise<Metric[]> {
    const metrics: Metric[] = []

    try {
      const client = await this.connectionPool.getConnection("analytics")

      // Connection pool metrics
      const poolMetrics = this.connectionPool.getPoolMetrics()
      if (poolMetrics instanceof Map) {
        for (const [poolName, poolMetric] of poolMetrics) {
          metrics.push({
            id: `db_connections_${poolName}_${timestamp.getTime()}`,
            name: "database_connections",
            value: poolMetric.activeConnections,
            unit: "count",
            timestamp,
            tags: { pool: poolName, type: "active" },
            labels: {},
          })
        }
      }

      // Query performance metrics
      const queryStatsResult = await client.query(`
        SELECT 
          calls,
          total_exec_time,
          mean_exec_time,
          max_exec_time
        FROM pg_stat_statements 
        WHERE calls > 100
        ORDER BY total_exec_time DESC 
        LIMIT 10
      `)

      if (queryStatsResult.rows.length > 0) {
        const avgQueryTime =
          queryStatsResult.rows.reduce((sum, row) => sum + row.mean_exec_time, 0) /
          queryStatsResult.rows.length

        metrics.push({
          id: `avg_query_time_${timestamp.getTime()}`,
          name: "average_query_time",
          value: avgQueryTime,
          unit: "milliseconds",
          timestamp,
          tags: { source: "pg_stat_statements" },
          labels: {},
        })
      }

      // Cache hit ratio
      const cacheHitResult = await client.query(`
        SELECT round(100 * sum(blks_hit) / sum(blks_hit + blks_read), 2) as cache_hit_ratio
        FROM pg_stat_database WHERE datname = current_database()
      `)

      if (cacheHitResult.rows[0]?.cache_hit_ratio) {
        metrics.push({
          id: `cache_hit_ratio_${timestamp.getTime()}`,
          name: "cache_hit_ratio",
          value: parseFloat(cacheHitResult.rows[0].cache_hit_ratio),
          unit: "percent",
          timestamp,
          tags: { type: "database" },
          labels: {},
        })
      }

      client.release()
    } catch (error) {
      console.error("Error collecting database metrics:", error)
    }

    return metrics
  }

  private async collectCacheMetrics(timestamp: Date): Promise<Metric[]> {
    const metrics: Metric[] = []

    try {
      const cacheAnalytics = await this.cacheManager.getAnalytics()

      metrics.push({
        id: `cache_hit_ratio_${timestamp.getTime()}`,
        name: "cache_hit_ratio",
        value: cacheAnalytics.overall.hitRatio,
        unit: "percent",
        timestamp,
        tags: { type: "redis", level: "all" },
        labels: {},
      })

      metrics.push({
        id: `cache_operations_${timestamp.getTime()}`,
        name: "cache_operations",
        value: cacheAnalytics.overall.operations,
        unit: "count",
        timestamp,
        tags: { type: "redis" },
        labels: {},
      })
    } catch (error) {
      console.error("Error collecting cache metrics:", error)
    }

    return metrics
  }

  private async collectApiMetrics(timestamp: Date): Promise<Metric[]> {
    const metrics: Metric[] = []

    try {
      const client = await this.connectionPool.getConnection("analytics")

      // API response times
      const responseTimeResult = await client.query(`
        SELECT 
          AVG(response_time_ms) as avg_response_time,
          PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY response_time_ms) as p95_response_time,
          COUNT(*) as request_count
        FROM api_usage_logs 
        WHERE timestamp > NOW() - INTERVAL '5 minutes'
      `)

      if (responseTimeResult.rows[0]) {
        const row = responseTimeResult.rows[0]

        metrics.push({
          id: `avg_response_time_${timestamp.getTime()}`,
          name: "average_response_time",
          value: parseFloat(row.avg_response_time || 0),
          unit: "milliseconds",
          timestamp,
          tags: { source: "api" },
          labels: {},
        })

        metrics.push({
          id: `p95_response_time_${timestamp.getTime()}`,
          name: "p95_response_time",
          value: parseFloat(row.p95_response_time || 0),
          unit: "milliseconds",
          timestamp,
          tags: { source: "api" },
          labels: {},
        })

        metrics.push({
          id: `api_requests_${timestamp.getTime()}`,
          name: "api_requests",
          value: parseInt(row.request_count || 0),
          unit: "count",
          timestamp,
          tags: { period: "5min" },
          labels: {},
        })
      }

      client.release()
    } catch (error) {
      console.error("Error collecting API metrics:", error)
    }

    return metrics
  }

  private async collectSystemMetrics(timestamp: Date): Promise<Metric[]> {
    const metrics: Metric[] = []

    try {
      // Database size
      const client = await this.connectionPool.getConnection("main")
      const sizeResult = await client.query("SELECT pg_database_size(current_database()) as size")

      if (sizeResult.rows[0]) {
        metrics.push({
          id: `database_size_${timestamp.getTime()}`,
          name: "database_size",
          value: parseInt(sizeResult.rows[0].size),
          unit: "bytes",
          timestamp,
          tags: { type: "storage" },
          labels: {},
        })
      }

      client.release()
    } catch (error) {
      console.error("Error collecting system metrics:", error)
    }

    return metrics
  }

  private async collectBusinessMetrics(timestamp: Date): Promise<Metric[]> {
    const metrics: Metric[] = []

    try {
      const client = await this.connectionPool.getConnection("analytics")

      // Active users
      const activeUsersResult = await client.query(`
        SELECT COUNT(DISTINCT user_id) as active_users
        FROM api_usage_logs 
        WHERE timestamp > NOW() - INTERVAL '1 hour'
      `)

      if (activeUsersResult.rows[0]) {
        metrics.push({
          id: `active_users_${timestamp.getTime()}`,
          name: "active_users",
          value: parseInt(activeUsersResult.rows[0].active_users),
          unit: "count",
          timestamp,
          tags: { period: "1hour" },
          labels: {},
        })
      }

      client.release()
    } catch (error) {
      console.error("Error collecting business metrics:", error)
    }

    return metrics
  }

  private async storeMetrics(metrics: Metric[]): Promise<void> {
    if (metrics.length === 0) return

    try {
      const client = await this.connectionPool.getConnection("main")

      const values = metrics
        .map((metric, index) => {
          const offset = index * 7
          return `($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5}, $${offset + 6}, $${offset + 7})`
        })
        .join(", ")

      const params = metrics.flatMap((metric) => [
        metric.name,
        metric.value,
        metric.unit,
        JSON.stringify(metric.tags),
        JSON.stringify(metric.labels),
        metric.timestamp,
        metric.tags.tenant_id || null,
      ])

      await client.query(
        `
        INSERT INTO monitoring_metrics 
        (metric_name, metric_value, unit, tags, labels, timestamp, tenant_id)
        VALUES ${values}
      `,
        params,
      )

      client.release()
    } catch (error) {
      console.error("Error storing metrics:", error)
    }
  }

  private async checkThresholds(metrics: Metric[]): Promise<void> {
    for (const metric of metrics) {
      await this.evaluateMetricThresholds(metric)
    }
  }

  private async evaluateMetricThresholds(metric: Metric): Promise<void> {
    // Implementation would check metric against configured thresholds
    // and create alerts if thresholds are breached
  }

  // Additional helper methods would be implemented here...
  private async initializeAlerting(config: MonitoringConfig): Promise<void> {}
  private async setupAutomatedReporting(): Promise<void> {}
  private async generateRecommendations(summary: any, slaCompliance: any): Promise<string[]> {
    return []
  }
  private async calculateTrends(startDate: Date, endDate: Date, tenantId?: string): Promise<any[]> {
    return []
  }
  private async getTopAlertSources(
    startDate: Date,
    endDate: Date,
  ): Promise<Array<{ source: string; count: number }>> {
    return []
  }
  private async forecastMetric(metric: string): Promise<CapacityForecast> {
    return {
      metric,
      currentUsage: 0,
      projectedUsage: { days30: 0, days60: 0, days90: 0 },
      capacityLimit: 100,
      recommendations: [],
      confidence: 0.8,
    }
  }
  private async getOverviewMetrics(tenantId?: string): Promise<Record<string, number>> {
    return {}
  }
  private async getRecentMetrics(tenantId?: string): Promise<Metric[]> {
    return []
  }
  private async performHealthChecks(): Promise<Record<string, "healthy" | "warning" | "critical">> {
    return {}
  }
}

// Singleton instance
let enterpriseMonitoringSystemInstance: EnterpriseMonitoringSystem | null = null

export function getEnterpriseMonitoringSystem(): EnterpriseMonitoringSystem {
  if (!enterpriseMonitoringSystemInstance) {
    enterpriseMonitoringSystemInstance = new EnterpriseMonitoringSystem()
  }
  return enterpriseMonitoringSystemInstance
}

export default EnterpriseMonitoringSystem
