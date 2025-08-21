import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// Rate limiting store (in production, use Redis)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>()

export interface ApiGatewayConfig {
  rateLimit?: {
    windowMs: number
    maxRequests: number
  }
  requireAuth?: boolean
  requiredPermissions?: string[]
  requiredRoles?: string[]
  enableLogging?: boolean
  enableMetrics?: boolean
}

export class ApiGateway {
  private config: ApiGatewayConfig

  constructor(config: ApiGatewayConfig = {}) {
    this.config = {
      rateLimit: { windowMs: 60000, maxRequests: 100 }, // 100 requests per minute
      requireAuth: true,
      enableLogging: true,
      enableMetrics: true,
      ...config,
    }
  }

  async middleware(
    request: NextRequest,
    handler: (req: NextRequest, user?: any) => Promise<NextResponse>,
  ) {
    const startTime = Date.now()
    let user = null

    try {
      // 1. Rate Limiting
      if (this.config.rateLimit) {
        const rateLimitResult = await this.checkRateLimit(request)
        if (rateLimitResult) return rateLimitResult
      }

      // 2. Authentication
      if (this.config.requireAuth) {
        const authResult = await this.authenticate(request)
        if (authResult instanceof NextResponse) return authResult
        user = authResult
      }

      // 3. Authorization
      if (user && (this.config.requiredPermissions || this.config.requiredRoles)) {
        const authzResult = await this.authorize(user)
        if (authzResult) return authzResult
      }

      // 4. Execute handler
      const response = await handler(request, user)

      // 5. Logging and Metrics
      if (this.config.enableLogging) {
        await this.logRequest(request, response, user, Date.now() - startTime)
      }

      if (this.config.enableMetrics) {
        await this.recordMetrics(request, response, Date.now() - startTime)
      }

      return response
    } catch (error) {
      console.error("API Gateway error:", error)
      return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
  }

  private async checkRateLimit(request: NextRequest): Promise<NextResponse | null> {
    if (!this.config.rateLimit) return null

    const clientId = this.getClientId(request)
    const now = Date.now()
    const windowMs = this.config.rateLimit.windowMs
    const maxRequests = this.config.rateLimit.maxRequests

    const clientData = rateLimitStore.get(clientId)

    if (!clientData || now > clientData.resetTime) {
      rateLimitStore.set(clientId, { count: 1, resetTime: now + windowMs })
      return null
    }

    if (clientData.count >= maxRequests) {
      return NextResponse.json(
        {
          error: "Rate limit exceeded",
          retryAfter: Math.ceil((clientData.resetTime - now) / 1000),
        },
        { status: 429 },
      )
    }

    clientData.count++
    return null
  }

  private async authenticate(request: NextRequest): Promise<any | NextResponse> {
    try {
      const supabase = await createClient()
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser()

      if (error || !user) {
        return NextResponse.json({ error: "Authentication required" }, { status: 401 })
      }

      // Get user profile with role information
      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single()

      if (!profile) {
        return NextResponse.json({ error: "User profile not found" }, { status: 401 })
      }

      return {
        id: user.id,
        email: user.email,
        role: profile.role,
        permissions: this.getRolePermissions(profile.role),
        profile,
      }
    } catch (error) {
      return NextResponse.json({ error: "Authentication failed" }, { status: 401 })
    }
  }

  private async authorize(user: any): Promise<NextResponse | null> {
    // Check required roles
    if (this.config.requiredRoles && this.config.requiredRoles.length > 0) {
      if (!this.config.requiredRoles.includes(user.role)) {
        return NextResponse.json({ error: "Insufficient role privileges" }, { status: 403 })
      }
    }

    // Check required permissions
    if (this.config.requiredPermissions && this.config.requiredPermissions.length > 0) {
      const hasAllPermissions = this.config.requiredPermissions.every((permission) =>
        user.permissions.includes(permission),
      )
      if (!hasAllPermissions) {
        return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
      }
    }

    return null
  }

  private async logRequest(
    request: NextRequest,
    response: NextResponse,
    user: any,
    duration: number,
  ) {
    try {
      const supabase = await createClient()
      await supabase.from("system_logs").insert({
        level: response.status >= 400 ? "error" : "info",
        service: "api-gateway",
        message: `${request.method} ${request.nextUrl.pathname} - ${response.status}`,
        metadata: {
          method: request.method,
          path: request.nextUrl.pathname,
          status: response.status,
          duration,
          userAgent: request.headers.get("user-agent"),
          ip: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip"),
        },
        user_id: user?.id,
        ip_address: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip"),
      })
    } catch (error) {
      console.error("Failed to log request:", error)
    }
  }

  private async recordMetrics(request: NextRequest, response: NextResponse, duration: number) {
    try {
      const supabase = await createClient()
      await supabase.from("system_metrics").insert([
        {
          service_name: "api-gateway",
          metric_type: "response_time",
          value: duration,
          unit: "ms",
        },
        {
          service_name: "api-gateway",
          metric_type: "request_count",
          value: 1,
          unit: "count",
        },
      ])
    } catch (error) {
      console.error("Failed to record metrics:", error)
    }
  }

  private getClientId(request: NextRequest): string {
    return request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown"
  }

  private getRolePermissions(role: string): string[] {
    const permissions = {
      admin: [
        "read",
        "write",
        "delete",
        "manage-users",
        "manage-flights",
        "manage-bookings",
        "system-monitor",
        "manage-integrations",
        "view-analytics",
        "manage-roles",
        "audit-logs",
      ],
      manager: [
        "read",
        "write",
        "manage-flights",
        "manage-bookings",
        "view-analytics",
        "system-monitor",
      ],
      agent: ["read", "write", "manage-bookings", "view-analytics"],
      user: ["read"],
    }
    return permissions[role as keyof typeof permissions] || []
  }
}

// Service discovery and health check utilities
export class ServiceRegistry {
  private services = new Map<string, ServiceInfo>()

