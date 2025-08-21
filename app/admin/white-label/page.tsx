"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ColorPicker } from "@/components/ui/color-picker"
import { useToast } from "@/hooks/use-toast"
import { Palette, Globe, Image, Type, Layout, Save, Eye, Upload, RefreshCw } from "lucide-react"

interface WhiteLabelConfig {
  tenantId: string
  tenantName: string
  enabled: boolean
  customDomain?: string
  brandColors: {
    primary: string
    secondary: string
    accent: string
    background: string
    foreground: string
    muted: string
    border: string
  }
  logo: {
    light: string
    dark: string
    favicon: string
  }
  typography: {
    fontFamily: string
    headingFont: string
    fontSize: {
      base: number
      scale: number
    }
  }
  customCSS?: string
  metadata: {
    title: string
    description: string
    keywords: string[]
  }
}

export default function WhiteLabelPage() {
  const [configs, setConfigs] = useState<WhiteLabelConfig[]>([])
  const [selectedConfig, setSelectedConfig] = useState<WhiteLabelConfig | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [previewMode, setPreviewMode] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    loadWhiteLabelConfigs()
  }, [])

  const loadWhiteLabelConfigs = async () => {
    try {
      setLoading(true)
      // Mock data for demonstration
      setConfigs(mockWhiteLabelConfigs)
      setSelectedConfig(mockWhiteLabelConfigs[0])
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load white-label configurations",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const saveConfiguration = async () => {
    if (!selectedConfig) return

    try {
      setSaving(true)
      const response = await fetch("/api/admin/enterprise", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          endpoint: "white-label",
          tenantId: selectedConfig.tenantId,
          config: selectedConfig,
        }),
      })

      if (!response.ok) throw new Error("Failed to save configuration")

      toast({
        title: "Success",
        description: "White-label configuration saved successfully",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save configuration",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const updateConfig = (updates: Partial<WhiteLabelConfig>) => {
    if (!selectedConfig) return
    setSelectedConfig({ ...selectedConfig, ...updates })
  }

  const updateBrandColor = (colorKey: string, value: string) => {
    if (!selectedConfig) return
    setSelectedConfig({
      ...selectedConfig,
      brandColors: {
        ...selectedConfig.brandColors,
        [colorKey]: value,
      },
    })
  }

  const handleImageUpload = async (type: "light" | "dark" | "favicon", file: File) => {
    // In production, upload to storage and get URL
    const reader = new FileReader()
    reader.onloadend = () => {
      if (!selectedConfig) return
      setSelectedConfig({
        ...selectedConfig,
        logo: {
          ...selectedConfig.logo,
          [type]: reader.result as string,
        },
      })
    }
    reader.readAsDataURL(file)
  }

  if (loading) {
    return <div className="container mx-auto py-6">Loading white-label configurations...</div>
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">White-Label Management</h1>
          <p className="text-muted-foreground">
            Customize branding and appearance for enterprise tenants
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setPreviewMode(!previewMode)}>
            <Eye className="mr-2 h-4 w-4" />
            {previewMode ? "Edit Mode" : "Preview"}
          </Button>
          <Button onClick={saveConfiguration} disabled={saving}>
            <Save className="mr-2 h-4 w-4" />
            Save Changes
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-6">
        {/* Tenant Selector */}
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle className="text-lg">Select Tenant</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {configs.map((config) => (
                <Button
                  key={config.tenantId}
                  variant={selectedConfig?.tenantId === config.tenantId ? "secondary" : "ghost"}
                  className="w-full justify-start"
                  onClick={() => setSelectedConfig(config)}
                >
                  <div className="text-left">
                    <div className="font-medium">{config.tenantName}</div>
                    {config.enabled && (
                      <Badge variant="default" className="mt-1 text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                        Active
                      </Badge>
                    )}
                  </div>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Configuration Panel */}
        {selectedConfig && (
          <Card className="col-span-3">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>{selectedConfig.tenantName} White-Label Settings</CardTitle>
                  <CardDescription>
                    Customize the appearance and branding for this tenant
                  </CardDescription>
                </div>
                <Switch
                  checked={selectedConfig.enabled}
                  onCheckedChange={(checked) => updateConfig({ enabled: checked })}
                />
              </div>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="branding">
                <TabsList className="grid w-full grid-cols-5">
                  <TabsTrigger value="branding">
                    <Palette className="mr-2 h-4 w-4" />
                    Branding
                  </TabsTrigger>
                  <TabsTrigger value="domain">
                    <Globe className="mr-2 h-4 w-4" />
                    Domain
                  </TabsTrigger>
                  <TabsTrigger value="logos">
                    <Image className="mr-2 h-4 w-4" />
                    Logos
                  </TabsTrigger>
                  <TabsTrigger value="typography">
                    <Type className="mr-2 h-4 w-4" />
                    Typography
                  </TabsTrigger>
                  <TabsTrigger value="advanced">
                    <Layout className="mr-2 h-4 w-4" />
                    Advanced
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="branding" className="space-y-6 mt-6">
                  <div>
                    <h3 className="text-lg font-medium mb-4">Brand Colors</h3>
                    <div className="grid grid-cols-2 gap-6">
                      {Object.entries(selectedConfig.brandColors).map(([key, value]) => (
                        <div key={key} className="space-y-2">
                          <Label>{key.charAt(0).toUpperCase() + key.slice(1)}</Label>
                          <div className="flex gap-2">
                            <Input
                              type="color"
                              value={value}
                              onChange={(e) => updateBrandColor(key, e.target.value)}
                              className="w-20 h-10 cursor-pointer"
                            />
                            <Input
                              value={value}
                              onChange={(e) => updateBrandColor(key, e.target.value)}
                              placeholder="#000000"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {previewMode && (
                    <Card className="mt-6">
                      <CardHeader>
                        <CardTitle>Color Preview</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-4 gap-4">
                          {Object.entries(selectedConfig.brandColors).map(([key, value]) => (
                            <div key={key} className="text-center">
                              <div
                                className="w-full h-20 rounded-lg border"
                                style={{ backgroundColor: value }}
                              />
                              <p className="text-sm mt-2">{key}</p>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>

                <TabsContent value="domain" className="space-y-6 mt-6">
                  <div>
                    <h3 className="text-lg font-medium mb-4">Custom Domain Settings</h3>
                    <div className="space-y-4">
                      <div>
                        <Label>Custom Domain</Label>
                        <Input
                          value={selectedConfig.customDomain || ""}
                          onChange={(e) => updateConfig({ customDomain: e.target.value })}
                          placeholder="layovers.acmeairlines.com"
                        />
                        <p className="text-sm text-muted-foreground mt-2">
                          Configure DNS CNAME to point to app.layoverhq.com
                        </p>
                      </div>
                      <div>
                        <Label>SSL Certificate</Label>
                        <Badge variant="default" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">Auto-provisioned via Let's Encrypt</Badge>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="logos" className="space-y-6 mt-6">
                  <div>
                    <h3 className="text-lg font-medium mb-4">Logo Management</h3>
                    <div className="grid grid-cols-3 gap-6">
                      <div className="space-y-2">
                        <Label>Light Mode Logo</Label>
                        <div className="border-2 border-dashed rounded-lg p-4 text-center">
                          {selectedConfig.logo.light ? (
                            <img
                              src={selectedConfig.logo.light}
                              alt="Light logo"
                              className="max-h-20 mx-auto"
                            />
                          ) : (
                            <Upload className="h-8 w-8 mx-auto text-muted-foreground" />
                          )}
                          <Input
                            type="file"
                            accept="image/*"
                            className="mt-2"
                            onChange={(e) =>
                              e.target.files?.[0] && handleImageUpload("light", e.target.files[0])
                            }
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Dark Mode Logo</Label>
                        <div className="border-2 border-dashed rounded-lg p-4 text-center">
                          {selectedConfig.logo.dark ? (
                            <img
                              src={selectedConfig.logo.dark}
                              alt="Dark logo"
                              className="max-h-20 mx-auto"
                            />
                          ) : (
                            <Upload className="h-8 w-8 mx-auto text-muted-foreground" />
                          )}
                          <Input
                            type="file"
                            accept="image/*"
                            className="mt-2"
                            onChange={(e) =>
                              e.target.files?.[0] && handleImageUpload("dark", e.target.files[0])
                            }
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Favicon</Label>
                        <div className="border-2 border-dashed rounded-lg p-4 text-center">
                          {selectedConfig.logo.favicon ? (
                            <img
                              src={selectedConfig.logo.favicon}
                              alt="Favicon"
                              className="max-h-20 mx-auto"
                            />
                          ) : (
                            <Upload className="h-8 w-8 mx-auto text-muted-foreground" />
                          )}
                          <Input
                            type="file"
                            accept="image/*"
                            className="mt-2"
                            onChange={(e) =>
                              e.target.files?.[0] && handleImageUpload("favicon", e.target.files[0])
                            }
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="typography" className="space-y-6 mt-6">
                  <div>
                    <h3 className="text-lg font-medium mb-4">Typography Settings</h3>
                    <div className="space-y-4">
                      <div>
                        <Label>Body Font Family</Label>
                        <Select value={selectedConfig.typography.fontFamily}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Inter">Inter</SelectItem>
                            <SelectItem value="Roboto">Roboto</SelectItem>
                            <SelectItem value="Open Sans">Open Sans</SelectItem>
                            <SelectItem value="Lato">Lato</SelectItem>
                            <SelectItem value="Poppins">Poppins</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Heading Font Family</Label>
                        <Select value={selectedConfig.typography.headingFont}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Inter">Inter</SelectItem>
                            <SelectItem value="Montserrat">Montserrat</SelectItem>
                            <SelectItem value="Playfair Display">Playfair Display</SelectItem>
                            <SelectItem value="Raleway">Raleway</SelectItem>
                            <SelectItem value="Poppins">Poppins</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Base Font Size (px)</Label>
                          <Input
                            type="number"
                            value={selectedConfig.typography.fontSize.base}
                            onChange={(e) =>
                              updateConfig({
                                typography: {
                                  ...selectedConfig.typography,
                                  fontSize: {
                                    ...selectedConfig.typography.fontSize,
                                    base: parseInt(e.target.value),
                                  },
                                },
                              })
                            }
                          />
                        </div>
                        <div>
                          <Label>Scale Factor</Label>
                          <Input
                            type="number"
                            step="0.1"
                            value={selectedConfig.typography.fontSize.scale}
                            onChange={(e) =>
                              updateConfig({
                                typography: {
                                  ...selectedConfig.typography,
                                  fontSize: {
                                    ...selectedConfig.typography.fontSize,
                                    scale: parseFloat(e.target.value),
                                  },
                                },
                              })
                            }
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="advanced" className="space-y-6 mt-6">
                  <div>
                    <h3 className="text-lg font-medium mb-4">Advanced Customization</h3>
                    <div className="space-y-4">
                      <div>
                        <Label>Custom CSS</Label>
                        <Textarea
                          value={selectedConfig.customCSS || ""}
                          onChange={(e) => updateConfig({ customCSS: e.target.value })}
                          placeholder="/* Add custom CSS rules here */"
                          rows={10}
                          className="font-mono text-sm"
                        />
                      </div>
                      <div>
                        <Label>Page Title</Label>
                        <Input
                          value={selectedConfig.metadata.title}
                          onChange={(e) =>
                            updateConfig({
                              metadata: {
                                ...selectedConfig.metadata,
                                title: e.target.value,
                              },
                            })
                          }
                        />
                      </div>
                      <div>
                        <Label>Meta Description</Label>
                        <Textarea
                          value={selectedConfig.metadata.description}
                          onChange={(e) =>
                            updateConfig({
                              metadata: {
                                ...selectedConfig.metadata,
                                description: e.target.value,
                              },
                            })
                          }
                          rows={3}
                        />
                      </div>
                      <div>
                        <Label>Keywords</Label>
                        <Input
                          value={selectedConfig.metadata.keywords.join(", ")}
                          onChange={(e) =>
                            updateConfig({
                              metadata: {
                                ...selectedConfig.metadata,
                                keywords: e.target.value.split(",").map((k) => k.trim()),
                              },
                            })
                          }
                          placeholder="travel, layovers, experiences"
                        />
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

// Mock data for demonstration
const mockWhiteLabelConfigs: WhiteLabelConfig[] = [
  {
    tenantId: "tenant-1",
    tenantName: "Acme Airlines",
    enabled: true,
    customDomain: "layovers.acmeairlines.com",
    brandColors: {
      primary: "#0066CC",
      secondary: "#003366",
      accent: "#FF6600",
      background: "#FFFFFF",
      foreground: "#000000",
      muted: "#F5F5F5",
      border: "#E0E0E0",
    },
    logo: {
      light: "",
      dark: "",
      favicon: "",
    },
    typography: {
      fontFamily: "Inter",
      headingFont: "Montserrat",
      fontSize: {
        base: 16,
        scale: 1.25,
      },
    },
    metadata: {
      title: "Acme Airlines Layover Experiences",
      description: "Turn your layover into an adventure with Acme Airlines",
      keywords: ["acme airlines", "layovers", "travel", "experiences"],
    },
  },
  {
    tenantId: "tenant-2",
    tenantName: "Global Airways",
    enabled: false,
    brandColors: {
      primary: "#2E7D32",
      secondary: "#1B5E20",
      accent: "#FFC107",
      background: "#FFFFFF",
      foreground: "#000000",
      muted: "#F5F5F5",
      border: "#E0E0E0",
    },
    logo: {
      light: "",
      dark: "",
      favicon: "",
    },
    typography: {
      fontFamily: "Roboto",
      headingFont: "Raleway",
      fontSize: {
        base: 16,
        scale: 1.2,
      },
    },
    metadata: {
      title: "Global Airways Layover Services",
      description: "Explore the world during your layover with Global Airways",
      keywords: ["global airways", "airport services", "layovers"],
    },
  },
]
