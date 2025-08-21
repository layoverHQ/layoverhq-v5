/**
 * Enterprise API Credentials Manager
 *
 * Secure management of third-party API credentials with encryption,
 * rotation, quota management, and comprehensive audit logging.
 */

import { createClient } from "@/lib/supabase/server"
import { createServiceRoleClient } from "@/lib/supabase/service-role"
import { getConfigManager } from "./config-manager"
import { createHash, createCipheriv, createDecipheriv, randomBytes } from "crypto"

export interface ApiCredential {
  id: string
  name: string
  provider: string
  credential_type: "api_key" | "oauth" | "bearer_token" | "basic_auth" | "custom"
  environment: "production" | "staging" | "development" | "sandbox"
  tenant_id?: string
  config: Record<string, any>
  rate_limits: Record<string, any>
  is_active: boolean
  is_test_mode: boolean
  last_used?: string
  usage_count: number
  created_at: string
  updated_at: string
  created_by: string
  updated_by?: string
}

export interface DecryptedCredential extends Omit<ApiCredential, "encrypted_data"> {
  credentials: Record<string, string>
}

export interface ApiUsageLog {
  id: string
  credential_id: string
  tenant_id?: string
  endpoint: string
  method: string
  status_code: number
  response_time_ms: number
  request_size_bytes?: number
  response_size_bytes?: number
  error_message?: string
  user_id?: string
  ip_address?: string
  user_agent?: string
  created_at: string
}

export interface QuotaLimit {
  id: string
  credential_id: string
  tenant_id?: string
  quota_type:
    | "requests_per_minute"
    | "requests_per_hour"
    | "requests_per_day"
    | "requests_per_month"
  limit_value: number
  current_usage: number
  reset_time: string
  is_active: boolean
}

export interface CreateCredentialRequest {
  name: string
  provider: string
  credential_type: ApiCredential["credential_type"]
  environment: ApiCredential["environment"]
  tenant_id?: string
  credentials: Record<string, string>
  config?: Record<string, any>
  rate_limits?: Record<string, any>
  is_test_mode?: boolean
}

export interface RotateCredentialRequest {
  credential_id: string
  new_credentials: Record<string, string>
  rotation_type?: "manual" | "automatic" | "emergency"
  reason?: string
}

class ApiCredentialsManager {
  private supabase = createServiceRoleClient()
  private configManager = getConfigManager()
  private encryptionKey: string

  constructor() {
    // In production, this should come from a secure key management service
    this.encryptionKey = process.env.API_CREDENTIALS_ENCRYPTION_KEY || this.generateEncryptionKey()
  }

