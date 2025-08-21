/**
 * White Label Manager - Airline Partner Customization System
 *
 * Comprehensive white-label management interface allowing airline partners
 * to customize branding, themes, and features without code changes.
 */

"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
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
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Palette,
  Upload,
  Eye,
  Save,
  RotateCcw,
  Globe,
  Settings,
  Image as ImageIcon,
  Type,
  Layout,
  Smartphone,
  Monitor,
  CheckCircle,
  AlertTriangle,
  Copy,
  ExternalLink,
} from "lucide-react"

interface WhiteLabelConfig {
  tenant_id: string
  tenant_name: string
  branding: {
    logo_url?: string
    logo_dark_url?: string
    favicon_url?: string
    brand_name: string
    tagline?: string
    company_description?: string
  }
  theme: {
    primary_color: string
    secondary_color: string
    accent_color: string
    background_color: string
    text_color: string
    border_color: string
    success_color: string
    warning_color: string
    error_color: string
  }
  typography: {
    font_family: string
    heading_font: string
    font_sizes: {
      xs: string
      sm: string
      base: string
      lg: string
      xl: string
      "2xl": string
      "3xl": string
    }
  }
  layout: {
    header_style: "minimal" | "standard" | "branded"
    footer_style: "minimal" | "standard" | "extended"
    sidebar_position: "left" | "right" | "hidden"
    border_radius: "none" | "small" | "medium" | "large"
    spacing: "compact" | "standard" | "spacious"
  }
  domain: {
    custom_domain?: string
    subdomain?: string
    ssl_enabled: boolean
    domain_verified: boolean
  }
  features: {
    enabled_modules: string[]
    hidden_features: string[]
    custom_navigation: Array<{
      label: string
      url: string
      icon?: string
      target?: "_self" | "_blank"
    }>
  }
  content: {
    welcome_message?: string
    footer_text?: string
    privacy_policy_url?: string
    terms_of_service_url?: string
    support_email?: string
    support_phone?: string
  }
  seo: {
    meta_title?: string
    meta_description?: string
    og_image_url?: string
    ga_tracking_id?: string
    gtm_container_id?: string
  }
  status: "draft" | "published" | "archived"
  last_published?: string
  created_at: string
  updated_at: string
}

interface PreviewDevice {
  id: string
  name: string
  width: number
  height: number
  icon: any
}

const previewDevices: PreviewDevice[] = [
  { id: "desktop", name: "Desktop", width: 1440, height: 900, icon: Monitor },
  { id: "tablet", name: "Tablet", width: 768, height: 1024, icon: Monitor },
  { id: "mobile", name: "Mobile", width: 375, height: 667, icon: Smartphone },
]

const fontOptions = [
  "Inter",
  "Roboto",
  "Open Sans",
  "Lato",
  "Montserrat",
  "Poppins",
  "Source Sans Pro",
  "Nunito",
  "Raleway",
  "Work Sans",
]

const moduleOptions = [
  { id: "flight_search", name: "Flight Search", description: "Core flight search functionality" },
  {
    id: "layover_discovery",
    name: "Layover Discovery",
    description: "Layover optimization engine",
  },
  { id: "experiences", name: "Experiences", description: "Activity and experience booking" },
  { id: "user_dashboard", name: "User Dashboard", description: "Personal user dashboard" },
  { id: "booking_history", name: "Booking History", description: "Past bookings and trips" },
  { id: "preferences", name: "Preferences", description: "User preference management" },
  { id: "notifications", name: "Notifications", description: "Email and push notifications" },
  { id: "analytics", name: "Analytics", description: "Usage analytics and insights" },
]

