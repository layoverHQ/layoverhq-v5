import { createClient } from "@/lib/supabase/server"
import { eventBus, EventTypes } from "./event-system"

export interface MetricData {
  name: string
  value: number
  unit: string
  tags?: Record<string, string>
  timestamp?: Date
}

export interface LogEntry {
  level: "debug" | "info" | "warn" | "error" | "fatal"
  message: string
  service: string
  metadata?: Record<string, any>
  userId?: string
  requestId?: string
  timestamp?: Date
  stack?: string
}

export interface Alert {
  id?: string
  name: string
  condition: string
  threshold: number
  severity: "low" | "medium" | "high" | "critical"
  isActive: boolean
  lastTriggered?: Date
  description?: string
}

export interface HealthCheck {
  service: string
  status: "healthy" | "degraded" | "unhealthy"
  responseTime: number
  lastCheck: Date
  details?: Record<string, any>
}

export class MonitoringService {
  private metrics = new Map<string, MetricData[]>()
  private alerts = new Map<string, Alert>()
  private healthChecks = new Map<string, HealthCheck>()

  // Collect metric
  async collectMetric(metric: MetricData): Promise<void> {
    try {
      const key = `${metric.name}:${JSON.stringify(metric.tags || {})}`
      const timestamp = metric.timestamp || new Date()

      // Store in memory for quick access
      if (!this.metrics.has(key)) {
        this.metrics.set(key, [])
      }

      const metricHistory = this.metrics.get(key)!
      metricHistory.push({ ...metric, timestamp })

      // Keep only last 1000 data points in memory
      if (metricHistory.length > 1000) {
        metricHistory.shift()
      }

      // Persist to database
      const supabase = await createClient()
      await supabase.from("system_metrics").insert({
        service_name: metric.tags?.service || "unknown",
        metric_type: metric.name,
        value: metric.value,
        unit: metric.unit,
        tags: metric.tags || {},
        timestamp: timestamp.toISOString(),
      })

      // Check alerts
      await this.checkAlerts(metric)
    } catch (error) {
      console.error("Failed to collect metric:", error)
    }
  }

  // Log entry
  async log(entry: LogEntry): Promise<void> {
    try {
      const timestamp = entry.timestamp || new Date()
      const supabase = await createClient()

      await supabase.from("system_logs").insert({
        level: entry.level,
        service: entry.service,
        message: entry.message,
        metadata: entry.metadata || {},
        user_id: entry.userId,
        ip_address: entry.metadata?.ipAddress,
        timestamp: timestamp.toISOString(),
      })

      // Trigger alerts for error logs
      if (entry.level === "error" || entry.level === "fatal") {
        await this.triggerErrorAlert(entry)
      }

      // Console output for development
      if (process.env.NODE_ENV === "development") {
        const logMethod =
          entry.level === "error" || entry.level === "fatal" ? console.error : console.log
        logMethod(
          `[${entry.level.toUpperCase()}] ${entry.service}: ${entry.message}`,
          entry.metadata,
        )
      }
    } catch (error) {
      console.error("Failed to log entry:", error)
    }
  }

  // Register alert
  registerAlert(alert: Alert): void {
    this.alerts.set(alert.name, alert)
  }

  // Check alerts against metric
  private async checkAlerts(metric: MetricData): Promise<void> {
    for (const [name, alert] of this.alerts.entries()) {
      if (!alert.isActive) continue

      const shouldTrigger = this.evaluateAlertCondition(alert, metric)

      if (shouldTrigger) {
        await this.triggerAlert(alert, metric)
      }
    }
  }

  // Evaluate alert condition
  private evaluateAlertCondition(alert: Alert, metric: MetricData): boolean {
    // Simple condition evaluation - can be extended with more complex logic
    switch (alert.condition) {
      case "greater_than":
        return metric.value > alert.threshold
      case "less_than":
        return metric.value < alert.threshold
      case "equals":
        return metric.value === alert.threshold
      default:
        return false
    }
  }

  // Trigger alert
  private async triggerAlert(alert: Alert, metric: MetricData): Promise<void> {
    try {
      const now = new Date()

      // Rate limiting - don't trigger same alert within 5 minutes
      if (alert.lastTriggered && now.getTime() - alert.lastTriggered.getTime() < 5 * 60 * 1000) {
        return
      }

      alert.lastTriggered = now

      // Store alert in database
      const supabase = await createClient()
      await supabase.from("alerts").insert({
        name: alert.name,
        severity: alert.severity,
        condition: alert.condition,
        threshold: alert.threshold,
        current_value: metric.value,
        metric_name: metric.name,
        triggered_at: now.toISOString(),
        status: "active",
        description: alert.description,
      })

      // Publish alert event
      await eventBus.publish({
        type: EventTypes.SYSTEM_ALERT,
        source: "monitoring-service",
        data: {
          alert: alert.name,
          severity: alert.severity,
          metric: metric.name,
          value: metric.value,
          threshold: alert.threshold,
          description: alert.description,
        },
      })

      console.warn(
        `ALERT TRIGGERED: ${alert.name} - ${metric.name}: ${metric.value} ${metric.unit}`,
      )
    } catch (error) {
      console.error("Failed to trigger alert:", error)
    }
  }

  // Trigger error alert
  private async triggerErrorAlert(entry: LogEntry): Promise<void> {
    await eventBus.publish({
      type: EventTypes.SYSTEM_ALERT,
      source: "monitoring-service",
      data: {
        alert: "error_log",
        severity: entry.level === "fatal" ? "critical" : "high",
        service: entry.service,
        message: entry.message,
        metadata: entry.metadata,
      },
    })
  }

