import { createClient } from "@/lib/supabase/client"

interface RateLimitConfig {
  windowMs: number
  maxRequests: number
  keyGenerator?: (context: any) => string
}

interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetTime: number
  retryAfter?: number
}

export class RateLimiter {
  private config: RateLimitConfig
  private supabase = createClient()

  constructor(config: RateLimitConfig) {
    this.config = config
  }

  async checkLimit(context: any): Promise<RateLimitResult> {
    const key = this.config.keyGenerator
      ? this.config.keyGenerator(context)
      : context.user?.id || context.ipAddress
    const now = Date.now()
    const windowStart = now - this.config.windowMs

    try {
      // Clean up old entries
      await this.supabase
        .from("rate_limits")
        .delete()
        .lt("created_at", new Date(windowStart).toISOString())

      // Get current count for this key
      const { data: requests, error } = await this.supabase
        .from("rate_limits")
        .select("*")
        .eq("key", key)
        .gte("created_at", new Date(windowStart).toISOString())

      if (error) {
        console.error("Rate limit check error:", error)
        return {
          allowed: true,
          remaining: this.config.maxRequests,
          resetTime: now + this.config.windowMs,
        }
      }

      const currentCount = requests?.length || 0

      if (currentCount >= this.config.maxRequests) {
        const oldestRequest = requests?.[0]
        const resetTime = oldestRequest
          ? new Date(oldestRequest.created_at).getTime() + this.config.windowMs
          : now + this.config.windowMs

        return {
          allowed: false,
          remaining: 0,
          resetTime,
          retryAfter: Math.ceil((resetTime - now) / 1000),
        }
      }

      // Record this request
      await this.supabase.from("rate_limits").insert({
        key,
        ip_address: context.ipAddress,
        user_id: context.user?.id,
        endpoint: context.endpoint,
        created_at: new Date().toISOString(),
      })

      return {
        allowed: true,
        remaining: this.config.maxRequests - currentCount - 1,
        resetTime: now + this.config.windowMs,
      }
    } catch (error) {
      console.error("Rate limiting error:", error)
      return {
        allowed: true,
        remaining: this.config.maxRequests,
        resetTime: now + this.config.windowMs,
      }
    }
  }

  static createUserLimiter(): RateLimiter {
    return new RateLimiter({
      windowMs: 15 * 60 * 1000, // 15 minutes
      maxRequests: 100,
      keyGenerator: (context) => `user:${context.user?.id || context.ipAddress}`,
    })
  }

  static createAdminLimiter(): RateLimiter {
    return new RateLimiter({
      windowMs: 5 * 60 * 1000, // 5 minutes
      maxRequests: 500,
      keyGenerator: (context) => `admin:${context.user?.id}`,
    })
  }

  static createLoginLimiter(): RateLimiter {
    return new RateLimiter({
      windowMs: 15 * 60 * 1000, // 15 minutes
      maxRequests: 5,
      keyGenerator: (context) => `login:${context.ipAddress}`,
    })
  }
}
