export interface PerformanceMetric {
  id: string
  name: string
  value: number
  unit: string
  timestamp: number
  tags: Record<string, string>
}

export interface ErrorEvent {
  id: string
  message: string
  stack: string
  level: "error" | "warning" | "info"
  userId?: string
  url: string
  userAgent: string
  timestamp: number
  resolved: boolean
}

export interface HealthCheck {
  service: string
  status: "healthy" | "degraded" | "unhealthy"
  responseTime: number
  lastCheck: number
  error?: string
}

export class PerformanceMonitor {
  private metrics: Map<string, PerformanceMetric[]> = new Map()
  private errors: ErrorEvent[] = []
  private healthChecks: Map<string, HealthCheck> = new Map()

  // Performance Monitoring
  recordMetric(name: string, value: number, unit = "ms", tags: Record<string, string> = {}): void {
    const metric: PerformanceMetric = {
      id: `${Date.now()}-${Math.random()}`,
      name,
      value,
      unit,
      timestamp: Date.now(),
      tags,
    }

    if (!this.metrics.has(name)) {
      this.metrics.set(name, [])
    }

    const metricHistory = this.metrics.get(name)!
    metricHistory.push(metric)

    // Keep only last 1000 metrics per type
    if (metricHistory.length > 1000) {
      metricHistory.shift()
    }

    // Send to database for persistence
    this.persistMetric(metric)
  }

  private async persistMetric(metric: PerformanceMetric): Promise<void> {
    try {
      const { createServiceRoleClient } = await import("@/lib/supabase/server")
      const supabase = createServiceRoleClient()

      await supabase.from("system_metrics").insert({
        metric_name: metric.name,
        metric_value: metric.value,
        metric_unit: metric.unit,
        tags: metric.tags,
        created_at: new Date(metric.timestamp).toISOString(),
      })
    } catch (error) {
      console.error("Failed to persist metric:", error)
    }
  }

  // Error Tracking
  recordError(error: Error, context: { userId?: string; url: string; userAgent: string }): void {
    const errorEvent: ErrorEvent = {
      id: `${Date.now()}-${Math.random()}`,
      message: error.message,
      stack: error.stack || "",
      level: "error",
      userId: context.userId,
      url: context.url,
      userAgent: context.userAgent,
      timestamp: Date.now(),
      resolved: false,
    }

    this.errors.push(errorEvent)

    // Keep only last 1000 errors
    if (this.errors.length > 1000) {
      this.errors.shift()
    }

    // Send to database and alerting system
    this.persistError(errorEvent)
    this.checkAlertThresholds(errorEvent)
  }

  private async persistError(error: ErrorEvent): Promise<void> {
    try {
      const { createServiceRoleClient } = await import("@/lib/supabase/server")
      const supabase = createServiceRoleClient()

      await supabase.from("error_logs").insert({
        message: error.message,
        stack: error.stack,
        level: error.level,
        user_id: error.userId,
        url: error.url,
        user_agent: error.userAgent,
        resolved: error.resolved,
        created_at: new Date(error.timestamp).toISOString(),
      })
    } catch (err) {
      console.error("Failed to persist error:", err)
    }
  }

  private checkAlertThresholds(error: ErrorEvent): void {
    const recentErrors = this.errors.filter((e) => Date.now() - e.timestamp < 5 * 60 * 1000) // Last 5 minutes

    if (recentErrors.length > 10) {
      this.sendAlert(
        "High error rate detected",
        `${recentErrors.length} errors in the last 5 minutes`,
      )
    }
  }

  // Health Checks
  async runHealthCheck(
    service: string,
    checkFunction: () => Promise<boolean>,
  ): Promise<HealthCheck> {
    const startTime = Date.now()

    try {
      const isHealthy = await checkFunction()
      const responseTime = Date.now() - startTime

      const healthCheck: HealthCheck = {
        service,
        status: isHealthy ? "healthy" : "unhealthy",
        responseTime,
        lastCheck: Date.now(),
      }

      this.healthChecks.set(service, healthCheck)
      await this.persistHealthCheck(healthCheck)

      return healthCheck
    } catch (error) {
      const responseTime = Date.now() - startTime
      const healthCheck: HealthCheck = {
        service,
        status: "unhealthy",
        responseTime,
        lastCheck: Date.now(),
        error: error instanceof Error ? error.message : "Unknown error",
      }

      this.healthChecks.set(service, healthCheck)
      await this.persistHealthCheck(healthCheck)

      return healthCheck
    }
  }

