/**
 * Enterprise Cache Manager for LayoverHQ
 *
 * Integrates with existing Redis setup to provide:
 * - Multi-level caching strategy
 * - Intelligent cache invalidation
 * - Cache warming and preloading
 * - Performance analytics
 * - Multi-tenant cache isolation
 */

import { Redis } from "@upstash/redis"
import { getConnectionPoolManager } from "@/lib/database/connection-pool-manager"
import { getConfigManager } from "@/lib/services/config-manager"

export interface CacheConfig {
  // Basic configuration
  defaultTtl: number
  maxKeyLength: number
  maxValueSize: number

  // Multi-level strategy
  l1Cache: {
    enabled: boolean
    maxMemoryMB: number
    evictionPolicy: "lru" | "lfu" | "ttl"
  }

  l2Cache: {
    enabled: boolean
    redisUrl: string
    maxConnections: number
  }

  l3Cache: {
    enabled: boolean
    useDatabase: boolean
  }

  // Performance optimization
  compression: {
    enabled: boolean
    algorithm: "gzip" | "lz4"
    threshold: number
  }

  serialization: {
    format: "json" | "msgpack"
  }

  // Multi-tenant isolation
  tenantIsolation: boolean
  tenantKeyPrefix: string
}

export interface CacheEntry<T = any> {
  key: string
  value: T
  ttl: number
  tags: string[]
  metadata: {
    createdAt: Date
    accessCount: number
    lastAccessed: Date
    dataSize: number
    compressionRatio?: number
  }
}

export interface CacheMetrics {
  hits: number
  misses: number
  hitRatio: number
  operations: number
  totalKeys: number
  totalMemoryUsage: number
  averageKeySize: number
  topKeys: Array<{ key: string; accessCount: number }>
  errorCount: number
}

export interface CacheInvalidationRule {
  pattern: string
  triggers: string[]
  strategy: "immediate" | "lazy" | "scheduled"
  dependencies?: string[]
}

class EnterpriseCacheManager {
  private redis: Redis
  private l1Cache: Map<string, CacheEntry> = new Map()
  private configManager = getConfigManager()
  private connectionPool = getConnectionPoolManager()

  private metrics: Map<string, CacheMetrics> = new Map()
  private invalidationRules: Map<string, CacheInvalidationRule> = new Map()
  private compressionEnabled = false

  private readonly DEFAULT_CONFIG: CacheConfig = {
    defaultTtl: 3600,
    maxKeyLength: 250,
    maxValueSize: 10 * 1024 * 1024, // 10MB
    l1Cache: {
      enabled: true,
      maxMemoryMB: 256,
      evictionPolicy: "lru",
    },
    l2Cache: {
      enabled: true,
      redisUrl: process.env.UPSTASH_REDIS_REST_URL || "",
      maxConnections: 20,
    },
    l3Cache: {
      enabled: true,
      useDatabase: true,
    },
    compression: {
      enabled: true,
      algorithm: "gzip",
      threshold: 1024,
    },
    serialization: {
      format: "json",
    },
    tenantIsolation: true,
    tenantKeyPrefix: "tenant",
  }

  constructor(config?: Partial<CacheConfig>) {
    const finalConfig = { ...this.DEFAULT_CONFIG, ...config }

    // Initialize Redis connection
    this.redis = new Redis({
      url: finalConfig.l2Cache.redisUrl,
      token: process.env.UPSTASH_REDIS_REST_TOKEN || "",
    })

    this.compressionEnabled = finalConfig.compression.enabled

    // Set up default invalidation rules
    this.setupDefaultInvalidationRules()

    // Start monitoring
    this.startMetricsCollection()
  }

