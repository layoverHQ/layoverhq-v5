"use client"

import React, { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Palette,
  Globe,
  Settings,
  Eye,
  Upload,
  Download,
  Save,
  RefreshCw,
  Smartphone,
  Monitor,
  Tablet,
  Code,
  Link,
  Mail,
  Lock,
  Users,
  CreditCard,
  BarChart3,
  Shield,
} from "lucide-react"

interface WhiteLabelConfig {
  branding: {
    companyName: string
    logoUrl: string
    faviconUrl: string
    primaryColor: string
    secondaryColor: string
    accentColor: string
    fontFamily: string
    brandingMode: "light" | "dark" | "auto"
  }
  domain: {
    customDomain: string
    subdomain: string
    sslEnabled: boolean
    domainVerified: boolean
    dnsRecords: DNSRecord[]
  }
  content: {
    welcomeMessage: string
    supportEmail: string
    termsOfServiceUrl: string
    privacyPolicyUrl: string
    aboutUs: string
    footerText: string
  }
  features: {
    enableBooking: boolean
    enableReviews: boolean
    enableLoyaltyProgram: boolean
    enableChatSupport: boolean
    enableNotifications: boolean
    enableAnalytics: boolean
    enableAPIAccess: boolean
    enableWhiteGlove: boolean
  }
  integrations: {
    googleAnalytics: string
    facebookPixel: string
    intercom: string
    zendesk: string
    stripe: string
    customJs: string
    customCss: string
  }
  permissions: {
    adminUsers: AdminUser[]
    rolePermissions: Record<string, Permission[]>
    apiKeyAccess: boolean
    dataExportAccess: boolean
  }
  localization: {
    defaultLanguage: string
    supportedLanguages: string[]
    timezone: string
    currency: string
    dateFormat: string
  }
}

interface DNSRecord {
  type: string
  name: string
  value: string
  ttl: number
  status: "verified" | "pending" | "failed"
}

interface AdminUser {
  id: string
  email: string
  name: string
  role: "owner" | "admin" | "manager" | "viewer"
  lastLogin: Date
  status: "active" | "inactive" | "invited"
}

interface Permission {
  resource: string
  actions: string[]
}

interface WhiteLabelPortalProps {
  enterpriseId: string
  userRole: "owner" | "admin" | "manager"
}

