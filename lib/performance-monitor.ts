import { metrics } from "./monitoring"

export interface PerformanceMetrics {
  responseTime: number
  throughput: number
  errorRate: number
  cpuUsage: number
  memoryUsage: number
  activeConnections: number
}

export class PerformanceMonitor {
  private requestCounts = new Map<string, number>()
  private responseTimes = new Map<string, number[]>()
  private errorCounts = new Map<string, number>()
  private startTime = Date.now()

  // Track request
  trackRequest(endpoint: string, method: string, responseTime: number, statusCode: number): void {
    const key = `${method}:${endpoint}`

    // Track request count
    this.requestCounts.set(key, (this.requestCounts.get(key) || 0) + 1)

    // Track response times
    if (!this.responseTimes.has(key)) {
      this.responseTimes.set(key, [])
    }
    const times = this.responseTimes.get(key)!
    times.push(responseTime)

    // Keep only last 1000 response times
    if (times.length > 1000) {
      times.shift()
    }

    // Track errors
    if (statusCode >= 400) {
      this.errorCounts.set(key, (this.errorCounts.get(key) || 0) + 1)
    }

    // Collect metrics
    metrics.histogram("http_request_duration", responseTime, "ms", {
      endpoint,
      method,
      status: statusCode.toString(),
    })

    metrics.counter("http_requests_total", 1, {
      endpoint,
      method,
      status: statusCode.toString(),
    })
  }

  // Get performance metrics
  getMetrics(endpoint?: string): PerformanceMetrics {
    const now = Date.now()
    const uptimeSeconds = (now - this.startTime) / 1000

    let totalRequests = 0
    let totalErrors = 0
    let allResponseTimes: number[] = []

    if (endpoint) {
      const key = endpoint
      totalRequests = this.requestCounts.get(key) || 0
      totalErrors = this.errorCounts.get(key) || 0
      allResponseTimes = this.responseTimes.get(key) || []
    } else {
      // Aggregate all endpoints
      for (const count of this.requestCounts.values()) {
        totalRequests += count
      }
      for (const count of this.errorCounts.values()) {
        totalErrors += count
      }
      for (const times of this.responseTimes.values()) {
        allResponseTimes.push(...times)
      }
    }

    const avgResponseTime =
      allResponseTimes.length > 0
        ? allResponseTimes.reduce((a, b) => a + b, 0) / allResponseTimes.length
        : 0

    const throughput = totalRequests / uptimeSeconds
    const errorRate = totalRequests > 0 ? (totalErrors / totalRequests) * 100 : 0

    // System metrics
    const memUsage = process.memoryUsage()
    const cpuUsage = process.cpuUsage()

    return {
      responseTime: avgResponseTime,
      throughput,
      errorRate,
      cpuUsage: (cpuUsage.user + cpuUsage.system) / 1000000, // Convert to seconds
      memoryUsage: memUsage.heapUsed / 1024 / 1024, // Convert to MB
      activeConnections: 0, // Would need to track this separately
    }
  }

  // Get percentiles
  getPercentiles(endpoint?: string): { p50: number; p95: number; p99: number } {
    let allResponseTimes: number[] = []

    if (endpoint) {
      allResponseTimes = this.responseTimes.get(endpoint) || []
    } else {
      for (const times of this.responseTimes.values()) {
        allResponseTimes.push(...times)
      }
    }

    if (allResponseTimes.length === 0) {
      return { p50: 0, p95: 0, p99: 0 }
    }

    const sorted = allResponseTimes.sort((a, b) => a - b)
    const len = sorted.length

    return {
      p50: sorted[Math.floor(len * 0.5)],
      p95: sorted[Math.floor(len * 0.95)],
      p99: sorted[Math.floor(len * 0.99)],
    }
  }

  // Start collecting system metrics
  startSystemMetricsCollection(): void {
    setInterval(() => {
      this.collectSystemMetrics()
    }, 30000) // Every 30 seconds
  }

  private async collectSystemMetrics(): Promise<void> {
    const memUsage = process.memoryUsage()
    const cpuUsage = process.cpuUsage()

    await metrics.gauge("system_memory_heap_used", memUsage.heapUsed, "bytes")
    await metrics.gauge("system_memory_heap_total", memUsage.heapTotal, "bytes")
    await metrics.gauge("system_memory_external", memUsage.external, "bytes")
    await metrics.gauge("system_cpu_user", cpuUsage.user, "microseconds")
    await metrics.gauge("system_cpu_system", cpuUsage.system, "microseconds")

    // Event loop lag
    const start = process.hrtime.bigint()
    setImmediate(() => {
      const lag = Number(process.hrtime.bigint() - start) / 1000000 // Convert to milliseconds
      metrics.gauge("event_loop_lag", lag, "ms")
    })
  }
}

// Global performance monitor instance
export const performanceMonitor = new PerformanceMonitor()

// Middleware for tracking HTTP requests
export function createPerformanceMiddleware() {
  return (req: any, res: any, next: any) => {
    const startTime = Date.now()

    res.on("finish", () => {
      const responseTime = Date.now() - startTime
      const endpoint = req.route?.path || req.path || "unknown"
      const method = req.method

      performanceMonitor.trackRequest(endpoint, method, responseTime, res.statusCode)
    })

    next()
  }
}

// Start system metrics collection
performanceMonitor.startSystemMetricsCollection()
