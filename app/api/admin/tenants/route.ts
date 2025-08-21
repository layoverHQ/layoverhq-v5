/**
 * Admin Tenants API - Enterprise Tenant Management
 *
 * RESTful API for managing enterprise tenants, onboarding,
 * and configuration through the zero-CLI admin interface.
 */

import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getConfigManager } from "@/lib/services/config-manager"
import crypto from "crypto"
import bcrypt from "bcryptjs"

interface CreateTenantRequest {
  name: string
  slug: string
  domain?: string
  subdomain?: string
  subscription_plan: "free" | "starter" | "professional" | "enterprise"
  data_residency_region: "us-east-1" | "eu-west-1" | "ap-southeast-1"
  owner_email: string
  owner_name: string
  industry?: string
  company_size?: string
  expected_volume?: number
}

interface TenantResponse {
  id: string
  name: string
  slug: string
  domain?: string
  subdomain?: string
  subscription_plan: string
  subscription_status: string
  api_key_hash?: string
  rate_limits: Record<string, number>
  usage_quotas: Record<string, number>
  current_usage: Record<string, number>
  white_label_config: Record<string, any>
  enabled_features: string[]
  status: string
  data_residency_region: string
  created_at: string
  updated_at: string
  user_count?: number
  monthly_api_calls?: number
  monthly_revenue?: number
}

/**
 * GET /api/admin/tenants
 * List all tenants with pagination and filtering
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "20")
    const status = searchParams.get("status")
    const plan = searchParams.get("plan")
    const search = searchParams.get("search")

    const supabase = await createClient()

    // Build query
    let query = supabase
      .from("enterprises")
      .select(
        `
        *,
        users(count)
      `,
      )
      .neq("status", "deleted")
      .order("created_at", { ascending: false })

    // Apply filters
    if (status) {
      query = query.eq("status", status)
    }

    if (plan) {
      query = query.eq("subscription_plan", plan)
    }

    if (search) {
      query = query.or(`name.ilike.%${search}%,slug.ilike.%${search}%,domain.ilike.%${search}%`)
    }

    // Apply pagination
    const from = (page - 1) * limit
    const to = from + limit - 1
    query = query.range(from, to)

    const { data: tenants, error, count } = await query

    if (error) {
      console.error("[Admin] Error fetching tenants:", error)
      return NextResponse.json({ error: "Failed to fetch tenants" }, { status: 500 })
    }

    // Get usage statistics for each tenant
    const enrichedTenants: TenantResponse[] = await Promise.all(
      (tenants || []).map(async (tenant) => {
        const { data: usageData } = await supabase
          .from("api_usage_logs")
          .select("*")
          .eq("tenant_id", tenant.id)
          .gte("timestamp", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()) // Last 30 days

        const monthlyApiCalls = usageData?.length || 0
        const monthlyRevenue = (usageData || []).reduce(
          (sum, log) => sum + (log.operation_cost || 0),
          0,
        )

        return {
          id: tenant.id,
          name: tenant.name,
          slug: tenant.slug,
          domain: tenant.domain,
          subdomain: tenant.subdomain,
          subscription_plan: tenant.subscription_plan,
          subscription_status: tenant.subscription_status,
          api_key_hash: tenant.api_key_hash,
          rate_limits: tenant.rate_limits || {},
          usage_quotas: tenant.usage_quotas || {},
          current_usage: tenant.current_usage || {},
          white_label_config: tenant.white_label_config || {},
          enabled_features: tenant.enabled_features || [],
          status: tenant.status,
          data_residency_region: tenant.data_residency_region,
          created_at: tenant.created_at,
          updated_at: tenant.updated_at,
          user_count: tenant.users?.[0]?.count || 0,
          monthly_api_calls: monthlyApiCalls,
          monthly_revenue: monthlyRevenue,
        }
      }),
    )

    return NextResponse.json({
      success: true,
      tenants: enrichedTenants,
      pagination: {
        page,
        limit,
        total: count || 0,
        pages: Math.ceil((count || 0) / limit),
      },
    })
  } catch (error) {
    console.error("[Admin] Tenants GET error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

/**
 * POST /api/admin/tenants
 * Create a new tenant
 */
