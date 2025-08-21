import { createClient } from "@/lib/supabase/server"

export interface CacheEntry<T = any> {
  key: string
  value: T
  ttl: number
  createdAt: number
  lastAccessed: number
  hitCount: number
  tags?: string[]
}

export interface CacheOptions {
  ttl?: number // Time to live in milliseconds
  tags?: string[] // For cache invalidation by tags
  serialize?: boolean // Whether to serialize complex objects
  compress?: boolean // Whether to compress large values
}

export interface CacheStats {
  hits: number
  misses: number
  hitRate: number
  totalKeys: number
  memoryUsage: number
  evictions: number
}

export class CacheManager {
  private cache = new Map<string, CacheEntry>()
  private stats: CacheStats = {
    hits: 0,
    misses: 0,
    hitRate: 0,
    totalKeys: 0,
    memoryUsage: 0,
    evictions: 0,
  }
  private cleanupInterval: NodeJS.Timeout | null = null
  private maxMemoryMB: number
  private maxKeys: number

  constructor(
    options: { maxMemoryMB?: number; maxKeys?: number; cleanupIntervalMs?: number } = {},
  ) {
    this.maxMemoryMB = options.maxMemoryMB || 100
    this.maxKeys = options.maxKeys || 10000

    // Start cleanup interval
    this.cleanupInterval = setInterval(() => {
      this.cleanup()
    }, options.cleanupIntervalMs || 60000) // Every minute
  }

  // Get value from cache
  async get<T>(key: string): Promise<T | null> {
    const entry = this.cache.get(key)

    if (!entry) {
      this.stats.misses++
      this.updateHitRate()
      return null
    }

    // Check if expired
    if (Date.now() > entry.createdAt + entry.ttl) {
      this.cache.delete(key)
      this.stats.misses++
      this.stats.evictions++
      this.updateHitRate()
      return null
    }

    // Update access stats
    entry.lastAccessed = Date.now()
    entry.hitCount++
    this.stats.hits++
    this.updateHitRate()

    return entry.value as T
  }

  // Set value in cache
  async set<T>(key: string, value: T, options: CacheOptions = {}): Promise<void> {
    const ttl = options.ttl || 3600000 // Default 1 hour
    const now = Date.now()

    // Check memory limits before adding
    if (this.cache.size >= this.maxKeys) {
      await this.evictLRU()
    }

    const entry: CacheEntry<T> = {
      key,
      value,
      ttl,
      createdAt: now,
      lastAccessed: now,
      hitCount: 0,
      tags: options.tags,
    }

    this.cache.set(key, entry)
    this.stats.totalKeys = this.cache.size
    this.updateMemoryUsage()

    // Persist to database for durability (optional)
    if (ttl > 3600000) {
      // Only persist long-lived cache entries
      await this.persistToDatabase(key, entry)
    }
  }

  // Delete specific key
  async delete(key: string): Promise<boolean> {
    const deleted = this.cache.delete(key)
    if (deleted) {
      this.stats.totalKeys = this.cache.size
      this.updateMemoryUsage()

      // Remove from database
      await this.removeFromDatabase(key)
    }
    return deleted
  }

  // Clear all cache
  async clear(): Promise<void> {
    this.cache.clear()
    this.stats.totalKeys = 0
    this.stats.memoryUsage = 0

    // Clear database cache
    const supabase = await createClient()
    await supabase.from("cache_entries").delete().neq("id", "00000000-0000-0000-0000-000000000000")
  }

  // Invalidate by tags
  async invalidateByTags(tags: string[]): Promise<number> {
    let invalidated = 0

    for (const [key, entry] of this.cache.entries()) {
      if (entry.tags && entry.tags.some((tag) => tags.includes(tag))) {
        this.cache.delete(key)
        invalidated++
      }
    }

    this.stats.totalKeys = this.cache.size
    this.stats.evictions += invalidated
    this.updateMemoryUsage()

    return invalidated
  }

  // Get or set pattern (cache-aside)
  async getOrSet<T>(
    key: string,
    factory: () => Promise<T>,
    options: CacheOptions = {},
  ): Promise<T> {
    const cached = await this.get<T>(key)
    if (cached !== null) {
      return cached
    }

    const value = await factory()
    await this.set(key, value, options)
    return value
  }

  // Warm cache with predefined data
  async warmCache(
    entries: Array<{ key: string; factory: () => Promise<any>; options?: CacheOptions }>,
  ): Promise<void> {
    const promises = entries.map(async ({ key, factory, options }) => {
      try {
        const value = await factory()
        await this.set(key, value, options)
      } catch (error) {
        console.error(`Failed to warm cache for key ${key}:`, error)
      }
    })

    await Promise.allSettled(promises)
  }

  // Get cache statistics
  getStats(): CacheStats {
    return { ...this.stats }
  }

  // Get all keys matching pattern
  getKeys(pattern?: RegExp): string[] {
    const keys = Array.from(this.cache.keys())
    return pattern ? keys.filter((key) => pattern.test(key)) : keys
  }

