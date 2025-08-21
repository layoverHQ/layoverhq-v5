import { Redis } from "@upstash/redis"
import { cacheManager, CacheOptions } from "./cache-manager"
import { errorTracker } from "./error-tracking"

// Redis configuration
const REDIS_URL = process.env.UPSTASH_REDIS_REST_URL
const REDIS_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN

export interface RedisCacheOptions extends CacheOptions {
  useLocalFallback?: boolean
  keyPrefix?: string
  serializer?: "json" | "string" | "msgpack"
}

export class RedisCache {
  private redis: Redis | null = null
  private isConnected = false
  private connectionAttempts = 0
  private maxConnectionAttempts = 3

  constructor() {
    this.initializeRedis()
  }

  private async initializeRedis(): Promise<void> {
    if (!REDIS_URL || !REDIS_TOKEN) {
      console.warn("Redis credentials not found, falling back to local cache")
      return
    }

    try {
      this.redis = new Redis({
        url: REDIS_URL,
        token: REDIS_TOKEN,
        retry: {
          retries: 3,
          backoff: (retryCount) => Math.exp(retryCount) * 50,
        },
      })

      // Test connection
      await this.redis.ping()
      this.isConnected = true
      this.connectionAttempts = 0
      console.log("Redis cache initialized successfully")
    } catch (error) {
      this.connectionAttempts++
      console.error(`Redis connection failed (attempt ${this.connectionAttempts}):`, error)

      if (this.connectionAttempts < this.maxConnectionAttempts) {
        // Retry after delay
        setTimeout(() => this.initializeRedis(), 5000 * this.connectionAttempts)
      } else {
        console.warn("Max Redis connection attempts reached, falling back to local cache")
      }

      await errorTracker.trackError(error as Error, {
        service: "redis-cache",
        operation: "initialize",
        metadata: { attempts: this.connectionAttempts },
      })
    }
  }

  async get<T>(key: string, options: RedisCacheOptions = {}): Promise<T | null> {
    const finalKey = this.buildKey(key, options.keyPrefix)

    try {
      if (this.isConnected && this.redis) {
        const value = await this.redis.get(finalKey)

        if (value !== null) {
          return this.deserialize<T>(value, options.serializer)
        }
      }

      // Fallback to local cache
      if (options.useLocalFallback !== false) {
        return await cacheManager.get<T>(finalKey)
      }

      return null
    } catch (error) {
      console.error(`Redis get failed for key ${finalKey}:`, error)

      // Fallback to local cache
      if (options.useLocalFallback !== false) {
        return await cacheManager.get<T>(finalKey)
      }

      return null
    }
  }

  async set<T>(key: string, value: T, options: RedisCacheOptions = {}): Promise<boolean> {
    const finalKey = this.buildKey(key, options.keyPrefix)
    const ttlSeconds = options.ttl ? Math.ceil(options.ttl / 1000) : 3600

    try {
      if (this.isConnected && this.redis) {
        const serializedValue = this.serialize(value, options.serializer)

        if (options.ttl) {
          await this.redis.setex(finalKey, ttlSeconds, serializedValue)
        } else {
          await this.redis.set(finalKey, serializedValue)
        }

        // Also store in local cache for faster access
        if (options.useLocalFallback !== false) {
          await cacheManager.set(finalKey, value, options)
        }

        return true
      }

      // Fallback to local cache only
      if (options.useLocalFallback !== false) {
        await cacheManager.set(finalKey, value, options)
        return true
      }

      return false
    } catch (error) {
      console.error(`Redis set failed for key ${finalKey}:`, error)

      // Fallback to local cache
      if (options.useLocalFallback !== false) {
        await cacheManager.set(finalKey, value, options)
        return true
      }

      return false
    }
  }

  async delete(key: string, options: RedisCacheOptions = {}): Promise<boolean> {
    const finalKey = this.buildKey(key, options.keyPrefix)

    try {
      let redisResult = false

      if (this.isConnected && this.redis) {
        const result = await this.redis.del(finalKey)
        redisResult = result > 0
      }

      // Also delete from local cache
      if (options.useLocalFallback !== false) {
        await cacheManager.delete(finalKey)
      }

      return redisResult
    } catch (error) {
      console.error(`Redis delete failed for key ${finalKey}:`, error)

      // Fallback to local cache delete
      if (options.useLocalFallback !== false) {
        return await cacheManager.delete(finalKey)
      }

      return false
    }
  }

