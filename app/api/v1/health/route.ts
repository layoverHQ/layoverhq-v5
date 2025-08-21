import { type NextRequest, NextResponse } from "next/server"
import { serviceRegistry } from "@/lib/api-gateway"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    const healthChecks = await Promise.allSettled([
      // Database connectivity
      supabase.from("profiles").select("count").limit(1),
      // Redis connectivity (if available)
      checkRedisHealth(),
      // External API connectivity
      checkExternalAPIs(),
    ])

    const [dbResult, redisResult, apiResult] = healthChecks

    const health = {
      status: "healthy",
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || "1.0.0",
      environment: process.env.NODE_ENV || "development",
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      services: {
        database: {
          status:
            dbResult.status === "fulfilled" && !dbResult.value.error ? "healthy" : "unhealthy",
          responseTime: Date.now(),
          error:
            dbResult.status === "rejected"
              ? dbResult.reason?.message
              : dbResult.status === "fulfilled"
                ? dbResult.value.error?.message
                : undefined,
        },
        redis: {
          status: redisResult.status === "fulfilled" ? "healthy" : "degraded",
          error: redisResult.status === "rejected" ? redisResult.reason?.message : undefined,
        },
        externalAPIs: {
          status: apiResult.status === "fulfilled" ? "healthy" : "degraded",
          error: apiResult.status === "rejected" ? apiResult.reason?.message : undefined,
        },
        api: {
          status: "healthy",
          uptime: process.uptime(),
          memory: process.memoryUsage(),
        },
      },
      registeredServices: serviceRegistry.getAllServices(),
    }

    // Perform health checks on registered services
    for (const service of serviceRegistry.getAllServices()) {
      await serviceRegistry.healthCheck(service.name.toLowerCase().replace(" ", "-"))
    }

    const criticalServices = ["database"]
    const hasCriticalFailure = criticalServices.some(
      (service) => health.services[service as keyof typeof health.services]?.status === "unhealthy",
    )

    const overallStatus = hasCriticalFailure
      ? "unhealthy"
      : Object.values(health.services).some((service) => service.status === "degraded")
        ? "degraded"
        : "healthy"

    health.status = overallStatus

    return NextResponse.json(health, {
      status: overallStatus === "healthy" ? 200 : overallStatus === "degraded" ? 200 : 503,
      headers: {
        "Cache-Control": "no-cache, no-store, must-revalidate",
        Pragma: "no-cache",
        Expires: "0",
      },
    })
  } catch (error) {
    return NextResponse.json(
      {
        status: "unhealthy",
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : "Unknown error",
        version: process.env.npm_package_version || "1.0.0",
        environment: process.env.NODE_ENV || "development",
      },
      { status: 503 },
    )
  }
}

async function checkRedisHealth(): Promise<void> {
  try {
    if (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
      const { Redis } = await import("@upstash/redis")
      const redis = new Redis({
        url: process.env.KV_REST_API_URL,
        token: process.env.KV_REST_API_TOKEN,
      })
      await redis.ping()
    }
  } catch (error) {
    throw new Error(
      `Redis health check failed: ${error instanceof Error ? error.message : "Unknown error"}`,
    )
  }
}

async function checkExternalAPIs(): Promise<void> {
  try {
    // Check critical external APIs
    const apiChecks = [
      // Add your critical API endpoints here
      // fetch('https://api.amadeus.com/health', { method: 'HEAD', timeout: 5000 }),
    ]

    if (apiChecks.length > 0) {
      await Promise.all(apiChecks)
    }
  } catch (error) {
    throw new Error(
      `External API health check failed: ${error instanceof Error ? error.message : "Unknown error"}`,
    )
  }
}
