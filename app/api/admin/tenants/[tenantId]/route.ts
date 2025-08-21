/**
 * Admin Individual Tenant API - Single Tenant Management
 *
 * RESTful API for managing individual enterprise tenants,
 * including updates, status changes, and detailed information.
 */

import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getConfigManager } from "@/lib/services/config-manager"

interface UpdateTenantRequest {
  name?: string
  domain?: string
  subdomain?: string
  subscription_plan?: "free" | "starter" | "professional" | "enterprise"
  status?: "active" | "suspended" | "trial" | "churned"
  rate_limits?: Record<string, number>
  usage_quotas?: Record<string, number>
  enabled_features?: string[]
  white_label_config?: Record<string, any>
  data_residency_region?: "us-east-1" | "eu-west-1" | "ap-southeast-1"
}

/**
 * GET /api/admin/tenants/[tenantId]
 * Get detailed information about a specific tenant
 */
export async function GET(request: NextRequest, { params }: { params: { tenantId: string } }) {
  try {
    const { tenantId } = params

    const supabase = await createClient()

    // Get tenant details with related data
    const { data: tenant, error } = await supabase
      .from("enterprises")
      .select(
        `
        *,
        users(
          id,
          email,
          first_name,
          last_name,
          role_in_enterprise,
          subscription_tier,
          last_login,
          created_at
        )
      `,
      )
      .eq("id", tenantId)
      .single()

    if (error || !tenant) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 })
    }

    // Get API credentials
    const { data: credentials } = await supabase
      .from("api_credentials")
      .select("*")
      .eq("tenant_id", tenantId)
      .eq("is_active", true)

    // Get recent API usage statistics
    const { data: usageStats } = await supabase
      .from("api_usage_logs")
      .select("*")
      .eq("tenant_id", tenantId)
      .gte("timestamp", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
      .order("timestamp", { ascending: false })
      .limit(100)

    // Calculate usage metrics
    const totalRequests = usageStats?.length || 0
    const totalRevenue = usageStats?.reduce((sum, log) => sum + (log.operation_cost || 0), 0) || 0
    const avgResponseTime = usageStats?.length
      ? usageStats.reduce((sum, log) => sum + log.response_time_ms, 0) / usageStats.length
      : 0

    // Get endpoint usage breakdown
    const endpointUsage =
      usageStats?.reduce(
        (acc, log) => {
          const endpoint = log.endpoint || "unknown"
          if (!acc[endpoint]) {
            acc[endpoint] = { count: 0, totalTime: 0 }
          }
          acc[endpoint].count++
          acc[endpoint].totalTime += log.response_time_ms
          return acc
        },
        {} as Record<string, { count: number; totalTime: number }>,
      ) || {}

    // Get error rate
    const errorCount = usageStats?.filter((log) => log.response_status >= 400).length || 0
    const errorRate = totalRequests > 0 ? (errorCount / totalRequests) * 100 : 0

    return NextResponse.json({
      success: true,
      tenant: {
        ...tenant,
        users: tenant.users || [],
        api_credentials: credentials || [],
        usage_statistics: {
          total_requests_30d: totalRequests,
          total_revenue_30d: totalRevenue,
          avg_response_time_ms: Math.round(avgResponseTime),
          error_rate_percent: Math.round(errorRate * 100) / 100,
          endpoint_usage: Object.entries(endpointUsage)
            .map(([endpoint, stats]: [string, any]) => ({
              endpoint,
              count: stats.count,
              avg_response_time: Math.round(stats.totalTime / stats.count),
            }))
            .sort((a, b) => b.count - a.count),
        },
      },
    })
  } catch (error) {
    console.error("[Admin] Tenant GET error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

/**
 * PATCH /api/admin/tenants/[tenantId]
 * Update tenant configuration
 */
export async function PATCH(request: NextRequest, { params }: { params: { tenantId: string } }) {
  try {
    const { tenantId } = params
    const updates: UpdateTenantRequest = await request.json()

    const supabase = await createClient()

    // Validate tenant exists
    const { data: existingTenant, error: fetchError } = await supabase
      .from("enterprises")
      .select("*")
      .eq("id", tenantId)
      .single()

    if (fetchError || !existingTenant) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 })
    }

    // Validate slug uniqueness if being updated
    if (updates.name && updates.name !== existingTenant.name) {
      const newSlug = updates.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")
      const { data: slugConflict } = await supabase
        .from("enterprises")
        .select("id")
        .eq("slug", newSlug)
        .neq("id", tenantId)
        .single()

      if (slugConflict) {
        return NextResponse.json(
          { error: "A tenant with this name already exists" },
          { status: 400 },
        )
      }

      // Update slug automatically
      updates.name = updates.name
    }

    // Prepare update data
    const updateData: any = {
      ...updates,
      updated_at: new Date().toISOString(),
    }

    // Auto-generate slug if name is updated
    if (updates.name) {
      updateData.slug = updates.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")
    }

    // Update tenant
    const { data: updatedTenant, error: updateError } = await supabase
      .from("enterprises")
      .update(updateData)
      .eq("id", tenantId)
      .select()
      .single()

    if (updateError) {
      console.error("[Admin] Error updating tenant:", updateError)
      return NextResponse.json({ error: "Failed to update tenant" }, { status: 500 })
    }

    // If subscription plan changed, update default configurations
    if (
      updates.subscription_plan &&
      updates.subscription_plan !== existingTenant.subscription_plan
    ) {
      await updateSubscriptionPlanConfigs(tenantId, updates.subscription_plan)
    }

    // If rate limits changed, update API credentials
    if (updates.rate_limits) {
      await supabase
        .from("api_credentials")
        .update({ rate_limits: updates.rate_limits })
        .eq("tenant_id", tenantId)
    }

    // If usage quotas changed, update API credentials
    if (updates.usage_quotas) {
      await supabase
        .from("api_credentials")
        .update({ usage_quotas: updates.usage_quotas })
        .eq("tenant_id", tenantId)
    }

    // Log the configuration change
    await supabase.from("audit_logs").insert({
      tenant_id: tenantId,
      action: "TENANT_UPDATED",
      entity_type: "enterprise",
      entity_id: tenantId,
      changes: updates,
      performed_by: "admin", // In real implementation, get from auth
      timestamp: new Date().toISOString(),
    })

    return NextResponse.json({
      success: true,
      tenant: updatedTenant,
    })
  } catch (error) {
    console.error("[Admin] Tenant PATCH error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

/**
 * DELETE /api/admin/tenants/[tenantId]
 * Soft delete a tenant (mark as deleted)
 */
export async function DELETE(request: NextRequest, { params }: { params: { tenantId: string } }) {
  try {
    const { tenantId } = params
    const { searchParams } = new URL(request.url)
    const hard = searchParams.get("hard") === "true"

    const supabase = await createClient()

    // Validate tenant exists
    const { data: existingTenant, error: fetchError } = await supabase
      .from("enterprises")
      .select("*")
      .eq("id", tenantId)
      .single()

    if (fetchError || !existingTenant) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 })
    }

    if (hard) {
      // Hard delete - permanently remove tenant and all related data
      // This should be used very carefully and only when necessary

      // Delete in order to respect foreign key constraints
      await Promise.all([
        supabase.from("api_usage_logs").delete().eq("tenant_id", tenantId),
        supabase.from("audit_logs").delete().eq("tenant_id", tenantId),
        supabase.from("config_audit_logs").delete().eq("tenant_id", tenantId),
        supabase.from("system_configs").delete().eq("tenant_id", tenantId),
        supabase.from("api_credentials").delete().eq("tenant_id", tenantId),
      ])

      await supabase.from("users").delete().eq("enterprise_id", tenantId)
      await supabase.from("enterprises").delete().eq("id", tenantId)

      await supabase.from("audit_logs").insert({
        tenant_id: tenantId,
        action: "TENANT_HARD_DELETED",
        entity_type: "enterprise",
        entity_id: tenantId,
        performed_by: "admin", // In real implementation, get from auth
        timestamp: new Date().toISOString(),
      })
    } else {
      // Soft delete - mark as deleted but keep data
      const { data: updatedTenant, error: updateError } = await supabase
        .from("enterprises")
        .update({
          status: "deleted",
          updated_at: new Date().toISOString(),
        })
        .eq("id", tenantId)
        .select()
        .single()

      if (updateError) {
        console.error("[Admin] Error soft deleting tenant:", updateError)
        return NextResponse.json({ error: "Failed to delete tenant" }, { status: 500 })
      }

      // Deactivate all API credentials
      await supabase.from("api_credentials").update({ is_active: false }).eq("tenant_id", tenantId)

      await supabase.from("audit_logs").insert({
        tenant_id: tenantId,
        action: "TENANT_SOFT_DELETED",
        entity_type: "enterprise",
        entity_id: tenantId,
        performed_by: "admin", // In real implementation, get from auth
        timestamp: new Date().toISOString(),
      })
    }

    return NextResponse.json({
      success: true,
      message: hard ? "Tenant permanently deleted" : "Tenant marked as deleted",
    })
  } catch (error) {
    console.error("[Admin] Tenant DELETE error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

/**
 * Update subscription plan configurations
 */
async function updateSubscriptionPlanConfigs(tenantId: string, newPlan: string) {
  const configManager = getConfigManager()

  // Get new defaults for the plan
  const newRateLimits = getDefaultRateLimits(newPlan)
  const newUsageQuotas = getDefaultUsageQuotas(newPlan)
  const newFeatures = getDefaultFeatures(newPlan)

  // Update configurations
  await configManager.set("subscription.plan", newPlan, "system", tenantId)
  await configManager.set("subscription.rate_limits", newRateLimits, "system", tenantId)
  await configManager.set("subscription.usage_quotas", newUsageQuotas, "system", tenantId)
  await configManager.set("subscription.enabled_features", newFeatures, "system", tenantId)
}

// Helper functions (same as in main tenants route)
function getDefaultRateLimits(plan: string): Record<string, number> {
  const limits = {
    free: {
      requests_per_minute: 10,
      requests_per_hour: 100,
      requests_per_day: 1000,
      burst_capacity: 20,
    },
    starter: {
      requests_per_minute: 60,
      requests_per_hour: 1000,
      requests_per_day: 10000,
      burst_capacity: 100,
    },
    professional: {
      requests_per_minute: 300,
      requests_per_hour: 5000,
      requests_per_day: 100000,
      burst_capacity: 500,
    },
    enterprise: {
      requests_per_minute: 1000,
      requests_per_hour: 20000,
      requests_per_day: 1000000,
      burst_capacity: 2000,
    },
  }

  return limits[plan as keyof typeof limits] || limits.free
}

function getDefaultUsageQuotas(plan: string): Record<string, number> {
  const quotas = {
    free: {
      monthly_requests: 1000,
      monthly_bandwidth_gb: 1,
    },
    starter: {
      monthly_requests: 10000,
      monthly_bandwidth_gb: 10,
    },
    professional: {
      monthly_requests: 100000,
      monthly_bandwidth_gb: 100,
    },
    enterprise: {
      monthly_requests: -1, // Unlimited
      monthly_bandwidth_gb: -1, // Unlimited
    },
  }

  return quotas[plan as keyof typeof quotas] || quotas.free
}

function getDefaultFeatures(plan: string): string[] {
  const features = {
    free: ["flight_search"],
    starter: ["flight_search", "layover_optimization", "basic_analytics"],
    professional: [
      "flight_search",
      "layover_optimization",
      "experiences",
      "analytics",
      "white_label",
      "api_access",
    ],
    enterprise: [
      "flight_search",
      "layover_optimization",
      "experiences",
      "analytics",
      "white_label",
      "api_access",
      "mobile_sdk",
      "custom_integrations",
      "dedicated_support",
    ],
  }

  return features[plan as keyof typeof features] || features.free
}
