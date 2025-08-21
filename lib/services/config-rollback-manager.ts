/**
 * Configuration Rollback and Snapshot Manager
 *
 * Advanced rollback capabilities with automatic backups, change tracking,
 * and safe rollback procedures with validation and testing.
 */

import { createServiceRoleClient } from "@/lib/supabase/service-role"
import { getConfigManager } from "./config-manager"
import { EventEmitter } from "events"

export interface ConfigSnapshot {
  id: string
  name: string
  description?: string
  configs: Array<{
    key: string
    value: any
    type: string
    category: string
    tenant_id?: string
    environment: string
  }>
  tenant_id?: string
  created_at: string
  created_by: string
}

export interface RollbackPlan {
  id: string
  snapshot_id: string
  target_snapshot_id: string
  changes: Array<{
    key: string
    action: "create" | "update" | "delete"
    current_value?: any
    target_value?: any
    requires_restart?: boolean
    risk_level: "low" | "medium" | "high"
  }>
  validation_results: {
    passed: boolean
    warnings: string[]
    errors: string[]
  }
  estimated_downtime_seconds: number
  created_at: string
  created_by: string
}

export interface RollbackExecution {
  id: string
  rollback_plan_id: string
  status: "pending" | "in_progress" | "completed" | "failed" | "aborted"
  progress_percentage: number
  current_step: string
  steps_completed: number
  total_steps: number
  errors: string[]
  started_at: string
  completed_at?: string
  executed_by: string
}

export interface ConfigBackup {
  id: string
  backup_type: "automatic" | "manual" | "pre_rollback"
  trigger_event: string
  configs: Record<string, any>
  tenant_id?: string
  created_at: string
  retention_until: string
}

class ConfigRollbackManager extends EventEmitter {
  private supabase = createServiceRoleClient()
  private configManager = getConfigManager()
  private activeRollbacks = new Map<string, RollbackExecution>()

  constructor() {
    super()
    this.setupConfigChangeListener()
    this.startAutomaticBackups()
  }

