/**
 * Multi-Tenant API Gateway - Enterprise-Grade Request Management
 *
 * Comprehensive API gateway that handles tenant routing, rate limiting,
 * authentication, usage analytics, and real-time monitoring for enterprise
 * customers with complete isolation and customizable policies.
 */

import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { Redis } from "@upstash/redis"
import { Ratelimit } from "@upstash/ratelimit"

export interface TenantConfig {
  id: string
  name: string
  slug: string
  subscription_plan: "free" | "starter" | "professional" | "enterprise"
  api_key_hash: string
  rate_limits: {
    requests_per_minute: number
    requests_per_hour: number
    requests_per_day: number
    burst_capacity: number
  }
  usage_quotas: {
    monthly_requests: number
    monthly_bandwidth_gb: number
  }
  current_usage: {
    requests_this_month: number
    bandwidth_this_month_gb: number
    last_request_at?: string
  }
  ip_whitelist?: string[]
  allowed_origins?: string[]
  custom_domain?: string
  enabled_features: string[]
  status: "active" | "suspended" | "trial" | "churned"
  data_residency_region: string
}

export interface ApiRequest {
  method: string
  url: string
  headers: Record<string, string>
  body?: any
  query: Record<string, string>
  ip_address: string
  user_agent: string
  timestamp: Date
  request_id: string
  trace_id: string
}

export interface ApiResponse {
  status: number
  headers: Record<string, string>
  body?: any
  response_time_ms: number
  request_size_bytes: number
  response_size_bytes: number
}

export interface UsageMetrics {
  tenant_id: string
  endpoint: string
  method: string
  status_code: number
  response_time_ms: number
  request_size_bytes: number
  response_size_bytes: number
  timestamp: Date
  ip_address: string
  user_agent: string
  country?: string
  cost: number
}

class MultiTenantApiGateway {
  private redis: Redis
  private rateLimiters: Map<string, Ratelimit> = new Map()
  private tenantCache: Map<string, TenantConfig> = new Map()
  private lastCacheRefresh = 0
  private cacheRefreshInterval = 5 * 60 * 1000 // 5 minutes

