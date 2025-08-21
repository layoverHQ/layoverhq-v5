/**
 * Enterprise API Gateway - Multi-Tenant Request Management
 *
 * Comprehensive API gateway with tenant-based routing, rate limiting,
 * usage tracking, and security enforcement for enterprise customers.
 */

import { NextRequest, NextResponse } from "next/server"
import { createServiceRoleClient } from "@/lib/supabase/service-role"
import { Redis } from "@upstash/redis"
import { getConfigManager } from "./config-manager"
import { EventEmitter } from "events"

export interface ApiKeyConfig {
  id: string
  tenant_id: string
  api_key_hash: string
  permissions: string[]
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
  ip_whitelist?: string[]
  allowed_origins?: string[]
  expires_at?: string
  is_active: boolean
  created_at: string
  last_used_at?: string
}

export interface RateLimitResult {
  allowed: boolean
  limit: number
  remaining: number
  reset_time: number
  retry_after?: number
}

export interface UsageMetrics {
  requests_count: number
  bandwidth_bytes: number
  error_count: number
  avg_response_time: number
  last_request_at: string
}

export interface GatewayRequest {
  tenant_id: string
  api_key: string
  endpoint: string
  method: string
  ip_address: string
  user_agent: string
  origin?: string
  request_size: number
  timestamp: string
}

export interface GatewayResponse {
  status_code: number
  response_size: number
  response_time_ms: number
  cache_hit: boolean
  error_message?: string
}

