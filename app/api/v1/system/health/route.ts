import { type NextRequest, NextResponse } from "next/server"
import { performanceMonitor } from "@/lib/performance/performance-monitor"
import { enhancedErrorHandler } from "@/lib/monitoring/enhanced-error-handling"
import { redisCache } from "@/lib/redis-cache"
import { logger } from "@/lib/logger"

export async function GET(request: NextRequest) {
  const startTime = Date.now()

  try {
    // Gather system health metrics
    const performanceStats = performanceMonitor.getStats()
    const slowEndpoints = performanceMonitor.getSlowEndpoints()
    const errorStats = enhancedErrorHandler.getErrorStats()
    const circuitBreakers = enhancedErrorHandler.getCircuitBreakerStatus()
    const healthScore = enhancedErrorHandler.calculateHealthScore()

    // Test critical services
    const serviceChecks = await Promise.allSettled([
      testRedisConnection(),
      testLayoverDiscoveryEngine(),
      testViatorService(),
    ])

    const redisHealth =
      serviceChecks[0].status === "fulfilled"
        ? serviceChecks[0].value
        : { status: "down", error: "Connection failed" }
    const discoveryHealth =
      serviceChecks[1].status === "fulfilled"
        ? serviceChecks[1].value
        : { status: "down", error: "Service failed" }
    const viatorHealth =
      serviceChecks[2].status === "fulfilled"
        ? serviceChecks[2].value
        : { status: "down", error: "Service failed" }

    // Overall system status
    const systemStatus = determineSystemStatus(healthScore.score, errorStats, performanceStats)

    const healthReport = {
      status: systemStatus,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.npm_package_version || "1.0.0",
      environment: process.env.NODE_ENV || "development",

      // Overall metrics
      health: {
        score: healthScore.score,
        factors: healthScore.factors,
      },

      // Performance metrics
      performance: {
        averageResponseTime: performanceStats.averageResponseTime,
        p95ResponseTime: performanceStats.p95ResponseTime,
        p99ResponseTime: performanceStats.p99ResponseTime,
        cacheHitRate: performanceStats.cacheHitRate,
        totalRequests: performanceStats.totalRequests,
        slowRequests: performanceStats.slowRequests,
        slowEndpoints: slowEndpoints.slice(0, 5), // Top 5 slow endpoints
        recommendations: performanceMonitor.getOptimizationRecommendations(),
      },

      // Error metrics
      errors: {
        totalErrors: errorStats.totalErrors,
        unresolvedErrors: errorStats.unresolvedErrors,
        errorsByCategory: errorStats.errorsByCategory,
        errorsBySeverity: errorStats.errorsBySeverity,
        topErrors: errorStats.topErrors.slice(0, 3).map((error) => ({
          id: error.id,
          message: error.message,
          severity: error.severity,
          category: error.category,
          occurrenceCount: error.occurrenceCount,
          service: error.context.service,
        })),
      },

      // Circuit breaker status
      circuitBreakers: circuitBreakers.map((cb) => ({
        service: cb.serviceName,
        state: cb.state,
        failureCount: cb.failureCount,
        lastFailureTime: cb.lastFailureTime > 0 ? new Date(cb.lastFailureTime).toISOString() : null,
      })),

      // Service health checks
      services: {
        redis: redisHealth,
        layoverDiscovery: discoveryHealth,
        viator: viatorHealth,
      },

      // System resources
      system: {
        memory: {
          used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
          total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
          external: Math.round(process.memoryUsage().external / 1024 / 1024),
        },
        uptime: Math.round(process.uptime()),
        platform: process.platform,
        nodeVersion: process.version,
      },

      // Response time for this health check
      healthCheckDuration: Date.now() - startTime,
    }

    logger.info("System health check completed", {
      status: systemStatus,
      healthScore: healthScore.score,
      duration: Date.now() - startTime,
    })

    return NextResponse.json(healthReport, {
      status: systemStatus === "healthy" ? 200 : systemStatus === "degraded" ? 503 : 500,
    })
  } catch (error) {
    logger.error("Health check failed", { error })

    return NextResponse.json(
      {
        status: "unhealthy",
        timestamp: new Date().toISOString(),
        error: "Health check system failure",
        healthCheckDuration: Date.now() - startTime,
      },
      { status: 500 },
    )
  }
}

async function testRedisConnection(): Promise<{
  status: string
  responseTime?: number
  error?: string
}> {
  const startTime = Date.now()

  try {
    const testKey = `health_check_${Date.now()}`
    const testValue = "ping"

    await redisCache.set(testKey, testValue, {
      ttl: 5000, // 5 seconds
      keyPrefix: "layoverhq",
    })

    const retrieved = await redisCache.get(testKey, {
      keyPrefix: "layoverhq",
    })

    if (retrieved !== testValue) {
      throw new Error("Redis read/write test failed")
    }

    return {
      status: "healthy",
      responseTime: Date.now() - startTime,
    }
  } catch (error) {
    return {
      status: "unhealthy",
      responseTime: Date.now() - startTime,
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}

async function testLayoverDiscoveryEngine(): Promise<{
  status: string
  responseTime?: number
  error?: string
}> {
  const startTime = Date.now()

  try {
    // Test with minimal parameters to check if the engine is responsive
    const testParams = {
      origin: "JFK",
      destination: "LAX",
      departureDate: new Date(Date.now() + 86400000).toISOString().split("T")[0], // Tomorrow
      passengers: { adults: 1, children: 0, infants: 0 },
    }

    // Import dynamically to avoid circular dependencies
    const { coreLayoverDiscoveryEngine } = await import(
      "@/lib/services/core-layover-discovery-engine"
    )

    // Quick timeout test - just verify the service starts processing
    const results = await Promise.race([
      coreLayoverDiscoveryEngine.discoverLayoverOpportunities(testParams),
      new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout")), 5000)),
    ])

    return {
      status: "healthy",
      responseTime: Date.now() - startTime,
    }
  } catch (error) {
    return {
      status: "degraded", // Degraded rather than unhealthy as this might be a timeout
      responseTime: Date.now() - startTime,
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}

async function testViatorService(): Promise<{
  status: string
  responseTime?: number
  error?: string
}> {
  const startTime = Date.now()

  try {
    // Import dynamically to avoid circular dependencies
    const { enhancedViatorService } = await import("@/lib/services/enhanced-viator-service")

    // Test a simple availability check (will use mock data if no API key)
    const availability = await enhancedViatorService.checkAvailability(
      "TEST_PRODUCT",
      new Date(Date.now() + 86400000).toISOString().split("T")[0],
      1,
    )

    return {
      status: "healthy",
      responseTime: Date.now() - startTime,
    }
  } catch (error) {
    return {
      status: "degraded",
      responseTime: Date.now() - startTime,
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}

function determineSystemStatus(
  healthScore: number,
  errorStats: any,
  performanceStats: any,
): "healthy" | "degraded" | "unhealthy" {
  // Critical issues
  if (
    healthScore < 50 ||
    errorStats.errorsBySeverity.critical > 0 ||
    performanceStats.averageResponseTime > 5000
  ) {
    return "unhealthy"
  }

  // Performance or reliability issues
  if (
    healthScore < 80 ||
    performanceStats.averageResponseTime > 3000 ||
    errorStats.unresolvedErrors > 5 ||
    performanceStats.cacheHitRate < 50
  ) {
    return "degraded"
  }

  return "healthy"
}
