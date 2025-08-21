/**
 * Enterprise Onboarding API - Self-Service Tenant Provisioning
 *
 * RESTful API for automated enterprise customer onboarding,
 * including tenant creation, API credential generation, and
 * initial configuration setup.
 */

import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getConfigManager } from "@/lib/services/config-manager"
import crypto from "crypto"
import bcrypt from "bcryptjs"

interface OnboardingRequest {
  company: {
    name: string
    slug: string
    industry: string
    size: string
    country: string
    description: string
    website?: string
    logo_url?: string
  }
  primary_contact: {
    first_name: string
    last_name: string
    email: string
    phone?: string
    title: string
    department: string
  }
  technical_contact?: {
    first_name: string
    last_name: string
    email: string
    phone?: string
    title: string
    department: string
  }
  billing_contact?: {
    first_name: string
    last_name: string
    email: string
    phone?: string
    title: string
    department: string
  }
  technical_config: {
    data_residency: "us-east-1" | "eu-west-1" | "ap-southeast-1"
    subscription_plan: "starter" | "professional" | "enterprise"
    expected_monthly_volume: number
    integration_requirements: string[]
    custom_domain?: string
    sso_provider?: string
  }
  feature_preferences: string[]
  compliance_requirements: string[]
  agreed_to_terms: boolean
  marketing_consent: boolean
}

interface OnboardingResponse {
  success: boolean
  tenant_id: string
  api_key: string
  api_secret: string
  dashboard_url: string
  documentation_url: string
  support_contact: string
  next_steps: Array<{
    step: string
    title: string
    description: string
    url?: string
  }>
}

/**
 * POST /api/admin/onboarding
 * Complete enterprise onboarding process
 */