class EnterpriseApiGateway extends EventEmitter {
  private supabase = createServiceRoleClient()
  private redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL!,
    token: process.env.UPSTASH_REDIS_REST_TOKEN!,
  })
  private configManager = getConfigManager()
  private apiKeyCache = new Map<string, ApiKeyConfig>()
  private readonly CACHE_TTL = 5 * 60 // 5 minutes

  constructor() {
    super()
    this.startCacheRefresh()
  }

  /**
   * Process incoming API request through the gateway
   */
  async processRequest(
    request: NextRequest,
    endpoint: string,
  ): Promise<{ response?: NextResponse; continue?: boolean; context?: any }> {
    const startTime = Date.now()

    try {
      // Extract API key from request
      const apiKey = this.extractApiKey(request)
      if (!apiKey) {
        return {
          response: this.createErrorResponse(401, "API key required", "MISSING_API_KEY"),
        }
      }

      // Validate and get API key configuration
      const apiKeyConfig = await this.validateApiKey(apiKey)
      if (!apiKeyConfig) {
        return {
          response: this.createErrorResponse(401, "Invalid API key", "INVALID_API_KEY"),
        }
      }

      // Check if API key is active and not expired
      if (!apiKeyConfig.is_active) {
        return {
          response: this.createErrorResponse(401, "API key is disabled", "DISABLED_API_KEY"),
        }
      }

      if (apiKeyConfig.expires_at && new Date(apiKeyConfig.expires_at) < new Date()) {
        return {
          response: this.createErrorResponse(401, "API key has expired", "EXPIRED_API_KEY"),
        }
      }

      // Validate IP whitelist
      const clientIp = this.getClientIp(request)
      if (!this.validateIpWhitelist(clientIp, apiKeyConfig.ip_whitelist)) {
        return {
          response: this.createErrorResponse(403, "IP address not allowed", "IP_NOT_WHITELISTED"),
        }
      }

      // Validate origin
      const origin = request.headers.get("origin")
      if (!this.validateOrigin(origin, apiKeyConfig.allowed_origins)) {
        return {
          response: this.createErrorResponse(403, "Origin not allowed", "ORIGIN_NOT_ALLOWED"),
        }
      }

      // Check permissions for the endpoint
      if (!this.hasPermission(endpoint, apiKeyConfig.permissions)) {
        return {
          response: this.createErrorResponse(
            403,
            "Insufficient permissions",
            "INSUFFICIENT_PERMISSIONS",
          ),
        }
      }

      // Apply rate limiting
      const rateLimitResult = await this.checkRateLimit(apiKeyConfig, clientIp)
      if (!rateLimitResult.allowed) {
        return {
          response: this.createRateLimitResponse(rateLimitResult),
        }
      }

      // Track request metrics
      const gatewayRequest: GatewayRequest = {
        tenant_id: apiKeyConfig.tenant_id,
        api_key: apiKey,
        endpoint,
        method: request.method,
        ip_address: clientIp,
        user_agent: request.headers.get("user-agent") || "",
        origin,
        request_size: this.getRequestSize(request),
        timestamp: new Date().toISOString(),
      }

      // Continue with the request, providing context
      return {
        continue: true,
        context: {
          tenant_id: apiKeyConfig.tenant_id,
          api_key_config: apiKeyConfig,
          gateway_request: gatewayRequest,
          start_time: startTime,
          rate_limit_headers: {
            "x-ratelimit-limit": rateLimitResult.limit.toString(),
            "x-ratelimit-remaining": rateLimitResult.remaining.toString(),
            "x-ratelimit-reset": rateLimitResult.reset_time.toString(),
          },
        },
      }
    } catch (error) {
      console.error("Gateway error:", error)
      return {
        response: this.createErrorResponse(500, "Internal gateway error", "GATEWAY_ERROR"),
      }
    }
  }

  /**
   * Process response and track metrics
   */
  async processResponse(response: NextResponse, context: any): Promise<NextResponse> {
    const endTime = Date.now()
    const responseTime = endTime - context.start_time

    try {
      // Create gateway response record
      const gatewayResponse: GatewayResponse = {
        status_code: response.status,
        response_size: this.getResponseSize(response),
        response_time_ms: responseTime,
        cache_hit: response.headers.get("x-cache") === "HIT",
        error_message: response.status >= 400 ? await this.getErrorMessage(response) : undefined,
      }

      // Track usage metrics
      await this.trackUsage(context.gateway_request, gatewayResponse)

      // Add rate limit headers
      Object.entries(context.rate_limit_headers).forEach(([key, value]) => {
        response.headers.set(key, value as string)
      })

      // Add tenant identification header
      response.headers.set("x-tenant-id", context.tenant_id)

      // Log API usage for billing and analytics
      await this.logApiUsage(context.gateway_request, gatewayResponse)

      // Emit usage event for real-time monitoring
      this.emit("apiUsage", {
        tenant_id: context.tenant_id,
        endpoint: context.gateway_request.endpoint,
        response_time: responseTime,
        status_code: response.status,
      })

      return response
    } catch (error) {
      console.error("Error processing response:", error)
      return response
    }
  }

  /**
   * Validate API key and get configuration
   */
  private async validateApiKey(apiKey: string): Promise<ApiKeyConfig | null> {
    try {
      // Check cache first
      if (this.apiKeyCache.has(apiKey)) {
        const cached = this.apiKeyCache.get(apiKey)!
        if (Date.now() - new Date(cached.last_used_at || 0).getTime() < this.CACHE_TTL * 1000) {
          return cached
        }
      }

      // Hash the API key for database lookup
      const apiKeyHash = await this.hashApiKey(apiKey)

      // Query database
      const { data, error } = await this.supabase
        .from("api_credentials")
        .select(
          `
          *,
          enterprises!inner(
            id,
            status,
            subscription_plan,
            rate_limits,
            usage_quotas
          )
        `,
        )
        .eq("api_key_hash", apiKeyHash)
        .eq("is_active", true)
        .single()

      if (error || !data) {
        return null
      }

      // Merge enterprise settings
      const config: ApiKeyConfig = {
        ...data,
        rate_limits: {
          ...data.rate_limits,
          ...data.enterprises.rate_limits,
        },
        usage_quotas: {
          ...data.usage_quotas,
          ...data.enterprises.usage_quotas,
        },
      }

      // Cache the result
      this.apiKeyCache.set(apiKey, config)

      // Update last used timestamp
      await this.updateLastUsed(data.id)

      return config
    } catch (error) {
      console.error("Error validating API key:", error)
      return null
    }
  }

  /**
   * Check rate limits for API key
   */
  private async checkRateLimit(
    apiKeyConfig: ApiKeyConfig,
    clientIp: string,
  ): Promise<RateLimitResult> {
    try {
      const now = Date.now()
      const minute = Math.floor(now / 60000)
      const hour = Math.floor(now / 3600000)
      const day = Math.floor(now / 86400000)

      // Rate limit keys
      const keyPrefix = `ratelimit:${apiKeyConfig.tenant_id}:${apiKeyConfig.id}`
      const minuteKey = `${keyPrefix}:${minute}`
      const hourKey = `${keyPrefix}:hour:${hour}`
      const dayKey = `${keyPrefix}:day:${day}`

      // Get current counts
      const [minuteCount, hourCount, dayCount] = await Promise.all([
        this.redis.get(minuteKey),
        this.redis.get(hourKey),
        this.redis.get(dayKey),
      ])

      const limits = apiKeyConfig.rate_limits
      const current = {
        minute: Number(minuteCount) || 0,
        hour: Number(hourCount) || 0,
        day: Number(dayCount) || 0,
      }

      // Check each limit
      if (current.minute >= limits.requests_per_minute) {
        return {
          allowed: false,
          limit: limits.requests_per_minute,
          remaining: 0,
          reset_time: (minute + 1) * 60,
          retry_after: 60 - (now % 60000) / 1000,
        }
      }

      if (current.hour >= limits.requests_per_hour) {
        return {
          allowed: false,
          limit: limits.requests_per_hour,
          remaining: 0,
          reset_time: (hour + 1) * 3600,
          retry_after: 3600 - (now % 3600000) / 1000,
        }
      }

      if (current.day >= limits.requests_per_day) {
        return {
          allowed: false,
          limit: limits.requests_per_day,
          remaining: 0,
          reset_time: (day + 1) * 86400,
          retry_after: 86400 - (now % 86400000) / 1000,
        }
      }

      // Increment counters
      const pipeline = this.redis.pipeline()
      pipeline.incr(minuteKey)
      pipeline.expire(minuteKey, 60)
      pipeline.incr(hourKey)
      pipeline.expire(hourKey, 3600)
      pipeline.incr(dayKey)
      pipeline.expire(dayKey, 86400)
      await pipeline.exec()

      return {
        allowed: true,
        limit: limits.requests_per_minute,
        remaining: limits.requests_per_minute - current.minute - 1,
        reset_time: (minute + 1) * 60,
      }
    } catch (error) {
      console.error("Rate limit check error:", error)
      // Allow request on error to avoid blocking
      return {
        allowed: true,
        limit: 1000,
        remaining: 999,
        reset_time: Date.now() + 60000,
      }
    }
  }

  /**
   * Track usage metrics for billing and analytics
   */
  private async trackUsage(request: GatewayRequest, response: GatewayResponse): Promise<void> {
    try {
      const usageKey = `usage:${request.tenant_id}:${new Date().toISOString().slice(0, 7)}` // Monthly

      // Increment usage counters
      const pipeline = this.redis.pipeline()
      pipeline.hincrby(usageKey, "requests_count", 1)
      pipeline.hincrby(usageKey, "bandwidth_bytes", request.request_size + response.response_size)
      if (response.status_code >= 400) {
        pipeline.hincrby(usageKey, "error_count", 1)
      }
      pipeline.hset(usageKey, { last_request_at: request.timestamp })
      pipeline.expire(usageKey, 86400 * 32) // Keep for 32 days

      // Update rolling average response time
      const responseTimeKey = `response_time:${request.tenant_id}`
      pipeline.lpush(responseTimeKey, response.response_time_ms)
      pipeline.ltrim(responseTimeKey, 0, 99) // Keep last 100 responses
      pipeline.expire(responseTimeKey, 3600) // 1 hour

      await pipeline.exec()
    } catch (error) {
      console.error("Error tracking usage:", error)
    }
  }

  /**
   * Log API usage to database for detailed analytics
   */
  private async logApiUsage(request: GatewayRequest, response: GatewayResponse): Promise<void> {
    try {
      await this.supabase.from("api_usage_logs").insert({
        enterprise_id: request.tenant_id,
        endpoint: request.endpoint,
        method: request.method,
        response_status: response.status_code,
        response_time_ms: response.response_time_ms,
        request_size_bytes: request.request_size,
        response_size_bytes: response.response_size,
        ip_address: request.ip_address,
        user_agent: request.user_agent,
        error_message: response.error_message,
        billable_operation: response.status_code < 400,
        operation_cost: this.calculateOperationCost(request, response),
        quota_consumed: 1,
        timestamp: request.timestamp,
      })
    } catch (error) {
      console.error("Error logging API usage:", error)
    }
  }

  /**
   * Helper methods
   */

  private extractApiKey(request: NextRequest): string | null {
    // Check Authorization header
    const authHeader = request.headers.get("authorization")
    if (authHeader?.startsWith("Bearer ")) {
      return authHeader.slice(7)
    }

    // Check x-api-key header
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

  private getClientIp(request: NextRequest): string {
    return (
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      request.headers.get("cf-connecting-ip") ||
      "127.0.0.1"
    )
  }

  private validateIpWhitelist(ip: string, whitelist?: string[]): boolean {
    if (!whitelist || whitelist.length === 0) return true
    return whitelist.includes(ip) || whitelist.includes("0.0.0.0/0")
  }

  private validateOrigin(origin: string | null, allowedOrigins?: string[]): boolean {
    if (!allowedOrigins || allowedOrigins.length === 0) return true
    if (!origin) return false
    return allowedOrigins.includes(origin) || allowedOrigins.includes("*")
  }

  private hasPermission(endpoint: string, permissions: string[]): boolean {
    if (permissions.includes("*")) return true

    // Check exact match
    if (permissions.includes(endpoint)) return true

    // Check wildcard patterns
    return permissions.some((permission) => {
      if (permission.endsWith("*")) {
        const prefix = permission.slice(0, -1)
        return endpoint.startsWith(prefix)
      }
      return false
    })
  }

  private getRequestSize(request: NextRequest): number {
    const contentLength = request.headers.get("content-length")
    return contentLength ? parseInt(contentLength, 10) : 0
  }

  private getResponseSize(response: NextResponse): number {
    const contentLength = response.headers.get("content-length")
    return contentLength ? parseInt(contentLength, 10) : 0
  }

  private async getErrorMessage(response: NextResponse): Promise<string | undefined> {
    try {
      const text = await response.clone().text()
      const json = JSON.parse(text)
      return json.error || json.message
    } catch {
      return undefined
    }
  }

  private calculateOperationCost(request: GatewayRequest, response: GatewayResponse): number {
    // Base cost per request
    let cost = 0.001

    // Add cost based on response time (premium for fast responses)
    if (response.response_time_ms < 100) {
      cost += 0.0005
    } else if (response.response_time_ms > 1000) {
      cost -= 0.0002
    }

    // Add cost based on data transfer
    const totalBytes = request.request_size + response.response_size
    cost += (totalBytes / 1024 / 1024) * 0.01 // $0.01 per MB

    return cost
  }

  private async hashApiKey(apiKey: string): Promise<string> {
    const encoder = new TextEncoder()
    const data = encoder.encode(apiKey)
    const hashBuffer = await crypto.subtle.digest("SHA-256", data)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("")
  }

  private async updateLastUsed(apiKeyId: string): Promise<void> {
    try {
      await this.supabase
        .from("api_credentials")
        .update({ last_used_at: new Date().toISOString() })
        .eq("id", apiKeyId)
    } catch (error) {
      console.error("Error updating last used:", error)
    }
  }

  private createErrorResponse(status: number, message: string, code: string): NextResponse {
    return NextResponse.json(
      {
        error: {
          message,
          code,
          timestamp: new Date().toISOString(),
        },
      },
      { status },
    )
  }

  private createRateLimitResponse(rateLimitResult: RateLimitResult): NextResponse {
    const response = NextResponse.json(
      {
        error: {
          message: "Rate limit exceeded",
          code: "RATE_LIMIT_EXCEEDED",
          timestamp: new Date().toISOString(),
        },
      },
      { status: 429 },
    )

    response.headers.set("x-ratelimit-limit", rateLimitResult.limit.toString())
    response.headers.set("x-ratelimit-remaining", rateLimitResult.remaining.toString())
    response.headers.set("x-ratelimit-reset", rateLimitResult.reset_time.toString())

    if (rateLimitResult.retry_after) {
      response.headers.set("retry-after", Math.ceil(rateLimitResult.retry_after).toString())
    }

    return response
  }

  private startCacheRefresh(): void {
    // Refresh API key cache every 5 minutes
    setInterval(() => {
      this.apiKeyCache.clear()
    }, this.CACHE_TTL * 1000)
  }

  /**
   * Get usage metrics for a tenant
   */
  async getUsageMetrics(
    tenantId: string,
    period: "hour" | "day" | "month" = "month",
  ): Promise<UsageMetrics> {
    try {
      let usageKey: string
      const now = new Date()

      switch (period) {
        case "hour":
          usageKey = `usage:${tenantId}:${now.toISOString().slice(0, 13)}` // YYYY-MM-DDTHH
          break
        case "day":
          usageKey = `usage:${tenantId}:${now.toISOString().slice(0, 10)}` // YYYY-MM-DD
          break
        case "month":
        default:
          usageKey = `usage:${tenantId}:${now.toISOString().slice(0, 7)}` // YYYY-MM
          break
      }

      const usage = await this.redis.hgetall(usageKey)
      const responseTimeKey = `response_time:${tenantId}`
      const responseTimes = await this.redis.lrange(responseTimeKey, 0, -1)

      const avgResponseTime =
        responseTimes.length > 0
          ? responseTimes.reduce((sum, time) => sum + Number(time), 0) / responseTimes.length
          : 0

      return {
        requests_count: Number(usage.requests_count) || 0,
        bandwidth_bytes: Number(usage.bandwidth_bytes) || 0,
        error_count: Number(usage.error_count) || 0,
        avg_response_time: avgResponseTime,
        last_request_at: (usage as any).last_request_at || "",
      }
    } catch (error) {
      console.error("Error getting usage metrics:", error)
      return {
        requests_count: 0,
        bandwidth_bytes: 0,
        error_count: 0,
        avg_response_time: 0,
        last_request_at: "",
      }
    }
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    this.removeAllListeners()
  }
}

// Singleton instance
let apiGatewayInstance: EnterpriseApiGateway | null = null

export function getEnterpriseApiGateway(): EnterpriseApiGateway {
  if (!apiGatewayInstance) {
    apiGatewayInstance = new EnterpriseApiGateway()
  }
  return apiGatewayInstance
}

export default EnterpriseApiGateway
