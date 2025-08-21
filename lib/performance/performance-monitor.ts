/**
 * Performance Monitoring System for LayoverHQ
 *
 * Monitors and optimizes API response times to maintain sub-3s target
 */

import { logger } from "../logger"
import { redisCache } from "../redis-cache"

export interface PerformanceMetrics {
  endpoint: string
  method: string
  duration: number
  timestamp: number
  statusCode: number
  cacheHit?: boolean
  userId?: string
  metadata?: any
}

export interface PerformanceThresholds {
  warning: number // ms
  critical: number // ms
  target: number // ms
}

export class PerformanceMonitor {
  private static instance: PerformanceMonitor
  private metrics: PerformanceMetrics[] = []
  private readonly maxMetricsHistory = 1000

  // Performance thresholds (milliseconds)
  private readonly thresholds: { [key: string]: PerformanceThresholds } = {
    default: { target: 2000, warning: 1500, critical: 3000 },
    "/api/v1/layovers/discover": { target: 2500, warning: 2000, critical: 3000 },
    "/api/v1/flights/search": { target: 1500, warning: 1000, critical: 2000 },
    "/api/v1/experiences/availability": { target: 1000, warning: 800, critical: 1500 },
    "/api/v1/experiences/book": { target: 2000, warning: 1500, critical: 3000 },
  }