export async function POST(request: NextRequest) {
  try {
    const body: CreateTenantRequest = await request.json()

    // Validate required fields
    if (!body.name || !body.slug || !body.owner_email || !body.owner_name) {
      return NextResponse.json(
        { error: "Missing required fields: name, slug, owner_email, owner_name" },
        { status: 400 },
      )
    }

    // Validate slug uniqueness
    const supabase = await createClient()
    const { data: existingTenant } = await supabase
      .from("enterprises")
      .select("id")
      .eq("slug", body.slug)
      .single()

    if (existingTenant) {
      return NextResponse.json({ error: "Slug already exists" }, { status: 400 })
    }

    // Generate default configuration based on subscription plan
    const defaultRateLimits = getDefaultRateLimits(body.subscription_plan)
    const defaultUsageQuotas = getDefaultUsageQuotas(body.subscription_plan)
    const defaultFeatures = getDefaultFeatures(body.subscription_plan)

    // Create enterprise/tenant
    const { data: enterprise, error: enterpriseError } = await supabase
      .from("enterprises")
      .insert({
        name: body.name,
        slug: body.slug,
        domain: body.domain,
        subdomain: body.subdomain,
        subscription_plan: body.subscription_plan,
        subscription_status: "active",
        rate_limits: defaultRateLimits,
        usage_quotas: defaultUsageQuotas,
        current_usage: { requests_this_month: 0, bandwidth_this_month_gb: 0 },
        enabled_features: defaultFeatures,
        white_label_config: getDefaultWhiteLabelConfig(body.name),
        data_residency_region: body.data_residency_region,
        status: "active",
      })
      .select()
      .single()

    if (enterpriseError) {
      console.error("[Admin] Error creating enterprise:", enterpriseError)
      return NextResponse.json({ error: "Failed to create tenant" }, { status: 500 })
    }

    // Generate API credentials
    const apiKey = generateApiKey()
    const apiSecret = generateApiSecret()
    const apiKeyHash = await bcrypt.hash(apiKey, 10)

    const { data: credentials, error: credentialsError } = await supabase
      .from("api_credentials")
      .insert({
        tenant_id: enterprise.id,
        name: "Primary API Key",
        description: "Auto-generated primary API key for tenant",
        api_key_hash: apiKeyHash,
        api_key_preview: apiKey.slice(-4),
        permissions: ["*"], // Full access
        rate_limits: defaultRateLimits,
        usage_quotas: defaultUsageQuotas,
        current_usage: { requests_this_month: 0, bandwidth_this_month_gb: 0 },
        is_active: true,
        created_by: "system",
      })
      .select()
      .single()

    if (credentialsError) {
      console.error("[Admin] Error creating API credentials:", credentialsError)
      // Clean up enterprise if credentials failed
      await supabase.from("enterprises").delete().eq("id", enterprise.id)
      return NextResponse.json({ error: "Failed to create API credentials" }, { status: 500 })
    }

    // Create owner user account
    const { data: user, error: userError } = await supabase
      .from("users")
      .insert({
        email: body.owner_email,
        enterprise_id: enterprise.id,
        role_in_enterprise: "owner",
        first_name: body.owner_name.split(" ")[0],
        last_name: body.owner_name.split(" ").slice(1).join(" ") || "",
        display_name: body.owner_name,
        subscription_tier: body.subscription_plan,
        consent_data_processing: true,
      })
      .select()
      .single()

    if (userError) {
      console.error("[Admin] Error creating owner user:", userError)
      // Note: We don't clean up here as the tenant is still valid without the user
    }

    // Initialize default configurations
    const configManager = getConfigManager()
    await configManager.initialize()

    // Set tenant-specific configurations
    const tenantConfigs = {
      "app.name": body.name,
      "app.tenant_id": enterprise.id,
      "features.white_label": true,
      "integrations.enabled": defaultFeatures,
    }

    for (const [key, value] of Object.entries(tenantConfigs)) {
      await configManager.set(key, value, "system", enterprise.id)
    }

    // Send welcome email (in a real implementation)
    // await sendWelcomeEmail(body.owner_email, enterprise, { apiKey, apiSecret })

    return NextResponse.json({
      success: true,
      tenant: {
        id: enterprise.id,
        name: enterprise.name,
        slug: enterprise.slug,
        api_key: apiKey,
        api_secret: apiSecret,
        dashboard_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?tenant=${enterprise.slug}`,
        documentation_url: `${process.env.NEXT_PUBLIC_APP_URL}/docs`,
        support_contact: process.env.SUPPORT_EMAIL || "support@layoverhq.com",
      },
    })
  } catch (error) {
    console.error("[Admin] Tenants POST error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

/**
 * Utility functions
 */
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

function getDefaultWhiteLabelConfig(companyName: string): Record<string, any> {
  return {
    branding: {
      brand_name: companyName,
      tagline: "Discover Amazing Layovers",
    },
    theme: {
      primary_color: "#3b82f6",
      secondary_color: "#64748b",
      accent_color: "#0ea5e9",
    },
    layout: {
      header_style: "standard",
      footer_style: "standard",
    },
  }
}

function generateApiKey(): string {
  return `layover_${crypto.randomBytes(16).toString("hex")}`
}

function generateApiSecret(): string {
  return crypto.randomBytes(32).toString("hex")
}