  private async persistHealthCheck(healthCheck: HealthCheck): Promise<void> {
    try {
      const { createServiceRoleClient } = await import("@/lib/supabase/server")
      const supabase = createServiceRoleClient()

      await supabase.from("health_checks").insert({
        service_name: healthCheck.service,
        status: healthCheck.status,
        response_time: healthCheck.responseTime,
        error_message: healthCheck.error,
        checked_at: new Date(healthCheck.lastCheck).toISOString(),
      })
    } catch (error) {
      console.error("Failed to persist health check:", error)
    }
  }

  // Alerting
  private async sendAlert(title: string, message: string): Promise<void> {
    try {
      const { createServiceRoleClient } = await import("@/lib/supabase/server")
      const supabase = createServiceRoleClient()

      // Get admin users to notify
      const { data: admins } = await supabase.from("profiles").select("id").eq("role", "admin")

      if (admins) {
        for (const admin of admins) {
          await supabase.from("notifications").insert({
            user_id: admin.id,
            title,
            message,
            type: "error",
            category: "system_alert",
          })
        }
      }
    } catch (error) {
      console.error("Failed to send alert:", error)
    }
  }

  // Analytics and Reporting
  getMetricsSummary(metricName: string, timeRange = 3600000): any {
    const metrics = this.metrics.get(metricName) || []
    const recentMetrics = metrics.filter((m) => Date.now() - m.timestamp < timeRange)

    if (recentMetrics.length === 0) {
      return null
    }

    const values = recentMetrics.map((m) => m.value)
    const sum = values.reduce((a, b) => a + b, 0)
    const avg = sum / values.length
    const min = Math.min(...values)
    const max = Math.max(...values)

    return {
      count: recentMetrics.length,
      average: avg,
      minimum: min,
      maximum: max,
      latest: values[values.length - 1],
    }
  }

  getErrorsSummary(timeRange = 3600000): any {
    const recentErrors = this.errors.filter((e) => Date.now() - e.timestamp < timeRange)

    const errorsByLevel = recentErrors.reduce(
      (acc, error) => {
        acc[error.level] = (acc[error.level] || 0) + 1
        return acc
      },
      {} as Record<string, number>,
    )

    return {
      total: recentErrors.length,
      byLevel: errorsByLevel,
      resolved: recentErrors.filter((e) => e.resolved).length,
      unresolved: recentErrors.filter((e) => !e.resolved).length,
    }
  }

  getAllHealthChecks(): HealthCheck[] {
    return Array.from(this.healthChecks.values())
  }

  // System Resource Monitoring
  async collectSystemMetrics(): Promise<void> {
    try {
      // CPU Usage (simulated - in production, use actual system metrics)
      const cpuUsage = Math.random() * 100
      this.recordMetric("cpu_usage", cpuUsage, "%", { type: "system" })

      // Memory Usage (simulated)
      const memoryUsage = Math.random() * 100
      this.recordMetric("memory_usage", memoryUsage, "%", { type: "system" })

      // Disk Usage (simulated)
      const diskUsage = Math.random() * 100
      this.recordMetric("disk_usage", diskUsage, "%", { type: "system" })

      // Network Latency (simulated)
      const networkLatency = Math.random() * 100 + 10
      this.recordMetric("network_latency", networkLatency, "ms", { type: "network" })

      // Active Users Count
      const { createServiceRoleClient } = await import("@/lib/supabase/server")
      const supabase = createServiceRoleClient()

      const { data: activeSessions } = await supabase
        .from("user_sessions")
        .select("id")
        .eq("is_active", true)
        .gte("last_activity", new Date(Date.now() - 30 * 60 * 1000).toISOString()) // Active in last 30 minutes

      const activeUsers = activeSessions?.length || 0
      this.recordMetric("active_users", activeUsers, "count", { type: "users" })

      // Database Connections
      const { data: connections } = await supabase.rpc("get_active_connections")
      const dbConnections = connections?.length || 0
      this.recordMetric("database_connections", dbConnections, "count", { type: "database" })
    } catch (error) {
      console.error("Failed to collect system metrics:", error)
    }
  }

  // Start monitoring
  startMonitoring(): void {
    // Collect system metrics every 30 seconds
    setInterval(() => {
      this.collectSystemMetrics()
    }, 30000)

    // Run health checks every 2 minutes
    setInterval(() => {
      this.runHealthChecks()
    }, 120000)
  }

  private async runHealthChecks(): Promise<void> {
    // Database health check
    await this.runHealthCheck("database", async () => {
      const { createServiceRoleClient } = await import("@/lib/supabase/server")
      const supabase = createServiceRoleClient()
      const { error } = await supabase.from("profiles").select("id").limit(1)
      return !error
    })

    // API health check
    await this.runHealthCheck("api", async () => {
      try {
        const response = await fetch("/api/health")
        return response.ok
      } catch {
        return false
      }
    })

    // External services health checks would go here
  }
}

// Global instance
export const performanceMonitor = new PerformanceMonitor()