  /**
   * Multi-level cache retrieval with intelligent fallback
   */
  async get<T = any>(
    key: string,
    options: {
      tenantId?: string
      fallbackFunction?: () => Promise<T>
      ttl?: number
      tags?: string[]
      useL1?: boolean
      useL2?: boolean
      useL3?: boolean
    } = {},
  ): Promise<T | null> {
    const {
      tenantId,
      fallbackFunction,
      ttl = this.DEFAULT_CONFIG.defaultTtl,
      tags = [],
      useL1 = true,
      useL2 = true,
      useL3 = true,
    } = options

    const fullKey = this.buildKey(key, tenantId)
    const startTime = Date.now()

    try {
      // L1 Cache (Memory)
      if (useL1) {
        const l1Result = this.getFromL1<T>(fullKey)
        if (l1Result !== null) {
          this.updateMetrics(fullKey, "hit", "l1", Date.now() - startTime)
          return l1Result
        }
      }

      // L2 Cache (Redis)
      if (useL2) {
        const l2Result = await this.getFromL2<T>(fullKey)
        if (l2Result !== null) {
          // Warm L1 cache
          if (useL1) {
            this.setInL1(fullKey, l2Result, ttl, tags)
          }
          this.updateMetrics(fullKey, "hit", "l2", Date.now() - startTime)
          return l2Result
        }
      }

      // L3 Cache (Database)
      if (useL3) {
        const l3Result = await this.getFromL3<T>(fullKey)
        if (l3Result !== null) {
          // Warm upper caches
          if (useL2) {
            await this.setInL2(fullKey, l3Result, ttl, tags)
          }
          if (useL1) {
            this.setInL1(fullKey, l3Result, ttl, tags)
          }
          this.updateMetrics(fullKey, "hit", "l3", Date.now() - startTime)
          return l3Result
        }
      }

      // Cache miss - use fallback function if provided
      if (fallbackFunction) {
        const result = await fallbackFunction()
        if (result !== null && result !== undefined) {
          await this.set(fullKey, result, { ttl, tags, tenantId })
        }
        this.updateMetrics(fullKey, "miss", "fallback", Date.now() - startTime)
        return result
      }

      this.updateMetrics(fullKey, "miss", "none", Date.now() - startTime)
      return null
    } catch (error) {
      this.updateMetrics(fullKey, "error", "none", Date.now() - startTime)
      console.error(`Cache get error for key ${fullKey}:`, error)

      // Fallback to function if cache fails
      if (fallbackFunction) {
        return await fallbackFunction()
      }

      return null
    }
  }

  /**
   * Multi-level cache storage
   */
  async set<T = any>(
    key: string,
    value: T,
    options: {
      ttl?: number
      tags?: string[]
      tenantId?: string
      storeInL1?: boolean
      storeInL2?: boolean
      storeInL3?: boolean
    } = {},
  ): Promise<boolean> {
    const {
      ttl = this.DEFAULT_CONFIG.defaultTtl,
      tags = [],
      tenantId,
      storeInL1 = true,
      storeInL2 = true,
      storeInL3 = true,
    } = options

    const fullKey = this.buildKey(key, tenantId)
    const startTime = Date.now()

    try {
      const operations: Promise<any>[] = []

      // Store in L1 cache
      if (storeInL1) {
        this.setInL1(fullKey, value, ttl, tags)
      }

      // Store in L2 cache (Redis)
      if (storeInL2) {
        operations.push(this.setInL2(fullKey, value, ttl, tags))
      }

      // Store in L3 cache (Database)
      if (storeInL3) {
        operations.push(this.setInL3(fullKey, value, ttl, tags))
      }

      await Promise.all(operations)

      this.updateMetrics(fullKey, "set", "success", Date.now() - startTime)
      return true
    } catch (error) {
      this.updateMetrics(fullKey, "error", "set", Date.now() - startTime)
      console.error(`Cache set error for key ${fullKey}:`, error)
      return false
    }
  }

  /**
   * Intelligent cache warming for popular data
   */
  async warmCache(
    patterns: string[],
    options: {
      tenantId?: string
      batchSize?: number
      maxWarmItems?: number
      priority?: "high" | "medium" | "low"
    } = {},
  ): Promise<{ warmed: number; errors: number }> {
    const { tenantId, batchSize = 100, maxWarmItems = 1000, priority = "medium" } = options

    let warmed = 0
    let errors = 0

    try {
      // Get popular cache keys based on metrics
      const popularKeys = await this.getPopularKeys(patterns, maxWarmItems, tenantId)

      // Process in batches
      for (let i = 0; i < popularKeys.length; i += batchSize) {
        const batch = popularKeys.slice(i, i + batchSize)

        const warmPromises = batch.map(async (key) => {
          try {
            // Check if key exists in lower cache levels
            const exists = await this.redis.exists(key)
            if (!exists) {
              // Reconstruct data and cache it
              const data = await this.reconstructCacheData(key)
              if (data) {
                await this.set(key, data, { tenantId })
                warmed++
              }
            }
          } catch (error) {
            errors++
            console.error(`Cache warming error for key ${key}:`, error)
          }
        })

        await Promise.all(warmPromises)

        // Rate limiting based on priority
        const delay = priority === "high" ? 10 : priority === "medium" ? 50 : 100
        await new Promise((resolve) => setTimeout(resolve, delay))
      }
    } catch (error) {
      console.error("Cache warming error:", error)
      errors++
    }

    return { warmed, errors }
  }