export default function WhiteLabelManager() {
  const [configs, setConfigs] = useState<WhiteLabelConfig[]>([])
  const [selectedConfig, setSelectedConfig] = useState<WhiteLabelConfig | null>(null)
  const [activeTab, setActiveTab] = useState("branding")
  const [previewDevice, setPreviewDevice] = useState("desktop")
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)

  useEffect(() => {
    loadWhiteLabelConfigs()
  }, [])

  const loadWhiteLabelConfigs = async () => {
    try {
      setIsLoading(true)
      const response = await fetch("/api/admin/white-label")
      if (response.ok) {
        const data = await response.json()
        setConfigs(data.configs || [])
        if (data.configs?.length > 0 && !selectedConfig) {
          setSelectedConfig(data.configs[0])
        }
      }
    } catch (error) {
      console.error("Failed to load white-label configs:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const updateConfig = (updates: Partial<WhiteLabelConfig>) => {
    if (!selectedConfig) return

    const updatedConfig = { ...selectedConfig, ...updates }
    setSelectedConfig(updatedConfig)
    setHasUnsavedChanges(true)
  }

  const updateBranding = (field: string, value: any) => {
    updateConfig({
      branding: {
        ...selectedConfig?.branding,
        [field]: value,
      },
    })
  }

  const updateTheme = (field: string, value: any) => {
    updateConfig({
      theme: {
        ...selectedConfig?.theme,
        [field]: value,
      },
    })
  }

  const updateLayout = (field: string, value: any) => {
    updateConfig({
      layout: {
        ...selectedConfig?.layout,
        [field]: value,
      },
    })
  }

  const updateFeatures = (field: string, value: any) => {
    updateConfig({
      features: {
        ...selectedConfig?.features,
        [field]: value,
      },
    })
  }

  const saveConfiguration = async () => {
    if (!selectedConfig) return

    try {
      setIsSaving(true)
      const response = await fetch(`/api/admin/white-label/${selectedConfig.tenant_id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(selectedConfig),
      })

      if (response.ok) {
        setHasUnsavedChanges(false)
        await loadWhiteLabelConfigs()
      }
    } catch (error) {
      console.error("Error saving white-label config:", error)
    } finally {
      setIsSaving(false)
    }
  }

  const publishConfiguration = async () => {
    if (!selectedConfig) return

    try {
      const response = await fetch(`/api/admin/white-label/${selectedConfig.tenant_id}/publish`, {
        method: "POST",
      })

      if (response.ok) {
        updateConfig({
          status: "published",
          last_published: new Date().toISOString(),
        })
        await saveConfiguration()
      }
    } catch (error) {
      console.error("Error publishing configuration:", error)
    }
  }

  const previewConfiguration = () => {
    setShowPreview(true)
  }

  const uploadFile = async (file: File, type: "logo" | "favicon" | "og_image") => {
    const formData = new FormData()
    formData.append("file", file)
    formData.append("type", type)
    formData.append("tenant_id", selectedConfig?.tenant_id || "")

    try {
      const response = await fetch("/api/admin/white-label/upload", {
        method: "POST",
        body: formData,
      })

      if (response.ok) {
        const result = await response.json()
        return result.url
      }
    } catch (error) {
      console.error("Error uploading file:", error)
    }
    return null
  }

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
    type: "logo" | "favicon" | "og_image",
  ) => {
    const file = event.target.files?.[0]
    if (!file) return

    const url = await uploadFile(file, type)
    if (url) {
      if (type === "logo") {
        updateBranding("logo_url", url)
      } else if (type === "favicon") {
        updateBranding("favicon_url", url)
      } else if (type === "og_image") {
        updateConfig({
          seo: {
            ...selectedConfig?.seo,
            og_image_url: url,
          },
        })
      }
    }
  }

  const toggleModule = (moduleId: string) => {
    if (!selectedConfig) return

    const enabledModules = selectedConfig.features.enabled_modules || []
    const updatedModules = enabledModules.includes(moduleId)
      ? enabledModules.filter((id) => id !== moduleId)
      : [...enabledModules, moduleId]

    updateFeatures("enabled_modules", updatedModules)
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p>Loading white-label configurations...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>White Label Management</CardTitle>
              <CardDescription>
                Customize branding, themes, and features for airline partners without code changes.
              </CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              {hasUnsavedChanges && (
                <Badge variant="outline" className="text-yellow-600 border-yellow-600">
                  Unsaved Changes
                </Badge>
              )}
              <Button variant="outline" onClick={previewConfiguration}>
                <Eye className="h-4 w-4 mr-2" />
                Preview
              </Button>
              <Button onClick={saveConfiguration} disabled={!hasUnsavedChanges || isSaving}>
                <Save className="h-4 w-4 mr-2" />
                {isSaving ? "Saving..." : "Save"}
              </Button>
              <Button
                onClick={publishConfiguration}
                disabled={!selectedConfig || selectedConfig.status === "published"}
              >
                <Globe className="h-4 w-4 mr-2" />
                Publish
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Tenant Selector */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Select Tenant</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {configs.map((config) => (
                <Button
                  key={config.tenant_id}
                  variant={selectedConfig?.tenant_id === config.tenant_id ? "default" : "ghost"}
                  className="w-full justify-start"
                  onClick={() => setSelectedConfig(config)}
                >
                  <div className="text-left">
                    <p className="font-medium">{config.tenant_name}</p>
                    <p className="text-xs text-gray-500">{config.status}</p>
                  </div>
                </Button>
              ))}
            </CardContent>
          </Card>

          {selectedConfig && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Configuration Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Status</span>
                  <Badge
                    className={
                      selectedConfig.status === "published"
                        ? "bg-green-100 text-green-800"
                        : selectedConfig.status === "draft"
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-gray-100 text-gray-800"
                    }
                  >
                    {selectedConfig.status.toUpperCase()}
                  </Badge>
                </div>
                {selectedConfig.last_published && (
                  <div>
                    <span className="text-sm text-gray-500">Last Published</span>
                    <p className="text-sm">
                      {new Date(selectedConfig.last_published).toLocaleDateString()}
                    </p>
                  </div>
                )}
                {selectedConfig.domain.custom_domain && (
                  <div>
                    <span className="text-sm text-gray-500">Custom Domain</span>
                    <div className="flex items-center space-x-2">
                      <p className="text-sm">{selectedConfig.domain.custom_domain}</p>
                      {selectedConfig.domain.domain_verified ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : (
                        <AlertTriangle className="h-4 w-4 text-yellow-600" />
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Configuration Panel */}
        <div className="lg:col-span-3">
          {selectedConfig ? (
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
              <TabsList className="grid w-full grid-cols-6">
                <TabsTrigger value="branding">Branding</TabsTrigger>
                <TabsTrigger value="theme">Theme</TabsTrigger>
                <TabsTrigger value="layout">Layout</TabsTrigger>
                <TabsTrigger value="features">Features</TabsTrigger>
                <TabsTrigger value="domain">Domain</TabsTrigger>
                <TabsTrigger value="seo">SEO</TabsTrigger>
              </TabsList>

              <TabsContent value="branding" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Brand Assets</CardTitle>
                    <CardDescription>
                      Upload logos, favicons, and other brand assets.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div>
                          <Label>Brand Name</Label>
                          <Input
                            value={selectedConfig.branding.brand_name || ""}
                            onChange={(e) => updateBranding("brand_name", e.target.value)}
                            placeholder="Your Airline"
                          />
                        </div>
                        <div>
                          <Label>Tagline</Label>
                          <Input
                            value={selectedConfig.branding.tagline || ""}
                            onChange={(e) => updateBranding("tagline", e.target.value)}
                            placeholder="Discover the world differently"
                          />
                        </div>
                        <div>
                          <Label>Company Description</Label>
                          <Textarea
                            value={selectedConfig.branding.company_description || ""}
                            onChange={(e) => updateBranding("company_description", e.target.value)}
                            placeholder="Brief description of your airline..."
                            rows={3}
                          />
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div>
                          <Label>Logo (Light Theme)</Label>
                          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                            {selectedConfig.branding.logo_url ? (
                              <div className="space-y-2">
                                <img
                                  src={selectedConfig.branding.logo_url}
                                  alt="Logo"
                                  className="h-12 mx-auto"
                                />
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => document.getElementById("logo-upload")?.click()}
                                >
                                  Change Logo
                                </Button>
                              </div>
                            ) : (
                              <div className="space-y-2">
                                <ImageIcon className="h-8 w-8 mx-auto text-gray-400" />
                                <Button
                                  variant="outline"
                                  onClick={() => document.getElementById("logo-upload")?.click()}
                                >
                                  Upload Logo
                                </Button>
                              </div>
                            )}
                            <input
                              id="logo-upload"
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => handleFileUpload(e, "logo")}
                            />
                          </div>
                        </div>

                        <div>
                          <Label>Favicon</Label>
                          <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                            {selectedConfig.branding.favicon_url ? (
                              <div className="space-y-2">
                                <img
                                  src={selectedConfig.branding.favicon_url}
                                  alt="Favicon"
                                  className="h-8 w-8 mx-auto"
                                />
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => document.getElementById("favicon-upload")?.click()}
                                >
                                  Change
                                </Button>
                              </div>
                            ) : (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => document.getElementById("favicon-upload")?.click()}
                              >
                                Upload Favicon
                              </Button>
                            )}
                            <input
                              id="favicon-upload"
                              type="file"
                              accept="image/x-icon,image/png"
                              className="hidden"
                              onChange={(e) => handleFileUpload(e, "favicon")}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="theme" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Color Scheme</CardTitle>
                    <CardDescription>Customize the color palette for your brand.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {Object.entries(selectedConfig.theme).map(([key, value]) => (
                        <div key={key} className="space-y-2">
                          <Label className="text-sm">{key.replace(/_/g, " ").toUpperCase()}</Label>
                          <div className="flex items-center space-x-2">
                            <input
                              type="color"
                              value={value}
                              onChange={(e) => updateTheme(key, e.target.value)}
                              className="w-10 h-10 rounded border"
                            />
                            <Input
                              value={value}
                              onChange={(e) => updateTheme(key, e.target.value)}
                              className="flex-1 font-mono text-sm"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Typography</CardTitle>
                    <CardDescription>Configure fonts and text styling.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label>Primary Font</Label>
                        <Select
                          value={selectedConfig.typography.font_family}
                          onValueChange={(value) =>
                            updateConfig({
                              typography: {
                                ...selectedConfig.typography,
                                font_family: value,
                              },
                            })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {fontOptions.map((font) => (
                              <SelectItem key={font} value={font}>
                                <span style={{ fontFamily: font }}>{font}</span>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Heading Font</Label>
                        <Select
                          value={selectedConfig.typography.heading_font}
                          onValueChange={(value) =>
                            updateConfig({
                              typography: {
                                ...selectedConfig.typography,
                                heading_font: value,
                              },
                            })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {fontOptions.map((font) => (
                              <SelectItem key={font} value={font}>
                                <span style={{ fontFamily: font }}>{font}</span>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="layout" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Layout Options</CardTitle>
                    <CardDescription>Configure the overall layout and spacing.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div>
                          <Label>Header Style</Label>
                          <Select
                            value={selectedConfig.layout.header_style}
                            onValueChange={(value) => updateLayout("header_style", value)}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="minimal">Minimal</SelectItem>
                              <SelectItem value="standard">Standard</SelectItem>
                              <SelectItem value="branded">Branded</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label>Footer Style</Label>
                          <Select
                            value={selectedConfig.layout.footer_style}
                            onValueChange={(value) => updateLayout("footer_style", value)}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="minimal">Minimal</SelectItem>
                              <SelectItem value="standard">Standard</SelectItem>
                              <SelectItem value="extended">Extended</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div>
                          <Label>Border Radius</Label>
                          <Select
                            value={selectedConfig.layout.border_radius}
                            onValueChange={(value) => updateLayout("border_radius", value)}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">None</SelectItem>
                              <SelectItem value="small">Small</SelectItem>
                              <SelectItem value="medium">Medium</SelectItem>
                              <SelectItem value="large">Large</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label>Spacing</Label>
                          <Select
                            value={selectedConfig.layout.spacing}
                            onValueChange={(value) => updateLayout("spacing", value)}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="compact">Compact</SelectItem>
                              <SelectItem value="standard">Standard</SelectItem>
                              <SelectItem value="spacious">Spacious</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="features" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Enabled Modules</CardTitle>
                    <CardDescription>
                      Select which features are available to your users.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {moduleOptions.map((module) => (
                        <div
                          key={module.id}
                          className="flex items-center justify-between p-4 border rounded-lg"
                        >
                          <div>
                            <h4 className="font-medium">{module.name}</h4>
                            <p className="text-sm text-gray-600">{module.description}</p>
                          </div>
                          <Switch
                            checked={
                              selectedConfig.features.enabled_modules?.includes(module.id) || false
                            }
                            onCheckedChange={() => toggleModule(module.id)}
                          />
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="domain" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Domain Configuration</CardTitle>
                    <CardDescription>Set up custom domains and SSL certificates.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div>
                      <Label>Custom Domain</Label>
                      <Input
                        value={selectedConfig.domain.custom_domain || ""}
                        onChange={(e) =>
                          updateConfig({
                            domain: {
                              ...selectedConfig.domain,
                              custom_domain: e.target.value,
                            },
                          })
                        }
                        placeholder="travel.yourairline.com"
                      />
                      <p className="text-sm text-gray-500 mt-1">
                        Point your domain's CNAME record to: layoverhq-custom.vercel.app
                      </p>
                    </div>

                    <div>
                      <Label>Subdomain</Label>
                      <div className="flex items-center space-x-2">
                        <Input
                          value={selectedConfig.domain.subdomain || ""}
                          onChange={(e) =>
                            updateConfig({
                              domain: {
                                ...selectedConfig.domain,
                                subdomain: e.target.value,
                              },
                            })
                          }
                          placeholder="yourairline"
                          className="flex-1"
                        />
                        <span className="text-sm text-gray-500">.layoverhq.com</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label>SSL Certificate</Label>
                        <p className="text-sm text-gray-600">
                          Automatically managed SSL certificate
                        </p>
                      </div>
                      <Switch
                        checked={selectedConfig.domain.ssl_enabled}
                        onCheckedChange={(checked) =>
                          updateConfig({
                            domain: {
                              ...selectedConfig.domain,
                              ssl_enabled: checked,
                            },
                          })
                        }
                      />
                    </div>

                    {selectedConfig.domain.custom_domain && (
                      <Alert>
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                          {selectedConfig.domain.domain_verified ? (
                            <span className="text-green-600">
                              Domain verified and SSL certificate issued.
                            </span>
                          ) : (
                            <span className="text-yellow-600">
                              Domain verification pending. Please update your DNS records.
                            </span>
                          )}
                        </AlertDescription>
                      </Alert>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="seo" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>SEO & Analytics</CardTitle>
                    <CardDescription>Configure SEO metadata and tracking codes.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-4">
                      <div>
                        <Label>Meta Title</Label>
                        <Input
                          value={selectedConfig.seo?.meta_title || ""}
                          onChange={(e) =>
                            updateConfig({
                              seo: {
                                ...selectedConfig.seo,
                                meta_title: e.target.value,
                              },
                            })
                          }
                          placeholder="Discover Amazing Layovers | Your Airline"
                        />
                      </div>

                      <div>
                        <Label>Meta Description</Label>
                        <Textarea
                          value={selectedConfig.seo?.meta_description || ""}
                          onChange={(e) =>
                            updateConfig({
                              seo: {
                                ...selectedConfig.seo,
                                meta_description: e.target.value,
                              },
                            })
                          }
                          placeholder="Turn your layovers into mini-adventures..."
                          rows={3}
                        />
                      </div>

                      <div>
                        <Label>Google Analytics Tracking ID</Label>
                        <Input
                          value={selectedConfig.seo?.ga_tracking_id || ""}
                          onChange={(e) =>
                            updateConfig({
                              seo: {
                                ...selectedConfig.seo,
                                ga_tracking_id: e.target.value,
                              },
                            })
                          }
                          placeholder="GA-XXXXXXXXX-X"
                        />
                      </div>

                      <div>
                        <Label>Google Tag Manager Container ID</Label>
                        <Input
                          value={selectedConfig.seo?.gtm_container_id || ""}
                          onChange={(e) =>
                            updateConfig({
                              seo: {
                                ...selectedConfig.seo,
                                gtm_container_id: e.target.value,
                              },
                            })
                          }
                          placeholder="GTM-XXXXXXX"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <p className="text-gray-500">Select a tenant to configure white-label settings.</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Preview Dialog */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-6xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>White Label Preview</DialogTitle>
            <DialogDescription>
              Preview how your configuration will look across different devices.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                {previewDevices.map((device) => (
                  <Button
                    key={device.id}
                    variant={previewDevice === device.id ? "default" : "outline"}
                    size="sm"
                    onClick={() => setPreviewDevice(device.id)}
                  >
                    <device.icon className="h-4 w-4 mr-2" />
                    {device.name}
                  </Button>
                ))}
              </div>
              <Button variant="outline" size="sm">
                <ExternalLink className="h-4 w-4 mr-2" />
                Open in New Tab
              </Button>
            </div>

            <div className="border rounded-lg overflow-hidden bg-gray-100 p-4">
              <div
                className="bg-white border rounded mx-auto"
                style={{
                  width: previewDevices.find((d) => d.id === previewDevice)?.width || 1440,
                  height: previewDevices.find((d) => d.id === previewDevice)?.height || 900,
                  maxWidth: "100%",
                  maxHeight: "60vh",
                  transform: "scale(0.5)",
                  transformOrigin: "top left",
                }}
              >
                {/* Preview iframe would go here */}
                <div className="p-8 space-y-4">
                  <div
                    className="h-16 rounded flex items-center px-6"
                    style={{ backgroundColor: selectedConfig?.theme.primary_color }}
                  >
                    <span className="text-white font-bold">
                      {selectedConfig?.branding.brand_name || "Brand Name"}
                    </span>
                  </div>
                  <div className="space-y-2">
                    <h1
                      className="text-2xl font-bold"
                      style={{ color: selectedConfig?.theme.text_color }}
                    >
                      {selectedConfig?.branding.tagline || "Discover the world differently"}
                    </h1>
                    <p className="text-gray-600">
                      {selectedConfig?.branding.company_description ||
                        "Your travel partner for amazing experiences"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
