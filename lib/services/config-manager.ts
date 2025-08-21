/**
 * Enterprise ConfigManager - Zero-CLI Administration System
 *
 * This service provides database-driven configuration management with hot-reload
 * capabilities, enabling admins to configure everything through the UI without
 * environment changes or code deployments.
 */

import { createClient } from "@/lib/supabase/server"
import { createBrowserClient } from "@supabase/ssr"
import { EventEmitter } from "events"

export interface SystemConfig {
  id: string
  key: string
  value: any
  type: "string" | "number" | "boolean" | "json" | "encrypted"
  category: string
  description?: string
  tenant_id?: string
  environment: "production" | "staging" | "development" | "all"
  is_active: boolean
  created_at: string
  updated_at: string
  updated_by: string
}

export interface ConfigValidationRule {
  required?: boolean
  min?: number
  max?: number
  pattern?: string
  enum?: string[]
  customValidator?: (value: any) => boolean | string
}

export interface ConfigSchema {
  [key: string]: {
    type: SystemConfig["type"]
    category: string
    description: string
    default: any
    validation?: ConfigValidationRule
    hot_reload: boolean
    requires_restart?: boolean
  }
}

class ConfigManager extends EventEmitter {
  private cache = new Map<string, any>()
  private tenantCache = new Map<string, Map<string, any>>()
  private lastUpdate = new Date()
  private refreshInterval: NodeJS.Timeout | null = null
  private isServerSide = typeof window === "undefined"

  // Configuration schema for validation and UI generation
  private schema: ConfigSchema = {
    "app.name": {
      type: "string",
      category: "application",
      description: "Application name displayed to users",
      default: "LayoverHQ",
      validation: { required: true },
      hot_reload: true,
    },
    "app.environment": {
      type: "string",
      category: "application",
      description: "Current environment",
      default: "production",
      validation: { enum: ["production", "staging", "development"] },
      hot_reload: false,
      requires_restart: true,
    },
    "features.hacker_mode": {
      type: "boolean",
      category: "features",
      description: "Enable hacker mode interface",
      default: true,
      hot_reload: true,
    },
    "features.ai_recommendations": {
      type: "boolean",
      category: "features",
      description: "Enable AI-powered recommendations",
      default: true,
      hot_reload: true,
    },
    "rate_limits.api_requests_per_minute": {
      type: "number",
      category: "security",
      description: "API requests per minute per user",
      default: 60,
      validation: { min: 10, max: 1000 },
      hot_reload: true,
    },
    "cache.ttl_seconds": {
      type: "number",
      category: "performance",
      description: "Default cache TTL in seconds",
      default: 3600,
      validation: { min: 60, max: 86400 },
      hot_reload: true,
    },
    "integrations.amadeus.enabled": {
      type: "boolean",
      category: "integrations",
      description: "Enable Amadeus flight API",
      default: true,
      hot_reload: true,
    },
    "integrations.viator.enabled": {
      type: "boolean",
      category: "integrations",
      description: "Enable Viator experiences API",
      default: true,
      hot_reload: true,
    },
    "ui.theme.primary_color": {
      type: "string",
      category: "ui",
      description: "Primary brand color",
      default: "#3b82f6",
      validation: { pattern: "^#[0-9a-fA-F]{6}$" },
      hot_reload: true,
    },
    "monitoring.error_tracking": {
      type: "boolean",
      category: "monitoring",
      description: "Enable error tracking and reporting",
      default: true,
      hot_reload: true,
    },
    "security.session_timeout_minutes": {
      type: "number",
      category: "security",
      description: "User session timeout in minutes",
      default: 60,
      validation: { min: 15, max: 1440 },
      hot_reload: false,
      requires_restart: true,
    },
  }

  constructor() {
    super()
    this.startRefreshInterval()
  }

  /**
   * Initialize configuration from database
   */
  async initialize(): Promise<void> {
    try {
      await this.refreshCache()
      this.emit("initialized")
    } catch (error) {
      console.error("[ConfigManager] Initialization failed:", error)
      throw error
    }
  }

