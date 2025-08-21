"use client"

/**
 * White-Label Admin Portal
 * Complete interface for partner branding and customization management
 */

import React, { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import {
  Palette,
  Globe,
  Mail,
  Smartphone,
  Monitor,
  Eye,
  Save,
  Upload,
  Settings,
  Check,
  X,
  AlertCircle,
  Loader2,
  RefreshCw,
} from "lucide-react"

interface WhiteLabelConfig {
  branding: {
    primaryColor: string
    secondaryColor: string
    accentColor: string
    logoUrl: string
    logoUrlDark?: string
    faviconUrl: string
    fontFamily: string
    fontUrl?: string
  }
  domain: {
    customDomain?: string
    subdomain: string
    sslVerified: boolean
    dnsConfigured: boolean
  }
  ui: {
    theme: "light" | "dark" | "auto"
    layout: "modern" | "classic" | "minimal"
    headerStyle: "fixed" | "static" | "transparent"
    footerStyle: "minimal" | "detailed" | "hidden"
    buttonStyle: "rounded" | "sharp" | "pill"
  }
  content: {
    companyName: string
    tagline?: string
    welcomeMessage?: string
    supportEmail: string
    supportPhone?: string
    socialLinks: {
      facebook?: string
      twitter?: string
      instagram?: string
      linkedin?: string
    }
  }
  features: {
    enableBooking: boolean
    enableRecommendations: boolean
    enableLayoverAnalysis: boolean
    enablePriceAlerts: boolean
    enableMobileApp: boolean
    enableApiAccess: boolean
  }
}

interface PreviewData {
  previewUrl: string
  status: "generating" | "ready" | "error"
  lastUpdated: Date
}

export default function WhiteLabelAdminPortal() {
  const [config, setConfig] = useState<WhiteLabelConfig>({
    branding: {
      primaryColor: "#0066CC",
      secondaryColor: "#004499",
      accentColor: "#FF6B35",
      logoUrl: "/placeholder-logo.svg",
      faviconUrl: "/favicon.ico",
      fontFamily: "Inter",
    },
    domain: {
      subdomain: "layoverhq",
      sslVerified: false,
      dnsConfigured: false,
    },
    ui: {
      theme: "light",
      layout: "modern",
      headerStyle: "fixed",
      footerStyle: "detailed",
      buttonStyle: "rounded",
    },
    content: {
      companyName: "LayoverHQ",
      supportEmail: "support@layoverhq.com",
      socialLinks: {},
    },
    features: {
      enableBooking: true,
      enableRecommendations: true,
      enableLayoverAnalysis: true,
      enablePriceAlerts: true,
      enableMobileApp: false,
      enableApiAccess: false,
    },
  })

  const [preview, setPreview] = useState<PreviewData>({
    previewUrl: "",
    status: "ready",
    lastUpdated: new Date(),
  })

  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [activeTab, setActiveTab] = useState("branding")
  const [unsavedChanges, setUnsavedChanges] = useState(false)

  // Auto-generate preview on config changes
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      if (unsavedChanges) {
        generatePreview()
      }
    }, 1000)

    return () => clearTimeout(debounceTimer)
  }, [config])

  const generatePreview = async () => {
    try {
      setPreview((prev) => ({ ...prev, status: "generating" }))

      const response = await fetch("/api/admin/white-label/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ config }),
      })

      if (!response.ok) throw new Error("Failed to generate preview")

      const data = await response.json()
      setPreview({
        previewUrl: data.previewUrl,
        status: "ready",
        lastUpdated: new Date(),
      })
    } catch (error) {
      console.error("Preview generation failed:", error)
      setPreview((prev) => ({ ...prev, status: "error" }))
    }
  }

  const saveConfiguration = async () => {
    try {
      setIsSaving(true)

      const response = await fetch("/api/admin/white-label/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ config }),
      })

      if (!response.ok) throw new Error("Failed to save configuration")

      setUnsavedChanges(false)
      // Show success message
    } catch (error) {
      console.error("Save failed:", error)
      // Show error message
    } finally {
      setIsSaving(false)
    }
  }

  const setupCustomDomain = async (domain: string) => {
    try {
      const response = await fetch("/api/admin/white-label/domain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain }),
      })

      if (!response.ok) throw new Error("Failed to setup domain")

      const data = await response.json()
      // Show DNS configuration instructions
      return data
    } catch (error) {
      console.error("Domain setup failed:", error)
    }
  }

  const uploadLogo = async (file: File, type: "logo" | "favicon") => {
    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("type", type)

      const response = await fetch("/api/admin/white-label/upload", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) throw new Error("Upload failed")

      const data = await response.json()

      if (type === "logo") {
        setConfig((prev) => ({
          ...prev,
          branding: { ...prev.branding, logoUrl: data.url },
        }))
      } else {
        setConfig((prev) => ({
          ...prev,
          branding: { ...prev.branding, faviconUrl: data.url },
        }))
      }

      setUnsavedChanges(true)
    } catch (error) {
      console.error("Upload failed:", error)
    }
  }

  const updateConfig = (path: string, value: any) => {
    const keys = path.split(".")
    setConfig((prev) => {
      const newConfig = { ...prev }
      let current = newConfig

      for (let i = 0; i < keys.length - 1; i++) {
        current = current[keys[i]] = { ...current[keys[i]] }
      }

      current[keys[keys.length - 1]] = value
      return newConfig
    })
    setUnsavedChanges(true)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="container mx-auto py-8 px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">White-Label Customization</h1>
            <p className="text-slate-600 mt-2">
              Customize your LayoverHQ experience with your brand
            </p>
          </div>

          <div className="flex items-center gap-4">
            {unsavedChanges && (
              <Badge variant="secondary" className="animate-pulse">
                <AlertCircle className="w-3 h-3 mr-1" />
                Unsaved Changes
              </Badge>
            )}

            <Button
              onClick={generatePreview}
              variant="outline"
              disabled={preview.status === "generating"}
            >
              {preview.status === "generating" ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Eye className="w-4 h-4 mr-2" />
              )}
              Preview
            </Button>

            <Button onClick={saveConfiguration} disabled={isSaving || !unsavedChanges}>
              {isSaving ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              Save Configuration
            </Button>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Configuration Panel */}
          <div className="lg:col-span-2">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
              <TabsList className="grid w-full grid-cols-6">
                <TabsTrigger value="branding" className="flex items-center gap-2">
                  <Palette className="w-4 h-4" />
                  Brand
                </TabsTrigger>
                <TabsTrigger value="domain" className="flex items-center gap-2">
                  <Globe className="w-4 h-4" />
                  Domain
                </TabsTrigger>
                <TabsTrigger value="ui" className="flex items-center gap-2">
                  <Monitor className="w-4 h-4" />
                  UI
                </TabsTrigger>
                <TabsTrigger value="content" className="flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  Content
                </TabsTrigger>
                <TabsTrigger value="features" className="flex items-center gap-2">
                  <Settings className="w-4 h-4" />
                  Features
                </TabsTrigger>
                <TabsTrigger value="mobile" className="flex items-center gap-2">
                  <Smartphone className="w-4 h-4" />
                  Mobile
                </TabsTrigger>
              </TabsList>

              {/* Branding Tab */}
              <TabsContent value="branding" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Brand Identity</CardTitle>
                    <CardDescription>Configure your brand colors, logos, and fonts</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Color Configuration */}
                    <div className="space-y-4">
                      <h4 className="font-medium">Brand Colors</h4>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label>Primary Color</Label>
                          <div className="flex items-center gap-2">
                            <div
                              className="w-8 h-8 rounded border"
                              style={{ backgroundColor: config.branding.primaryColor }}
                            />
                            <Input
                              type="color"
                              value={config.branding.primaryColor}
                              onChange={(e) =>
                                updateConfig("branding.primaryColor", e.target.value)
                              }
                              className="w-full"
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label>Secondary Color</Label>
                          <div className="flex items-center gap-2">
                            <div
                              className="w-8 h-8 rounded border"
                              style={{ backgroundColor: config.branding.secondaryColor }}
                            />
                            <Input
                              type="color"
                              value={config.branding.secondaryColor}
                              onChange={(e) =>
                                updateConfig("branding.secondaryColor", e.target.value)
                              }
                              className="w-full"
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label>Accent Color</Label>
                          <div className="flex items-center gap-2">
                            <div
                              className="w-8 h-8 rounded border"
                              style={{ backgroundColor: config.branding.accentColor }}
                            />
                            <Input
                              type="color"
                              value={config.branding.accentColor}
                              onChange={(e) => updateConfig("branding.accentColor", e.target.value)}
                              className="w-full"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Logo Upload */}
                    <div className="space-y-4">
                      <h4 className="font-medium">Brand Assets</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Company Logo</Label>
                          <div className="border-2 border-dashed border-slate-300 rounded-lg p-4 text-center">
                            {config.branding.logoUrl ? (
                              <img
                                src={config.branding.logoUrl}
                                alt="Logo"
                                className="max-h-16 mx-auto mb-2"
                              />
                            ) : (
                              <div className="w-16 h-16 mx-auto mb-2 bg-slate-200 rounded" />
                            )}
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => {
                                const file = e.target.files?.[0]
                                if (file) uploadLogo(file, "logo")
                              }}
                              className="hidden"
                              id="logo-upload"
                            />
                            <Label htmlFor="logo-upload" className="cursor-pointer">
                              <Button variant="outline" size="sm" asChild>
                                <span>
                                  <Upload className="w-4 h-4 mr-2" />
                                  Upload Logo
                                </span>
                              </Button>
                            </Label>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label>Favicon</Label>
                          <div className="border-2 border-dashed border-slate-300 rounded-lg p-4 text-center">
                            {config.branding.faviconUrl ? (
                              <img
                                src={config.branding.faviconUrl}
                                alt="Favicon"
                                className="w-8 h-8 mx-auto mb-2"
                              />
                            ) : (
                              <div className="w-8 h-8 mx-auto mb-2 bg-slate-200 rounded" />
                            )}
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => {
                                const file = e.target.files?.[0]
                                if (file) uploadLogo(file, "favicon")
                              }}
                              className="hidden"
                              id="favicon-upload"
                            />
                            <Label htmlFor="favicon-upload" className="cursor-pointer">
                              <Button variant="outline" size="sm" asChild>
                                <span>
                                  <Upload className="w-4 h-4 mr-2" />
                                  Upload Icon
                                </span>
                              </Button>
                            </Label>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Font Configuration */}
                    <div className="space-y-2">
                      <Label>Font Family</Label>
                      <Select
                        value={config.branding.fontFamily}
                        onValueChange={(value) => updateConfig("branding.fontFamily", value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Inter">Inter (Default)</SelectItem>
                          <SelectItem value="Roboto">Roboto</SelectItem>
                          <SelectItem value="Open Sans">Open Sans</SelectItem>
                          <SelectItem value="Lato">Lato</SelectItem>
                          <SelectItem value="Poppins">Poppins</SelectItem>
                          <SelectItem value="Montserrat">Montserrat</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Domain Tab */}
              <TabsContent value="domain" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Domain Configuration</CardTitle>
                    <CardDescription>Setup your custom domain and SSL certificate</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-2">
                      <Label>Subdomain</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          value={config.domain.subdomain}
                          onChange={(e) => updateConfig("domain.subdomain", e.target.value)}
                          placeholder="your-company"
                        />
                        <span className="text-slate-500">.layoverhq.com</span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Custom Domain (Optional)</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          value={config.domain.customDomain || ""}
                          onChange={(e) => updateConfig("domain.customDomain", e.target.value)}
                          placeholder="travel.yourcompany.com"
                        />
                        <Button
                          onClick={() =>
                            config.domain.customDomain &&
                            setupCustomDomain(config.domain.customDomain)
                          }
                          variant="outline"
                        >
                          Setup
                        </Button>
                      </div>
                    </div>

                    {config.domain.customDomain && (
                      <Alert>
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                          <div className="space-y-2">
                            <p className="font-medium">DNS Configuration Required</p>
                            <p className="text-sm">
                              Add these DNS records to configure your custom domain:
                            </p>
                            <div className="bg-slate-50 p-3 rounded text-sm font-mono">
                              <div>Type: CNAME</div>
                              <div>Name: {config.domain.customDomain}</div>
                              <div>Value: proxy.layoverhq.com</div>
                            </div>
                          </div>
                        </AlertDescription>
                      </Alert>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex items-center space-x-2">
                        <div
                          className={`w-2 h-2 rounded-full ${
                            config.domain.dnsConfigured ? "bg-green-500" : "bg-red-500"
                          }`}
                        />
                        <Label>DNS Configured</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div
                          className={`w-2 h-2 rounded-full ${
                            config.domain.sslVerified ? "bg-green-500" : "bg-red-500"
                          }`}
                        />
                        <Label>SSL Certificate</Label>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* UI Tab */}
              <TabsContent value="ui" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>User Interface</CardTitle>
                    <CardDescription>
                      Customize the look and feel of your application
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Theme</Label>
                        <Select
                          value={config.ui.theme}
                          onValueChange={(value: "light" | "dark" | "auto") =>
                            updateConfig("ui.theme", value)
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="light">Light</SelectItem>
                            <SelectItem value="dark">Dark</SelectItem>
                            <SelectItem value="auto">Auto</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Layout Style</Label>
                        <Select
                          value={config.ui.layout}
                          onValueChange={(value: "modern" | "classic" | "minimal") =>
                            updateConfig("ui.layout", value)
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="modern">Modern</SelectItem>
                            <SelectItem value="classic">Classic</SelectItem>
                            <SelectItem value="minimal">Minimal</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label>Header Style</Label>
                        <Select
                          value={config.ui.headerStyle}
                          onValueChange={(value: "fixed" | "static" | "transparent") =>
                            updateConfig("ui.headerStyle", value)
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="fixed">Fixed</SelectItem>
                            <SelectItem value="static">Static</SelectItem>
                            <SelectItem value="transparent">Transparent</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Footer Style</Label>
                        <Select
                          value={config.ui.footerStyle}
                          onValueChange={(value: "minimal" | "detailed" | "hidden") =>
                            updateConfig("ui.footerStyle", value)
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="minimal">Minimal</SelectItem>
                            <SelectItem value="detailed">Detailed</SelectItem>
                            <SelectItem value="hidden">Hidden</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Button Style</Label>
                        <Select
                          value={config.ui.buttonStyle}
                          onValueChange={(value: "rounded" | "sharp" | "pill") =>
                            updateConfig("ui.buttonStyle", value)
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="rounded">Rounded</SelectItem>
                            <SelectItem value="sharp">Sharp</SelectItem>
                            <SelectItem value="pill">Pill</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Content Tab */}
              <TabsContent value="content" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Content & Messaging</CardTitle>
                    <CardDescription>
                      Customize your company information and messaging
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Company Name</Label>
                        <Input
                          value={config.content.companyName}
                          onChange={(e) => updateConfig("content.companyName", e.target.value)}
                          placeholder="Your Company Name"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Tagline (Optional)</Label>
                        <Input
                          value={config.content.tagline || ""}
                          onChange={(e) => updateConfig("content.tagline", e.target.value)}
                          placeholder="Your company tagline"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Welcome Message</Label>
                      <Textarea
                        value={config.content.welcomeMessage || ""}
                        onChange={(e) => updateConfig("content.welcomeMessage", e.target.value)}
                        placeholder="Welcome message for your customers..."
                        rows={3}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Support Email</Label>
                        <Input
                          type="email"
                          value={config.content.supportEmail}
                          onChange={(e) => updateConfig("content.supportEmail", e.target.value)}
                          placeholder="support@yourcompany.com"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Support Phone (Optional)</Label>
                        <Input
                          value={config.content.supportPhone || ""}
                          onChange={(e) => updateConfig("content.supportPhone", e.target.value)}
                          placeholder="+1 (555) 123-4567"
                        />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <Label>Social Media Links</Label>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-sm">Facebook</Label>
                          <Input
                            value={config.content.socialLinks.facebook || ""}
                            onChange={(e) =>
                              updateConfig("content.socialLinks.facebook", e.target.value)
                            }
                            placeholder="https://facebook.com/yourcompany"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-sm">Twitter</Label>
                          <Input
                            value={config.content.socialLinks.twitter || ""}
                            onChange={(e) =>
                              updateConfig("content.socialLinks.twitter", e.target.value)
                            }
                            placeholder="https://twitter.com/yourcompany"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-sm">LinkedIn</Label>
                          <Input
                            value={config.content.socialLinks.linkedin || ""}
                            onChange={(e) =>
                              updateConfig("content.socialLinks.linkedin", e.target.value)
                            }
                            placeholder="https://linkedin.com/company/yourcompany"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-sm">Instagram</Label>
                          <Input
                            value={config.content.socialLinks.instagram || ""}
                            onChange={(e) =>
                              updateConfig("content.socialLinks.instagram", e.target.value)
                            }
                            placeholder="https://instagram.com/yourcompany"
                          />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Features Tab */}
              <TabsContent value="features" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Feature Configuration</CardTitle>
                    <CardDescription>Enable or disable features for your platform</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-4">
                      {[
                        {
                          key: "enableBooking",
                          label: "Booking System",
                          description: "Allow customers to book layover experiences",
                        },
                        {
                          key: "enableRecommendations",
                          label: "Smart Recommendations",
                          description: "AI-powered layover suggestions",
                        },
                        {
                          key: "enableLayoverAnalysis",
                          label: "Layover Analysis",
                          description: "Detailed layover opportunity analysis",
                        },
                        {
                          key: "enablePriceAlerts",
                          label: "Price Alerts",
                          description: "Email notifications for price changes",
                        },
                        {
                          key: "enableMobileApp",
                          label: "Mobile App",
                          description: "Native mobile application access",
                        },
                        {
                          key: "enableApiAccess",
                          label: "API Access",
                          description: "Programmatic API integration",
                        },
                      ].map((feature) => (
                        <div
                          key={feature.key}
                          className="flex items-center justify-between p-4 border rounded-lg"
                        >
                          <div>
                            <h4 className="font-medium">{feature.label}</h4>
                            <p className="text-sm text-slate-600">{feature.description}</p>
                          </div>
                          <Switch
                            checked={config.features[feature.key as keyof typeof config.features]}
                            onCheckedChange={(checked) =>
                              updateConfig(`features.${feature.key}`, checked)
                            }
                          />
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Preview Panel */}
          <div className="lg:col-span-1">
            <Card className="sticky top-4">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="w-5 h-5" />
                  Live Preview
                </CardTitle>
                <CardDescription>See how your customizations look in real-time</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {preview.status === "generating" && (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="w-6 h-6 animate-spin" />
                      <span className="ml-2">Generating preview...</span>
                    </div>
                  )}

                  {preview.status === "ready" && preview.previewUrl && (
                    <div className="border rounded-lg overflow-hidden">
                      <iframe
                        src={preview.previewUrl}
                        className="w-full h-96 border-0"
                        title="White-label preview"
                      />
                    </div>
                  )}

                  {preview.status === "error" && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        Failed to generate preview. Please try again.
                      </AlertDescription>
                    </Alert>
                  )}

                  <div className="flex justify-between items-center text-sm text-slate-600">
                    <span>Last updated: {preview.lastUpdated.toLocaleTimeString()}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={generatePreview}
                      disabled={preview.status === "generating"}
                    >
                      <RefreshCw className="w-3 h-3 mr-1" />
                      Refresh
                    </Button>
                  </div>

                  {preview.previewUrl && (
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => window.open(preview.previewUrl, "_blank")}
                    >
                      Open Full Preview
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