  private constructor() {}

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor()
    }
    return PerformanceMonitor.instance
  }

  /**
   * Start tracking a request
   */
  startTracking(endpoint: string, method: string = "GET", metadata?: any): PerformanceTracker {
    return new PerformanceTracker(endpoint, method, metadata, this)
  }

  /**
   * Record a completed request
   */
  recordMetric(metric: PerformanceMetrics): void {
    this.metrics.push(metric)

    // Keep only the most recent metrics
    if (this.metrics.length > this.maxMetricsHistory) {
      this.metrics = this.metrics.slice(-this.maxMetricsHistory)
    }

    // Check thresholds and alert if necessary
    this.checkThresholds(metric)

    // Log performance data
    this.logPerformance(metric)

    // Store in cache for reporting
    this.storeMetricForReporting(metric)
  }

  /**
   * Get performance statistics for an endpoint
   */
  getStats(
    endpoint?: string,
    timeWindow: number = 3600000,
  ): {
    averageResponseTime: number
    p95ResponseTime: number
    p99ResponseTime: number
    totalRequests: number
    slowRequests: number
    cacheHitRate: number
    errorRate: number
  } {
    const cutoff = Date.now() - timeWindow
    let filteredMetrics = this.metrics.filter((m) => m.timestamp > cutoff)

    if (endpoint) {
      filteredMetrics = filteredMetrics.filter((m) => m.endpoint === endpoint)
    }

    if (filteredMetrics.length === 0) {
      return {
        averageResponseTime: 0,
        p95ResponseTime: 0,
        p99ResponseTime: 0,
        totalRequests: 0,
        slowRequests: 0,
        cacheHitRate: 0,
        errorRate: 0,
      }
    }

    const durations = filteredMetrics.map((m) => m.duration).sort((a, b) => a - b)
    const cacheHits = filteredMetrics.filter((m) => m.cacheHit).length
    const errors = filteredMetrics.filter((m) => m.statusCode >= 400).length
    const threshold = this.getThreshold(endpoint || "default")
    const slowRequests = filteredMetrics.filter((m) => m.duration > threshold.warning).length

    return {
      averageResponseTime: Math.round(durations.reduce((sum, d) => sum + d, 0) / durations.length),
      p95ResponseTime: Math.round(durations[Math.floor(durations.length * 0.95)] || 0),
      p99ResponseTime: Math.round(durations[Math.floor(durations.length * 0.99)] || 0),
      totalRequests: filteredMetrics.length,
      slowRequests,
      cacheHitRate: Math.round((cacheHits / filteredMetrics.length) * 100),
      errorRate: Math.round((errors / filteredMetrics.length) * 100),
    }
  }

  /**
   * Get slow endpoints that need optimization
   */
  getSlowEndpoints(timeWindow: number = 3600000): Array<{
    endpoint: string
    averageResponseTime: number
    p95ResponseTime: number
    totalRequests: number
    threshold: number
  }> {
    const endpoints = [...new Set(this.metrics.map((m) => m.endpoint))]

    return endpoints
      .map((endpoint) => {
        const stats = this.getStats(endpoint, timeWindow)
        const threshold = this.getThreshold(endpoint)

        return {
          endpoint,
          averageResponseTime: stats.averageResponseTime,
          p95ResponseTime: stats.p95ResponseTime,
          totalRequests: stats.totalRequests,
          threshold: threshold.target,
        }
      })
      .filter((stat) => stat.averageResponseTime > stat.threshold)
      .sort((a, b) => b.averageResponseTime - a.averageResponseTime)
  }

  /**
   * Generate performance recommendations
   */
  getOptimizationRecommendations(): string[] {
    const recommendations: string[] = []
    const stats = this.getStats()
    const slowEndpoints = this.getSlowEndpoints()

    if (stats.averageResponseTime > 2000) {
      recommendations.push(
        "🚨 Overall response time exceeds 2s target - immediate optimization needed",
      )
    }

    if (stats.cacheHitRate < 70) {
      recommendations.push(
        "💾 Cache hit rate below 70% - consider increasing cache TTL or improving cache strategies",
      )
    }

    if (stats.errorRate > 5) {
      recommendations.push(
        "❌ Error rate above 5% - investigate error causes and improve reliability",
      )
    }

    if (slowEndpoints.length > 0) {
      recommendations.push(
        `⚠️ ${slowEndpoints.length} endpoints are slower than target - focus optimization efforts`,
      )
    }

    // Specific recommendations for slow endpoints
    slowEndpoints.slice(0, 3).forEach((endpoint) => {
      if (endpoint.endpoint.includes("/layovers/discover")) {
        recommendations.push(
          "🔍 Layover discovery is slow - consider parallel API calls and better caching",
        )
      } else if (endpoint.endpoint.includes("/experiences/")) {
        recommendations.push("🎯 Experience APIs are slow - implement Viator API response caching")
      } else if (endpoint.endpoint.includes("/flights/search")) {
        recommendations.push("✈️ Flight search is slow - optimize flight aggregator performance")
      }
    })

    return recommendations
  }

  private checkThresholds(metric: PerformanceMetrics): void {
    const threshold = this.getThreshold(metric.endpoint)

    if (metric.duration > threshold.critical) {
      logger.error("🚨 Critical performance threshold exceeded", {
        endpoint: metric.endpoint,
        duration: metric.duration,
        threshold: threshold.critical,
        statusCode: metric.statusCode,
      })
    } else if (metric.duration > threshold.warning) {
      logger.warn("⚠️ Performance warning threshold exceeded", {
        endpoint: metric.endpoint,
        duration: metric.duration,
        threshold: threshold.warning,
        statusCode: metric.statusCode,
      })
    }
  }

  private logPerformance(metric: PerformanceMetrics): void {
    const threshold = this.getThreshold(metric.endpoint)
    const level = metric.duration > threshold.warning ? "warn" : "info"

    logger[level]("📊 Performance metric recorded", {
      endpoint: metric.endpoint,
      method: metric.method,
      duration: metric.duration,
      statusCode: metric.statusCode,
      cacheHit: metric.cacheHit,
      target: threshold.target,
    })
  }

  private async storeMetricForReporting(metric: PerformanceMetrics): Promise<void> {
    try {
      const key = `performance_metrics_${new Date().toISOString().split("T")[0]}`
      const existingMetrics =
        (await redisCache.get(key, {
          keyPrefix: "layoverhq",
          useLocalFallback: false,
        })) || []

      const metricsArray = Array.isArray(existingMetrics) ? existingMetrics : []
      metricsArray.push(metric)

      await redisCache.set(key, metricsArray, {
        ttl: 86400000, // 24 hours
        keyPrefix: "layoverhq",
      })
    } catch (error) {
      logger.error("Failed to store performance metric", { error })
    }
  }

  private getThreshold(endpoint: string): PerformanceThresholds {
    // Find the most specific threshold match
    const matchingKey = Object.keys(this.thresholds)
      .filter((key) => endpoint.includes(key))
      .sort((a, b) => b.length - a.length)[0]

    return this.thresholds[matchingKey] || this.thresholds.default
  }
}

/**
 * Performance tracker for individual requests
 */
export class PerformanceTracker {
  private startTime: number
  private endTime?: number

  constructor(
    private endpoint: string,
    private method: string,
    private metadata: any,
    private monitor: PerformanceMonitor,
  ) {
    this.startTime = Date.now()
  }

  /**
   * End tracking and record the metric
   */
  end(statusCode: number = 200, cacheHit: boolean = false, userId?: string): void {
    this.endTime = Date.now()
    const duration = this.endTime - this.startTime

    const metric: PerformanceMetrics = {
      endpoint: this.endpoint,
      method: this.method,
      duration,
      timestamp: this.startTime,
      statusCode,
      cacheHit,
      userId,
      metadata: this.metadata,
    }

    this.monitor.recordMetric(metric)
  }

  /**
   * Get current duration (useful for logging during long operations)
   */
  getCurrentDuration(): number {
    return Date.now() - this.startTime
  }
}

// Export singleton instance
export const performanceMonitor = PerformanceMonitor.getInstance()