  /**
   * Get configuration value with tenant support
   */
  async get<T = any>(key: string, tenantId?: string, defaultValue?: T): Promise<T> {
    try {
      // Check tenant-specific cache first
      if (tenantId && this.tenantCache.has(tenantId)) {
        const tenantConfig = this.tenantCache.get(tenantId)!
        if (tenantConfig.has(key)) {
          return tenantConfig.get(key)
        }
      }

      // Check global cache
      if (this.cache.has(key)) {
        return this.cache.get(key)
      }

      // Load from database if not in cache
      const value = await this.loadFromDatabase(key, tenantId)
      if (value !== null) {
        this.setCacheValue(key, value, tenantId)
        return value
      }

      // Return schema default or provided default
      const schemaDefault = this.schema[key]?.default
      return defaultValue !== undefined ? defaultValue : schemaDefault
    } catch (error) {
      console.error(`[ConfigManager] Error getting config ${key}:`, error)
      const schemaDefault = this.schema[key]?.default
      return defaultValue !== undefined ? defaultValue : schemaDefault
    }
  }

  /**
   * Set configuration value with validation and audit trail
   */
  async set(
    key: string,
    value: any,
    userId: string,
    tenantId?: string,
    skipValidation = false,
  ): Promise<boolean> {
    try {
      // Validate against schema
      if (!skipValidation) {
        const validationResult = this.validateValue(key, value)
        if (validationResult !== true) {
          throw new Error(`Validation failed: ${validationResult}`)
        }
      }

      // Encrypt sensitive values
      const processedValue = await this.processValue(key, value)

      // Save to database
      const success = await this.saveToDatabase(key, processedValue, userId, tenantId)
      if (!success) {
        return false
      }

      // Update cache
      this.setCacheValue(key, value, tenantId)

      // Emit change event for hot-reload
      const schemaInfo = this.schema[key]
      if (schemaInfo?.hot_reload) {
        this.emit("configChanged", { key, value, tenantId, userId })
      }

      // Create audit log
      await this.auditLog("UPDATE", key, value, userId, tenantId)

      return true
    } catch (error) {
      console.error(`[ConfigManager] Error setting config ${key}:`, error)
      return false
    }
  }

  /**
   * Get all configurations for a category
   */
  async getCategory(category: string, tenantId?: string): Promise<Record<string, any>> {
    const configs: Record<string, any> = {}

    for (const [key, schema] of Object.entries(this.schema)) {
      if (schema.category === category) {
        configs[key] = await this.get(key, tenantId)
      }
    }

    return configs
  }

