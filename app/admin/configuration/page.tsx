"use client"

import { useState, useEffect } from "react"
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
import { useToast } from "@/hooks/use-toast"
import {
  Settings,
  Database,
  Globe,
  Shield,
  Bell,
  Save,
  RefreshCw,
  History,
  AlertCircle,
  CheckCircle,
} from "lucide-react"

interface ConfigItem {
  key: string
  value: any
  type: "string" | "number" | "boolean" | "json"
  category: string
  description?: string
  sensitive?: boolean
  lastModified?: string
  modifiedBy?: string
}

export default function ConfigurationPage() {
  const [configs, setConfigs] = useState<ConfigItem[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState("general")
  const [searchTerm, setSearchTerm] = useState("")
  const [unsavedChanges, setUnsavedChanges] = useState(false)
  const { toast } = useToast()

  const categories = [
    { id: "general", label: "General", icon: Settings },
    { id: "database", label: "Database", icon: Database },
    { id: "api", label: "API & Integrations", icon: Globe },
    { id: "security", label: "Security", icon: Shield },
    { id: "notifications", label: "Notifications", icon: Bell },
  ]

  useEffect(() => {
    loadConfigurations()
  }, [])

  const loadConfigurations = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/admin/enterprise?endpoint=configurations")
      if (!response.ok) throw new Error("Failed to load configurations")

      const data = await response.json()
      setConfigs(data.configurations || mockConfigs)
    } catch (error) {
      // Use mock data for demonstration
      setConfigs(mockConfigs)
    } finally {
      setLoading(false)
    }
  }

  const saveConfigurations = async () => {
    try {
      setSaving(true)
      const response = await fetch("/api/admin/enterprise", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          endpoint: "configurations",
          updates: configs.filter((c) => c.category === selectedCategory),
        }),
      })

      if (!response.ok) throw new Error("Failed to save configurations")

      toast({
        title: "Success",
        description: "Configurations saved successfully",
      })
      setUnsavedChanges(false)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save configurations",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const updateConfig = (key: string, value: any) => {
    setConfigs((prev) => prev.map((config) => (config.key === key ? { ...config, value } : config)))
    setUnsavedChanges(true)
  }

  const filteredConfigs = configs.filter(
    (config) =>
      config.category === selectedCategory &&
      (config.key.toLowerCase().includes(searchTerm.toLowerCase()) ||
        config.description?.toLowerCase().includes(searchTerm.toLowerCase())),
  )

  const renderConfigInput = (config: ConfigItem) => {
    switch (config.type) {
      case "boolean":
        return (
          <Switch
            checked={config.value}
            onCheckedChange={(checked) => updateConfig(config.key, checked)}
          />
        )
      case "number":
        return (
          <Input
            type="number"
            value={config.value}
            onChange={(e) => updateConfig(config.key, parseInt(e.target.value))}
            className="max-w-sm"
          />
        )
      case "json":
        return (
          <Textarea
            value={
              typeof config.value === "object"
                ? JSON.stringify(config.value, null, 2)
                : config.value
            }
            onChange={(e) => {
              try {
                const parsed = JSON.parse(e.target.value)
                updateConfig(config.key, parsed)
              } catch {
                // Invalid JSON, keep as string
                updateConfig(config.key, e.target.value)
              }
            }}
            rows={6}
            className="font-mono text-sm"
          />
        )
      default:
        return (
          <Input
            type={config.sensitive ? "password" : "text"}
            value={config.value}
            onChange={(e) => updateConfig(config.key, e.target.value)}
            className="max-w-lg"
          />
        )
    }
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Configuration Management</h1>
          <p className="text-muted-foreground">Manage system-wide configurations and settings</p>
        </div>
        <div className="flex gap-2">
          {unsavedChanges && (
            <Badge variant="secondary" className="py-2 bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
              <AlertCircle className="mr-1 h-3 w-3" />
              Unsaved Changes
            </Badge>
          )}
          <Button variant="outline" onClick={loadConfigurations}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button onClick={saveConfigurations} disabled={!unsavedChanges || saving}>
            <Save className="mr-2 h-4 w-4" />
            Save Changes
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-6">
        {/* Categories Sidebar */}
        <Card className="col-span-1 h-fit">
          <CardHeader>
            <CardTitle className="text-lg">Categories</CardTitle>
          </CardHeader>
          <CardContent className="p-2">
            <div className="space-y-1">
              {categories.map((category) => {
                const Icon = category.icon
                return (
                  <Button
                    key={category.id}
                    variant={selectedCategory === category.id ? "secondary" : "ghost"}
                    className="w-full justify-start"
                    onClick={() => setSelectedCategory(category.id)}
                  >
                    <Icon className="mr-2 h-4 w-4" />
                    {category.label}
                  </Button>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Configuration Panel */}
        <Card className="col-span-3">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>
                  {categories.find((c) => c.id === selectedCategory)?.label} Settings
                </CardTitle>
                <CardDescription>
                  Configure {selectedCategory} settings for the platform
                </CardDescription>
              </div>
              <Input
                placeholder="Search configurations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-xs"
              />
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">Loading configurations...</div>
            ) : filteredConfigs.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">No configurations found</div>
            ) : (
              <div className="space-y-6">
                {filteredConfigs.map((config) => (
                  <div key={config.key} className="space-y-2 pb-6 border-b last:border-0">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <Label htmlFor={config.key} className="text-base">
                          {config.key
                            .split(".")
                            .pop()
                            ?.replace(/_/g, " ")
                            .replace(/\b\w/g, (l) => l.toUpperCase())}
                        </Label>
                        {config.description && (
                          <p className="text-sm text-muted-foreground">{config.description}</p>
                        )}
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <code className="px-1 py-0.5 bg-muted rounded">{config.key}</code>
                          {config.sensitive && (
                            <Badge variant="outline" className="text-xs">
                              <Shield className="mr-1 h-3 w-3" />
                              Sensitive
                            </Badge>
                          )}
                          {config.lastModified && (
                            <span>
                              Modified {new Date(config.lastModified).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="mt-2">{renderConfigInput(config)}</div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// Mock configurations for demonstration
const mockConfigs: ConfigItem[] = [
  // General
  {
    key: "app.name",
    value: "LayoverHQ",
    type: "string",
    category: "general",
    description: "Application display name",
  },
  {
    key: "app.url",
    value: "https://layoverhq.com",
    type: "string",
    category: "general",
    description: "Primary application URL",
  },
  {
    key: "app.maintenance_mode",
    value: false,
    type: "boolean",
    category: "general",
    description: "Enable maintenance mode for the platform",
  },
  // Database
  {
    key: "db.pool.max_connections",
    value: 100,
    type: "number",
    category: "database",
    description: "Maximum number of database connections",
  },
  {
    key: "db.pool.min_connections",
    value: 10,
    type: "number",
    category: "database",
    description: "Minimum number of database connections",
  },
  {
    key: "db.backup.enabled",
    value: true,
    type: "boolean",
    category: "database",
    description: "Enable automatic database backups",
  },
  {
    key: "db.backup.schedule",
    value: "0 2 * * *",
    type: "string",
    category: "database",
    description: "Backup schedule (cron format)",
  },
  // API
  {
    key: "api.rate_limit.default",
    value: 100,
    type: "number",
    category: "api",
    description: "Default API rate limit per minute",
  },
  {
    key: "api.rate_limit.enterprise",
    value: 1000,
    type: "number",
    category: "api",
    description: "Enterprise API rate limit per minute",
  },
  {
    key: "api.viator.key",
    value: "vtr_key_xxxxx",
    type: "string",
    category: "api",
    description: "Viator API key",
    sensitive: true,
  },
  {
    key: "api.amadeus.client_id",
    value: "amd_client_xxxxx",
    type: "string",
    category: "api",
    description: "Amadeus API client ID",
    sensitive: true,
  },
  // Security
  {
    key: "security.session.timeout",
    value: 3600,
    type: "number",
    category: "security",
    description: "Session timeout in seconds",
  },
  {
    key: "security.password.min_length",
    value: 12,
    type: "number",
    category: "security",
    description: "Minimum password length",
  },
  {
    key: "security.mfa.enabled",
    value: true,
    type: "boolean",
    category: "security",
    description: "Enable multi-factor authentication",
  },
  {
    key: "security.cors.allowed_origins",
    value: ["https://layoverhq.com", "https://admin.layoverhq.com"],
    type: "json",
    category: "security",
    description: "Allowed CORS origins",
  },
  // Notifications
  {
    key: "notifications.email.enabled",
    value: true,
    type: "boolean",
    category: "notifications",
    description: "Enable email notifications",
  },
  {
    key: "notifications.email.smtp_host",
    value: "smtp.sendgrid.net",
    type: "string",
    category: "notifications",
    description: "SMTP server host",
  },
  {
    key: "notifications.email.from_address",
    value: "noreply@layoverhq.com",
    type: "string",
    category: "notifications",
    description: "Default from email address",
  },
  {
    key: "notifications.slack.webhook_url",
    value: "https://hooks.slack.com/services/xxxxx",
    type: "string",
    category: "notifications",
    description: "Slack webhook URL for alerts",
    sensitive: true,
  },
]
