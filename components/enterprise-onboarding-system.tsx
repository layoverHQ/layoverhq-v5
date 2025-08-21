"use client"

/**
 * Enterprise Onboarding System - Self-Service Tenant Provisioning
 *
 * Comprehensive onboarding interface that allows new enterprise customers
 * to provision their tenants, configure initial settings, and generate
 * API credentials without manual intervention.
 */

import React, { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Building2,
  User,
  Key,
  Globe,
  Settings,
  Check,
  ArrowRight,
  ArrowLeft,
  AlertTriangle,
  CheckCircle,
  Copy,
  Download,
  Mail,
  Phone,
  MapPin,
  CreditCard,
  Shield,
  Zap,
  Users,
  Database,
  Cloud,
  Rocket,
  Star,
} from "lucide-react"

interface OnboardingStep {
  id: string
  title: string
  description: string
  required: boolean
  completed: boolean
}

interface CompanyInfo {
  name: string
  slug: string
  industry: string
  size: string
  country: string
  description: string
  website?: string
  logo_url?: string
}

interface ContactInfo {
  first_name: string
  last_name: string
  email: string
  phone?: string
  title: string
  department: string
}

interface TechnicalConfig {
  data_residency: string
  subscription_plan: string
  expected_monthly_volume: number
  integration_requirements: string[]
  custom_domain?: string
  sso_provider?: string
}

interface OnboardingRequest {
  company: CompanyInfo
  primary_contact: ContactInfo
  technical_contact?: ContactInfo
  billing_contact?: ContactInfo
  technical_config: TechnicalConfig
  feature_preferences: string[]
  compliance_requirements: string[]
  agreed_to_terms: boolean
  marketing_consent: boolean
}

interface OnboardingResult {
  tenant_id: string
  api_key: string
  api_secret: string
  dashboard_url: string
  documentation_url: string
  support_contact: string
}

const steps: OnboardingStep[] = [
  {
    id: "company",
    title: "Company Information",
    description: "Basic information about your organization",
    required: true,
    completed: false,
  },
  {
    id: "contacts",
    title: "Contact Details",
    description: "Key contacts for your account",
    required: true,
    completed: false,
  },
  {
    id: "technical",
    title: "Technical Configuration",
    description: "Technical requirements and preferences",
    required: true,
    completed: false,
  },
  {
    id: "features",
    title: "Feature Selection",
    description: "Choose the features you need",
    required: false,
    completed: false,
  },
  {
    id: "compliance",
    title: "Compliance & Security",
    description: "Security and compliance requirements",
    required: false,
    completed: false,
  },
  {
    id: "review",
    title: "Review & Submit",
    description: "Review your configuration and complete setup",
    required: true,
    completed: false,
  },
]

const industryOptions = [
  "Airline/Aviation",
  "Travel Technology",
  "Online Travel Agency",
  "Corporate Travel",
  "Hospitality",
  "Tourism Board",
  "Travel Insurance",
  "Other",
]

const companySizeOptions = [
  "1-10 employees",
  "11-50 employees",
  "51-200 employees",
  "201-1000 employees",
  "1000+ employees",
]

const subscriptionPlans = [
  {
    id: "starter",
    name: "Starter",
    price: "$99/month",
    features: [
      "Up to 10,000 API calls/month",
      "Basic flight search",
      "Email support",
      "Standard SLA",
    ],
  },
  {
    id: "professional",
    name: "Professional",
    price: "$499/month",
    features: [
      "Up to 100,000 API calls/month",
      "Advanced layover optimization",
      "Priority support",
      "Enhanced SLA",
      "White-label customization",
    ],
    popular: true,
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: "Custom pricing",
    features: [
      "Unlimited API calls",
      "Dedicated infrastructure",
      "24/7 phone support",
      "Custom integrations",
      "Full white-label solution",
      "Dedicated customer success manager",
    ],
  },
]

