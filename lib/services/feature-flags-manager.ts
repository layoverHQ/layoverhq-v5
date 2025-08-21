/**
 * Enterprise Feature Flags Manager
 *
 * Dynamic feature flag management with tenant-specific overrides,
 * A/B testing capabilities, user segmentation, and rollout controls.
 */

import { createServiceRoleClient } from "@/lib/supabase/service-role"
import { getConfigManager } from "./config-manager"
import { EventEmitter } from "events"

export interface FeatureFlag {
  id: string
  key: string
  name: string
  description?: string
  is_enabled: boolean
  tenant_id?: string
  user_segment: Record<string, any>
  rollout_percentage: number
  conditions: Record<string, any>
  created_at: string
  updated_at: string
  created_by: string
}

export interface FeatureFlagEvaluation {
  enabled: boolean
  reason: string
  metadata?: Record<string, any>
}

export interface UserContext {
  user_id: string
  tenant_id?: string
  email?: string
  role?: string
  plan?: string
  created_at?: string
  properties?: Record<string, any>
}

export interface SegmentCondition {
  type: "user_id" | "email" | "role" | "plan" | "tenant_id" | "property" | "percentage"
  operator:
    | "equals"
    | "not_equals"
    | "contains"
    | "not_contains"
    | "in"
    | "not_in"
    | "greater_than"
    | "less_than"
    | "exists"
  value: any
  property_name?: string
}

export interface CreateFeatureFlagRequest {
  key: string
  name: string
  description?: string
  is_enabled?: boolean
  tenant_id?: string
  user_segment?: Record<string, any>
  rollout_percentage?: number
  conditions?: Record<string, any>
}

export interface UpdateFeatureFlagRequest {
  name?: string
  description?: string
  is_enabled?: boolean
  user_segment?: Record<string, any>
  rollout_percentage?: number
  conditions?: Record<string, any>
}

class FeatureFlagsManager extends EventEmitter {
  private supabase = createServiceRoleClient()
  private configManager = getConfigManager()
  private cache = new Map<string, FeatureFlag>()
  private evaluationCache = new Map<string, { result: FeatureFlagEvaluation; expires: number }>()
  private lastUpdate = new Date()
  private refreshInterval: NodeJS.Timeout | null = null
  private readonly CACHE_TTL = 5 * 60 * 1000 // 5 minutes
  private readonly EVALUATION_CACHE_TTL = 60 * 1000 // 1 minute

  constructor() {
    super()
    this.startCacheRefresh()
  }

