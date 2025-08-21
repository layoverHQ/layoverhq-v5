/**
 * Configuration Panel - Zero-CLI Administration Interface
 *
 * Enables administrators to configure all system parameters through
 * a web interface with hot-reload capabilities, validation, and rollback.
 */

"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import {
  Save,
  RotateCcw,
  Download,
  Upload,
  CheckCircle,
  AlertTriangle,
  Clock,
  Settings,
  Database,
  Shield,
  Zap,
  Globe,
  Palette,
} from "lucide-react"

interface ConfigValue {
  key: string
  value: any
  type: "string" | "number" | "boolean" | "json" | "encrypted"
  category: string
  description: string
  validation?: {
    required?: boolean
    min?: number
    max?: number
    pattern?: string
    enum?: string[]
  }
  hot_reload: boolean
  requires_restart?: boolean
}

interface ConfigSnapshot {
  id: string
  name: string
  created_at: string
  created_by: string
  config_count: number
}

interface ValidationError {
  key: string
  message: string
}

export default function ConfigurationPanel() {
  const [configs, setConfigs] = useState<Record<string, ConfigValue>>({})
  const [modifiedConfigs, setModifiedConfigs] = useState<Record<string, any>>({})
  const [snapshots, setSnapshots] = useState<ConfigSnapshot[]>([])
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [activeCategory, setActiveCategory] = useState("application")
  const [snapshotName, setSnapshotName] = useState("")
  const [showCreateSnapshot, setShowCreateSnapshot] = useState(false)

  const categories = [
    {
      id: "application",
      name: "Application",
      icon: Settings,
      description: "Core application settings",
    },
    { id: "features", name: "Features", icon: Zap, description: "Feature flags and toggles" },
    { id: "security", name: "Security", icon: Shield, description: "Authentication and security" },
    {
      id: "performance",
      name: "Performance",
      icon: Database,
      description: "Caching and optimization",
    },
    {
      id: "integrations",
      name: "Integrations",
      icon: Globe,
      description: "External API configurations",
    },
    { id: "ui", name: "UI/UX", icon: Palette, description: "User interface customization" },
    {
      id: "monitoring",
      name: "Monitoring",
      icon: AlertTriangle,
      description: "Logging and monitoring",
    },
  ]

  useEffect(() => {
    loadConfigurations()
    loadSnapshots()
  }, [])

  const loadConfigurations = async () => {
    try {
      setIsLoading(true)
      const response = await fetch("/api/admin/config")
      if (response.ok) {
        const data = await response.json()
        setConfigs(data.configs || {})
      }
    } catch (error) {
      console.error("Failed to load configurations:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const loadSnapshots = async () => {
    try {
      const response = await fetch("/api/admin/config/snapshots")
      if (response.ok) {
        const data = await response.json()
        setSnapshots(data.snapshots || [])
      }
    } catch (error) {
      console.error("Failed to load snapshots:", error)
    }
  }

  const validateConfiguration = (key: string, value: any): string | null => {
    const config = configs[key]
    if (!config?.validation) return null

    const { validation } = config

    // Required check
    if (validation.required && (value === null || value === undefined || value === "")) {
      return "This field is required"
    }

    // Type-specific validation
    switch (config.type) {
      case "number":
        const num = Number(value)
        if (isNaN(num)) return "Must be a valid number"
        if (validation.min !== undefined && num < validation.min) {
          return `Must be at least ${validation.min}`
        }
        if (validation.max !== undefined && num > validation.max) {
          return `Must be at most ${validation.max}`
        }
        break

      case "string":
        if (validation.pattern && !new RegExp(validation.pattern).test(value)) {
          return "Invalid format"
        }
        if (validation.enum && !validation.enum.includes(value)) {
          return `Must be one of: ${validation.enum.join(", ")}`
        }
        break

      case "json":
        try {
          if (typeof value === "string") {
            JSON.parse(value)
          }
        } catch {
          return "Must be valid JSON"
        }
        break
    }

    return null
  }

  const handleConfigChange = (key: string, value: any) => {
    setModifiedConfigs((prev) => ({
      ...prev,
      [key]: value,
    }))

    // Validate the change
    const error = validateConfiguration(key, value)
    setValidationErrors((prev) => {
      const filtered = prev.filter((e) => e.key !== key)
      return error ? [...filtered, { key, message: error }] : filtered
    })
  }

  const saveConfigurations = async () => {
    if (validationErrors.length > 0) {
      return
    }

    try {
      setIsSaving(true)
      const response = await fetch("/api/admin/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          configs: modifiedConfigs,
        }),
      })

      if (response.ok) {
        const result = await response.json()
        if (result.success) {
          // Update local state
          setConfigs((prev) => ({
            ...prev,
            ...Object.fromEntries(
              Object.entries(modifiedConfigs).map(([key, value]) => [key, { ...prev[key], value }]),
            ),
          }))
          setModifiedConfigs({})

          // Show success message
          console.log("Configurations saved successfully")
        } else {
          console.error("Failed to save configurations:", result.errors)
        }
      }
    } catch (error) {
      console.error("Error saving configurations:", error)
    } finally {
      setIsSaving(false)
    }
  }

  const createSnapshot = async () => {
    if (!snapshotName.trim()) return

    try {
      const response = await fetch("/api/admin/config/snapshots", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: snapshotName.trim(),
        }),
      })

      if (response.ok) {
        const result = await response.json()
        if (result.success) {
          await loadSnapshots()
          setSnapshotName("")
          setShowCreateSnapshot(false)
        }
      }
    } catch (error) {
      console.error("Error creating snapshot:", error)
    }
  }

  const rollbackToSnapshot = async (snapshotId: string) => {
    if (
      !confirm(
        "Are you sure you want to rollback to this snapshot? This will overwrite current configurations.",
      )
    ) {
      return
    }

    try {
      const response = await fetch(`/api/admin/config/snapshots/${snapshotId}/rollback`, {
        method: "POST",
      })

      if (response.ok) {
        await loadConfigurations()
        setModifiedConfigs({})
      }
    } catch (error) {
      console.error("Error rolling back to snapshot:", error)
    }
  }

  const renderConfigInput = (key: string, config: ConfigValue) => {
    const currentValue = modifiedConfigs[key] !== undefined ? modifiedConfigs[key] : config.value
    const hasError = validationErrors.some((e) => e.key === key)
    const isModified = modifiedConfigs[key] !== undefined

    switch (config.type) {
      case "boolean":
        return (
          <div className="flex items-center space-x-2">
            <Switch
              checked={currentValue}
              onCheckedChange={(checked) => handleConfigChange(key, checked)}
            />
            <Label className="text-sm">{currentValue ? "Enabled" : "Disabled"}</Label>
          </div>
        )

      case "number":
        return (
          <Input
            type="number"
            value={currentValue || ""}
            onChange={(e) => handleConfigChange(key, Number(e.target.value))}
            className={hasError ? "border-red-500" : ""}
            min={config.validation?.min}
            max={config.validation?.max}
          />
        )

      case "json":
        return (
          <Textarea
            value={
              typeof currentValue === "object"
                ? JSON.stringify(currentValue, null, 2)
                : currentValue
            }
            onChange={(e) => {
              try {
                const parsed = JSON.parse(e.target.value)
                handleConfigChange(key, parsed)
              } catch {
                handleConfigChange(key, e.target.value)
              }
            }}
            className={`font-mono text-sm ${hasError ? "border-red-500" : ""}`}
            rows={6}
          />
        )

      case "encrypted":
        return (
          <Input
            type="password"
            value={currentValue || ""}
            onChange={(e) => handleConfigChange(key, e.target.value)}
            className={hasError ? "border-red-500" : ""}
            placeholder="••••••••"
          />
        )

      default:
        if (config.validation?.enum) {
          return (
            <Select value={currentValue} onValueChange={(value) => handleConfigChange(key, value)}>
              <SelectTrigger className={hasError ? "border-red-500" : ""}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {config.validation.enum.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )
        }

        return (
          <Input
            value={currentValue || ""}
            onChange={(e) => handleConfigChange(key, e.target.value)}
            className={hasError ? "border-red-500" : ""}
            pattern={config.validation?.pattern}
          />
        )
    }
  }

  const getCategoryConfigs = (category: string) => {
    return Object.entries(configs).filter(([_, config]) => config.category === category)
  }

  const hasUnsavedChanges = Object.keys(modifiedConfigs).length > 0

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p>Loading configurations...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with Actions */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>System Configuration</CardTitle>
              <CardDescription>
                Manage all system settings with hot-reload capabilities. Changes are applied
                instantly without service restart.
              </CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              {hasUnsavedChanges && (
                <Badge variant="outline" className="text-yellow-600 border-yellow-600">
                  {Object.keys(modifiedConfigs).length} unsaved changes
                </Badge>
              )}
              <Button
                onClick={() => setShowCreateSnapshot(!showCreateSnapshot)}
                variant="outline"
                size="sm"
              >
                <Download className="h-4 w-4 mr-2" />
                Create Snapshot
              </Button>
              <Button
                onClick={saveConfigurations}
                disabled={!hasUnsavedChanges || validationErrors.length > 0 || isSaving}
                size="sm"
              >
                {isSaving ? (
                  <Clock className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Save Changes
              </Button>
            </div>
          </div>
        </CardHeader>

        {/* Create Snapshot Panel */}
        {showCreateSnapshot && (
          <CardContent className="border-t">
            <div className="flex items-center space-x-4">
              <div className="flex-1">
                <Label htmlFor="snapshot-name">Snapshot Name</Label>
                <Input
                  id="snapshot-name"
                  value={snapshotName}
                  onChange={(e) => setSnapshotName(e.target.value)}
                  placeholder="e.g., Before feature flag changes"
                  className="mt-1"
                />
              </div>
              <div className="flex items-end space-x-2">
                <Button onClick={createSnapshot} disabled={!snapshotName.trim()}>
                  Create
                </Button>
                <Button variant="outline" onClick={() => setShowCreateSnapshot(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Validation Errors */}
      {validationErrors.length > 0 && (
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription>
            <div className="space-y-1">
              <p className="font-medium text-red-800">Please fix the following errors:</p>
              {validationErrors.map((error) => (
                <p key={error.key} className="text-sm text-red-700">
                  • {configs[error.key]?.description || error.key}: {error.message}
                </p>
              ))}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Configuration Categories */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Category Sidebar */}
        <div className="space-y-2">
          {categories.map((category) => {
            const categoryConfigs = getCategoryConfigs(category.id)
            const modifiedInCategory = categoryConfigs.filter(
              ([key]) => modifiedConfigs[key] !== undefined,
            ).length

            return (
              <Button
                key={category.id}
                variant={activeCategory === category.id ? "default" : "ghost"}
                className="w-full justify-start"
                onClick={() => setActiveCategory(category.id)}
              >
                <category.icon className="h-4 w-4 mr-2" />
                <span className="flex-1 text-left">{category.name}</span>
                {modifiedInCategory > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {modifiedInCategory}
                  </Badge>
                )}
              </Button>
            )
          })}
        </div>

        {/* Configuration Panel */}
        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <CardTitle>
                {categories.find((c) => c.id === activeCategory)?.name} Settings
              </CardTitle>
              <CardDescription>
                {categories.find((c) => c.id === activeCategory)?.description}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {getCategoryConfigs(activeCategory).map(([key, config]) => {
                const hasError = validationErrors.some((e) => e.key === key)
                const isModified = modifiedConfigs[key] !== undefined
                const error = validationErrors.find((e) => e.key === key)

                return (
                  <div key={key} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor={key} className="text-sm font-medium">
                        {config.description || key}
                      </Label>
                      <div className="flex items-center space-x-2">
                        {isModified && (
                          <Badge variant="outline" className="text-xs">
                            Modified
                          </Badge>
                        )}
                        {config.hot_reload ? (
                          <Badge variant="default" className="text-xs">
                            <Zap className="h-3 w-3 mr-1" />
                            Hot Reload
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="text-xs">
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            Restart Required
                          </Badge>
                        )}
                      </div>
                    </div>

                    {renderConfigInput(key, config)}

                    {error && <p className="text-sm text-red-600">{error.message}</p>}

                    <p className="text-xs text-gray-500">
                      Key: <code className="bg-gray-100 px-1 rounded">{key}</code>
                      {config.type && ` • Type: ${config.type}`}
                    </p>
                  </div>
                )
              })}

              {getCategoryConfigs(activeCategory).length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No configurations found for this category.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Configuration Snapshots */}
      <Card>
        <CardHeader>
          <CardTitle>Configuration Snapshots</CardTitle>
          <CardDescription>
            Create and manage configuration snapshots for easy rollback and disaster recovery.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {snapshots.length > 0 ? (
            <div className="space-y-3">
              {snapshots.map((snapshot) => (
                <div
                  key={snapshot.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div>
                    <h4 className="font-medium">{snapshot.name}</h4>
                    <p className="text-sm text-gray-600">
                      Created {new Date(snapshot.created_at).toLocaleDateString()} •
                      {snapshot.config_count} configurations
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => rollbackToSnapshot(snapshot.id)}
                    >
                      <RotateCcw className="h-4 w-4 mr-2" />
                      Rollback
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              No configuration snapshots available.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