  /**
   * Create a detailed snapshot with metadata
   */
  async createDetailedSnapshot(
    name: string,
    description: string,
    userId: string,
    tenantId?: string,
    includeDependencies = true,
  ): Promise<{ success: boolean; snapshot_id?: string; error?: string }> {
    try {
      // Get current configurations
      let query = this.supabase.from("system_configs").select("*").eq("is_active", true)

      if (tenantId) {
        query = query.eq("tenant_id", tenantId)
      } else {
        query = query.is("tenant_id", null)
      }

      const { data: configs, error } = await query

      if (error) throw error

      // Include dependency information if requested
      const enhancedConfigs = configs?.map((config) => ({
        ...config,
        dependencies: includeDependencies ? this.getConfigDependencies(config.key) : [],
        validation_rules: this.getConfigValidationRules(config.key),
      }))

      // Create snapshot with enhanced metadata
      const { data: snapshot, error: snapshotError } = await this.supabase
        .from("config_snapshots")
        .insert({
          name,
          description,
          configs: enhancedConfigs || [],
          tenant_id: tenantId,
          created_by: userId,
          metadata: {
            config_count: enhancedConfigs?.length || 0,
            categories: this.extractCategories(enhancedConfigs || []),
            environment_configs: this.groupByEnvironment(enhancedConfigs || []),
            snapshot_hash: this.generateSnapshotHash(enhancedConfigs || []),
          },
        })
        .select("id")
        .single()

      if (snapshotError) throw snapshotError

      // Log snapshot creation
      await this.logRollbackAction("SNAPSHOT_CREATE", snapshot.id, userId, {
        name,
        config_count: enhancedConfigs?.length || 0,
        tenant_id: tenantId,
      })

      this.emit("snapshotCreated", {
        snapshotId: snapshot.id,
        name,
        userId,
        tenantId,
      })

      return { success: true, snapshot_id: snapshot.id }
    } catch (error) {
      console.error("Error creating detailed snapshot:", error)
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }
    }
  }

  /**
   * Create a rollback plan with impact analysis
   */
  async createRollbackPlan(
    sourceSnapshotId: string,
    targetSnapshotId: string,
    userId: string,
  ): Promise<{ success: boolean; plan_id?: string; error?: string }> {
    try {
      // Get both snapshots
      const [sourceSnapshot, targetSnapshot] = await Promise.all([
        this.getSnapshot(sourceSnapshotId),
        this.getSnapshot(targetSnapshotId),
      ])

      if (!sourceSnapshot || !targetSnapshot) {
        return { success: false, error: "Snapshot not found" }
      }

      // Analyze differences
      const changes = this.analyzeConfigChanges(sourceSnapshot.configs, targetSnapshot.configs)

      // Validate changes
      const validationResults = await this.validateRollbackChanges(changes)

      // Estimate impact
      const estimatedDowntime = this.estimateDowntime(changes)

      // Create rollback plan
      const { data: plan, error } = await this.supabase
        .from("config_rollback_plans")
        .insert({
          snapshot_id: sourceSnapshotId,
          target_snapshot_id: targetSnapshotId,
          changes,
          validation_results: validationResults,
          estimated_downtime_seconds: estimatedDowntime,
          created_by: userId,
          metadata: {
            change_count: changes.length,
            high_risk_changes: changes.filter((c) => c.risk_level === "high").length,
            requires_restart: changes.some((c) => c.requires_restart),
          },
        })
        .select("id")
        .single()

      if (error) throw error

      // Log plan creation
      await this.logRollbackAction("PLAN_CREATE", plan.id, userId, {
        source_snapshot: sourceSnapshotId,
        target_snapshot: targetSnapshotId,
        change_count: changes.length,
      })

      return { success: true, plan_id: plan.id }
    } catch (error) {
      console.error("Error creating rollback plan:", error)
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }
    }
  }

  /**
   * Execute rollback plan with progress tracking
   */
  async executeRollbackPlan(
    planId: string,
    userId: string,
    options: {
      dryRun?: boolean
      skipValidation?: boolean
      continueOnError?: boolean
    } = {},
  ): Promise<{ success: boolean; execution_id?: string; error?: string }> {
    try {
      // Get rollback plan
      const { data: plan, error: planError } = await this.supabase
        .from("config_rollback_plans")
        .select("*")
        .eq("id", planId)
        .single()

      if (planError || !plan) {
        return { success: false, error: "Rollback plan not found" }
      }

      // Validate plan if not skipped
      if (!options.skipValidation && !plan.validation_results.passed) {
        return {
          success: false,
          error: `Validation failed: ${plan.validation_results.errors.join(", ")}`,
        }
      }

      // Create execution record
      const { data: execution, error: executionError } = await this.supabase
        .from("config_rollback_executions")
        .insert({
          rollback_plan_id: planId,
          status: "pending",
          progress_percentage: 0,
          current_step: "initializing",
          steps_completed: 0,
          total_steps: plan.changes.length,
          executed_by: userId,
          options,
        })
        .select("id")
        .single()

      if (executionError) throw executionError

      // Track active rollback
      const executionData: RollbackExecution = {
        id: execution.id,
        rollback_plan_id: planId,
        status: "in_progress",
        progress_percentage: 0,
        current_step: "initializing",
        steps_completed: 0,
        total_steps: plan.changes.length,
        errors: [],
        started_at: new Date().toISOString(),
        executed_by: userId,
      }

      this.activeRollbacks.set(execution.id, executionData)

      // Execute rollback asynchronously
      this.performRollback(execution.id, plan, options, userId)

      return { success: true, execution_id: execution.id }
    } catch (error) {
      console.error("Error executing rollback plan:", error)
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }
    }
  }

  /**
   * Get rollback execution status
   */
  async getRollbackStatus(executionId: string): Promise<RollbackExecution | null> {
    // Check active rollbacks first
    const active = this.activeRollbacks.get(executionId)
    if (active) {
      return active
    }

    // Check database
    try {
      const { data: execution, error } = await this.supabase
        .from("config_rollback_executions")
        .select("*")
        .eq("id", executionId)
        .single()

      return execution || null
    } catch (error) {
      console.error("Error getting rollback status:", error)
      return null
    }
  }

  /**
   * Abort active rollback
   */
  async abortRollback(
    executionId: string,
    userId: string,
    reason: string,
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const execution = this.activeRollbacks.get(executionId)
      if (!execution) {
        return { success: false, error: "Rollback execution not found or not active" }
      }

      // Mark as aborted
      execution.status = "aborted"
      execution.completed_at = new Date().toISOString()

      // Update database
      await this.supabase
        .from("config_rollback_executions")
        .update({
          status: "aborted",
          completed_at: execution.completed_at,
          errors: [...execution.errors, `Aborted by user: ${reason}`],
        })
        .eq("id", executionId)

      // Remove from active rollbacks
      this.activeRollbacks.delete(executionId)

      // Log the abort
      await this.logRollbackAction("ROLLBACK_ABORT", executionId, userId, {
        reason,
        progress: execution.progress_percentage,
      })

      this.emit("rollbackAborted", { executionId, userId, reason })

      return { success: true }
    } catch (error) {
      console.error("Error aborting rollback:", error)
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }
    }
  }

  /**
   * Create automatic backup before changes
   */
  async createAutomaticBackup(
    triggerEvent: string,
    tenantId?: string,
    retentionDays = 30,
  ): Promise<string | null> {
    try {
      // Get current configurations
      let query = this.supabase.from("system_configs").select("*").eq("is_active", true)

      if (tenantId) {
        query = query.eq("tenant_id", tenantId)
      }

      const { data: configs, error } = await query

      if (error) throw error

      // Create backup
      const retentionDate = new Date()
      retentionDate.setDate(retentionDate.getDate() + retentionDays)

      const { data: backup, error: backupError } = await this.supabase
        .from("config_backups")
        .insert({
          backup_type: "automatic",
          trigger_event: triggerEvent,
          configs: configs || [],
          tenant_id: tenantId,
          retention_until: retentionDate.toISOString(),
        })
        .select("id")
        .single()

      if (backupError) throw backupError

      return backup.id
    } catch (error) {
      console.error("Error creating automatic backup:", error)
      return null
    }
  }

  /**
   * Get snapshot by ID
   */
  private async getSnapshot(snapshotId: string): Promise<ConfigSnapshot | null> {
    try {
      const { data: snapshot, error } = await this.supabase
        .from("config_snapshots")
        .select("*")
        .eq("id", snapshotId)
        .single()

      return snapshot || null
    } catch (error) {
      console.error("Error getting snapshot:", error)
      return null
    }
  }

  /**
   * Analyze configuration changes between snapshots
   */
  private analyzeConfigChanges(sourceConfigs: any[], targetConfigs: any[]): Array<any> {
    const changes: Array<any> = []
    const sourceMap = new Map(sourceConfigs.map((c) => [c.key, c]))
    const targetMap = new Map(targetConfigs.map((c) => [c.key, c]))

    // Find updates and deletes
    for (const [key, sourceConfig] of sourceMap) {
      const targetConfig = targetMap.get(key)

      if (!targetConfig) {
        // Config was deleted
        changes.push({
          key,
          action: "delete",
          current_value: sourceConfig.value,
          requires_restart: this.configRequiresRestart(key),
          risk_level: this.assessRiskLevel(key, "delete"),
        })
      } else if (JSON.stringify(sourceConfig.value) !== JSON.stringify(targetConfig.value)) {
        // Config was updated
        changes.push({
          key,
          action: "update",
          current_value: sourceConfig.value,
          target_value: targetConfig.value,
          requires_restart: this.configRequiresRestart(key),
          risk_level: this.assessRiskLevel(key, "update", sourceConfig.value, targetConfig.value),
        })
      }
    }

    // Find creates
    for (const [key, targetConfig] of targetMap) {
      if (!sourceMap.has(key)) {
        changes.push({
          key,
          action: "create",
          target_value: targetConfig.value,
          requires_restart: this.configRequiresRestart(key),
          risk_level: this.assessRiskLevel(key, "create"),
        })
      }
    }

    return changes
  }

  /**
   * Validate rollback changes
   */
  private async validateRollbackChanges(changes: any[]): Promise<any> {
    const warnings: string[] = []
    const errors: string[] = []

    for (const change of changes) {
      // Check if change is safe
      if (change.risk_level === "high") {
        warnings.push(`High risk change: ${change.key} (${change.action})`)
      }

      // Validate configuration values
      if (change.action !== "delete") {
        const validation = this.validateConfigValue(change.key, change.target_value)
        if (!validation.valid) {
          errors.push(`Invalid value for ${change.key}: ${validation.error}`)
        }
      }

      // Check dependencies
      const dependencies = this.getConfigDependencies(change.key)
      for (const dep of dependencies) {
        const depChange = changes.find((c) => c.key === dep)
        if (depChange && depChange.action === "delete") {
          errors.push(`Cannot modify ${change.key}: depends on ${dep} which is being deleted`)
        }
      }
    }

    return {
      passed: errors.length === 0,
      warnings,
      errors,
    }
  }

  /**
   * Perform the actual rollback
   */
  private async performRollback(
    executionId: string,
    plan: any,
    options: any,
    userId: string,
  ): Promise<void> {
    const execution = this.activeRollbacks.get(executionId)!

    try {
      execution.status = "in_progress"
      execution.current_step = "applying_changes"

      // Create pre-rollback backup
      const backupId = await this.createAutomaticBackup(
        `pre_rollback_${executionId}`,
        plan.tenant_id,
      )

      let completedSteps = 0

      for (const change of plan.changes) {
        try {
          execution.current_step = `Applying ${change.action} for ${change.key}`

          if (!options.dryRun) {
            await this.applyConfigChange(change, userId)
          }

          completedSteps++
          execution.steps_completed = completedSteps
          execution.progress_percentage = Math.round((completedSteps / execution.total_steps) * 100)

          // Update database periodically
          if (completedSteps % 5 === 0) {
            await this.updateExecutionProgress(executionId, execution)
          }

          this.emit("rollbackProgress", {
            executionId,
            progress: execution.progress_percentage,
            currentStep: execution.current_step,
          })
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : "Unknown error"
          execution.errors.push(`Error applying ${change.key}: ${errorMessage}`)

          if (!options.continueOnError) {
            throw error
          }
        }
      }

      // Mark as completed
      execution.status = "completed"
      execution.completed_at = new Date().toISOString()
      execution.progress_percentage = 100
      execution.current_step = "completed"

      await this.updateExecutionProgress(executionId, execution)

      // Log completion
      await this.logRollbackAction("ROLLBACK_COMPLETE", executionId, userId, {
        changes_applied: completedSteps,
        errors: execution.errors.length,
      })

      this.emit("rollbackCompleted", { executionId, userId })
    } catch (error) {
      execution.status = "failed"
      execution.completed_at = new Date().toISOString()
      execution.errors.push(error instanceof Error ? error.message : "Unknown error")

      await this.updateExecutionProgress(executionId, execution)

      await this.logRollbackAction("ROLLBACK_FAILED", executionId, userId, {
        error: execution.errors[execution.errors.length - 1],
        steps_completed: execution.steps_completed,
      })

      this.emit("rollbackFailed", { executionId, userId, error })
    } finally {
      this.activeRollbacks.delete(executionId)
    }
  }

  /**
   * Apply a single configuration change
   */
  private async applyConfigChange(change: any, userId: string): Promise<void> {
    switch (change.action) {
      case "create":
      case "update":
        await this.configManager.set(change.key, change.target_value, userId)
        break
      case "delete":
        // Mark as inactive instead of actual deletion
        await this.supabase
          .from("system_configs")
          .update({ is_active: false })
          .eq("key", change.key)
        break
    }
  }

  /**
   * Helper methods
   */

  private configRequiresRestart(key: string): boolean {
    const schema = this.configManager.getSchema()
    return schema[key]?.requires_restart || false
  }

  private assessRiskLevel(
    key: string,
    action: string,
    currentValue?: any,
    targetValue?: any,
  ): "low" | "medium" | "high" {
    // Risk assessment logic
    if (key.includes("security") || key.includes("auth")) return "high"
    if (action === "delete") return "medium"
    if (this.configRequiresRestart(key)) return "medium"
    return "low"
  }

  private validateConfigValue(key: string, value: any): { valid: boolean; error?: string } {
    // Use the config manager's validation
    const schema = this.configManager.getSchema()
    const schemaItem = schema[key]

    if (!schemaItem) {
      return { valid: false, error: "Unknown configuration key" }
    }

    // Basic validation - extend as needed
    return { valid: true }
  }

  private getConfigDependencies(key: string): string[] {
    // Return config dependencies - this would be defined in schema
    return []
  }

  private getConfigValidationRules(key: string): any {
    const schema = this.configManager.getSchema()
    return schema[key]?.validation || {}
  }

  private extractCategories(configs: any[]): string[] {
    return [...new Set(configs.map((c) => c.category))]
  }

  private groupByEnvironment(configs: any[]): Record<string, number> {
    return configs.reduce((acc, config) => {
      acc[config.environment] = (acc[config.environment] || 0) + 1
      return acc
    }, {})
  }

  private generateSnapshotHash(configs: any[]): string {
    // Generate hash of configuration state
    const content = JSON.stringify(configs.map((c) => ({ key: c.key, value: c.value })))
    return Buffer.from(content).toString("base64").substring(0, 16)
  }

  private estimateDowntime(changes: any[]): number {
    // Estimate downtime based on changes
    let downtime = 0

    for (const change of changes) {
      if (change.requires_restart) {
        downtime += 30 // 30 seconds for restart
      } else {
        downtime += 1 // 1 second for hot reload
      }
    }

    return downtime
  }

  private async updateExecutionProgress(
    executionId: string,
    execution: RollbackExecution,
  ): Promise<void> {
    await this.supabase
      .from("config_rollback_executions")
      .update({
        status: execution.status,
        progress_percentage: execution.progress_percentage,
        current_step: execution.current_step,
        steps_completed: execution.steps_completed,
        errors: execution.errors,
        completed_at: execution.completed_at,
      })
      .eq("id", executionId)
  }

  private setupConfigChangeListener(): void {
    this.configManager.on("configChanged", async (data) => {
      // Create automatic backup on significant changes
      if (this.isSignificantChange(data.key)) {
        await this.createAutomaticBackup(`config_change_${data.key}`, data.tenantId)
      }
    })
  }

  private isSignificantChange(key: string): boolean {
    // Define what constitutes a significant change
    return (
      key.includes("security") ||
      key.includes("database") ||
      key.includes("auth") ||
      this.configRequiresRestart(key)
    )
  }

  private startAutomaticBackups(): void {
    // Schedule automatic backups every 6 hours
    setInterval(
      async () => {
        await this.createAutomaticBackup("scheduled_backup")
      },
      6 * 60 * 60 * 1000,
    )
  }

  private async logRollbackAction(
    action: string,
    entityId: string,
    userId: string,
    metadata?: Record<string, any>,
  ): Promise<void> {
    try {
      await this.supabase.from("enterprise_audit_logs").insert({
        event_type: "configuration",
        entity_type: "rollback",
        entity_id: entityId,
        action,
        actor_id: userId,
        metadata: metadata || {},
        risk_score: action.includes("FAILED") ? 8 : action.includes("ABORT") ? 5 : 3,
      })
    } catch (error) {
      console.error("Error logging rollback action:", error)
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
let configRollbackManagerInstance: ConfigRollbackManager | null = null

export function getConfigRollbackManager(): ConfigRollbackManager {
  if (!configRollbackManagerInstance) {
    configRollbackManagerInstance = new ConfigRollbackManager()
  }
  return configRollbackManagerInstance
}

export default ConfigRollbackManager