  /**
   * Smart cache invalidation with dependency tracking
   */
  async invalidate(
    pattern: string | string[],
    options: {
      tenantId?: string
      cascade?: boolean
      strategy?: "immediate" | "lazy"
    } = {},
  ): Promise<{ invalidated: number; errors: number }> {
    const { tenantId, cascade = true, strategy = "immediate" } = options
    const patterns = Array.isArray(pattern) ? pattern : [pattern]

    let invalidated = 0
    let errors = 0

    try {
      for (const pat of patterns) {
        const fullPattern = this.buildKey(pat, tenantId)

        if (strategy === "immediate") {
          // Immediate invalidation
          const keys = await this.findKeysByPattern(fullPattern)

          for (const key of keys) {
            try {
              // Remove from all cache levels
              this.l1Cache.delete(key)
              await this.redis.del(key)
              await this.removeFromL3(key)

              invalidated++

              // Handle cascade invalidation
              if (cascade) {
                const dependentKeys = await this.findDependentKeys(key)
                for (const depKey of dependentKeys) {
                  this.l1Cache.delete(depKey)
                  await this.redis.del(depKey)
                  await this.removeFromL3(depKey)
                  invalidated++
                }
              }
            } catch (error) {
              errors++
              console.error(`Invalidation error for key ${key}:`, error)
            }
          }
        } else {
          // Lazy invalidation - mark as expired
          const keys = await this.findKeysByPattern(fullPattern)
          for (const key of keys) {
            await this.redis.expire(key, 1) // Expire in 1 second
            invalidated++
          }
        }
      }
    } catch (error) {
      console.error("Cache invalidation error:", error)
      errors++
    }

    return { invalidated, errors }
  }

  /**
   * Get comprehensive cache analytics
   */
  async getAnalytics(tenantId?: string): Promise<{
    overall: CacheMetrics
    byLevel: Record<string, CacheMetrics>
    tenantMetrics?: Record<string, CacheMetrics>
    performance: {
      averageLatency: number
      throughput: number
      errorRate: number
    }
  }> {
    try {
      // Collect metrics from all cache levels
      const l1Metrics = this.getL1Metrics()
      const l2Metrics = await this.getL2Metrics()
      const l3Metrics = await this.getL3Metrics()

      // Calculate overall metrics
      const overall: CacheMetrics = {
        hits: l1Metrics.hits + l2Metrics.hits + l3Metrics.hits,
        misses: l1Metrics.misses + l2Metrics.misses + l3Metrics.misses,
        hitRatio: 0,
        operations: l1Metrics.operations + l2Metrics.operations + l3Metrics.operations,
        totalKeys: l1Metrics.totalKeys + l2Metrics.totalKeys + l3Metrics.totalKeys,
        totalMemoryUsage: l1Metrics.totalMemoryUsage + l2Metrics.totalMemoryUsage,
        averageKeySize: (l1Metrics.averageKeySize + l2Metrics.averageKeySize) / 2,
        topKeys: [...l1Metrics.topKeys, ...l2Metrics.topKeys].slice(0, 10),
        errorCount: l1Metrics.errorCount + l2Metrics.errorCount + l3Metrics.errorCount,
      }

      overall.hitRatio = (overall.hits / (overall.hits + overall.misses)) * 100

      // Performance metrics
      const performance = {
        averageLatency: await this.getAverageLatency(),
        throughput: await this.getThroughput(),
        errorRate: (overall.errorCount / overall.operations) * 100,
      }

      return {
        overall,
        byLevel: {
          l1: l1Metrics,
          l2: l2Metrics,
          l3: l3Metrics,
        },
        performance,
      }
    } catch (error) {
      console.error("Error getting cache analytics:", error)
      throw error
    }
  }