  /**
   * Create new API credential with encryption
   */
  async createCredential(
    request: CreateCredentialRequest,
    userId: string,
  ): Promise<{ success: boolean; credential_id?: string; error?: string }> {
    try {
      // Validate required fields
      if (!request.name || !request.provider || !request.credentials) {
        return { success: false, error: "Missing required fields" }
      }

      // Check for existing credential with same provider/environment/tenant
      const existing = await this.getCredential(
        request.provider,
        request.environment,
        request.tenant_id,
      )
      if (existing) {
        return {
          success: false,
          error: `Credential already exists for ${request.provider} in ${request.environment}`,
        }
      }

      // Encrypt credentials
      const encryptedData = await this.encryptCredentials(request.credentials)
      const encryptionKeyId = this.getEncryptionKeyId()

      // Create credential record
      const { data: credential, error } = await this.supabase
        .from("api_credentials")
        .insert({
          name: request.name,
          provider: request.provider,
          credential_type: request.credential_type,
          environment: request.environment,
          tenant_id: request.tenant_id,
          encrypted_data: encryptedData,
          encryption_key_id: encryptionKeyId,
          config: request.config || {},
          rate_limits: request.rate_limits || {},
          is_test_mode: request.is_test_mode || false,
          created_by: userId,
          updated_by: userId,
        })
        .select("id")
        .single()

      if (error) {
        console.error("Error creating API credential:", error)
        return { success: false, error: error.message }
      }

      // Set up default quota limits
      await this.setupDefaultQuotas(credential.id, request.tenant_id)

      // Log the creation
      await this.logCredentialAction("CREATE", credential.id, userId, {
        provider: request.provider,
        environment: request.environment,
        tenant_id: request.tenant_id,
      })

      return { success: true, credential_id: credential.id }
    } catch (error) {
      console.error("Error in createCredential:", error)
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }
    }
  }

  /**
   * Get API credential by provider and environment
   */
  async getCredential(
    provider: string,
    environment: string,
    tenantId?: string,
  ): Promise<DecryptedCredential | null> {
    try {
      let query = this.supabase
        .from("api_credentials")
        .select("*")
        .eq("provider", provider)
        .eq("environment", environment)
        .eq("is_active", true)

      if (tenantId) {
        query = query.eq("tenant_id", tenantId)
      } else {
        query = query.is("tenant_id", null)
      }

      const { data: credential, error } = await query.single()

      if (error || !credential) {
        return null
      }

      // Decrypt credentials
      const decryptedCredentials = await this.decryptCredentials(
        credential.encrypted_data,
        credential.encryption_key_id,
      )

      return {
        ...credential,
        credentials: decryptedCredentials,
      }
    } catch (error) {
      console.error("Error getting credential:", error)
      return null
    }
  }

  /**
   * List API credentials with optional filtering
   */
  async listCredentials(
    tenantId?: string,
    provider?: string,
    environment?: string,
  ): Promise<ApiCredential[]> {
    try {
      let query = this.supabase
        .from("api_credentials")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false })

      if (tenantId) {
        query = query.eq("tenant_id", tenantId)
      }

      if (provider) {
        query = query.eq("provider", provider)
      }

      if (environment) {
        query = query.eq("environment", environment)
      }

      const { data: credentials, error } = await query

      if (error) {
        console.error("Error listing credentials:", error)
        return []
      }

      // Remove sensitive data from the list
      return (credentials || []).map((cred) => ({
        ...cred,
        encrypted_data: undefined,
      }))
    } catch (error) {
      console.error("Error in listCredentials:", error)
      return []
    }
  }

  /**
   * Update API credential configuration
   */
  async updateCredential(
    credentialId: string,
    updates: Partial<
      Pick<ApiCredential, "name" | "config" | "rate_limits" | "is_active" | "is_test_mode">
    >,
    userId: string,
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await this.supabase
        .from("api_credentials")
        .update({
          ...updates,
          updated_by: userId,
        })
        .eq("id", credentialId)

      if (error) {
        console.error("Error updating credential:", error)
        return { success: false, error: error.message }
      }

      await this.logCredentialAction("UPDATE", credentialId, userId, updates)

      return { success: true }
    } catch (error) {
      console.error("Error in updateCredential:", error)
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }
    }
  }

  /**
   * Rotate API credentials
   */
  async rotateCredential(
    request: RotateCredentialRequest,
    userId: string,
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Encrypt new credentials
      const encryptedData = await this.encryptCredentials(request.new_credentials)
      const newEncryptionKeyId = this.getEncryptionKeyId()

      // Use the database function for rotation
      const { error } = await this.supabase.rpc("rotate_api_credential", {
        credential_id_param: request.credential_id,
        new_encrypted_data: encryptedData,
        new_encryption_key_id: newEncryptionKeyId,
        rotation_type_param: request.rotation_type || "manual",
        reason_param: request.reason,
      })

      if (error) {
        console.error("Error rotating credential:", error)
        return { success: false, error: error.message }
      }

      await this.logCredentialAction("ROTATE", request.credential_id, userId, {
        rotation_type: request.rotation_type,
        reason: request.reason,
      })

      return { success: true }
    } catch (error) {
      console.error("Error in rotateCredential:", error)
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }
    }
  }

  /**
   * Delete API credential
   */
  async deleteCredential(
    credentialId: string,
    userId: string,
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Soft delete by marking as inactive
      const { error } = await this.supabase
        .from("api_credentials")
        .update({
          is_active: false,
          updated_by: userId,
        })
        .eq("id", credentialId)

      if (error) {
        console.error("Error deleting credential:", error)
        return { success: false, error: error.message }
      }

      await this.logCredentialAction("DELETE", credentialId, userId)

      return { success: true }
    } catch (error) {
      console.error("Error in deleteCredential:", error)
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }
    }
  }

  /**
   * Check API quota before making request
   */
  async checkQuota(
    credentialId: string,
    quotaType: QuotaLimit["quota_type"],
  ): Promise<{ allowed: boolean; limit?: number; current?: number; reset_time?: string }> {
    try {
      const { data: result, error } = await this.supabase.rpc("check_api_quota", {
        credential_id_param: credentialId,
        quota_type_param: quotaType,
      })

      if (error) {
        console.error("Error checking quota:", error)
        return { allowed: true } // Allow on error to prevent blocking
      }

      // Get quota details
      const { data: quota } = await this.supabase
        .from("api_quota_limits")
        .select("*")
        .eq("credential_id", credentialId)
        .eq("quota_type", quotaType)
        .eq("is_active", true)
        .single()

      return {
        allowed: result,
        limit: quota?.limit_value,
        current: quota?.current_usage,
        reset_time: quota?.reset_time,
      }
    } catch (error) {
      console.error("Error in checkQuota:", error)
      return { allowed: true }
    }
  }

  /**
   * Record API usage
   */
  async recordUsage(
    credentialId: string,
    usage: {
      endpoint: string
      method: string
      status_code: number
      response_time_ms: number
      request_size_bytes?: number
      response_size_bytes?: number
      error_message?: string
      user_id?: string
      ip_address?: string
      user_agent?: string
    },
  ): Promise<void> {
    try {
      // Update credential usage
      await this.supabase.rpc("update_api_credential_usage", {
        credential_id_param: credentialId,
        endpoint_param: usage.endpoint,
        status_code_param: usage.status_code,
        response_time_param: usage.response_time_ms,
      })

      // Increment quota usage for successful requests
      if (usage.status_code >= 200 && usage.status_code < 300) {
        await this.supabase.rpc("increment_api_quota_usage", {
          credential_id_param: credentialId,
          quota_type_param: "requests_per_minute",
        })
      }

      // Store detailed usage log
      await this.supabase.from("api_usage_logs").insert({
        credential_id: credentialId,
        ...usage,
      })
    } catch (error) {
      console.error("Error recording API usage:", error)
    }
  }

  /**
   * Get API usage analytics
   */
  async getUsageAnalytics(
    credentialId: string,
    startDate: string,
    endDate: string,
  ): Promise<{
    total_requests: number
    success_rate: number
    average_response_time: number
    error_breakdown: Record<number, number>
    hourly_usage: Array<{ hour: string; count: number }>
  }> {
    try {
      const { data: logs, error } = await this.supabase
        .from("api_usage_logs")
        .select("*")
        .eq("credential_id", credentialId)
        .gte("created_at", startDate)
        .lte("created_at", endDate)

      if (error || !logs) {
        throw error
      }

      const totalRequests = logs.length
      const successfulRequests = logs.filter(
        (log) => log.status_code >= 200 && log.status_code < 300,
      ).length
      const successRate = totalRequests > 0 ? (successfulRequests / totalRequests) * 100 : 0

      const avgResponseTime =
        totalRequests > 0
          ? logs.reduce((sum, log) => sum + (log.response_time_ms || 0), 0) / totalRequests
          : 0

      const errorBreakdown = logs.reduce(
        (acc, log) => {
          if (log.status_code >= 400) {
            acc[log.status_code] = (acc[log.status_code] || 0) + 1
          }
          return acc
        },
        {} as Record<number, number>,
      )

      const hourlyUsage = logs.reduce(
        (acc, log) => {
          const hour = new Date(log.created_at).toISOString().substring(0, 13) + ":00:00.000Z"
          const existing = acc.find((item) => item.hour === hour)
          if (existing) {
            existing.count++
          } else {
            acc.push({ hour, count: 1 })
          }
          return acc
        },
        [] as Array<{ hour: string; count: number }>,
      )

      return {
        total_requests: totalRequests,
        success_rate: successRate,
        average_response_time: avgResponseTime,
        error_breakdown: errorBreakdown,
        hourly_usage: hourlyUsage.sort((a, b) => a.hour.localeCompare(b.hour)),
      }
    } catch (error) {
      console.error("Error getting usage analytics:", error)
      return {
        total_requests: 0,
        success_rate: 0,
        average_response_time: 0,
        error_breakdown: {},
        hourly_usage: [],
      }
    }
  }

  /**
   * Set quota limits for credential
   */
  async setQuotaLimits(
    credentialId: string,
    quotas: Array<{
      quota_type: QuotaLimit["quota_type"]
      limit_value: number
    }>,
    tenantId?: string,
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Remove existing quotas
      await this.supabase.from("api_quota_limits").delete().eq("credential_id", credentialId)

      // Insert new quotas
      const quotaRecords = quotas.map((quota) => ({
        credential_id: credentialId,
        tenant_id: tenantId,
        quota_type: quota.quota_type,
        limit_value: quota.limit_value,
        reset_time: this.calculateResetTime(quota.quota_type),
      }))

      const { error } = await this.supabase.from("api_quota_limits").insert(quotaRecords)

      if (error) {
        console.error("Error setting quota limits:", error)
        return { success: false, error: error.message }
      }

      return { success: true }
    } catch (error) {
      console.error("Error in setQuotaLimits:", error)
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }
    }
  }

  /**
   * Private helper methods
   */

  private async encryptCredentials(credentials: Record<string, string>): Promise<any> {
    try {
      const iv = randomBytes(16)
      const cipher = createCipheriv("aes-256-gcm", Buffer.from(this.encryptionKey, "hex"), iv)

      let encrypted = cipher.update(JSON.stringify(credentials), "utf8", "hex")
      encrypted += cipher.final("hex")

      const authTag = cipher.getAuthTag()

      return {
        data: encrypted,
        iv: iv.toString("hex"),
        authTag: authTag.toString("hex"),
      }
    } catch (error) {
      console.error("Error encrypting credentials:", error)
      throw error
    }
  }

  private async decryptCredentials(
    encryptedData: any,
    encryptionKeyId: string,
  ): Promise<Record<string, string>> {
    try {
      const decipher = createDecipheriv(
        "aes-256-gcm",
        Buffer.from(this.encryptionKey, "hex"),
        Buffer.from(encryptedData.iv, "hex"),
      )

      decipher.setAuthTag(Buffer.from(encryptedData.authTag, "hex"))

      let decrypted = decipher.update(encryptedData.data, "hex", "utf8")
      decrypted += decipher.final("utf8")

      return JSON.parse(decrypted)
    } catch (error) {
      console.error("Error decrypting credentials:", error)
      throw error
    }
  }

  private generateEncryptionKey(): string {
    return randomBytes(32).toString("hex")
  }

  private getEncryptionKeyId(): string {
    return createHash("sha256").update(this.encryptionKey).digest("hex").substring(0, 16)
  }

  private async setupDefaultQuotas(credentialId: string, tenantId?: string): Promise<void> {
    const defaultQuotas = [
      { quota_type: "requests_per_minute" as const, limit_value: 60 },
      { quota_type: "requests_per_hour" as const, limit_value: 1000 },
      { quota_type: "requests_per_day" as const, limit_value: 10000 },
    ]

    await this.setQuotaLimits(credentialId, defaultQuotas, tenantId)
  }

  private calculateResetTime(quotaType: QuotaLimit["quota_type"]): string {
    const now = new Date()
    switch (quotaType) {
      case "requests_per_minute":
        return new Date(now.getTime() + 60 * 1000).toISOString()
      case "requests_per_hour":
        return new Date(now.getTime() + 60 * 60 * 1000).toISOString()
      case "requests_per_day":
        return new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString()
      case "requests_per_month":
        return new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString()
      default:
        return new Date(now.getTime() + 60 * 60 * 1000).toISOString()
    }
  }

  private async logCredentialAction(
    action: string,
    credentialId: string,
    userId: string,
    metadata?: Record<string, any>,
  ): Promise<void> {
    try {
      await this.supabase.from("enterprise_audit_logs").insert({
        event_type: "api_credentials",
        entity_type: "credential",
        entity_id: credentialId,
        action,
        actor_id: userId,
        metadata: metadata || {},
        risk_score: action === "DELETE" ? 5 : action === "ROTATE" ? 3 : 1,
      })
    } catch (error) {
      console.error("Error logging credential action:", error)
    }
  }
}

// Singleton instance
let apiCredentialsManagerInstance: ApiCredentialsManager | null = null

export function getApiCredentialsManager(): ApiCredentialsManager {
  if (!apiCredentialsManagerInstance) {
    apiCredentialsManagerInstance = new ApiCredentialsManager()
  }
  return apiCredentialsManagerInstance
}

export default ApiCredentialsManager