export async function POST(request: NextRequest) {
  try {
    const onboardingData: OnboardingRequest = await request.json()

    // Validate required fields
    const validation = validateOnboardingData(onboardingData)
    if (!validation.valid) {
      return NextResponse.json(
        {
          success: false,
          error: "Validation failed",
          details: validation.errors,
        },
        { status: 400 },
      )
    }

    const supabase = await createClient()

    // Check if slug is available
    const { data: existingTenant } = await supabase
      .from("enterprises")
      .select("id")
      .eq("slug", onboardingData.company.slug)
      .single()

    if (existingTenant) {
      return NextResponse.json(
        {
          success: false,
          error: "Company slug already exists",
        },
        { status: 400 },
      )
    }

    // Check if email is already registered
    const { data: existingUser } = await supabase
      .from("users")
      .select("id")
      .eq("email", onboardingData.primary_contact.email)
      .single()

    if (existingUser) {
      return NextResponse.json(
        {
          success: false,
          error: "Email address already registered",
        },
        { status: 400 },
      )
    }

    // Generate tenant configuration based on plan and preferences
    const tenantConfig = generateTenantConfiguration(onboardingData)

    // Create the enterprise tenant
    const { data: enterprise, error: enterpriseError } = await supabase
      .from("enterprises")
      .insert({
        name: onboardingData.company.name,
        slug: onboardingData.company.slug,
        domain: onboardingData.technical_config.custom_domain,
        subscription_plan: onboardingData.technical_config.subscription_plan,
        subscription_status: "trial", // Start with trial
        rate_limits: tenantConfig.rateLimits,
        usage_quotas: tenantConfig.usageQuotas,
        current_usage: { requests_this_month: 0, bandwidth_this_month_gb: 0 },
        enabled_features: tenantConfig.enabledFeatures,
        white_label_config: generateWhiteLabelConfig(onboardingData),
        branding_settings: {
          company_name: onboardingData.company.name,
          industry: onboardingData.company.industry,
          company_size: onboardingData.company.size,
          logo_url: onboardingData.company.logo_url,
        },
        data_residency_region: onboardingData.technical_config.data_residency,
        compliance_requirements: onboardingData.compliance_requirements,
        status: "active",
        settings: {
          onboarding_completed: true,
          onboarded_at: new Date().toISOString(),
          expected_monthly_volume: onboardingData.technical_config.expected_monthly_volume,
          integration_requirements: onboardingData.technical_config.integration_requirements,
          marketing_consent: onboardingData.marketing_consent,
        },
      })
      .select()
      .single()

    if (enterpriseError) {
      console.error("[Onboarding] Error creating enterprise:", enterpriseError)
      return NextResponse.json(
        {
          success: false,
          error: "Failed to create enterprise account",
        },
        { status: 500 },
      )
    }

    // Generate API credentials
    const { apiKey, apiSecret, credentialsId } = await createApiCredentials(
      enterprise.id,
      tenantConfig,
    )

    if (!apiKey || !apiSecret) {
      // Clean up enterprise if credentials failed
      await supabase.from("enterprises").delete().eq("id", enterprise.id)
      return NextResponse.json(
        {
          success: false,
          error: "Failed to generate API credentials",
        },
        { status: 500 },
      )
    }

    // Create user accounts for contacts
    const primaryUserId = await createUserAccount(
      supabase,
      enterprise.id,
      onboardingData.primary_contact,
      "owner",
      onboardingData.technical_config.subscription_plan,
    )

    if (onboardingData.technical_contact) {
      await createUserAccount(
        supabase,
        enterprise.id,
        onboardingData.technical_contact,
        "admin",
        onboardingData.technical_config.subscription_plan,
      )
    }

    if (onboardingData.billing_contact) {
      await createUserAccount(
        supabase,
        enterprise.id,
        onboardingData.billing_contact,
        "admin",
        onboardingData.technical_config.subscription_plan,
      )
    }

    // Initialize tenant-specific configurations
    await initializeTenantConfigurations(enterprise.id, onboardingData)

    // Create onboarding audit trail
    await supabase.from("audit_logs").insert({
      tenant_id: enterprise.id,
      action: "TENANT_ONBOARDED",
      entity_type: "enterprise",
      entity_id: enterprise.id,
      changes: {
        onboarding_data: {
          ...onboardingData,
          // Remove sensitive data from audit log
          primary_contact: { ...onboardingData.primary_contact, email: "[REDACTED]" },
        },
      },
      performed_by: primaryUserId,
      timestamp: new Date().toISOString(),
    })

    // Send welcome emails (in background)
    // await sendWelcomeEmails(onboardingData, enterprise, { apiKey, apiSecret })

    // Generate next steps
    const nextSteps = generateNextSteps(onboardingData, enterprise)

    const response: OnboardingResponse = {
      success: true,
      tenant_id: enterprise.id,
      api_key: apiKey,
      api_secret: apiSecret,
      dashboard_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?tenant=${enterprise.slug}`,
      documentation_url: `${process.env.NEXT_PUBLIC_APP_URL}/docs`,
      support_contact: process.env.SUPPORT_EMAIL || "support@layoverhq.com",
      next_steps: nextSteps,
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error("[Onboarding] Error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error during onboarding",
      },
      { status: 500 },
    )
  }
}

/**
 * Validate onboarding data
 */
function validateOnboardingData(data: OnboardingRequest): {
  valid: boolean
  errors: string[]
} {
  const errors: string[] = []

  // Company validation
  if (!data.company.name) errors.push("Company name is required")
  if (!data.company.slug) errors.push("Company slug is required")
  if (!data.company.industry) errors.push("Industry is required")
  if (!data.company.size) errors.push("Company size is required")
  if (!data.company.country) errors.push("Country is required")

  // Primary contact validation
  if (!data.primary_contact.first_name) errors.push("Primary contact first name is required")
  if (!data.primary_contact.last_name) errors.push("Primary contact last name is required")
  if (!data.primary_contact.email) errors.push("Primary contact email is required")
  if (!data.primary_contact.title) errors.push("Primary contact title is required")

  // Email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (data.primary_contact.email && !emailRegex.test(data.primary_contact.email)) {
    errors.push("Primary contact email is invalid")
  }

  // Technical config validation
  if (!data.technical_config.subscription_plan) errors.push("Subscription plan is required")
  if (!data.technical_config.data_residency) errors.push("Data residency region is required")
  if (data.technical_config.expected_monthly_volume <= 0) {
    errors.push("Expected monthly volume must be greater than 0")
  }

  // Terms validation
  if (!data.agreed_to_terms) errors.push("Must agree to terms of service")

  // Custom domain validation
  if (data.technical_config.custom_domain) {
    const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9]\.[a-zA-Z]{2,}$/
    if (!domainRegex.test(data.technical_config.custom_domain)) {
      errors.push("Invalid custom domain format")
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

/**
 * Generate tenant configuration based on onboarding data
 */
function generateTenantConfiguration(data: OnboardingRequest) {
  const plan = data.technical_config.subscription_plan

  const rateLimits = {
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
  }[plan]

  const usageQuotas = {
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
  }[plan]

  // Combine plan features with user preferences
  const baseFeaturesForPlan = {
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
  }[plan]

  const enabledFeatures = [...new Set([...baseFeaturesForPlan, ...data.feature_preferences])]

  return {
    rateLimits,
    usageQuotas,
    enabledFeatures,
  }
}

/**
 * Generate white-label configuration
 */
function generateWhiteLabelConfig(data: OnboardingRequest) {
  return {
    branding: {
      brand_name: data.company.name,
      tagline: `${data.company.name} Travel Solutions`,
      company_description: data.company.description,
      logo_url: data.company.logo_url,
    },
    theme: {
      primary_color: "#3b82f6",
      secondary_color: "#64748b",
      accent_color: "#0ea5e9",
      background_color: "#ffffff",
      text_color: "#1f2937",
    },
    layout: {
      header_style: "branded",
      footer_style: "standard",
      sidebar_position: "left",
    },
    domain: {
      custom_domain: data.technical_config.custom_domain,
      ssl_enabled: true,
      domain_verified: false,
    },
    seo: {
      meta_title: `${data.company.name} - Travel Solutions`,
      meta_description: `Discover amazing travel opportunities with ${data.company.name}`,
    },
  }
}

/**
 * Create API credentials for the tenant
 */
async function createApiCredentials(
  tenantId: string,
  config: any,
): Promise<{ apiKey: string; apiSecret: string; credentialsId: string }> {
  try {
    const apiKey = `layover_${crypto.randomBytes(16).toString("hex")}`
    const apiSecret = crypto.randomBytes(32).toString("hex")
    const apiKeyHash = await bcrypt.hash(apiKey, 10)

    const supabase = await createClient()

    const { data: credentials, error } = await supabase
      .from("api_credentials")
      .insert({
        tenant_id: tenantId,
        name: "Primary API Key",
        description: "Auto-generated primary API key for enterprise tenant",
        api_key_hash: apiKeyHash,
        api_key_preview: apiKey.slice(-4),
        permissions: ["*"], // Full access
        rate_limits: config.rateLimits,
        usage_quotas: config.usageQuotas,
        current_usage: { requests_this_month: 0, bandwidth_this_month_gb: 0 },
        is_active: true,
        created_by: "system",
      })
      .select()
      .single()

    if (error) {
      console.error("[Onboarding] Error creating API credentials:", error)
      return { apiKey: "", apiSecret: "", credentialsId: "" }
    }

    return { apiKey, apiSecret, credentialsId: credentials.id }
  } catch (error) {
    console.error("[Onboarding] API credentials creation error:", error)
    return { apiKey: "", apiSecret: "", credentialsId: "" }
  }
}

/**
 * Create user account for a contact
 */
async function createUserAccount(
  supabase: any,
  enterpriseId: string,
  contact: any,
  role: string,
  subscriptionTier: string,
): Promise<string | null> {
  try {
    const { data: user, error } = await supabase
      .from("users")
      .insert({
        email: contact.email,
        enterprise_id: enterpriseId,
        role_in_enterprise: role,
        first_name: contact.first_name,
        last_name: contact.last_name,
        display_name: `${contact.first_name} ${contact.last_name}`,
        phone: contact.phone,
        subscription_tier: subscriptionTier,
        consent_data_processing: true,
        preferences: {
          job_title: contact.title,
          department: contact.department,
        },
      })
      .select()
      .single()

    if (error) {
      console.error("[Onboarding] Error creating user account:", error)
      return null
    }

    return user.id
  } catch (error) {
    console.error("[Onboarding] User account creation error:", error)
    return null
  }
}

/**
 * Initialize tenant-specific configurations
 */
async function initializeTenantConfigurations(tenantId: string, data: OnboardingRequest) {
  try {
    const configManager = getConfigManager()
    await configManager.initialize()

    const tenantConfigs = {
      "app.name": data.company.name,
      "app.tenant_id": tenantId,
      "app.industry": data.company.industry,
      "features.enabled": data.feature_preferences,
      "compliance.requirements": data.compliance_requirements,
      "integrations.enabled": data.technical_config.integration_requirements,
      "subscription.plan": data.technical_config.subscription_plan,
      "subscription.expected_volume": data.technical_config.expected_monthly_volume,
      "data.residency_region": data.technical_config.data_residency,
      "white_label.enabled": true,
    }

    for (const [key, value] of Object.entries(tenantConfigs)) {
      await configManager.set(key, value, "system", tenantId)
    }
  } catch (error) {
    console.error("[Onboarding] Error initializing tenant configurations:", error)
  }
}

/**
 * Generate personalized next steps for the tenant
 */
function generateNextSteps(data: OnboardingRequest, enterprise: any) {
  const steps = [
    {
      step: "1",
      title: "Access Your Dashboard",
      description: "Log into your personalized admin dashboard to configure your account",
      url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?tenant=${enterprise.slug}`,
    },
    {
      step: "2",
      title: "Configure White-Label Settings",
      description: "Customize your branding, theme, and domain to match your airline",
      url: `${process.env.NEXT_PUBLIC_APP_URL}/admin/white-label`,
    },
    {
      step: "3",
      title: "Test API Integration",
      description: "Use your API credentials to test the integration",
      url: `${process.env.NEXT_PUBLIC_APP_URL}/docs/getting-started`,
    },
  ]

  // Add custom domain setup if requested
  if (data.technical_config.custom_domain) {
    steps.push({
      step: "4",
      title: "Configure Custom Domain",
      description: `Set up DNS records for ${data.technical_config.custom_domain}`,
      url: `${process.env.NEXT_PUBLIC_APP_URL}/docs/custom-domains`,
    })
  }

  // Add SSO setup if requested
  if (data.technical_config.sso_provider) {
    steps.push({
      step: "5",
      title: "Configure Single Sign-On",
      description: `Set up ${data.technical_config.sso_provider} SSO integration`,
      url: `${process.env.NEXT_PUBLIC_APP_URL}/docs/sso-setup`,
    })
  }

  // Add compliance setup if required
  if (data.compliance_requirements.length > 0) {
    steps.push({
      step: "6",
      title: "Complete Compliance Setup",
      description: `Configure ${data.compliance_requirements.join(", ")} compliance requirements`,
      url: `${process.env.NEXT_PUBLIC_APP_URL}/docs/compliance`,
    })
  }

  return steps
}