  // Private methods
  private async cleanup(): Promise<void> {
    const now = Date.now()
    let cleaned = 0

    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.createdAt + entry.ttl) {
        this.cache.delete(key)
        cleaned++
      }
    }

    if (cleaned > 0) {
      this.stats.totalKeys = this.cache.size
      this.stats.evictions += cleaned
      this.updateMemoryUsage()
    }
  }

  private async evictLRU(): Promise<void> {
    let oldestKey = ""
    let oldestTime = Date.now()

    for (const [key, entry] of this.cache.entries()) {
      if (entry.lastAccessed < oldestTime) {
        oldestTime = entry.lastAccessed
        oldestKey = key
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey)
      this.stats.evictions++
    }
  }

  private updateHitRate(): void {
    const total = this.stats.hits + this.stats.misses
    this.stats.hitRate = total > 0 ? this.stats.hits / total : 0
  }

  private updateMemoryUsage(): void {
    // Rough estimation of memory usage
    let size = 0
    for (const entry of this.cache.values()) {
      size += JSON.stringify(entry).length
    }
    this.stats.memoryUsage = size / (1024 * 1024) // Convert to MB
  }

  private async persistToDatabase(key: string, entry: CacheEntry): Promise<void> {
    try {
      const supabase = await createClient()
      await supabase.from("cache_entries").upsert({
        cache_key: key,
        value: entry.value,
        ttl: entry.ttl,
        tags: entry.tags || [],
        created_at: new Date(entry.createdAt).toISOString(),
        expires_at: new Date(entry.createdAt + entry.ttl).toISOString(),
      })
    } catch (error) {
      console.error("Failed to persist cache entry:", error)
    }
  }

  private async removeFromDatabase(key: string): Promise<void> {
    try {
      const supabase = await createClient()
      await supabase.from("cache_entries").delete().eq("cache_key", key)
    } catch (error) {
      console.error("Failed to remove cache entry from database:", error)
    }
  }

  // Load cache from database on startup
  async loadFromDatabase(): Promise<void> {
    try {
      const supabase = await createClient()
      const { data: entries } = await supabase
        .from("cache_entries")
        .select("*")
        .gt("expires_at", new Date().toISOString())

      for (const entry of entries || []) {
        const cacheEntry: CacheEntry = {
          key: entry.cache_key,
          value: entry.value,
          ttl: entry.ttl,
          createdAt: new Date(entry.created_at).getTime(),
          lastAccessed: new Date(entry.created_at).getTime(),
          hitCount: 0,
          tags: entry.tags,
        }

        this.cache.set(entry.cache_key, cacheEntry)
      }

      this.stats.totalKeys = this.cache.size
      this.updateMemoryUsage()
    } catch (error) {
      console.error("Failed to load cache from database:", error)
    }
  }

  // Cleanup resources
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
      this.cleanupInterval = null
    }
    this.cache.clear()
  }
}

// Global cache manager instance
export const cacheManager = new CacheManager({
  maxMemoryMB: 200,
  maxKeys: 50000,
  cleanupIntervalMs: 30000,
})

// Cache key builders
export const CacheKeys = {
  session: (sessionId: string) => `session:${sessionId}`,
  user: (userId: string) => `user:${userId}`,
  userProfile: (userId: string) => `user:profile:${userId}`,
  flight: (flightId: string) => `flight:${flightId}`,
  flightSearch: (params: string) => `flight:search:${params}`,
  booking: (bookingId: string) => `booking:${bookingId}`,
  userBookings: (userId: string) => `user:bookings:${userId}`,
  layoverPackages: (airportCode: string) => `layover:packages:${airportCode}`,
  integrationStatus: (integrationId: string) => `integration:status:${integrationId}`,
  systemHealth: () => "system:health",
  dashboardStats: () => "dashboard:stats",
  flightRoutes: (origin: string, destination: string) => `routes:${origin}:${destination}`,
}

// Cache tags for invalidation
export const CacheTags = {
  USER: "user",
  FLIGHT: "flight",
  BOOKING: "booking",
  LAYOVER: "layover",
  INTEGRATION: "integration",
  SYSTEM: "system",
  ANALYTICS: "analytics",
}

// Helper functions for common caching patterns
export const CacheHelpers = {
  // Cache flight search results
  cacheFlightSearch: async (searchParams: any, results: any) => {
    const key = CacheKeys.flightSearch(JSON.stringify(searchParams))
    await cacheManager.set(key, results, {
      ttl: 300000, // 5 minutes
      tags: [CacheTags.FLIGHT],
    })
  },

  // Cache user bookings
  cacheUserBookings: async (userId: string, bookings: any) => {
    const key = CacheKeys.userBookings(userId)
    await cacheManager.set(key, bookings, {
      ttl: 600000, // 10 minutes
      tags: [CacheTags.USER, CacheTags.BOOKING],
    })
  },

  // Cache system health
  cacheSystemHealth: async (healthData: any) => {
    const key = CacheKeys.systemHealth()
    await cacheManager.set(key, healthData, {
      ttl: 60000, // 1 minute
      tags: [CacheTags.SYSTEM],
    })
  },

  // Invalidate user-related cache
  invalidateUserCache: async (userId: string) => {
    await cacheManager.delete(CacheKeys.user(userId))
    await cacheManager.delete(CacheKeys.userProfile(userId))
    await cacheManager.delete(CacheKeys.userBookings(userId))
  },

  // Invalidate flight-related cache
  invalidateFlightCache: async () => {
    await cacheManager.invalidateByTags([CacheTags.FLIGHT])
  },
}