  /**
   * Create a new feature flag
   */
  async createFeatureFlag(
    request: CreateFeatureFlagRequest,
    userId: string,
  ): Promise<{ success: boolean; flag_id?: string; error?: string }> {
    try {
      // Validate required fields
      if (!request.key || !request.name) {
        return { success: false, error: "Key and name are required" }
      }

      // Check for existing flag with same key and tenant
      const existing = await this.getFeatureFlag(request.key, request.tenant_id)
      if (existing) {
        return {
          success: false,
          error: `Feature flag with key '${request.key}' already exists`,
        }
      }

      // Create flag
      const { data: flag, error } = await this.supabase
        .from("feature_flags")
        .insert({
          key: request.key,
          name: request.name,
          description: request.description,
          is_enabled: request.is_enabled ?? false,
          tenant_id: request.tenant_id,
          user_segment: request.user_segment || {},
          rollout_percentage: request.rollout_percentage ?? 0,
          conditions: request.conditions || {},
          created_by: userId,
        })
        .select("id")
        .single()

      if (error) {
        console.error("Error creating feature flag:", error)
        return { success: false, error: error.message }
      }

      // Refresh cache
      await this.refreshCache()

      // Log the creation
      await this.logFeatureFlagAction("CREATE", flag.id, userId, {
        key: request.key,
        tenant_id: request.tenant_id,
      })

      this.emit("flagCreated", { flagId: flag.id, key: request.key, userId })

      return { success: true, flag_id: flag.id }
    } catch (error) {
      console.error("Error in createFeatureFlag:", error)
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }
    }
  }

  /**
   * Get feature flag by key and tenant
   */
  async getFeatureFlag(key: string, tenantId?: string): Promise<FeatureFlag | null> {
    try {
      // Check cache first
      const cacheKey = this.getCacheKey(key, tenantId)
      if (this.cache.has(cacheKey)) {
        return this.cache.get(cacheKey)!
      }

      // Query database
      let query = this.supabase.from("feature_flags").select("*").eq("key", key)

      if (tenantId) {
        query = query.eq("tenant_id", tenantId)
      } else {
        query = query.is("tenant_id", null)
      }

      const { data: flag, error } = await query.single()

      if (error || !flag) {
        return null
      }

      // Cache the result
      this.cache.set(cacheKey, flag)

      return flag
    } catch (error) {
      console.error("Error getting feature flag:", error)
      return null
    }
  }

  /**
   * List feature flags with optional filtering
   */
  async listFeatureFlags(tenantId?: string, enabled?: boolean): Promise<FeatureFlag[]> {
    try {
      let query = this.supabase
        .from("feature_flags")
        .select("*")
        .order("created_at", { ascending: false })

      if (tenantId) {
        query = query.eq("tenant_id", tenantId)
      }

      if (enabled !== undefined) {
        query = query.eq("is_enabled", enabled)
      }

      const { data: flags, error } = await query

      if (error) {
        console.error("Error listing feature flags:", error)
        return []
      }

      return flags || []
    } catch (error) {
      console.error("Error in listFeatureFlags:", error)
      return []
    }
  }

  /**
   * Update feature flag
   */
  async updateFeatureFlag(
    flagId: string,
    updates: UpdateFeatureFlagRequest,
    userId: string,
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await this.supabase
        .from("feature_flags")
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq("id", flagId)

      if (error) {
        console.error("Error updating feature flag:", error)
        return { success: false, error: error.message }
      }

      // Clear cache
      this.cache.clear()
      this.evaluationCache.clear()

      // Refresh cache
      await this.refreshCache()

      // Log the update
      await this.logFeatureFlagAction("UPDATE", flagId, userId, updates)

      this.emit("flagUpdated", { flagId, updates, userId })

      return { success: true }
    } catch (error) {
      console.error("Error in updateFeatureFlag:", error)
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }
    }
  }

  /**
   * Delete feature flag
   */
  async deleteFeatureFlag(
    flagId: string,
    userId: string,
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Get flag details for logging
      const { data: flag } = await this.supabase
        .from("feature_flags")
        .select("key, tenant_id")
        .eq("id", flagId)
        .single()

      const { error } = await this.supabase.from("feature_flags").delete().eq("id", flagId)

      if (error) {
        console.error("Error deleting feature flag:", error)
        return { success: false, error: error.message }
      }

      // Clear cache
      if (flag) {
        const cacheKey = this.getCacheKey(flag.key, flag.tenant_id)
        this.cache.delete(cacheKey)
      }
      this.evaluationCache.clear()

      // Log the deletion
      await this.logFeatureFlagAction("DELETE", flagId, userId, flag)

      this.emit("flagDeleted", { flagId, userId })

      return { success: true }
    } catch (error) {
      console.error("Error in deleteFeatureFlag:", error)
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }
    }
  }

  /**
   * Evaluate feature flag for user context
   */
  async evaluateFlag(
    key: string,
    userContext: UserContext,
    defaultValue = false,
  ): Promise<FeatureFlagEvaluation> {
    try {
      // Check evaluation cache
      const evalCacheKey = this.getEvaluationCacheKey(key, userContext)
      const cached = this.evaluationCache.get(evalCacheKey)
      if (cached && Date.now() < cached.expires) {
        return cached.result
      }

      // Try tenant-specific flag first, then global
      let flag = await this.getFeatureFlag(key, userContext.tenant_id)
      if (!flag) {
        flag = await this.getFeatureFlag(key)
      }

      if (!flag) {
        const result = {
          enabled: defaultValue,
          reason: "flag_not_found",
        }

        // Cache the result
        this.evaluationCache.set(evalCacheKey, {
          result,
          expires: Date.now() + this.EVALUATION_CACHE_TTL,
        })

        return result
      }

      // Check if flag is globally disabled
      if (!flag.is_enabled) {
        const result = {
          enabled: false,
          reason: "flag_disabled",
        }

        this.evaluationCache.set(evalCacheKey, {
          result,
          expires: Date.now() + this.EVALUATION_CACHE_TTL,
        })

        return result
      }

      // Evaluate user segment conditions
      const segmentMatch = this.evaluateUserSegment(flag.user_segment, userContext)
      if (!segmentMatch.matches) {
        const result = {
          enabled: false,
          reason: "segment_mismatch",
          metadata: { segment_reason: segmentMatch.reason },
        }

        this.evaluationCache.set(evalCacheKey, {
          result,
          expires: Date.now() + this.EVALUATION_CACHE_TTL,
        })

        return result
      }

      // Evaluate rollout percentage
      const rolloutMatch = this.evaluateRolloutPercentage(
        flag.rollout_percentage,
        userContext.user_id,
        key,
      )

      if (!rolloutMatch) {
        const result = {
          enabled: false,
          reason: "rollout_percentage",
          metadata: { rollout_percentage: flag.rollout_percentage },
        }

        this.evaluationCache.set(evalCacheKey, {
          result,
          expires: Date.now() + this.EVALUATION_CACHE_TTL,
        })

        return result
      }

      // Evaluate additional conditions
      const conditionsMatch = this.evaluateConditions(flag.conditions, userContext)
      if (!conditionsMatch.matches) {
        const result = {
          enabled: false,
          reason: "conditions_failed",
          metadata: { condition_reason: conditionsMatch.reason },
        }

        this.evaluationCache.set(evalCacheKey, {
          result,
          expires: Date.now() + this.EVALUATION_CACHE_TTL,
        })

        return result
      }

      // Flag is enabled for this user
      const result = {
        enabled: true,
        reason: "enabled",
        metadata: {
          flag_id: flag.id,
          tenant_specific: !!flag.tenant_id,
        },
      }

      this.evaluationCache.set(evalCacheKey, {
        result,
        expires: Date.now() + this.EVALUATION_CACHE_TTL,
      })

      // Log the evaluation for analytics
      await this.logFlagEvaluation(flag.id, userContext, result)

      return result
    } catch (error) {
      console.error("Error evaluating feature flag:", error)
      return {
        enabled: defaultValue,
        reason: "evaluation_error",
      }
    }
  }

  /**
   * Evaluate multiple feature flags for user context
   */
  async evaluateFlags(
    keys: string[],
    userContext: UserContext,
  ): Promise<Record<string, FeatureFlagEvaluation>> {
    const results: Record<string, FeatureFlagEvaluation> = {}

    await Promise.all(
      keys.map(async (key) => {
        results[key] = await this.evaluateFlag(key, userContext)
      }),
    )

    return results
  }

  /**
   * Get feature flag analytics
   */
  async getFlagAnalytics(
    flagId: string,
    startDate: string,
    endDate: string,
  ): Promise<{
    total_evaluations: number
    enabled_count: number
    disabled_count: number
    unique_users: number
    reasons: Record<string, number>
    hourly_evaluations: Array<{ hour: string; count: number }>
  }> {
    try {
      // This would typically query a separate analytics table
      // For now, we'll return mock data
      return {
        total_evaluations: 0,
        enabled_count: 0,
        disabled_count: 0,
        unique_users: 0,
        reasons: {},
        hourly_evaluations: [],
      }
    } catch (error) {
      console.error("Error getting flag analytics:", error)
      return {
        total_evaluations: 0,
        enabled_count: 0,
        disabled_count: 0,
        unique_users: 0,
        reasons: {},
        hourly_evaluations: [],
      }
    }
  }

  /**
   * Private helper methods
   */

  private evaluateUserSegment(
    segment: Record<string, any>,
    userContext: UserContext,
  ): { matches: boolean; reason?: string } {
    if (!segment || Object.keys(segment).length === 0) {
      return { matches: true }
    }

    const conditions = segment.conditions as SegmentCondition[]
    if (!conditions || !Array.isArray(conditions)) {
      return { matches: true }
    }

    for (const condition of conditions) {
      const result = this.evaluateSegmentCondition(condition, userContext)
      if (!result) {
        return {
          matches: false,
          reason: `Condition failed: ${condition.type} ${condition.operator} ${condition.value}`,
        }
      }
    }

    return { matches: true }
  }

  private evaluateSegmentCondition(condition: SegmentCondition, userContext: UserContext): boolean {
    let contextValue: any

    switch (condition.type) {
      case "user_id":
        contextValue = userContext.user_id
        break
      case "email":
        contextValue = userContext.email
        break
      case "role":
        contextValue = userContext.role
        break
      case "plan":
        contextValue = userContext.plan
        break
      case "tenant_id":
        contextValue = userContext.tenant_id
        break
      case "property":
        contextValue = userContext.properties?.[condition.property_name || ""]
        break
      case "percentage":
        // Handle percentage-based rollout
        const hash = this.hashString(userContext.user_id + condition.value)
        return hash % 100 < Number(condition.value)
      default:
        return false
    }

    switch (condition.operator) {
      case "equals":
        return contextValue === condition.value
      case "not_equals":
        return contextValue !== condition.value
      case "contains":
        return typeof contextValue === "string" && contextValue.includes(condition.value)
      case "not_contains":
        return typeof contextValue === "string" && !contextValue.includes(condition.value)
      case "in":
        return Array.isArray(condition.value) && condition.value.includes(contextValue)
      case "not_in":
        return Array.isArray(condition.value) && !condition.value.includes(contextValue)
      case "greater_than":
        return Number(contextValue) > Number(condition.value)
      case "less_than":
        return Number(contextValue) < Number(condition.value)
      case "exists":
        return contextValue !== undefined && contextValue !== null
      default:
        return false
    }
  }

  private evaluateRolloutPercentage(percentage: number, userId: string, flagKey: string): boolean {
    if (percentage >= 100) return true
    if (percentage <= 0) return false

    // Create deterministic hash based on user ID and flag key
    const hash = this.hashString(userId + flagKey)
    return hash % 100 < percentage
  }

  private evaluateConditions(
    conditions: Record<string, any>,
    userContext: UserContext,
  ): { matches: boolean; reason?: string } {
    // Handle custom conditions like date ranges, feature dependencies, etc.
    if (!conditions || Object.keys(conditions).length === 0) {
      return { matches: true }
    }

    // Example: time-based conditions
    if (conditions.start_date || conditions.end_date) {
      const now = new Date()

      if (conditions.start_date && now < new Date(conditions.start_date)) {
        return { matches: false, reason: "Before start date" }
      }

      if (conditions.end_date && now > new Date(conditions.end_date)) {
        return { matches: false, reason: "After end date" }
      }
    }

    // Example: dependency on other flags
    if (conditions.requires_flags) {
      // This would require evaluating other flags
      // For now, we'll assume they pass
    }

    return { matches: true }
  }

  private hashString(str: string): number {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = (hash << 5) - hash + char
      hash = hash & hash // Convert to 32-bit integer
    }
    return Math.abs(hash)
  }

  private getCacheKey(key: string, tenantId?: string): string {
    return tenantId ? `${tenantId}:${key}` : `global:${key}`
  }

  private getEvaluationCacheKey(key: string, userContext: UserContext): string {
    return `eval:${key}:${userContext.user_id}:${userContext.tenant_id || "global"}`
  }

  private async refreshCache(): Promise<void> {
    try {
      const { data: flags, error } = await this.supabase.from("feature_flags").select("*")

      if (error) {
        console.error("Error refreshing feature flags cache:", error)
        return
      }

      // Clear and repopulate cache
      this.cache.clear()

      for (const flag of flags || []) {
        const cacheKey = this.getCacheKey(flag.key, flag.tenant_id)
        this.cache.set(cacheKey, flag)
      }

      this.lastUpdate = new Date()
      this.emit("cacheRefreshed")
    } catch (error) {
      console.error("Error in refreshCache:", error)
    }
  }

  private startCacheRefresh(): void {
    // Refresh cache every 5 minutes
    this.refreshInterval = setInterval(() => {
      this.refreshCache()
    }, this.CACHE_TTL)

    // Initial cache load
    this.refreshCache()
  }

  private async logFeatureFlagAction(
    action: string,
    flagId: string,
    userId: string,
    metadata?: Record<string, any>,
  ): Promise<void> {
    try {
      await this.supabase.from("enterprise_audit_logs").insert({
        event_type: "feature_flags",
        entity_type: "flag",
        entity_id: flagId,
        action,
        actor_id: userId,
        metadata: metadata || {},
        risk_score: action === "DELETE" ? 3 : 1,
      })
    } catch (error) {
      console.error("Error logging feature flag action:", error)
    }
  }

  private async logFlagEvaluation(
    flagId: string,
    userContext: UserContext,
    result: FeatureFlagEvaluation,
  ): Promise<void> {
    // In a production system, you'd log this to an analytics system
    // For now, we'll just emit an event
    this.emit("flagEvaluated", {
      flagId,
      userId: userContext.user_id,
      tenantId: userContext.tenant_id,
      enabled: result.enabled,
      reason: result.reason,
      timestamp: new Date().toISOString(),
    })
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval)
      this.refreshInterval = null
    }
    this.removeAllListeners()
  }
}

// Singleton instance
let featureFlagsManagerInstance: FeatureFlagsManager | null = null

export function getFeatureFlagsManager(): FeatureFlagsManager {
  if (!featureFlagsManagerInstance) {
    featureFlagsManagerInstance = new FeatureFlagsManager()
  }
  return featureFlagsManagerInstance
}

export default FeatureFlagsManager