  async exists(key: string, options: RedisCacheOptions = {}): Promise<boolean> {
    const finalKey = this.buildKey(key, options.keyPrefix)

    try {
      if (this.isConnected && this.redis) {
        const result = await this.redis.exists(finalKey)
        return result > 0
      }

      // Fallback to local cache
      if (options.useLocalFallback !== false) {
        const value = await cacheManager.get(finalKey)
        return value !== null
      }

      return false
    } catch (error) {
      console.error(`Redis exists failed for key ${finalKey}:`, error)
      return false
    }
  }

  async invalidatePattern(pattern: string, options: RedisCacheOptions = {}): Promise<number> {
    const finalPattern = this.buildKey(pattern, options.keyPrefix)

    try {
      let deletedCount = 0

      if (this.isConnected && this.redis) {
        // Use scan to find matching keys
        const keys = await this.scanKeys(finalPattern)

        if (keys.length > 0) {
          const result = await this.redis.del(...keys)
          deletedCount = result
        }
      }

      // Also invalidate local cache by tags
      if (options.useLocalFallback !== false && options.tags) {
        await cacheManager.invalidateByTags(options.tags)
      }

      return deletedCount
    } catch (error) {
      console.error(`Redis pattern invalidation failed for ${finalPattern}:`, error)
      return 0
    }
  }

  async getOrSet<T>(
    key: string,
    factory: () => Promise<T>,
    options: RedisCacheOptions = {},
  ): Promise<T> {
    const cached = await this.get<T>(key, options)

    if (cached !== null) {
      return cached
    }

    const value = await factory()
    await this.set(key, value, options)
    return value
  }

  // Specialized caching methods for LayoverHQ

  async cacheFlightSearch(
    searchParams: any,
    results: any,
    ttl: number = 300000, // 5 minutes
  ): Promise<void> {
    const key = `flight:search:${this.hashObject(searchParams)}`
    await this.set(key, results, {
      ttl,
      tags: ["flight", "search"],
      keyPrefix: "layoverhq",
      useLocalFallback: true,
    })
  }

  async getCachedFlightSearch(searchParams: any): Promise<any | null> {
    const key = `flight:search:${this.hashObject(searchParams)}`
    return await this.get(key, {
      keyPrefix: "layoverhq",
      useLocalFallback: true,
    })
  }

  async cacheViatorExperiences(
    city: string,
    params: any,
    experiences: any[],
    ttl: number = 1800000, // 30 minutes
  ): Promise<void> {
    const key = `viator:experiences:${city}:${this.hashObject(params)}`
    await this.set(key, experiences, {
      ttl,
      tags: ["viator", "experiences", `city:${city}`],
      keyPrefix: "layoverhq",
      useLocalFallback: true,
    })
  }

  async getCachedViatorExperiences(city: string, params: any): Promise<any[] | null> {
    const key = `viator:experiences:${city}:${this.hashObject(params)}`
    return await this.get(key, {
      keyPrefix: "layoverhq",
      useLocalFallback: true,
    })
  }

  async cacheLayoverAnalysis(
    routeKey: string,
    analysis: any,
    ttl: number = 3600000, // 1 hour
  ): Promise<void> {
    const key = `layover:analysis:${routeKey}`
    await this.set(key, analysis, {
      ttl,
      tags: ["layover", "analysis"],
      keyPrefix: "layoverhq",
      useLocalFallback: true,
    })
  }

  async getCachedLayoverAnalysis(routeKey: string): Promise<any | null> {
    const key = `layover:analysis:${routeKey}`
    return await this.get(key, {
      keyPrefix: "layoverhq",
      useLocalFallback: true,
    })
  }

  async cacheUserSession(
    userId: string,
    sessionData: any,
    ttl: number = 86400000, // 24 hours
  ): Promise<void> {
    const key = `user:session:${userId}`
    await this.set(key, sessionData, {
      ttl,
      tags: ["user", "session"],
      keyPrefix: "layoverhq",
      useLocalFallback: false, // Don't store sensitive data locally
    })
  }

  async getCachedUserSession(userId: string): Promise<any | null> {
    const key = `user:session:${userId}`
    return await this.get(key, {
      keyPrefix: "layoverhq",
      useLocalFallback: false,
    })
  }

  // Performance monitoring
  async getConnectionStatus(): Promise<{
    redis: boolean
    localCache: boolean
    connectionAttempts: number
  }> {
    return {
      redis: this.isConnected,
      localCache: true,
      connectionAttempts: this.connectionAttempts,
    }
  }

  async getCacheStats(): Promise<{
    redis?: any
    localCache: any
  }> {
    const stats: any = {
      localCache: cacheManager.getStats(),
    }

    if (this.isConnected && this.redis) {
      try {
        // Redis stats not available with Upstash Redis client
        stats.redis = { connected: true }
      } catch (error) {
        console.error("Failed to get Redis stats:", error)
      }
    }

    return stats
  }

