/**
 * Enterprise Admin API Routes
 *
 * Comprehensive API endpoints for enterprise administration including
 * tenant management, configuration, analytics, and system monitoring.
 */

import { NextRequest, NextResponse } from "next/server"
import { createServiceRoleClient } from "@/lib/supabase/service-role"
import { getConfigManager } from "@/lib/services/config-manager"
import { getFeatureFlagsManager } from "@/lib/services/feature-flags-manager"
import { getEnterpriseApiGateway } from "@/lib/services/enterprise-api-gateway"
import { verifyAdminAuth } from "@/lib/admin-auth"

export async function GET(request: NextRequest) {
  try {
    // Verify admin authentication
    const authResult = await verifyAdminAuth()
    if (!authResult.success) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const endpoint = searchParams.get("endpoint")

    switch (endpoint) {
      case "dashboard-metrics":
        return await getDashboardMetrics()

      case "system-health":
        return await getSystemHealth()

      case "tenants":
        return await getTenants(searchParams)

      case "analytics":
        return await getAnalytics(searchParams)

      default:
        return NextResponse.json({ error: "Invalid endpoint" }, { status: 400 })
    }
  } catch (error) {
    console.error("Enterprise admin API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await verifyAdminAuth()
    if (!authResult.success) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const endpoint = searchParams.get("endpoint")
    const body = await request.json()

    switch (endpoint) {
      case "create-tenant":
        return await createTenant(body, authResult.user.id)

      case "update-config":
        return await updateSystemConfig(body, authResult.user.id)

      case "create-snapshot":
        return await createConfigSnapshot(body, authResult.user.id)

      case "publish-white-label":
        return await publishWhiteLabel(body, authResult.user.id)

      default:
        return NextResponse.json({ error: "Invalid endpoint" }, { status: 400 })
    }
  } catch (error) {
    console.error("Enterprise admin API POST error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

async function getDashboardMetrics() {
  const supabase = createServiceRoleClient()
  const gateway = getEnterpriseApiGateway()

  try {
    // Get tenant count
    const { data: tenants, error: tenantsError } = await supabase
      .from("enterprises")
      .select("id, status, subscription_plan")
      .eq("status", "active")

    if (tenantsError) throw tenantsError

    // Get user count
    const { count: userCount, error: usersError } = await supabase
      .from("users")
      .select("*", { count: "exact", head: true })
      .not("deleted_at", "is", null)

    if (usersError) throw usersError

    // Get API usage from the last 24 hours
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    const { count: apiRequests, error: apiError } = await supabase
      .from("api_usage_logs")
      .select("*", { count: "exact", head: true })
      .gte("timestamp", yesterday)

    if (apiError) throw apiError

    // Calculate revenue (mock calculation for now)
    const monthlyRevenue =
      tenants?.reduce((total, tenant) => {
        const planRevenue = {
          free: 0,
          starter: 99,
          professional: 299,
          enterprise: 999,
        }
        return total + (planRevenue[tenant.subscription_plan as keyof typeof planRevenue] || 0)
      }, 0) || 0

    // Get average response time
    const { data: recentLogs } = await supabase
      .from("api_usage_logs")
      .select("response_time_ms")
      .gte("timestamp", yesterday)
      .limit(1000)

    const avgResponseTime =
      recentLogs?.length > 0
        ? recentLogs.reduce((sum, log) => sum + log.response_time_ms, 0) / recentLogs.length
        : 0

    // Calculate error rate
    const { count: errorCount } = await supabase
      .from("api_usage_logs")
      .select("*", { count: "exact", head: true })
      .gte("timestamp", yesterday)
      .gte("response_status", 400)

    const errorRate = apiRequests > 0 ? ((errorCount || 0) / apiRequests) * 100 : 0

    return NextResponse.json({
      success: true,
      metrics: {
        active_tenants: tenants?.length || 0,
        total_users: userCount || 0,
        api_requests_24h: apiRequests || 0,
        response_time_avg: Math.round(avgResponseTime),
        error_rate: Math.round(errorRate * 100) / 100,
        cache_hit_rate: 94.7, // Mock data - would come from Redis
        uptime_percentage: 99.97, // Mock data - would come from monitoring
        revenue_this_month: monthlyRevenue,
      },
    })
  } catch (error) {
    console.error("Error getting dashboard metrics:", error)
    return NextResponse.json({ error: "Failed to get dashboard metrics" }, { status: 500 })
  }
}

async function getSystemHealth() {
  try {
    const supabase = createServiceRoleClient()

    // Check database health
    const { error: dbError } = await supabase.from("enterprises").select("id").limit(1)

    const dbHealth = dbError ? "critical" : "healthy"

    // Check Redis health (mock for now)
    const cacheHealth = "healthy"

    // Check API gateway health
    const apiHealth = "healthy"

    // Check integrations health (mock)
    const integrationsHealth = "healthy"

    const overall = [dbHealth, cacheHealth, apiHealth, integrationsHealth].includes("critical")
      ? "critical"
      : [dbHealth, cacheHealth, apiHealth, integrationsHealth].includes("warning")
        ? "warning"
        : "healthy"

    return NextResponse.json({
      success: true,
      health: {
        overall,
        database: dbHealth,
        cache: cacheHealth,
        api_gateway: apiHealth,
        integrations: integrationsHealth,
      },
    })
  } catch (error) {
    return NextResponse.json({
      success: true,
      health: {
        overall: "critical",
        database: "critical",
        cache: "unknown",
        api_gateway: "unknown",
        integrations: "unknown",
      },
    })
  }
}

async function getTenants(searchParams: URLSearchParams) {
  const supabase = createServiceRoleClient()
  const gateway = getEnterpriseApiGateway()

  try {
    let query = supabase
      .from("enterprises")
      .select(
        `
        *,
        users:users(count)
      `,
      )
      .order("created_at", { ascending: false })

    const status = searchParams.get("status")
    const plan = searchParams.get("plan")
    const search = searchParams.get("search")

    if (status && status !== "all") {
      query = query.eq("status", status)
    }

    if (plan && plan !== "all") {
      query = query.eq("subscription_plan", plan)
    }

    if (search) {
      query = query.or(`name.ilike.%${search}%, slug.ilike.%${search}%, domain.ilike.%${search}%`)
    }

    const { data: tenants, error } = await query

    if (error) throw error

    // Enhance with usage data
    const enhancedTenants = await Promise.all(
      (tenants || []).map(async (tenant) => {
        const usage = await gateway.getUsageMetrics(tenant.id, "month")
        return {
          ...tenant,
          user_count: tenant.users?.[0]?.count || 0,
          monthly_api_calls: usage.requests_count,
          monthly_revenue: getMonthlyRevenue(tenant.subscription_plan),
        }
      }),
    )

    return NextResponse.json({
      success: true,
      tenants: enhancedTenants,
    })
  } catch (error) {
    console.error("Error getting tenants:", error)
    return NextResponse.json({ error: "Failed to get tenants" }, { status: 500 })
  }
}

async function getAnalytics(searchParams: URLSearchParams) {
  const supabase = createServiceRoleClient()

  try {
    const tenantId = searchParams.get("tenant_id")
    const period = searchParams.get("period") || "7d"

    let startDate: Date
    switch (period) {
      case "24h":
        startDate = new Date(Date.now() - 24 * 60 * 60 * 1000)
        break
      case "7d":
        startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        break
      case "30d":
        startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        break
      default:
        startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    }

    let query = supabase
      .from("api_usage_logs")
      .select("*")
      .gte("timestamp", startDate.toISOString())

    if (tenantId) {
      query = query.eq("enterprise_id", tenantId)
    }

    const { data: usageLogs, error } = await query

    if (error) throw error

    // Process analytics data
    const analytics = {
      total_requests: usageLogs?.length || 0,
      successful_requests: usageLogs?.filter((log) => log.response_status < 400).length || 0,
      error_requests: usageLogs?.filter((log) => log.response_status >= 400).length || 0,
      avg_response_time:
        usageLogs?.length > 0
          ? usageLogs.reduce((sum, log) => sum + log.response_time_ms, 0) / usageLogs.length
          : 0,
      total_bandwidth:
        usageLogs?.reduce(
          (sum, log) => sum + (log.request_size_bytes || 0) + (log.response_size_bytes || 0),
          0,
        ) || 0,
      unique_endpoints: new Set(usageLogs?.map((log) => log.endpoint)).size,
      hourly_breakdown: processHourlyBreakdown(usageLogs || []),
      endpoint_usage: processEndpointUsage(usageLogs || []),
      status_code_distribution: processStatusCodes(usageLogs || []),
    }

    return NextResponse.json({
      success: true,
      analytics,
    })
  } catch (error) {
    console.error("Error getting analytics:", error)
    return NextResponse.json({ error: "Failed to get analytics" }, { status: 500 })
  }
}

async function createTenant(data: any, userId: string) {
  const supabase = createServiceRoleClient()

  try {
    // Create enterprise
    const { data: enterprise, error: enterpriseError } = await supabase
      .from("enterprises")
      .insert({
        name: data.name,
        slug: data.slug,
        domain: data.domain,
        subdomain: data.subdomain,
        subscription_plan: data.subscription_plan,
        data_residency_region: data.data_residency_region,
        status: "active",
        created_by: userId,
      })
      .select()
      .single()

    if (enterpriseError) throw enterpriseError

    // Create owner user
    const { data: user, error: userError } = await supabase
      .from("users")
      .insert({
        email: data.owner_email,
        enterprise_id: enterprise.id,
        role_in_enterprise: "owner",
        first_name: data.owner_name.split(" ")[0],
        last_name: data.owner_name.split(" ").slice(1).join(" "),
        subscription_tier: "enterprise",
        consent_data_processing: true,
      })
      .select()
      .single()

    if (userError) throw userError

    // Generate API key
    const apiKey = generateApiKey()
    const apiKeyHash = await hashApiKey(apiKey)

    const { error: apiKeyError } = await supabase.from("api_credentials").insert({
      tenant_id: enterprise.id,
      api_key_hash: apiKeyHash,
      permissions: ["*"], // Full permissions for new tenant
      rate_limits: getDefaultRateLimits(data.subscription_plan),
      usage_quotas: getDefaultUsageQuotas(data.subscription_plan),
      is_active: true,
    })

    if (apiKeyError) throw apiKeyError

    return NextResponse.json({
      success: true,
      tenant: enterprise,
      user: user,
      api_key: apiKey, // Only shown once
    })
  } catch (error) {
    console.error("Error creating tenant:", error)
    return NextResponse.json({ error: "Failed to create tenant" }, { status: 500 })
  }
}

async function updateSystemConfig(data: any, userId: string) {
  const configManager = getConfigManager()

  try {
    const result = await configManager.setBulk(data.configs, userId, data.tenant_id)
    return NextResponse.json(result)
  } catch (error) {
    console.error("Error updating system config:", error)
    return NextResponse.json({ error: "Failed to update configuration" }, { status: 500 })
  }
}

async function createConfigSnapshot(data: any, userId: string) {
  const configManager = getConfigManager()

  try {
    const snapshotId = await configManager.createSnapshot(data.name, userId, data.tenant_id)
    return NextResponse.json({
      success: !!snapshotId,
      snapshot_id: snapshotId,
    })
  } catch (error) {
    console.error("Error creating config snapshot:", error)
    return NextResponse.json({ error: "Failed to create snapshot" }, { status: 500 })
  }
}

async function publishWhiteLabel(data: any, userId: string) {
  const supabase = createServiceRoleClient()

  try {
    const { error } = await supabase
      .from("white_label_configs")
      .update({
        status: "published",
        last_published: new Date().toISOString(),
        updated_by: userId,
      })
      .eq("tenant_id", data.tenant_id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error publishing white label config:", error)
    return NextResponse.json({ error: "Failed to publish configuration" }, { status: 500 })
  }
}

// Helper functions

function getMonthlyRevenue(plan: string): number {
  const planRevenue = {
    free: 0,
    starter: 99,
    professional: 299,
    enterprise: 999,
  }
  return planRevenue[plan as keyof typeof planRevenue] || 0
}

function processHourlyBreakdown(logs: any[]): Array<{ hour: string; count: number }> {
  const breakdown: Record<string, number> = {}

  logs.forEach((log) => {
    const hour = new Date(log.timestamp).toISOString().slice(0, 13)
    breakdown[hour] = (breakdown[hour] || 0) + 1
  })

  return Object.entries(breakdown)
    .map(([hour, count]) => ({ hour, count }))
    .sort((a, b) => a.hour.localeCompare(b.hour))
}

function processEndpointUsage(
  logs: any[],
): Array<{ endpoint: string; count: number; avg_response_time: number }> {
  const usage: Record<string, { count: number; total_time: number }> = {}

  logs.forEach((log) => {
    if (!usage[log.endpoint]) {
      usage[log.endpoint] = { count: 0, total_time: 0 }
    }
    usage[log.endpoint].count++
    usage[log.endpoint].total_time += log.response_time_ms
  })

  return Object.entries(usage)
    .map(([endpoint, data]) => ({
      endpoint,
      count: data.count,
      avg_response_time: data.count > 0 ? data.total_time / data.count : 0,
    }))
    .sort((a, b) => b.count - a.count)
}

function processStatusCodes(logs: any[]): Record<string, number> {
  const codes: Record<string, number> = {}

  logs.forEach((log) => {
    const status = Math.floor(log.response_status / 100) * 100
    const key = `${status}xx`
    codes[key] = (codes[key] || 0) + 1
  })

  return codes
}

function generateApiKey(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
  let result = "lhq_"
  for (let i = 0; i < 32; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

async function hashApiKey(apiKey: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(apiKey)
  const hashBuffer = await crypto.subtle.digest("SHA-256", data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("")
}

function getDefaultRateLimits(plan: string) {
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
      requests_per_hour: 10000,
      requests_per_day: 100000,
      burst_capacity: 500,
    },
    enterprise: {
      requests_per_minute: 1000,
      requests_per_hour: 50000,
      requests_per_day: 1000000,
      burst_capacity: 2000,
    },
  }
  return limits[plan as keyof typeof limits] || limits.free
}

function getDefaultUsageQuotas(plan: string) {
  const quotas = {
    free: { monthly_requests: 1000, monthly_bandwidth_gb: 1 },
    starter: { monthly_requests: 10000, monthly_bandwidth_gb: 10 },
    professional: { monthly_requests: 100000, monthly_bandwidth_gb: 100 },
    enterprise: { monthly_requests: 1000000, monthly_bandwidth_gb: 1000 },
  }
  return quotas[plan as keyof typeof quotas] || quotas.free
}