  constructor() {
    this.redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    })
  }

  /**
   * Main gateway handler for incoming API requests
   */
  async handleRequest(request: NextRequest): Promise<NextResponse> {
    const startTime = Date.now()
    const requestId = this.generateRequestId()
    const traceId = this.generateTraceId()

    try {
      // Parse request information
      const apiRequest: ApiRequest = {
        method: request.method,
        url: request.url,
        headers: Object.fromEntries(request.headers.entries()),
        query: Object.fromEntries(new URL(request.url).searchParams.entries()),
        ip_address: this.getClientIP(request),
        user_agent: request.headers.get("user-agent") || "",
        timestamp: new Date(),
        request_id: requestId,
        trace_id: traceId,
      }

      // Extract and validate API key
      const apiKey = this.extractApiKey(request)
      if (!apiKey) {
        return this.createErrorResponse(401, "API key required", requestId)
      }

      // Get tenant configuration
      const tenant = await this.getTenantByApiKey(apiKey)
      if (!tenant) {
        return this.createErrorResponse(401, "Invalid API key", requestId)
      }

      // Check tenant status
      if (tenant.status !== "active") {
        return this.createErrorResponse(403, `Tenant is ${tenant.status}`, requestId)
      }

      // Validate request origin and IP
      const originValidation = this.validateOriginAndIP(request, tenant)
      if (!originValidation.valid) {
        return this.createErrorResponse(403, originValidation.reason!, requestId)
      }

      // Check rate limits
      const rateLimitResult = await this.checkRateLimit(tenant, apiRequest)
      if (!rateLimitResult.allowed) {
        const response = this.createErrorResponse(429, "Rate limit exceeded", requestId)
        response.headers.set("X-RateLimit-Limit", rateLimitResult.limit.toString())
        response.headers.set("X-RateLimit-Remaining", rateLimitResult.remaining.toString())
        response.headers.set("X-RateLimit-Reset", rateLimitResult.resetTime.toString())
        return response
      }

      // Check usage quotas
      const quotaResult = await this.checkUsageQuotas(tenant)
      if (!quotaResult.allowed) {
        return this.createErrorResponse(403, quotaResult.reason!, requestId)
      }

      // Route request to appropriate handler
      const routedResponse = await this.routeRequest(apiRequest, tenant)

      // Calculate response metrics
      const responseTime = Date.now() - startTime
      const requestSize = request.headers.get("content-length")
        ? parseInt(request.headers.get("content-length")!)
        : 0
      const responseSize = this.estimateResponseSize(routedResponse)

      // Record usage metrics
      await this.recordUsageMetrics({
        tenant_id: tenant.id,
        endpoint: new URL(request.url).pathname,
        method: request.method,
        status_code: routedResponse.status,
        response_time_ms: responseTime,
        request_size_bytes: requestSize,
        response_size_bytes: responseSize,
        timestamp: new Date(),
        ip_address: apiRequest.ip_address,
        user_agent: apiRequest.user_agent,
        country: await this.getCountryFromIP(apiRequest.ip_address),
        cost: this.calculateRequestCost(tenant, responseTime, requestSize, responseSize),
      })

      // Add gateway headers
      routedResponse.headers.set("X-Request-ID", requestId)
      routedResponse.headers.set("X-Trace-ID", traceId)
      routedResponse.headers.set("X-Response-Time", `${responseTime}ms`)
      routedResponse.headers.set("X-Tenant-ID", tenant.id)
      routedResponse.headers.set("X-Gateway-Version", "2.0")

      // Add rate limit headers
      routedResponse.headers.set("X-RateLimit-Limit", rateLimitResult.limit.toString())
      routedResponse.headers.set("X-RateLimit-Remaining", rateLimitResult.remaining.toString())
      routedResponse.headers.set("X-RateLimit-Reset", rateLimitResult.resetTime.toString())

      return NextResponse.json(await routedResponse.json(), {
        status: routedResponse.status,
        headers: routedResponse.headers,
      })
    } catch (error) {
      console.error("[MultiTenantApiGateway] Request handling error:", error)

      // Record error metrics
      const responseTime = Date.now() - startTime
      await this.recordErrorMetrics(error, requestId, traceId, responseTime)

      return this.createErrorResponse(500, "Internal server error", requestId)
    }
  }

  /**
   * Extract API key from request headers
   */
  private extractApiKey(request: NextRequest): string | null {
    // Check Authorization header (Bearer token)
    const authHeader = request.headers.get("authorization")
    if (authHeader && authHeader.startsWith("Bearer ")) {
      return authHeader.substring(7)
    }

    // Check X-API-Key header
    const apiKeyHeader = request.headers.get("x-api-key")
    if (apiKeyHeader) {
      return apiKeyHeader
    }

    // Check query parameter
    const url = new URL(request.url)
    const apiKeyParam = url.searchParams.get("api_key")
    if (apiKeyParam) {
      return apiKeyParam
    }

    return null
  }

  /**
   * Get tenant configuration by API key
   */
  private async getTenantByApiKey(apiKey: string): Promise<TenantConfig | null> {
    try {
      // Check cache first
      const cacheKey = `tenant:${apiKey}`
      let tenant = this.tenantCache.get(cacheKey)

      if (!tenant || Date.now() - this.lastCacheRefresh > this.cacheRefreshInterval) {
        // Load from database
        const supabase = await createClient()
        const { data, error } = await supabase
          .from("api_credentials")
          .select(
            `
            *,
            enterprises(*)
          `,
          )
          .eq("api_key_hash", this.hashApiKey(apiKey))
          .eq("is_active", true)
          .single()

        if (error || !data) {
          return null
        }

        tenant = {
          id: data.tenant_id,
          name: data.enterprises.name,
          slug: data.enterprises.slug,
          subscription_plan: data.enterprises.subscription_plan,
          api_key_hash: data.api_key_hash,
          rate_limits: data.rate_limits,
          usage_quotas: data.usage_quotas,
          current_usage: data.current_usage,
          ip_whitelist: data.ip_whitelist,
          allowed_origins: data.allowed_origins,
          custom_domain: data.enterprises.domain,
          enabled_features: data.enterprises.enabled_features,
          status: data.enterprises.status,
          data_residency_region: data.enterprises.data_residency_region,
        }

        // Cache the result
        this.tenantCache.set(cacheKey, tenant)
        this.lastCacheRefresh = Date.now()
      }

      return tenant
    } catch (error) {
      console.error("[MultiTenantApiGateway] Error getting tenant:", error)
      return null
    }
  }

  /**
   * Validate request origin and IP address
   */
  private validateOriginAndIP(
    request: NextRequest,
    tenant: TenantConfig,
  ): { valid: boolean; reason?: string } {
    const clientIP = this.getClientIP(request)
    const origin = request.headers.get("origin") || request.headers.get("referer")

    // Check IP whitelist
    if (tenant.ip_whitelist && tenant.ip_whitelist.length > 0) {
      const isIPAllowed = tenant.ip_whitelist.some((allowedIP) => {
        if (allowedIP === "0.0.0.0/0") return true // Allow all
        return this.isIPInRange(clientIP, allowedIP)
      })

      if (!isIPAllowed) {
        return { valid: false, reason: "IP address not whitelisted" }
      }
    }

    // Check allowed origins
    if (tenant.allowed_origins && tenant.allowed_origins.length > 0 && origin) {
      const isOriginAllowed = tenant.allowed_origins.some((allowedOrigin) => {
        if (allowedOrigin === "*") return true // Allow all
        return origin.includes(allowedOrigin)
      })

      if (!isOriginAllowed) {
        return { valid: false, reason: "Origin not allowed" }
      }
    }

    return { valid: true }
  }

  /**
   * Check rate limits for the tenant
   */
  private async checkRateLimit(
    tenant: TenantConfig,
    request: ApiRequest,
  ): Promise<{
    allowed: boolean
    limit: number
    remaining: number
    resetTime: number
  }> {
    const rateLimitKey = `rate_limit:${tenant.id}`

    // Get or create rate limiter for this tenant
    if (!this.rateLimiters.has(rateLimitKey)) {
      this.rateLimiters.set(
        rateLimitKey,
        new Ratelimit({
          redis: this.redis,
          limiter: Ratelimit.slidingWindow(tenant.rate_limits.requests_per_minute, "1 m"),
          analytics: true,
        }),
      )
    }

    const ratelimit = this.rateLimiters.get(rateLimitKey)!
    const result = await ratelimit.limit(rateLimitKey)

    return {
      allowed: result.success,
      limit: result.limit,
      remaining: result.remaining,
      resetTime: result.reset,
    }
  }

  /**
   * Check usage quotas for the tenant
   */
  private async checkUsageQuotas(
    tenant: TenantConfig,
  ): Promise<{ allowed: boolean; reason?: string }> {
    const currentMonth = new Date().toISOString().slice(0, 7) // YYYY-MM
    const monthlyRequestsUsed = tenant.current_usage.requests_this_month || 0
    const monthlyBandwidthUsed = tenant.current_usage.bandwidth_this_month_gb || 0

    // Check request quota
    if (monthlyRequestsUsed >= tenant.usage_quotas.monthly_requests) {
      return {
        allowed: false,
        reason: "Monthly request quota exceeded",
      }
    }

    // Check bandwidth quota
    if (monthlyBandwidthUsed >= tenant.usage_quotas.monthly_bandwidth_gb) {
      return {
        allowed: false,
        reason: "Monthly bandwidth quota exceeded",
      }
    }

    return { allowed: true }
  }

  /**
   * Route request to appropriate handler based on endpoint
   */
  private async routeRequest(request: ApiRequest, tenant: TenantConfig): Promise<Response> {
    const url = new URL(request.url)
    const path = url.pathname

    // Route to different handlers based on path
    if (path.startsWith("/api/v1/flights")) {
      return this.routeToFlightAPI(request, tenant)
    } else if (path.startsWith("/api/v1/experiences")) {
      return this.routeToExperiencesAPI(request, tenant)
    } else if (path.startsWith("/api/v1/layovers")) {
      return this.routeToLayoversAPI(request, tenant)
    } else if (path.startsWith("/api/v1/bookings")) {
      return this.routeToBookingsAPI(request, tenant)
    } else if (path.startsWith("/api/v1/analytics")) {
      return this.routeToAnalyticsAPI(request, tenant)
    } else {
      return new Response(JSON.stringify({ error: "Endpoint not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      })
    }
  }

  /**
   * Route to flight API with tenant-specific configurations
   */
  private async routeToFlightAPI(request: ApiRequest, tenant: TenantConfig): Promise<Response> {
    // Check if tenant has flight search feature enabled
    if (!tenant.enabled_features.includes("flight_search")) {
      return this.createErrorResponse(403, "Flight search not enabled for this tenant")
    }

    // Forward to internal flight API with tenant context
    const internalUrl = new URL(request.url)
    internalUrl.searchParams.set("tenant_id", tenant.id)
    internalUrl.searchParams.set("data_region", tenant.data_residency_region)

    return fetch(internalUrl.toString(), {
      method: request.method,
      headers: {
        ...request.headers,
        "X-Internal-Request": "true",
        "X-Tenant-ID": tenant.id,
      },
      body: request.body,
    })
  }

  /**
   * Route to experiences API with tenant-specific configurations
   */
  private async routeToExperiencesAPI(
    request: ApiRequest,
    tenant: TenantConfig,
  ): Promise<Response> {
    if (!tenant.enabled_features.includes("experiences")) {
      return this.createErrorResponse(403, "Experiences not enabled for this tenant")
    }

    const internalUrl = new URL(request.url)
    internalUrl.searchParams.set("tenant_id", tenant.id)

    return fetch(internalUrl.toString(), {
      method: request.method,
      headers: {
        ...request.headers,
        "X-Internal-Request": "true",
        "X-Tenant-ID": tenant.id,
      },
      body: request.body,
    })
  }

  /**
   * Route to layovers API with tenant-specific configurations
   */
  private async routeToLayoversAPI(request: ApiRequest, tenant: TenantConfig): Promise<Response> {
    if (!tenant.enabled_features.includes("layover_optimization")) {
      return this.createErrorResponse(403, "Layover optimization not enabled for this tenant")
    }

    const internalUrl = new URL(request.url)
    internalUrl.searchParams.set("tenant_id", tenant.id)

    return fetch(internalUrl.toString(), {
      method: request.method,
      headers: {
        ...request.headers,
        "X-Internal-Request": "true",
        "X-Tenant-ID": tenant.id,
      },
      body: request.body,
    })
  }

  /**
   * Route to bookings API with tenant-specific configurations
   */
  private async routeToBookingsAPI(request: ApiRequest, tenant: TenantConfig): Promise<Response> {
    if (!tenant.enabled_features.includes("booking_management")) {
      return this.createErrorResponse(403, "Booking management not enabled for this tenant")
    }

    const internalUrl = new URL(request.url)
    internalUrl.searchParams.set("tenant_id", tenant.id)

    return fetch(internalUrl.toString(), {
      method: request.method,
      headers: {
        ...request.headers,
        "X-Internal-Request": "true",
        "X-Tenant-ID": tenant.id,
      },
      body: request.body,
    })
  }

  /**
   * Route to analytics API with tenant-specific configurations
   */
  private async routeToAnalyticsAPI(request: ApiRequest, tenant: TenantConfig): Promise<Response> {
    if (!tenant.enabled_features.includes("analytics")) {
      return this.createErrorResponse(403, "Analytics not enabled for this tenant")
    }

    // Analytics requests should only return data for the requesting tenant
    const internalUrl = new URL(request.url)
    internalUrl.searchParams.set("tenant_id", tenant.id)
    internalUrl.searchParams.set("scope", "tenant")

    return fetch(internalUrl.toString(), {
      method: request.method,
      headers: {
        ...request.headers,
        "X-Internal-Request": "true",
        "X-Tenant-ID": tenant.id,
      },
      body: request.body,
    })
  }

  /**
   * Record usage metrics for analytics and billing
   */
  private async recordUsageMetrics(metrics: UsageMetrics): Promise<void> {
    try {
      const supabase = await createClient()

      // Record in database
      await supabase.from("api_usage_logs").insert({
        tenant_id: metrics.tenant_id,
        endpoint: metrics.endpoint,
        method: metrics.method,
        response_status: metrics.status_code,
        response_time_ms: metrics.response_time_ms,
        request_size_bytes: metrics.request_size_bytes,
        response_size_bytes: metrics.response_size_bytes,
        ip_address: metrics.ip_address,
        user_agent: metrics.user_agent,
        country: metrics.country,
        billable_operation: true,
        operation_cost: metrics.cost,
        timestamp: metrics.timestamp.toISOString(),
      })

      // Update tenant usage counters
      await this.updateTenantUsage(metrics.tenant_id, {
        requests: 1,
        bandwidth_bytes: metrics.request_size_bytes + metrics.response_size_bytes,
      })

      // Update real-time metrics in Redis
      await this.updateRealTimeMetrics(metrics)
    } catch (error) {
      console.error("[MultiTenantApiGateway] Error recording usage metrics:", error)
    }
  }

  /**
   * Update tenant usage counters
   */
  private async updateTenantUsage(
    tenantId: string,
    usage: { requests: number; bandwidth_bytes: number },
  ): Promise<void> {
    const currentMonth = new Date().toISOString().slice(0, 7) // YYYY-MM
    const redisKey = `usage:${tenantId}:${currentMonth}`

    // Update Redis counters
    await Promise.all([
      this.redis.hincrby(redisKey, "requests", usage.requests),
      this.redis.hincrby(redisKey, "bandwidth_bytes", usage.bandwidth_bytes),
      this.redis.expire(redisKey, 60 * 60 * 24 * 32), // 32 days
    ])

    // Periodically sync to database (every 100 requests or 10 minutes)
    const requestCount = await this.redis.hget(redisKey, "requests")
    if (requestCount && parseInt(requestCount.toString()) % 100 === 0) {
      await this.syncUsageToDatabase(tenantId, currentMonth)
    }
  }

  /**
   * Update real-time metrics in Redis
   */
  private async updateRealTimeMetrics(metrics: UsageMetrics): Promise<void> {
    const now = Date.now()
    const minute = Math.floor(now / (60 * 1000))
    const hour = Math.floor(now / (60 * 60 * 1000))

    // Update per-minute metrics
    await Promise.all([
      this.redis.hincrby(`metrics:${metrics.tenant_id}:minute:${minute}`, "requests", 1),
      this.redis.hincrby(
        `metrics:${metrics.tenant_id}:minute:${minute}`,
        "response_time_total",
        metrics.response_time_ms,
      ),
      this.redis.expire(`metrics:${metrics.tenant_id}:minute:${minute}`, 3600),

      // Update per-hour metrics
      this.redis.hincrby(`metrics:${metrics.tenant_id}:hour:${hour}`, "requests", 1),
      this.redis.hincrby(
        `metrics:${metrics.tenant_id}:hour:${hour}`,
        "response_time_total",
        metrics.response_time_ms,
      ),
      this.redis.expire(`metrics:${metrics.tenant_id}:hour:${hour}`, 86400),
    ])
  }

  /**
   * Sync usage counters to database
   */
  private async syncUsageToDatabase(tenantId: string, month: string): Promise<void> {
    try {
      const redisKey = `usage:${tenantId}:${month}`
      const [requests, bandwidthBytes] = await Promise.all([
        this.redis.hget(redisKey, "requests"),
        this.redis.hget(redisKey, "bandwidth_bytes"),
      ])

      if (requests || bandwidthBytes) {
        const supabase = await createClient()
        await supabase
          .from("enterprises")
          .update({
            current_usage: {
              requests_this_month: parseInt(requests?.toString() || "0"),
              bandwidth_this_month_gb: parseFloat(
                (parseInt(bandwidthBytes?.toString() || "0") / 1024 / 1024 / 1024).toFixed(3),
              ),
              last_request_at: new Date().toISOString(),
            },
          })
          .eq("id", tenantId)
      }
    } catch (error) {
      console.error("[MultiTenantApiGateway] Error syncing usage to database:", error)
    }
  }

  /**
   * Calculate request cost for billing
   */
  private calculateRequestCost(
    tenant: TenantConfig,
    responseTimeMs: number,
    requestSizeBytes: number,
    responseSizeBytes: number,
  ): number {
    const baseCost = 0.001 // $0.001 per request

    // Add premium for higher response times (performance cost)
    const responseTimePremium = responseTimeMs > 1000 ? 0.0005 : 0

    // Add cost for bandwidth usage
    const totalBytes = requestSizeBytes + responseSizeBytes
    const bandwidthCost = (totalBytes / 1024 / 1024) * 0.0001 // $0.0001 per MB

    // Apply subscription plan multiplier
    const planMultiplier = {
      free: 0,
      starter: 1,
      professional: 0.8,
      enterprise: 0.6,
    }[tenant.subscription_plan]

    return (baseCost + responseTimePremium + bandwidthCost) * planMultiplier
  }

  /**
   * Record error metrics
   */
  private async recordErrorMetrics(
    error: any,
    requestId: string,
    traceId: string,
    responseTimeMs: number,
  ): Promise<void> {
    try {
      const supabase = await createClient()
      await supabase.from("api_error_logs").insert({
        request_id: requestId,
        trace_id: traceId,
        error_type: error.name || "UnknownError",
        error_message: error.message || "Unknown error",
        error_stack: error.stack,
        response_time_ms: responseTimeMs,
        timestamp: new Date().toISOString(),
      })
    } catch (dbError) {
      console.error("[MultiTenantApiGateway] Error recording error metrics:", dbError)
    }
  }

  /**
   * Create standardized error response
   */
  private createErrorResponse(status: number, message: string, requestId?: string): NextResponse {
    const response = NextResponse.json(
      {
        error: {
          code: status,
          message,
          request_id: requestId,
          timestamp: new Date().toISOString(),
        },
      },
      { status },
    )

    if (requestId) {
      response.headers.set("X-Request-ID", requestId)
    }
    response.headers.set("X-Gateway-Version", "2.0")

    return response
  }

  /**
   * Utility functions
   */
  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private generateTraceId(): string {
    return `trace_${Date.now()}_${Math.random().toString(36).substr(2, 12)}`
  }

  private getClientIP(request: NextRequest): string {
    return (
      request.headers.get("x-forwarded-for")?.split(",")[0] ||
      request.headers.get("x-real-ip") ||
      request.headers.get("cf-connecting-ip") ||
      "unknown"
    )
  }

  private hashApiKey(apiKey: string): string {
    // In production, use a proper hashing algorithm like bcrypt
    return Buffer.from(apiKey).toString("base64")
  }

  private isIPInRange(ip: string, range: string): boolean {
    // Simple implementation - in production, use a proper IP range library
    if (range.includes("/")) {
      // CIDR notation
      const [rangeIP, prefix] = range.split("/")
      // Implementation for CIDR matching would go here
      return ip === rangeIP // Simplified for now
    }
    return ip === range
  }

  private estimateResponseSize(response: Response): number {
    const contentLength = response.headers.get("content-length")
    return contentLength ? parseInt(contentLength) : 1024 // Default estimate
  }

  private async getCountryFromIP(ip: string): Promise<string | undefined> {
    // In production, use a GeoIP service or database
    try {
      // Placeholder implementation
      return "US"
    } catch {
      return undefined
    }
  }
}

// Singleton instance
let gatewayInstance: MultiTenantApiGateway | null = null

export function getApiGateway(): MultiTenantApiGateway {
  if (!gatewayInstance) {
    gatewayInstance = new MultiTenantApiGateway()
  }
  return gatewayInstance
}

export default MultiTenantApiGateway