  // Private helper methods

  private buildKey(key: string, prefix?: string): string {
    return prefix ? `${prefix}:${key}` : key
  }

  private serialize(value: any, serializer: string = "json"): string {
    switch (serializer) {
      case "string":
        return String(value)
      case "json":
      default:
        return JSON.stringify(value)
    }
  }

  private deserialize<T>(value: any, serializer: string = "json"): T {
    switch (serializer) {
      case "string":
        return value as T
      case "json":
      default:
        return JSON.parse(value) as T
    }
  }

  private hashObject(obj: any): string {
    return Buffer.from(JSON.stringify(obj)).toString("base64").slice(0, 20)
  }

  private async scanKeys(pattern: string): Promise<string[]> {
    if (!this.redis) return []

    const keys: string[] = []
    let cursor = 0

    do {
      const result = await this.redis.scan(cursor, {
        match: pattern,
        count: 100,
      })

      cursor = Number(result[0])
      keys.push(...result[1])
    } while (cursor !== 0)

    return keys
  }

  private parseRedisInfo(info: string): any {
    const lines = info.split("\r\n")
    const parsed: any = {}

    for (const line of lines) {
      if (line.includes(":")) {
        const [key, value] = line.split(":")
        parsed[key] = isNaN(Number(value)) ? value : Number(value)
      }
    }

    return parsed
  }
}

// Global Redis cache instance
export const redisCache = new RedisCache()

// Enhanced cache helpers that use Redis
export const EnhancedCacheHelpers = {
  // Flight search caching with Redis
  cacheFlightSearch: async (searchParams: any, results: any) => {
    await redisCache.cacheFlightSearch(searchParams, results)
  },

  getCachedFlightSearch: async (searchParams: any) => {
    return await redisCache.getCachedFlightSearch(searchParams)
  },

  // Viator experiences caching
  cacheViatorExperiences: async (city: string, params: any, experiences: any[]) => {
    await redisCache.cacheViatorExperiences(city, params, experiences)
  },

  getCachedViatorExperiences: async (city: string, params: any) => {
    return await redisCache.getCachedViatorExperiences(city, params)
  },

  // Layover analysis caching
  cacheLayoverAnalysis: async (routeKey: string, analysis: any) => {
    await redisCache.cacheLayoverAnalysis(routeKey, analysis)
  },

  getCachedLayoverAnalysis: async (routeKey: string) => {
    return await redisCache.getCachedLayoverAnalysis(routeKey)
  },

  // Warm critical cache entries
  warmCriticalCache: async () => {
    console.log("Warming critical cache entries...")

    const popularRoutes = [
      { origin: "JFK", destination: "LHR" },
      { origin: "LAX", destination: "NRT" },
      { origin: "DXB", destination: "LHR" },
      { origin: "IST", destination: "JFK" },
    ]

    const popularCities = ["Dubai", "Istanbul", "Singapore", "Amsterdam", "Doha"]

    // Warm flight search cache for popular routes
    const flightPromises = popularRoutes.map(async (route) => {
      try {
        // This would normally call the actual flight search API
        // For now, we'll cache a placeholder
        await redisCache.cacheFlightSearch(
          { ...route, departureDate: new Date().toISOString().split("T")[0] },
          { cached: true, warmed: true, timestamp: Date.now() },
        )
      } catch (error) {
        console.error(`Failed to warm cache for route ${route.origin}-${route.destination}:`, error)
      }
    })

    // Warm Viator experiences cache for popular cities
    const viatorPromises = popularCities.map(async (city) => {
      try {
        await redisCache.cacheViatorExperiences(city, { maxDurationHours: 6 }, [
          { cached: true, warmed: true, city, timestamp: Date.now() },
        ])
      } catch (error) {
        console.error(`Failed to warm Viator cache for ${city}:`, error)
      }
    })

    await Promise.allSettled([...flightPromises, ...viatorPromises])
    console.log("Cache warming completed")
  },

  // Invalidate all flight-related cache
  invalidateFlightCache: async () => {
    await redisCache.invalidatePattern("layoverhq:flight:*", {
      tags: ["flight"],
      useLocalFallback: true,
    })
  },

  // Invalidate city-specific cache
  invalidateCityCache: async (city: string) => {
    await redisCache.invalidatePattern(`layoverhq:*:*${city}*`, {
      tags: [`city:${city}`],
      useLocalFallback: true,
    })
  },
}