  /**
   * Predictive cache preloading based on patterns
   */
  async preloadPredictive(
    userId: string,
    context: {
      currentRoute?: string
      searchHistory?: string[]
      preferences?: Record<string, any>
      timeOfDay?: number
    },
  ): Promise<{ preloaded: number; predictions: string[] }> {
    try {
      // Analyze user patterns and predict likely cache keys
      const predictions = await this.predictLikelyCacheKeys(userId, context)

      let preloaded = 0

      // Preload predicted data
      for (const prediction of predictions) {
        try {
          const exists = await this.redis.exists(prediction)
          if (!exists) {
            const data = await this.reconstructCacheData(prediction)
            if (data) {
              await this.set(prediction, data, { ttl: 1800 }) // 30 minute TTL for predictions
              preloaded++
            }
          }
        } catch (error) {
          console.error(`Preload error for prediction ${prediction}:`, error)
        }
      }

      return { preloaded, predictions }
    } catch (error) {
      console.error("Predictive preloading error:", error)
      return { preloaded: 0, predictions: [] }
    }
  }

  /**
   * Private helper methods
   */

  private buildKey(key: string, tenantId?: string): string {
    if (tenantId && this.DEFAULT_CONFIG.tenantIsolation) {
      return `${this.DEFAULT_CONFIG.tenantKeyPrefix}:${tenantId}:${key}`
    }
    return key
  }

  private getFromL1<T>(key: string): T | null {
    const entry = this.l1Cache.get(key)
    if (!entry) return null

    // Check TTL
    const now = Date.now()
    const expiryTime = entry.metadata.createdAt.getTime() + entry.ttl * 1000

    if (now > expiryTime) {
      this.l1Cache.delete(key)
      return null
    }

    // Update access metrics
    entry.metadata.accessCount++
    entry.metadata.lastAccessed = new Date()

    return entry.value as T
  }

  private setInL1<T>(key: string, value: T, ttl: number, tags: string[]): void {
    // Check memory limits
    if (this.l1Cache.size >= 10000) {
      // Max 10k keys in L1
      this.evictFromL1()
    }

    const entry: CacheEntry<T> = {
      key,
      value,
      ttl,
      tags,
      metadata: {
        createdAt: new Date(),
        accessCount: 1,
        lastAccessed: new Date(),
        dataSize: JSON.stringify(value).length,
      },
    }

    this.l1Cache.set(key, entry)
  }

  private async getFromL2<T>(key: string): Promise<T | null> {
    try {
      const result = await this.redis.get(key)
      if (result === null) return null

      return typeof result === "string" ? (JSON.parse(result) as T) : (result as T)
    } catch (error) {
      console.error(`L2 cache get error for key ${key}:`, error)
      return null
    }
  }

  private async setInL2<T>(key: string, value: T, ttl: number, tags: string[]): Promise<void> {
    try {
      const serialized = JSON.stringify(value)
      await this.redis.setex(key, ttl, serialized)

      // Store tags for invalidation
      if (tags.length > 0) {
        if (tags.length === 1) {
          await this.redis.sadd(`tags:${key}`, tags[0])
        } else {
          for (const tag of tags) {
            await this.redis.sadd(`tags:${key}`, tag)
          }
        }
        await this.redis.expire(`tags:${key}`, ttl)
      }
    } catch (error) {
      console.error(`L2 cache set error for key ${key}:`, error)
      throw error
    }
  }

  private async getFromL3<T>(key: string): Promise<T | null> {
    try {
      const client = await this.connectionPool.getConnection("main")

      const result = await client.query(
        "SELECT response_data, expires_at FROM api_response_cache WHERE cache_key = $1 AND expires_at > NOW()",
        [key],
      )

      client.release()

      if (result.rows.length === 0) return null

      return result.rows[0].response_data as T
    } catch (error) {
      console.error(`L3 cache get error for key ${key}:`, error)
      return null
    }
  }

  private async setInL3<T>(key: string, value: T, ttl: number, tags: string[]): Promise<void> {
    try {
      const client = await this.connectionPool.getConnection("main")

      const expiresAt = new Date(Date.now() + ttl * 1000)

      await client.query(
        `INSERT INTO api_response_cache 
         (cache_key, provider_name, endpoint, response_data, expires_at, ttl_seconds)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (cache_key) DO UPDATE SET
         response_data = EXCLUDED.response_data,
         expires_at = EXCLUDED.expires_at,
         ttl_seconds = EXCLUDED.ttl_seconds,
         last_accessed = NOW()`,
        [key, "enterprise", "multi-level", JSON.stringify(value), expiresAt, ttl],
      )

      client.release()
    } catch (error) {
      console.error(`L3 cache set error for key ${key}:`, error)
      throw error
    }
  }