  // Perform health check
  async performHealthCheck(
    service: string,
    checkFunction: () => Promise<HealthCheck>,
  ): Promise<HealthCheck> {
    try {
      const startTime = Date.now()
      const result = await checkFunction()
      const responseTime = Date.now() - startTime

      const healthCheck: HealthCheck = {
        ...result,
        service,
        responseTime,
        lastCheck: new Date(),
      }

      this.healthChecks.set(service, healthCheck)

      // Store in database
      const supabase = await createClient()
      await supabase.from("health_checks").insert({
        service_name: service,
        status: healthCheck.status,
        response_time: responseTime,
        details: healthCheck.details || {},
        checked_at: healthCheck.lastCheck.toISOString(),
      })

      // Collect metric
      await this.collectMetric({
        name: "health_check_response_time",
        value: responseTime,
        unit: "ms",
        tags: { service },
      })

      return healthCheck
    } catch (error) {
      const healthCheck: HealthCheck = {
        service,
        status: "unhealthy",
        responseTime: -1,
        lastCheck: new Date(),
        details: { error: error instanceof Error ? error.message : "Unknown error" },
      }

      this.healthChecks.set(service, healthCheck)
      return healthCheck
    }
  }

  // Get metrics
  getMetrics(name?: string, tags?: Record<string, string>): MetricData[] {
    if (!name) {
      return Array.from(this.metrics.values()).flat()
    }

    const key = `${name}:${JSON.stringify(tags || {})}`
    return this.metrics.get(key) || []
  }

  // Get health status
  getHealthStatus(): Record<string, HealthCheck> {
    return Object.fromEntries(this.healthChecks.entries())
  }

  // Get active alerts
  getActiveAlerts(): Alert[] {
    return Array.from(this.alerts.values()).filter((alert) => alert.isActive)
  }

  // Performance monitoring
  async measurePerformance<T>(
    operation: string,
    fn: () => Promise<T>,
    tags?: Record<string, string>,
  ): Promise<T> {
    const startTime = Date.now()
    const startMemory = process.memoryUsage()

    try {
      const result = await fn()
      const duration = Date.now() - startTime
      const endMemory = process.memoryUsage()

      // Collect performance metrics
      await this.collectMetric({
        name: "operation_duration",
        value: duration,
        unit: "ms",
        tags: { operation, ...tags },
      })

      await this.collectMetric({
        name: "memory_usage_delta",
        value: endMemory.heapUsed - startMemory.heapUsed,
        unit: "bytes",
        tags: { operation, ...tags },
      })

      return result
    } catch (error) {
      const duration = Date.now() - startTime

      await this.collectMetric({
        name: "operation_error",
        value: 1,
        unit: "count",
        tags: { operation, error: error instanceof Error ? error.name : "unknown", ...tags },
      })

      await this.log({
        level: "error",
        service: "performance-monitor",
        message: `Operation ${operation} failed after ${duration}ms`,
        metadata: {
          operation,
          duration,
          error: error instanceof Error ? error.message : "Unknown error",
          stack: error instanceof Error ? error.stack : undefined,
          ...tags,
        },
      })

      throw error
    }
  }
}

// Global monitoring service instance
export const monitoring = new MonitoringService()

// Register default alerts
monitoring.registerAlert({
  name: "high_response_time",
  condition: "greater_than",
  threshold: 1000,
  severity: "medium",
  isActive: true,
  description: "API response time is too high",
})

monitoring.registerAlert({
  name: "high_error_rate",
  condition: "greater_than",
  threshold: 5,
  severity: "high",
  isActive: true,
  description: "Error rate is above acceptable threshold",
})

monitoring.registerAlert({
  name: "low_memory",
  condition: "less_than",
  threshold: 100 * 1024 * 1024, // 100MB
  severity: "critical",
  isActive: true,
  description: "Available memory is critically low",
})

// Logger utility with different levels
export const logger = {
  debug: (service: string, message: string, metadata?: Record<string, any>) =>
    monitoring.log({ level: "debug", service, message, metadata }),

  info: (service: string, message: string, metadata?: Record<string, any>) =>
    monitoring.log({ level: "info", service, message, metadata }),

  warn: (service: string, message: string, metadata?: Record<string, any>) =>
    monitoring.log({ level: "warn", service, message, metadata }),

  error: (service: string, message: string, metadata?: Record<string, any>) =>
    monitoring.log({ level: "error", service, message, metadata }),

  fatal: (service: string, message: string, metadata?: Record<string, any>) =>
    monitoring.log({ level: "fatal", service, message, metadata }),
}

// Metrics utility
export const metrics = {
  counter: (name: string, value = 1, tags?: Record<string, string>) =>
    monitoring.collectMetric({ name, value, unit: "count", tags }),

  gauge: (name: string, value: number, unit = "value", tags?: Record<string, string>) =>
    monitoring.collectMetric({ name, value, unit, tags }),

  histogram: (name: string, value: number, unit = "ms", tags?: Record<string, string>) =>
    monitoring.collectMetric({ name, value, unit, tags }),
  timing: async (
    name: string,
    fn: () => Promise<any>,
    tags?: Record<string, string>,
  ): Promise<any> => monitoring.measurePerformance(name, fn, tags),
}