  registerService(name: string, info: ServiceInfo) {
    this.services.set(name, { ...info, lastHealthCheck: Date.now(), status: "healthy" })
  }

  getService(name: string): ServiceInfo | undefined {
    return this.services.get(name)
  }

  getAllServices(): ServiceInfo[] {
    return Array.from(this.services.values())
  }

  async healthCheck(serviceName: string): Promise<boolean> {
    const service = this.services.get(serviceName)
    if (!service) return false

    try {
      const response = await fetch(`${service.url}/health`, {
        method: "GET",
        timeout: 5000,
      } as any)

      const isHealthy = response.ok
      this.services.set(serviceName, {
        ...service,
        status: isHealthy ? "healthy" : "unhealthy",
        lastHealthCheck: Date.now(),
      })

      return isHealthy
    } catch (error) {
      this.services.set(serviceName, {
        ...service,
        status: "unhealthy",
        lastHealthCheck: Date.now(),
      })
      return false
    }
  }
}

export interface ServiceInfo {
  name: string
  url: string
  version: string
  status: "healthy" | "unhealthy" | "degraded"
  lastHealthCheck: number
  metadata?: Record<string, any>
}

// Global service registry instance
export const serviceRegistry = new ServiceRegistry()

// Register core services
serviceRegistry.registerService("flight-service", {
  name: "Flight Service",
  url: "http://flight-service:3001",
  version: "1.0.0",
  status: "healthy",
  lastHealthCheck: Date.now(),
  metadata: { description: "Flight search and booking management" },
})

serviceRegistry.registerService("booking-service", {
  name: "Booking Service",
  url: "http://booking-service:3002",
  version: "1.0.0",
  status: "healthy",
  lastHealthCheck: Date.now(),
  metadata: { description: "Booking lifecycle management" },
})

serviceRegistry.registerService("ai-service", {
  name: "AI Service",
  url: "http://ai-service:3003",
  version: "1.0.0",
  status: "healthy",
  lastHealthCheck: Date.now(),
  metadata: { description: "AI-powered layover optimization" },
})

serviceRegistry.registerService("payment-service", {
  name: "Payment Service",
  url: "http://payment-service:3004",
  version: "1.0.0",
  status: "healthy",
  lastHealthCheck: Date.now(),
  metadata: { description: "Payment processing and refunds" },
})

serviceRegistry.registerService("notification-service", {
  name: "Notification Service",
  url: "http://notification-service:3005",
  version: "1.0.0",
  status: "healthy",
  lastHealthCheck: Date.now(),
  metadata: { description: "Email, SMS, and push notifications" },
})