const availableFeatures = [
  { id: "flight_search", name: "Flight Search", description: "Core flight search functionality" },
  {
    id: "layover_optimization",
    name: "Layover Optimization",
    description: "AI-powered layover discovery",
  },
  {
    id: "experiences",
    name: "Experience Booking",
    description: "Activity and experience integration",
  },
  { id: "user_management", name: "User Management", description: "Customer account management" },
  { id: "analytics", name: "Analytics Dashboard", description: "Usage and performance analytics" },
  { id: "white_label", name: "White Label", description: "Full brand customization" },
  { id: "api_access", name: "API Access", description: "REST API and webhooks" },
  { id: "mobile_sdk", name: "Mobile SDK", description: "iOS and Android SDK" },
]

const complianceOptions = [
  { id: "gdpr", name: "GDPR", description: "General Data Protection Regulation compliance" },
  { id: "ccpa", name: "CCPA", description: "California Consumer Privacy Act compliance" },
  { id: "pci_dss", name: "PCI DSS", description: "Payment Card Industry Data Security Standard" },
  { id: "sox", name: "SOX", description: "Sarbanes-Oxley Act compliance" },
  {
    id: "hipaa",
    name: "HIPAA",
    description: "Health Insurance Portability and Accountability Act",
  },
  { id: "iso_27001", name: "ISO 27001", description: "Information security management" },
]