export default function WhiteLabelAdminPortal({ enterpriseId, userRole }: WhiteLabelPortalProps) {
  const [config, setConfig] = useState<WhiteLabelConfig | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [previewMode, setPreviewMode] = useState<"desktop" | "tablet" | "mobile">("desktop")
  const [activeTab, setActiveTab] = useState("branding")
  const [isDirty, setIsDirty] = useState(false)

  useEffect(() => {
    loadWhiteLabelConfig()
  }, [enterpriseId])

  const loadWhiteLabelConfig = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/v1/enterprise/${enterpriseId}/white-label`)
      const data = await response.json()
      setConfig(data.config)
    } catch (error) {
      console.error("Failed to load white-label config:", error)
    } finally {
      setLoading(false)
    }
  }

  const saveConfig = async () => {
    if (!config) return

    try {
      setSaving(true)
      const response = await fetch(`/api/v1/enterprise/${enterpriseId}/white-label`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      })

      if (response.ok) {
        setIsDirty(false)
        // Show success notification
      }
    } catch (error) {
      console.error("Failed to save config:", error)
    } finally {
      setSaving(false)
    }
  }

  const updateConfig = (section: keyof WhiteLabelConfig, updates: any) => {
    if (!config) return

    setConfig({
      ...config,
      [section]: {
        ...config[section],
        ...updates,
      },
    })
    setIsDirty(true)
  }

  const verifyDomain = async () => {
    try {
      const response = await fetch(`/api/v1/enterprise/${enterpriseId}/white-label/verify-domain`, {
        method: "POST",
      })
      const data = await response.json()
      // Update domain verification status
      loadWhiteLabelConfig()
    } catch (error) {
      console.error("Failed to verify domain:", error)
    }
  }

  const uploadLogo = async (file: File, type: "logo" | "favicon") => {
    const formData = new FormData()
    formData.append("file", file)
    formData.append("type", type)

    try {
      const response = await fetch(`/api/v1/enterprise/${enterpriseId}/white-label/upload`, {
        method: "POST",
        body: formData,
      })

      const data = await response.json()
      if (data.success) {
        updateConfig("branding", {
          [type === "logo" ? "logoUrl" : "faviconUrl"]: data.url,
        })
      }
    } catch (error) {
      console.error("Failed to upload file:", error)
    }
  }

  const generatePreviewUrl = () => {
    return `${window.location.origin}/preview/${enterpriseId}?mode=${previewMode}`
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading white-label configuration...</p>
        </div>
      </div>
    )
  }

  if (!config) {
    return (
      <Alert>
        <Settings className="h-4 w-4" />
        <AlertDescription>
          Failed to load white-label configuration. Please try refreshing the page.
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">White-Label Configuration</h1>
          <p className="text-gray-600">Customize your branded experience</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => window.open(generatePreviewUrl(), "_blank")}>
            <Eye className="h-4 w-4 mr-2" />
            Preview
          </Button>
          <Button onClick={saveConfig} disabled={!isDirty || saving}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>

      {/* Unsaved Changes Alert */}
      {isDirty && (
        <Alert>
          <Save className="h-4 w-4" />
          <AlertDescription>
            You have unsaved changes. Don't forget to save your configuration.
          </AlertDescription>
        </Alert>
      )}

      {/* Preview Mode Selector */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Preview Mode
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Button
              variant={previewMode === "desktop" ? "default" : "outline"}
              size="sm"
              onClick={() => setPreviewMode("desktop")}
            >
              <Monitor className="h-4 w-4 mr-2" />
              Desktop
            </Button>
            <Button
              variant={previewMode === "tablet" ? "default" : "outline"}
              size="sm"
              onClick={() => setPreviewMode("tablet")}
            >
              <Tablet className="h-4 w-4 mr-2" />
              Tablet
            </Button>
            <Button
              variant={previewMode === "mobile" ? "default" : "outline"}
              size="sm"
              onClick={() => setPreviewMode("mobile")}
            >
              <Smartphone className="h-4 w-4 mr-2" />
              Mobile
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Configuration Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="branding">Branding</TabsTrigger>
          <TabsTrigger value="domain">Domain</TabsTrigger>
          <TabsTrigger value="content">Content</TabsTrigger>
          <TabsTrigger value="features">Features</TabsTrigger>
          <TabsTrigger value="integrations">Integrations</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="localization">Localization</TabsTrigger>
        </TabsList>

        <TabsContent value="branding" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Brand Identity */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Palette className="h-5 w-5" />
                  Brand Identity
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="companyName">Company Name</Label>
                  <Input
                    id="companyName"
                    value={config.branding.companyName}
                    onChange={(e) => updateConfig("branding", { companyName: e.target.value })}
                    placeholder="Your Company Name"
                  />
                </div>

                <div>
                  <Label htmlFor="logo">Logo Upload</Label>
                  <div className="flex items-center gap-4">
                    {config.branding.logoUrl && (
                      <img
                        src={config.branding.logoUrl}
                        alt="Logo"
                        className="h-12 w-12 object-contain border rounded"
                      />
                    )}
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) uploadLogo(file, "logo")
                      }}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="favicon">Favicon Upload</Label>
                  <div className="flex items-center gap-4">
                    {config.branding.faviconUrl && (
                      <img
                        src={config.branding.faviconUrl}
                        alt="Favicon"
                        className="h-6 w-6 object-contain border rounded"
                      />
                    )}
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) uploadLogo(file, "favicon")
                      }}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="fontFamily">Font Family</Label>
                  <Select
                    value={config.branding.fontFamily}
                    onValueChange={(value) => updateConfig("branding", { fontFamily: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select font" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Inter">Inter</SelectItem>
                      <SelectItem value="Roboto">Roboto</SelectItem>
                      <SelectItem value="Open Sans">Open Sans</SelectItem>
                      <SelectItem value="Lato">Lato</SelectItem>
                      <SelectItem value="Montserrat">Montserrat</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="brandingMode">Theme Mode</Label>
                  <Select
                    value={config.branding.brandingMode}
                    onValueChange={(value: "light" | "dark" | "auto") =>
                      updateConfig("branding", { brandingMode: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select theme mode" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">Light</SelectItem>
                      <SelectItem value="dark">Dark</SelectItem>
                      <SelectItem value="auto">Auto</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Color Scheme */}
            <Card>
              <CardHeader>
                <CardTitle>Color Scheme</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="primaryColor">Primary Color</Label>
                  <div className="flex gap-2">
                    <Input
                      id="primaryColor"
                      type="color"
                      value={config.branding.primaryColor}
                      onChange={(e) => updateConfig("branding", { primaryColor: e.target.value })}
                      className="w-16 h-10 p-1"
                    />
                    <Input
                      value={config.branding.primaryColor}
                      onChange={(e) => updateConfig("branding", { primaryColor: e.target.value })}
                      placeholder="#000000"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="secondaryColor">Secondary Color</Label>
                  <div className="flex gap-2">
                    <Input
                      id="secondaryColor"
                      type="color"
                      value={config.branding.secondaryColor}
                      onChange={(e) => updateConfig("branding", { secondaryColor: e.target.value })}
                      className="w-16 h-10 p-1"
                    />
                    <Input
                      value={config.branding.secondaryColor}
                      onChange={(e) => updateConfig("branding", { secondaryColor: e.target.value })}
                      placeholder="#000000"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="accentColor">Accent Color</Label>
                  <div className="flex gap-2">
                    <Input
                      id="accentColor"
                      type="color"
                      value={config.branding.accentColor}
                      onChange={(e) => updateConfig("branding", { accentColor: e.target.value })}
                      className="w-16 h-10 p-1"
                    />
                    <Input
                      value={config.branding.accentColor}
                      onChange={(e) => updateConfig("branding", { accentColor: e.target.value })}
                      placeholder="#000000"
                    />
                  </div>
                </div>

                {/* Color Preview */}
                <div className="mt-4 p-4 border rounded-lg">
                  <h4 className="font-semibold mb-2">Color Preview</h4>
                  <div className="flex gap-2">
                    <div
                      className="w-8 h-8 rounded border"
                      style={{ backgroundColor: config.branding.primaryColor }}
                      title="Primary"
                    />
                    <div
                      className="w-8 h-8 rounded border"
                      style={{ backgroundColor: config.branding.secondaryColor }}
                      title="Secondary"
                    />
                    <div
                      className="w-8 h-8 rounded border"
                      style={{ backgroundColor: config.branding.accentColor }}
                      title="Accent"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="domain" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Custom Domain Configuration
              </CardTitle>
              <CardDescription>Setup your custom domain and SSL certificate</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="customDomain">Custom Domain</Label>
                <div className="flex gap-2">
                  <Input
                    id="customDomain"
                    value={config.domain.customDomain}
                    onChange={(e) => updateConfig("domain", { customDomain: e.target.value })}
                    placeholder="travel.yourcompany.com"
                  />
                  <Button variant="outline" onClick={verifyDomain}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Verify
                  </Button>
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant={config.domain.domainVerified ? "default" : "secondary"}>
                    {config.domain.domainVerified ? "Verified" : "Not Verified"}
                  </Badge>
                  {config.domain.sslEnabled && (
                    <Badge variant="default">
                      <Lock className="h-3 w-3 mr-1" />
                      SSL Enabled
                    </Badge>
                  )}
                </div>
              </div>

              <div>
                <Label htmlFor="subdomain">Subdomain</Label>
                <div className="flex items-center">
                  <Input
                    id="subdomain"
                    value={config.domain.subdomain}
                    onChange={(e) => updateConfig("domain", { subdomain: e.target.value })}
                    placeholder="yourcompany"
                  />
                  <span className="ml-2 text-gray-600">.layoverhq.com</span>
                </div>
              </div>

              {/* DNS Records */}
              {config.domain.dnsRecords.length > 0 && (
                <div>
                  <Label>Required DNS Records</Label>
                  <div className="mt-2 space-y-2">
                    {config.domain.dnsRecords.map((record, index) => (
                      <div key={index} className="p-3 border rounded-lg">
                        <div className="flex justify-between items-center mb-2">
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary">{record.type}</Badge>
                            <span className="font-mono text-sm">{record.name}</span>
                          </div>
                          <Badge
                            className={
                              record.status === "verified"
                                ? "bg-green-100 text-green-800"
                                : record.status === "pending"
                                  ? "bg-yellow-100 text-yellow-800"
                                  : "bg-red-100 text-red-800"
                            }
                          >
                            {record.status}
                          </Badge>
                        </div>
                        <div className="font-mono text-sm text-gray-600 bg-gray-50 p-2 rounded">
                          {record.value}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="content" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Content & Messaging</CardTitle>
              <CardDescription>
                Customize the content and messaging throughout your platform
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="welcomeMessage">Welcome Message</Label>
                <Textarea
                  id="welcomeMessage"
                  value={config.content.welcomeMessage}
                  onChange={(e) => updateConfig("content", { welcomeMessage: e.target.value })}
                  placeholder="Welcome to our layover experience platform..."
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="aboutUs">About Us</Label>
                <Textarea
                  id="aboutUs"
                  value={config.content.aboutUs}
                  onChange={(e) => updateConfig("content", { aboutUs: e.target.value })}
                  placeholder="Tell users about your company..."
                  rows={4}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="supportEmail">Support Email</Label>
                  <Input
                    id="supportEmail"
                    type="email"
                    value={config.content.supportEmail}
                    onChange={(e) => updateConfig("content", { supportEmail: e.target.value })}
                    placeholder="support@yourcompany.com"
                  />
                </div>

                <div>
                  <Label htmlFor="footerText">Footer Text</Label>
                  <Input
                    id="footerText"
                    value={config.content.footerText}
                    onChange={(e) => updateConfig("content", { footerText: e.target.value })}
                    placeholder="© 2024 Your Company"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="termsOfServiceUrl">Terms of Service URL</Label>
                  <Input
                    id="termsOfServiceUrl"
                    type="url"
                    value={config.content.termsOfServiceUrl}
                    onChange={(e) => updateConfig("content", { termsOfServiceUrl: e.target.value })}
                    placeholder="https://yourcompany.com/terms"
                  />
                </div>

                <div>
                  <Label htmlFor="privacyPolicyUrl">Privacy Policy URL</Label>
                  <Input
                    id="privacyPolicyUrl"
                    type="url"
                    value={config.content.privacyPolicyUrl}
                    onChange={(e) => updateConfig("content", { privacyPolicyUrl: e.target.value })}
                    placeholder="https://yourcompany.com/privacy"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="features" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Feature Configuration</CardTitle>
              <CardDescription>
                Enable or disable features for your branded platform
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {Object.entries(config.features).map(([feature, enabled]) => (
                  <div key={feature} className="flex items-center justify-between">
                    <div>
                      <Label htmlFor={feature} className="capitalize">
                        {feature
                          .replace(/([A-Z])/g, " $1")
                          .replace("enable", "")
                          .trim()}
                      </Label>
                      <p className="text-sm text-gray-600 mt-1">{getFeatureDescription(feature)}</p>
                    </div>
                    <Switch
                      id={feature}
                      checked={enabled}
                      onCheckedChange={(checked) =>
                        updateConfig("features", { [feature]: checked })
                      }
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="integrations" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Third-Party Integrations</CardTitle>
              <CardDescription>Connect your analytics and support tools</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="googleAnalytics">Google Analytics ID</Label>
                  <Input
                    id="googleAnalytics"
                    value={config.integrations.googleAnalytics}
                    onChange={(e) =>
                      updateConfig("integrations", { googleAnalytics: e.target.value })
                    }
                    placeholder="GA-XXXXXXXXX-X"
                  />
                </div>

                <div>
                  <Label htmlFor="facebookPixel">Facebook Pixel ID</Label>
                  <Input
                    id="facebookPixel"
                    value={config.integrations.facebookPixel}
                    onChange={(e) =>
                      updateConfig("integrations", { facebookPixel: e.target.value })
                    }
                    placeholder="1234567890123456"
                  />
                </div>

                <div>
                  <Label htmlFor="intercom">Intercom App ID</Label>
                  <Input
                    id="intercom"
                    value={config.integrations.intercom}
                    onChange={(e) => updateConfig("integrations", { intercom: e.target.value })}
                    placeholder="abcd1234"
                  />
                </div>

                <div>
                  <Label htmlFor="stripe">Stripe Public Key</Label>
                  <Input
                    id="stripe"
                    value={config.integrations.stripe}
                    onChange={(e) => updateConfig("integrations", { stripe: e.target.value })}
                    placeholder="pk_live_..."
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="customCss">Custom CSS</Label>
                <Textarea
                  id="customCss"
                  value={config.integrations.customCss}
                  onChange={(e) => updateConfig("integrations", { customCss: e.target.value })}
                  placeholder="/* Your custom CSS styles */"
                  rows={6}
                  className="font-mono text-sm"
                />
              </div>

              <div>
                <Label htmlFor="customJs">Custom JavaScript</Label>
                <Textarea
                  id="customJs"
                  value={config.integrations.customJs}
                  onChange={(e) => updateConfig("integrations", { customJs: e.target.value })}
                  placeholder="// Your custom JavaScript code"
                  rows={6}
                  className="font-mono text-sm"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Admin Users & Permissions
              </CardTitle>
              <CardDescription>Manage admin access and permissions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {config.permissions.adminUsers.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div>
                      <div className="font-semibold">{user.name}</div>
                      <div className="text-sm text-gray-600">{user.email}</div>
                      <div className="text-xs text-gray-500 mt-1">
                        Last login: {new Date(user.lastLogin).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={user.status === "active" ? "default" : "secondary"}>
                        {user.status}
                      </Badge>
                      <Badge variant="outline">{user.role}</Badge>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 pt-6 border-t">
                <h4 className="font-semibold mb-4">API Access</h4>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Enable API Key Access</Label>
                    <p className="text-sm text-gray-600 mt-1">
                      Allow admin users to generate and manage API keys
                    </p>
                  </div>
                  <Switch
                    checked={config.permissions.apiKeyAccess}
                    onCheckedChange={(checked) =>
                      updateConfig("permissions", { apiKeyAccess: checked })
                    }
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="localization" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Localization Settings</CardTitle>
              <CardDescription>Configure language, currency, and regional settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="defaultLanguage">Default Language</Label>
                  <Select
                    value={config.localization.defaultLanguage}
                    onValueChange={(value) =>
                      updateConfig("localization", { defaultLanguage: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select language" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="es">Spanish</SelectItem>
                      <SelectItem value="fr">French</SelectItem>
                      <SelectItem value="de">German</SelectItem>
                      <SelectItem value="it">Italian</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="currency">Currency</Label>
                  <Select
                    value={config.localization.currency}
                    onValueChange={(value) => updateConfig("localization", { currency: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select currency" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USD">USD ($)</SelectItem>
                      <SelectItem value="EUR">EUR (€)</SelectItem>
                      <SelectItem value="GBP">GBP (£)</SelectItem>
                      <SelectItem value="CAD">CAD (C$)</SelectItem>
                      <SelectItem value="AUD">AUD (A$)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="timezone">Timezone</Label>
                  <Select
                    value={config.localization.timezone}
                    onValueChange={(value) => updateConfig("localization", { timezone: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select timezone" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="America/New_York">Eastern Time</SelectItem>
                      <SelectItem value="America/Chicago">Central Time</SelectItem>
                      <SelectItem value="America/Denver">Mountain Time</SelectItem>
                      <SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
                      <SelectItem value="Europe/London">GMT</SelectItem>
                      <SelectItem value="Europe/Paris">CET</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="dateFormat">Date Format</Label>
                  <Select
                    value={config.localization.dateFormat}
                    onValueChange={(value) => updateConfig("localization", { dateFormat: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select date format" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                      <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                      <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                      <SelectItem value="MMM DD, YYYY">MMM DD, YYYY</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

// Helper function to get feature descriptions
function getFeatureDescription(feature: string): string {
  const descriptions: Record<string, string> = {
    enableBooking: "Allow users to book experiences directly through your platform",
    enableReviews: "Enable customer reviews and ratings for experiences",
    enableLoyaltyProgram: "Activate loyalty points and rewards system",
    enableChatSupport: "Show live chat support widget",
    enableNotifications: "Send email and push notifications to users",
    enableAnalytics: "Track user behavior and provide analytics dashboard",
    enableAPIAccess: "Provide API access for custom integrations",
    enableWhiteGlove: "Enable premium white-glove concierge service",
  }
  return descriptions[feature] || "Configure this feature setting"
}