  private async removeFromL3(key: string): Promise<void> {
    try {
      const client = await this.connectionPool.getConnection("main")
      await client.query("DELETE FROM api_response_cache WHERE cache_key = $1", [key])
      client.release()
    } catch (error) {
      console.error(`L3 cache remove error for key ${key}:`, error)
    }
  }

  private evictFromL1(): void {
    // Simple LRU eviction
    const entries = Array.from(this.l1Cache.entries())
    entries.sort(
      (a, b) => a[1].metadata.lastAccessed.getTime() - b[1].metadata.lastAccessed.getTime(),
    )

    // Remove oldest 10% of entries
    const toRemove = Math.floor(entries.length * 0.1)
    for (let i = 0; i < toRemove; i++) {
      this.l1Cache.delete(entries[i][0])
    }
  }

  private setupDefaultInvalidationRules(): void {
    const rules: CacheInvalidationRule[] = [
      {
        pattern: "flights:*",
        triggers: ["flight_update", "price_change"],
        strategy: "immediate",
        dependencies: ["search:*", "recommendations:*"],
      },
      {
        pattern: "experiences:*",
        triggers: ["experience_update", "availability_change"],
        strategy: "lazy",
        dependencies: ["layover:*"],
      },
      {
        pattern: "weather:*",
        triggers: ["weather_update"],
        strategy: "immediate",
      },
    ]

    rules.forEach((rule) => {
      this.invalidationRules.set(rule.pattern, rule)
    })
  }

  private updateMetrics(key: string, operation: string, level: string, duration: number): void {
    // Implementation would update internal metrics tracking
    // This is a simplified version
  }

  private getL1Metrics(): CacheMetrics {
    // Return L1 cache metrics
    return this.createEmptyMetrics()
  }

  private async getL2Metrics(): Promise<CacheMetrics> {
    // Get Redis metrics
    return this.createEmptyMetrics()
  }

  private async getL3Metrics(): Promise<CacheMetrics> {
    // Get database cache metrics
    return this.createEmptyMetrics()
  }

  private createEmptyMetrics(): CacheMetrics {
    return {
      hits: 0,
      misses: 0,
      hitRatio: 0,
      operations: 0,
      totalKeys: 0,
      totalMemoryUsage: 0,
      averageKeySize: 0,
      topKeys: [],
      errorCount: 0,
    }
  }

  private async findKeysByPattern(pattern: string): Promise<string[]> {
    // Redis SCAN implementation
    const keys: string[] = []
    let cursor = 0

    do {
      const result = await this.redis.scan(cursor, { match: pattern, count: 100 })
      cursor = parseInt(result[0] as string, 10)
      keys.push(...(result[1] as string[]))
    } while (cursor !== 0)

    return keys
  }

  private async findDependentKeys(key: string): Promise<string[]> {
    // Find keys that depend on this key
    // Implementation would analyze dependency graph
    return []
  }

  private async getPopularKeys(
    patterns: string[],
    limit: number,
    tenantId?: string,
  ): Promise<string[]> {
    // Return popular keys based on access patterns
    return []
  }

  private async reconstructCacheData(key: string): Promise<any> {
    // Reconstruct cache data from original source
    // Implementation would depend on the key type
    return null
  }

  private async predictLikelyCacheKeys(userId: string, context: any): Promise<string[]> {
    // Machine learning-based prediction of likely cache keys
    return []
  }

  private async getAverageLatency(): Promise<number> {
    return 0
  }

  private async getThroughput(): Promise<number> {
    return 0
  }

  private startMetricsCollection(): void {
    setInterval(() => {
      // Collect and store metrics
    }, 60000) // Every minute
  }
}

// Singleton instance
let enterpriseCacheManagerInstance: EnterpriseCacheManager | null = null

export function getEnterpriseCacheManager(): EnterpriseCacheManager {
  if (!enterpriseCacheManagerInstance) {
    enterpriseCacheManagerInstance = new EnterpriseCacheManager()
  }
  return enterpriseCacheManagerInstance
}

export default EnterpriseCacheManager