export default function EnterpriseOnboardingSystem() {
  const [currentStep, setCurrentStep] = useState(0)
  const [onboardingData, setOnboardingData] = useState<OnboardingRequest>({
    company: {
      name: "",
      slug: "",
      industry: "",
      size: "",
      country: "",
      description: "",
    },
    primary_contact: {
      first_name: "",
      last_name: "",
      email: "",
      title: "",
      department: "",
    },
    technical_config: {
      data_residency: "us-east-1",
      subscription_plan: "professional",
      expected_monthly_volume: 10000,
      integration_requirements: [],
    },
    feature_preferences: [],
    compliance_requirements: [],
    agreed_to_terms: false,
    marketing_consent: false,
  })
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set())
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [onboardingResult, setOnboardingResult] = useState<OnboardingResult | null>(null)
  const [validationErrors, setValidationErrors] = useState<Record<string, string[]>>({})

  // Auto-generate slug from company name
  useEffect(() => {
    if (onboardingData.company.name) {
      const slug = onboardingData.company.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
      setOnboardingData((prev) => ({
        ...prev,
        company: {
          ...prev.company,
          slug,
        },
      }))
    }
  }, [onboardingData.company.name])

  const updateCompanyInfo = (field: keyof CompanyInfo, value: string) => {
    setOnboardingData((prev) => ({
      ...prev,
      company: {
        ...prev.company,
        [field]: value,
      },
    }))
  }

  const updatePrimaryContact = (field: keyof ContactInfo, value: string) => {
    setOnboardingData((prev) => ({
      ...prev,
      primary_contact: {
        ...prev.primary_contact,
        [field]: value,
      },
    }))
  }

  const updateTechnicalConfig = (field: keyof TechnicalConfig, value: any) => {
    setOnboardingData((prev) => ({
      ...prev,
      technical_config: {
        ...prev.technical_config,
        [field]: value,
      },
    }))
  }

  const toggleFeature = (featureId: string) => {
    setOnboardingData((prev) => ({
      ...prev,
      feature_preferences: prev.feature_preferences.includes(featureId)
        ? prev.feature_preferences.filter((id) => id !== featureId)
        : [...prev.feature_preferences, featureId],
    }))
  }

  const toggleCompliance = (complianceId: string) => {
    setOnboardingData((prev) => ({
      ...prev,
      compliance_requirements: prev.compliance_requirements.includes(complianceId)
        ? prev.compliance_requirements.filter((id) => id !== complianceId)
        : [...prev.compliance_requirements, complianceId],
    }))
  }

  const validateStep = (stepId: string): boolean => {
    const errors: string[] = []

    switch (stepId) {
      case "company":
        if (!onboardingData.company.name) errors.push("Company name is required")
        if (!onboardingData.company.industry) errors.push("Industry is required")
        if (!onboardingData.company.size) errors.push("Company size is required")
        if (!onboardingData.company.country) errors.push("Country is required")
        break

      case "contacts":
        if (!onboardingData.primary_contact.first_name) errors.push("First name is required")
        if (!onboardingData.primary_contact.last_name) errors.push("Last name is required")
        if (!onboardingData.primary_contact.email) errors.push("Email is required")
        if (!onboardingData.primary_contact.title) errors.push("Job title is required")
        break

      case "technical":
        if (!onboardingData.technical_config.subscription_plan)
          errors.push("Subscription plan is required")
        if (onboardingData.technical_config.expected_monthly_volume <= 0) {
          errors.push("Expected monthly volume must be greater than 0")
        }
        break

      case "review":
        if (!onboardingData.agreed_to_terms) errors.push("You must agree to the terms of service")
        break
    }

    if (errors.length > 0) {
      setValidationErrors({ [stepId]: errors })
      return false
    } else {
      setValidationErrors((prev) => ({ ...prev, [stepId]: [] }))
      return true
    }
  }

  const nextStep = () => {
    const currentStepId = steps[currentStep].id
    if (validateStep(currentStepId)) {
      setCompletedSteps((prev) => new Set([...prev, currentStepId]))
      if (currentStep < steps.length - 1) {
        setCurrentStep(currentStep + 1)
      }
    }
  }

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const goToStep = (stepIndex: number) => {
    setCurrentStep(stepIndex)
  }

  const submitOnboarding = async () => {
    if (!validateStep("review")) return

    setIsSubmitting(true)
    try {
      const response = await fetch("/api/admin/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(onboardingData),
      })

      if (response.ok) {
        const result = await response.json()
        setOnboardingResult(result)
      } else {
        const error = await response.json()
        setValidationErrors({ submit: [error.message || "Onboarding failed"] })
      }
    } catch (error) {
      console.error("Onboarding error:", error)
      setValidationErrors({ submit: ["An unexpected error occurred. Please try again."] })
    } finally {
      setIsSubmitting(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  const getStepProgress = () => {
    return (
      ((completedSteps.size + (currentStep > completedSteps.size ? 1 : 0)) / steps.length) * 100
    )
  }

  if (onboardingResult) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Success Header */}
        <Card className="border-green-200 bg-green-50">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-green-900">Welcome to LayoverHQ!</h1>
                <p className="text-green-700 mt-2">
                  Your enterprise account has been successfully created and configured.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Account Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Key className="w-5 h-5 mr-2" />
                API Credentials
              </CardTitle>
              <CardDescription>
                Your API credentials for integration. Keep these secure!
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm font-medium">Tenant ID</Label>
                <div className="flex items-center space-x-2 mt-1">
                  <code className="bg-gray-100 px-3 py-2 rounded text-sm flex-1">
                    {onboardingResult.tenant_id}
                  </code>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(onboardingResult.tenant_id)}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <div>
                <Label className="text-sm font-medium">API Key</Label>
                <div className="flex items-center space-x-2 mt-1">
                  <code className="bg-gray-100 px-3 py-2 rounded text-sm flex-1">
                    {onboardingResult.api_key}
                  </code>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(onboardingResult.api_key)}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <div>
                <Label className="text-sm font-medium">API Secret</Label>
                <div className="flex items-center space-x-2 mt-1">
                  <code className="bg-gray-100 px-3 py-2 rounded text-sm flex-1">
                    ••••••••••••{onboardingResult.api_secret.slice(-4)}
                  </code>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(onboardingResult.api_secret)}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Rocket className="w-5 h-5 mr-2" />
                Quick Links
              </CardTitle>
              <CardDescription>Everything you need to get started quickly.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button asChild className="w-full justify-start">
                <a href={onboardingResult.dashboard_url} target="_blank" rel="noopener noreferrer">
                  <Globe className="w-4 h-4 mr-2" />
                  Access Your Dashboard
                </a>
              </Button>
              <Button variant="outline" asChild className="w-full justify-start">
                <a
                  href={onboardingResult.documentation_url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Download className="w-4 h-4 mr-2" />
                  API Documentation
                </a>
              </Button>
              <Button variant="outline" asChild className="w-full justify-start">
                <a href={`mailto:${onboardingResult.support_contact}`}>
                  <Mail className="w-4 h-4 mr-2" />
                  Contact Support
                </a>
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Next Steps */}
        <Card>
          <CardHeader>
            <CardTitle>Next Steps</CardTitle>
            <CardDescription>
              Here's what you should do next to make the most of your LayoverHQ account.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-semibold text-blue-600">1</span>
                </div>
                <div>
                  <h3 className="font-medium">Explore Your Dashboard</h3>
                  <p className="text-sm text-gray-600">
                    Familiarize yourself with the admin interface and configuration options.
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-semibold text-blue-600">2</span>
                </div>
                <div>
                  <h3 className="font-medium">Configure White-Label Settings</h3>
                  <p className="text-sm text-gray-600">
                    Customize your branding, theme, and domain settings to match your airline.
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-semibold text-blue-600">3</span>
                </div>
                <div>
                  <h3 className="font-medium">Test API Integration</h3>
                  <p className="text-sm text-gray-600">
                    Use your API credentials to test the integration and ensure everything works
                    correctly.
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-semibold text-blue-600">4</span>
                </div>
                <div>
                  <h3 className="font-medium">Schedule Training Session</h3>
                  <p className="text-sm text-gray-600">
                    Book a training session with our customer success team to maximize your ROI.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Download Summary */}
        <div className="text-center">
          <Button size="lg">
            <Download className="w-4 h-4 mr-2" />
            Download Account Summary
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-3xl">Enterprise Onboarding</CardTitle>
          <CardDescription className="text-lg">
            Welcome to LayoverHQ! Let's get your enterprise account set up in just a few steps.
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Progress */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Progress</span>
              <span className="text-sm text-gray-500">
                {Math.round(getStepProgress())}% Complete
              </span>
            </div>
            <Progress value={getStepProgress()} className="h-3" />
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Step Navigation */}
        <div className="space-y-2">
          {steps.map((step, index) => (
            <button
              key={step.id}
              onClick={() => goToStep(index)}
              className={`w-full text-left p-3 rounded-lg border transition-colors ${
                index === currentStep
                  ? "border-blue-500 bg-blue-50"
                  : completedSteps.has(step.id)
                    ? "border-green-500 bg-green-50"
                    : "border-gray-200 hover:bg-gray-50"
              }`}
            >
              <div className="flex items-center space-x-3">
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-sm font-semibold ${
                    completedSteps.has(step.id)
                      ? "bg-green-500 text-white"
                      : index === currentStep
                        ? "bg-blue-500 text-white"
                        : "bg-gray-200 text-gray-600"
                  }`}
                >
                  {completedSteps.has(step.id) ? (
                    <Check className="w-3 h-3" />
                  ) : (
                    <span>{index + 1}</span>
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="font-medium">{step.title}</h3>
                  <p className="text-sm text-gray-600">{step.description}</p>
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Step Content */}
        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <span className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center mr-3 text-sm font-semibold">
                  {currentStep + 1}
                </span>
                {steps[currentStep].title}
              </CardTitle>
              <CardDescription>{steps[currentStep].description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {validationErrors[steps[currentStep].id]?.length > 0 && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <ul className="list-disc list-inside space-y-1">
                      {validationErrors[steps[currentStep].id].map((error, index) => (
                        <li key={index}>{error}</li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}

              {/* Company Information */}
              {currentStep === 0 && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="company-name">Company Name *</Label>
                      <Input
                        id="company-name"
                        value={onboardingData.company.name}
                        onChange={(e) => updateCompanyInfo("name", e.target.value)}
                        placeholder="Acme Airlines"
                      />
                    </div>
                    <div>
                      <Label htmlFor="company-slug">Slug (auto-generated)</Label>
                      <Input
                        id="company-slug"
                        value={onboardingData.company.slug}
                        onChange={(e) => updateCompanyInfo("slug", e.target.value)}
                        placeholder="acme-airlines"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="industry">Industry *</Label>
                      <Select
                        value={onboardingData.company.industry}
                        onValueChange={(value) => updateCompanyInfo("industry", value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select your industry" />
                        </SelectTrigger>
                        <SelectContent>
                          {industryOptions.map((industry) => (
                            <SelectItem key={industry} value={industry}>
                              {industry}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="company-size">Company Size *</Label>
                      <Select
                        value={onboardingData.company.size}
                        onValueChange={(value) => updateCompanyInfo("size", value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select company size" />
                        </SelectTrigger>
                        <SelectContent>
                          {companySizeOptions.map((size) => (
                            <SelectItem key={size} value={size}>
                              {size}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="country">Country *</Label>
                      <Input
                        id="country"
                        value={onboardingData.company.country}
                        onChange={(e) => updateCompanyInfo("country", e.target.value)}
                        placeholder="United States"
                      />
                    </div>
                    <div>
                      <Label htmlFor="website">Website</Label>
                      <Input
                        id="website"
                        value={onboardingData.company.website || ""}
                        onChange={(e) => updateCompanyInfo("website", e.target.value)}
                        placeholder="https://acmeairlines.com"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="description">Company Description</Label>
                    <Textarea
                      id="description"
                      value={onboardingData.company.description}
                      onChange={(e) => updateCompanyInfo("description", e.target.value)}
                      placeholder="Brief description of your company and services..."
                      rows={3}
                    />
                  </div>
                </div>
              )}

              {/* Contact Details */}
              {currentStep === 1 && (
                <div className="space-y-6">
                  <div>
                    <h3 className="font-semibold mb-4">Primary Contact</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="first-name">First Name *</Label>
                        <Input
                          id="first-name"
                          value={onboardingData.primary_contact.first_name}
                          onChange={(e) => updatePrimaryContact("first_name", e.target.value)}
                          placeholder="John"
                        />
                      </div>
                      <div>
                        <Label htmlFor="last-name">Last Name *</Label>
                        <Input
                          id="last-name"
                          value={onboardingData.primary_contact.last_name}
                          onChange={(e) => updatePrimaryContact("last_name", e.target.value)}
                          placeholder="Smith"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                      <div>
                        <Label htmlFor="email">Email *</Label>
                        <Input
                          id="email"
                          type="email"
                          value={onboardingData.primary_contact.email}
                          onChange={(e) => updatePrimaryContact("email", e.target.value)}
                          placeholder="john.smith@acmeairlines.com"
                        />
                      </div>
                      <div>
                        <Label htmlFor="phone">Phone</Label>
                        <Input
                          id="phone"
                          value={onboardingData.primary_contact.phone || ""}
                          onChange={(e) => updatePrimaryContact("phone", e.target.value)}
                          placeholder="+1 (555) 123-4567"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                      <div>
                        <Label htmlFor="title">Job Title *</Label>
                        <Input
                          id="title"
                          value={onboardingData.primary_contact.title}
                          onChange={(e) => updatePrimaryContact("title", e.target.value)}
                          placeholder="VP of Digital"
                        />
                      </div>
                      <div>
                        <Label htmlFor="department">Department</Label>
                        <Input
                          id="department"
                          value={onboardingData.primary_contact.department}
                          onChange={(e) => updatePrimaryContact("department", e.target.value)}
                          placeholder="Technology"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Technical Configuration */}
              {currentStep === 2 && (
                <div className="space-y-6">
                  <div>
                    <h3 className="font-semibold mb-4">Subscription Plan</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {subscriptionPlans.map((plan) => (
                        <div
                          key={plan.id}
                          className={`border rounded-lg p-4 cursor-pointer transition-colors relative ${
                            onboardingData.technical_config.subscription_plan === plan.id
                              ? "border-blue-500 bg-blue-50"
                              : "border-gray-200 hover:border-gray-300"
                          }`}
                          onClick={() => updateTechnicalConfig("subscription_plan", plan.id)}
                        >
                          {plan.popular && (
                            <Badge className="absolute -top-2 left-4 bg-blue-500">Popular</Badge>
                          )}
                          <div className="text-center">
                            <h4 className="font-semibold">{plan.name}</h4>
                            <p className="text-2xl font-bold mt-2">{plan.price}</p>
                            <ul className="text-sm space-y-1 mt-4">
                              {plan.features.map((feature, index) => (
                                <li key={index} className="flex items-center">
                                  <Check className="w-3 h-3 text-green-500 mr-2 flex-shrink-0" />
                                  {feature}
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="data-residency">Data Residency</Label>
                      <Select
                        value={onboardingData.technical_config.data_residency}
                        onValueChange={(value) => updateTechnicalConfig("data_residency", value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="us-east-1">US East (Virginia)</SelectItem>
                          <SelectItem value="eu-west-1">EU West (Ireland)</SelectItem>
                          <SelectItem value="ap-southeast-1">Asia Pacific (Singapore)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="monthly-volume">Expected Monthly API Calls</Label>
                      <Input
                        id="monthly-volume"
                        type="number"
                        value={onboardingData.technical_config.expected_monthly_volume}
                        onChange={(e) =>
                          updateTechnicalConfig("expected_monthly_volume", parseInt(e.target.value))
                        }
                        placeholder="10000"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="custom-domain">Custom Domain (optional)</Label>
                    <Input
                      id="custom-domain"
                      value={onboardingData.technical_config.custom_domain || ""}
                      onChange={(e) => updateTechnicalConfig("custom_domain", e.target.value)}
                      placeholder="travel.acmeairlines.com"
                    />
                  </div>
                </div>
              )}

              {/* Feature Selection */}
              {currentStep === 3 && (
                <div className="space-y-6">
                  <div>
                    <h3 className="font-semibold mb-4">Select Features</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {availableFeatures.map((feature) => (
                        <div
                          key={feature.id}
                          className="flex items-center space-x-3 p-4 border rounded-lg"
                        >
                          <Checkbox
                            id={feature.id}
                            checked={onboardingData.feature_preferences.includes(feature.id)}
                            onCheckedChange={() => toggleFeature(feature.id)}
                          />
                          <div>
                            <Label htmlFor={feature.id} className="font-medium">
                              {feature.name}
                            </Label>
                            <p className="text-sm text-gray-600">{feature.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Compliance & Security */}
              {currentStep === 4 && (
                <div className="space-y-6">
                  <div>
                    <h3 className="font-semibold mb-4">Compliance Requirements</h3>
                    <div className="space-y-3">
                      {complianceOptions.map((compliance) => (
                        <div
                          key={compliance.id}
                          className="flex items-center space-x-3 p-4 border rounded-lg"
                        >
                          <Checkbox
                            id={compliance.id}
                            checked={onboardingData.compliance_requirements.includes(compliance.id)}
                            onCheckedChange={() => toggleCompliance(compliance.id)}
                          />
                          <div>
                            <Label htmlFor={compliance.id} className="font-medium">
                              {compliance.name}
                            </Label>
                            <p className="text-sm text-gray-600">{compliance.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Review & Submit */}
              {currentStep === 5 && (
                <div className="space-y-6">
                  <div>
                    <h3 className="font-semibold mb-4">Review Your Configuration</h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-sm">Company Information</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                          <div>
                            <span className="text-sm font-medium">Name:</span>
                            <span className="text-sm ml-2">{onboardingData.company.name}</span>
                          </div>
                          <div>
                            <span className="text-sm font-medium">Industry:</span>
                            <span className="text-sm ml-2">{onboardingData.company.industry}</span>
                          </div>
                          <div>
                            <span className="text-sm font-medium">Size:</span>
                            <span className="text-sm ml-2">{onboardingData.company.size}</span>
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader>
                          <CardTitle className="text-sm">Primary Contact</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                          <div>
                            <span className="text-sm font-medium">Name:</span>
                            <span className="text-sm ml-2">
                              {onboardingData.primary_contact.first_name}{" "}
                              {onboardingData.primary_contact.last_name}
                            </span>
                          </div>
                          <div>
                            <span className="text-sm font-medium">Email:</span>
                            <span className="text-sm ml-2">
                              {onboardingData.primary_contact.email}
                            </span>
                          </div>
                          <div>
                            <span className="text-sm font-medium">Title:</span>
                            <span className="text-sm ml-2">
                              {onboardingData.primary_contact.title}
                            </span>
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader>
                          <CardTitle className="text-sm">Technical Configuration</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                          <div>
                            <span className="text-sm font-medium">Plan:</span>
                            <span className="text-sm ml-2 capitalize">
                              {onboardingData.technical_config.subscription_plan}
                            </span>
                          </div>
                          <div>
                            <span className="text-sm font-medium">Data Residency:</span>
                            <span className="text-sm ml-2">
                              {onboardingData.technical_config.data_residency}
                            </span>
                          </div>
                          <div>
                            <span className="text-sm font-medium">Monthly Volume:</span>
                            <span className="text-sm ml-2">
                              {onboardingData.technical_config.expected_monthly_volume.toLocaleString()}
                            </span>
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader>
                          <CardTitle className="text-sm">Features & Compliance</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                          <div>
                            <span className="text-sm font-medium">Features:</span>
                            <span className="text-sm ml-2">
                              {onboardingData.feature_preferences.length} selected
                            </span>
                          </div>
                          <div>
                            <span className="text-sm font-medium">Compliance:</span>
                            <span className="text-sm ml-2">
                              {onboardingData.compliance_requirements.length} requirements
                            </span>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>

                  <div className="space-y-4 border-t pt-6">
                    <div className="flex items-start space-x-3">
                      <Checkbox
                        id="terms"
                        checked={onboardingData.agreed_to_terms}
                        onCheckedChange={(checked) =>
                          setOnboardingData((prev) => ({ ...prev, agreed_to_terms: !!checked }))
                        }
                      />
                      <Label htmlFor="terms" className="text-sm">
                        I agree to the{" "}
                        <a href="#" className="text-blue-600 hover:underline">
                          Terms of Service
                        </a>{" "}
                        and{" "}
                        <a href="#" className="text-blue-600 hover:underline">
                          Privacy Policy
                        </a>
                      </Label>
                    </div>
                    <div className="flex items-start space-x-3">
                      <Checkbox
                        id="marketing"
                        checked={onboardingData.marketing_consent}
                        onCheckedChange={(checked) =>
                          setOnboardingData((prev) => ({ ...prev, marketing_consent: !!checked }))
                        }
                      />
                      <Label htmlFor="marketing" className="text-sm">
                        I agree to receive marketing communications and product updates
                      </Label>
                    </div>
                  </div>
                </div>
              )}

              {/* Navigation */}
              <div className="flex items-center justify-between pt-6 border-t">
                <Button variant="outline" onClick={prevStep} disabled={currentStep === 0}>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Previous
                </Button>

                {currentStep < steps.length - 1 ? (
                  <Button onClick={nextStep}>
                    Next
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                ) : (
                  <Button onClick={submitOnboarding} disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                        Creating Account...
                      </>
                    ) : (
                      <>
                        Complete Setup
                        <CheckCircle className="w-4 h-4 ml-2" />
                      </>
                    )}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