  /**
   * Bulk update configurations with transaction support
   */
  async setBulk(
    configs: Record<string, any>,
    userId: string,
    tenantId?: string,
  ): Promise<{ success: boolean; errors: string[] }> {
    const errors: string[] = []
    const validConfigs: Array<{ key: string; value: any }> = []

    // Validate all configs first
    for (const [key, value] of Object.entries(configs)) {
      const validationResult = this.validateValue(key, value)
      if (validationResult !== true) {
        errors.push(`${key}: ${validationResult}`)
      } else {
        validConfigs.push({ key, value })
      }
    }

    if (errors.length > 0) {
      return { success: false, errors }
    }

    try {
      // Use transaction for bulk update
      const supabase = this.isServerSide
        ? await createClient()
        : createBrowserClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          )

      const updates = validConfigs.map(async ({ key, value }) => {
        const processedValue = await this.processValue(key, value)
        return {
          key,
          value: processedValue,
          type: this.getValueType(processedValue),
          category: this.schema[key]?.category || "general",
          tenant_id: tenantId,
          updated_by: userId,
          environment: "all",
        }
      })

      const configData = await Promise.all(updates)

      const { error } = await supabase
        .from("system_configs")
        .upsert(configData, { onConflict: tenantId ? "key,tenant_id" : "key" })

      if (error) {
        throw error
      }

      // Update cache and emit events
      for (const { key, value } of validConfigs) {
        this.setCacheValue(key, value, tenantId)

        const schemaInfo = this.schema[key]
        if (schemaInfo?.hot_reload) {
          this.emit("configChanged", { key, value, tenantId, userId })
        }
      }

      // Create audit log for bulk update
      await this.auditLog("BULK_UPDATE", "multiple", validConfigs, userId, tenantId)

      return { success: true, errors: [] }
    } catch (error) {
      console.error("[ConfigManager] Bulk update failed:", error)
      return { success: false, errors: [error instanceof Error ? error.message : "Unknown error"] }
    }
  }

  /**
   * Create configuration snapshot for rollback
   */
  async createSnapshot(name: string, userId: string, tenantId?: string): Promise<string | null> {
    try {
      const supabase = this.isServerSide
        ? await createClient()
        : createBrowserClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          )

      // Get current configurations
      let query = supabase.from("system_configs").select("*").eq("is_active", true)

      if (tenantId) {
        query = query.eq("tenant_id", tenantId)
      } else {
        query = query.is("tenant_id", null)
      }

      const { data: configs, error } = await query

      if (error) throw error

      // Create snapshot
      const { data: snapshot, error: snapshotError } = await supabase
        .from("config_snapshots")
        .insert({
          name,
          configs: configs || [],
          tenant_id: tenantId,
          created_by: userId,
        })
        .select("id")
        .single()

      if (snapshotError) throw snapshotError

      await this.auditLog("SNAPSHOT_CREATE", name, { snapshot_id: snapshot.id }, userId, tenantId)

      return snapshot.id
    } catch (error) {
      console.error("[ConfigManager] Snapshot creation failed:", error)
      return null
    }
  }

  /**
   * Rollback to configuration snapshot
   */
  async rollbackToSnapshot(snapshotId: string, userId: string): Promise<boolean> {
    try {
      const supabase = this.isServerSide
        ? await createClient()
        : createBrowserClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          )

      // Get snapshot
      const { data: snapshot, error } = await supabase
        .from("config_snapshots")
        .select("*")
        .eq("id", snapshotId)
        .single()

      if (error) throw error

      // Restore configurations
      const configs = snapshot.configs as SystemConfig[]
      const updates = configs.map((config) => ({
        ...config,
        updated_by: userId,
        updated_at: new Date().toISOString(),
      }))

      const { error: updateError } = await supabase
        .from("system_configs")
        .upsert(updates, { onConflict: snapshot.tenant_id ? "key,tenant_id" : "key" })

      if (updateError) throw updateError

      // Refresh cache
      await this.refreshCache()

      await this.auditLog(
        "ROLLBACK",
        "snapshot",
        { snapshot_id: snapshotId },
        userId,
        snapshot.tenant_id,
      )

      return true
    } catch (error) {
      console.error("[ConfigManager] Rollback failed:", error)
      return false
    }
  }

  /**
   * Get configuration schema for UI generation
   */
  getSchema(): ConfigSchema {
    return { ...this.schema }
  }

  /**
   * Validate configuration value against schema
   */
  private validateValue(key: string, value: any): true | string {
    const schema = this.schema[key]
    if (!schema) {
      return `Unknown configuration key: ${key}`
    }

    const { validation } = schema
    if (!validation) return true

    // Required check
    if (validation.required && (value === null || value === undefined || value === "")) {
      return "Value is required"
    }

    // Type conversion and validation
    switch (schema.type) {
      case "number":
        const num = Number(value)
        if (isNaN(num)) return "Must be a valid number"
        if (validation.min !== undefined && num < validation.min) {
          return `Must be at least ${validation.min}`
        }
        if (validation.max !== undefined && num > validation.max) {
          return `Must be at most ${validation.max}`
        }
        break

      case "string":
        if (typeof value !== "string") return "Must be a string"
        if (validation.pattern && !new RegExp(validation.pattern).test(value)) {
          return "Invalid format"
        }
        if (validation.enum && !validation.enum.includes(value)) {
          return `Must be one of: ${validation.enum.join(", ")}`
        }
        break

      case "boolean":
        if (typeof value !== "boolean") return "Must be true or false"
        break

      case "json":
        try {
          if (typeof value === "string") {
            JSON.parse(value)
          }
        } catch {
          return "Must be valid JSON"
        }
        break
    }

    // Custom validation
    if (validation.customValidator) {
      const result = validation.customValidator(value)
      if (result !== true) {
        return typeof result === "string" ? result : "Custom validation failed"
      }
    }

    return true
  }

  /**
   * Process value before storage (encryption, serialization)
   */
  private async processValue(key: string, value: any): Promise<any> {
    const schema = this.schema[key]

    if (schema?.type === "encrypted") {
      // In a real implementation, you would encrypt sensitive values
      // For now, we'll just mark them as encrypted
      return { encrypted: true, value: value }
    }

    if (schema?.type === "json" && typeof value === "object") {
      return JSON.stringify(value)
    }

    return value
  }

  /**
   * Load configuration from database
   */
  private async loadFromDatabase(key: string, tenantId?: string): Promise<any> {
    try {
      const supabase = this.isServerSide
        ? await createClient()
        : createBrowserClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          )

      let query = supabase
        .from("system_configs")
        .select("value, type")
        .eq("key", key)
        .eq("is_active", true)

      if (tenantId) {
        query = query.eq("tenant_id", tenantId)
      } else {
        query = query.is("tenant_id", null)
      }

      const { data, error } = await query.single()

      if (error || !data) return null

      return this.deserializeValue(data.value, data.type)
    } catch (error) {
      console.error(`[ConfigManager] Database load error for ${key}:`, error)
      return null
    }
  }

  /**
   * Save configuration to database
   */
  private async saveToDatabase(
    key: string,
    value: any,
    userId: string,
    tenantId?: string,
  ): Promise<boolean> {
    try {
      const supabase = this.isServerSide
        ? await createClient()
        : createBrowserClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          )

      const configData = {
        key,
        value,
        type: this.getValueType(value),
        category: this.schema[key]?.category || "general",
        tenant_id: tenantId,
        updated_by: userId,
        environment: "all",
        is_active: true,
      }

      const { error } = await supabase
        .from("system_configs")
        .upsert(configData, { onConflict: tenantId ? "key,tenant_id" : "key" })

      return !error
    } catch (error) {
      console.error(`[ConfigManager] Database save error for ${key}:`, error)
      return false
    }
  }

  /**
   * Refresh configuration cache from database
   */
  private async refreshCache(): Promise<void> {
    try {
      const supabase = this.isServerSide
        ? await createClient()
        : createBrowserClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          )

      const { data: configs, error } = await supabase
        .from("system_configs")
        .select("*")
        .eq("is_active", true)

      if (error) throw error

      // Clear caches
      this.cache.clear()
      this.tenantCache.clear()

      // Populate caches
      for (const config of configs || []) {
        const value = this.deserializeValue(config.value, config.type)

        if (config.tenant_id) {
          if (!this.tenantCache.has(config.tenant_id)) {
            this.tenantCache.set(config.tenant_id, new Map())
          }
          this.tenantCache.get(config.tenant_id)!.set(config.key, value)
        } else {
          this.cache.set(config.key, value)
        }
      }

      this.lastUpdate = new Date()
      this.emit("cacheRefreshed")
    } catch (error) {
      console.error("[ConfigManager] Cache refresh failed:", error)
    }
  }

  /**
   * Set cache value for key and tenant
   */
  private setCacheValue(key: string, value: any, tenantId?: string): void {
    if (tenantId) {
      if (!this.tenantCache.has(tenantId)) {
        this.tenantCache.set(tenantId, new Map())
      }
      this.tenantCache.get(tenantId)!.set(key, value)
    } else {
      this.cache.set(key, value)
    }
  }

  /**
   * Deserialize value from database
   */
  private deserializeValue(value: any, type: string): any {
    switch (type) {
      case "json":
        return typeof value === "string" ? JSON.parse(value) : value
      case "number":
        return Number(value)
      case "boolean":
        return Boolean(value)
      case "encrypted":
        // In a real implementation, decrypt the value
        return value?.value || value
      default:
        return value
    }
  }

  /**
   * Get value type for storage
   */
  private getValueType(value: any): SystemConfig["type"] {
    if (typeof value === "number") return "number"
    if (typeof value === "boolean") return "boolean"
    if (typeof value === "object" && value !== null) return "json"
    return "string"
  }

  /**
   * Create audit log entry
   */
  private async auditLog(
    action: string,
    key: string,
    value: any,
    userId: string,
    tenantId?: string,
  ): Promise<void> {
    try {
      const supabase = this.isServerSide
        ? await createClient()
        : createBrowserClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          )

      await supabase.from("config_audit_logs").insert({
        action,
        config_key: key,
        config_value: value,
        user_id: userId,
        tenant_id: tenantId,
      })
    } catch (error) {
      console.error("[ConfigManager] Audit log failed:", error)
    }
  }

  /**
   * Start automatic cache refresh
   */
  private startRefreshInterval(): void {
    // Refresh cache every 5 minutes
    this.refreshInterval = setInterval(
      () => {
        this.refreshCache()
      },
      5 * 60 * 1000,
    )
  }

  /**
   * Stop automatic cache refresh
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
let configManagerInstance: ConfigManager | null = null

export function getConfigManager(): ConfigManager {
  if (!configManagerInstance) {
    configManagerInstance = new ConfigManager()
  }
  return configManagerInstance
}

export default ConfigManager
