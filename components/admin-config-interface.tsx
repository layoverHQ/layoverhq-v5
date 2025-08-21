"use client"

/**
 * Zero-CLI Admin Configuration Interface
 *
 * Complete configuration management interface that allows admins to configure
 * everything through the UI without SSH, environment changes, or code deployments.
 */

import React, { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import {
  Save,
  RotateCcw,
  AlertTriangle,
  CheckCircle,
  Settings,
  Database,
  Shield,
  Zap,
  Monitor,
  RefreshCw,
  History,
  Upload,
  Download,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface ConfigValue {
  id: string
  key: string
  value: any
  type: "string" | "number" | "boolean" | "json" | "encrypted"
  category: string
  description?: string
  tenant_id?: string
  environment: string
  is_active: boolean
  updated_at: string
  updated_by: string
}

interface ConfigSchema {
  [key: string]: {
    type: ConfigValue["type"]
    category: string
    description: string
    default: any
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
}

interface ConfigSnapshot {
  id: string
  name: string
  description?: string
  created_at: string
  created_by: string
}

interface ValidationError {
  key: string
  message: string
}

export default function AdminConfigInterface() {
  const [configs, setConfigs] = useState<Record<string, any>>({})
  const [originalConfigs, setOriginalConfigs] = useState<Record<string, any>>({})
  const [schema, setSchema] = useState<ConfigSchema>({})
  const [snapshots, setSnapshots] = useState<ConfigSnapshot[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>("application")
  const [selectedTenant, setSelectedTenant] = useState<string>("")
  const [selectedEnvironment, setSelectedEnvironment] = useState<string>("all")
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([])
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date())
  const { toast } = useToast()

  // Get unique categories from schema
  const categories = Object.values(schema).reduce((acc, schemaItem) => {
    if (!acc.includes(schemaItem.category)) {
      acc.push(schemaItem.category)
    }
    return acc
  }, [] as string[])

  // Filter configs by selected category
  const categoryConfigs = Object.entries(schema)
    .filter(([_, schemaItem]) => schemaItem.category === selectedCategory)
    .reduce(
      (acc, [key, schemaItem]) => {
        acc[key] = {
          ...schemaItem,
          value: configs[key] ?? schemaItem.default,
        }
        return acc
      },
      {} as Record<string, any>,
    )

  /**
   * Load configuration schema and values
   */
  const loadConfigurations = useCallback(async () => {
    setIsLoading(true)
    try {
      // Load schema
      const schemaResponse = await fetch("/api/admin/config/schema")
      if (schemaResponse.ok) {
        const schemaData = await schemaResponse.json()
        setSchema(schemaData)
      }

      // Load configurations
      const configsResponse = await fetch(
        `/api/admin/config?category=${selectedCategory}&tenant_id=${selectedTenant}&environment=${selectedEnvironment}`,
      )
      if (configsResponse.ok) {
        const configsData = await configsResponse.json()
        setConfigs(configsData)
        setOriginalConfigs({ ...configsData })
        setHasUnsavedChanges(false)
      }

      setLastRefresh(new Date())
    } catch (error) {
      console.error("Error loading configurations:", error)
      toast({
        title: "Error",
        description: "Failed to load configurations",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }, [selectedCategory, selectedTenant, selectedEnvironment, toast])

  /**
   * Load configuration snapshots
   */
  const loadSnapshots = useCallback(async () => {
    try {
      const response = await fetch("/api/admin/config/snapshots")
      if (response.ok) {
        const data = await response.json()
        setSnapshots(data)
      }
    } catch (error) {
      console.error("Error loading snapshots:", error)
    }
  }, [])

  /**
   * Validate configuration value
   */
  const validateConfig = (key: string, value: any): string | null => {
    const schemaItem = schema[key]
    if (!schemaItem?.validation) return null

    const { validation } = schemaItem

    // Required check
    if (validation.required && (value === null || value === undefined || value === "")) {
      return "This field is required"
    }

    // Type-specific validation
    switch (schemaItem.type) {
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
        if (typeof value !== "string") return "Must be a string"
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

  /**
   * Validate all configurations
   */
  const validateAllConfigs = (): ValidationError[] => {
    const errors: ValidationError[] = []

    Object.entries(categoryConfigs).forEach(([key, item]) => {
      const error = validateConfig(key, item.value)
      if (error) {
        errors.push({ key, message: error })
      }
    })

    return errors
  }

  /**
   * Handle configuration value change
   */
  const handleConfigChange = (key: string, value: any) => {
    setConfigs((prev) => ({
      ...prev,
      [key]: value,
    }))

    // Check if this creates unsaved changes
    const hasChanged = JSON.stringify(configs) !== JSON.stringify(originalConfigs)
    setHasUnsavedChanges(hasChanged || value !== originalConfigs[key])

    // Clear validation error for this field if it exists
    setValidationErrors((prev) => prev.filter((error) => error.key !== key))
  }

  /**
   * Save configurations
   */
  const saveConfigurations = async () => {
    // Validate before saving
    const errors = validateAllConfigs()
    setValidationErrors(errors)

    if (errors.length > 0) {
      toast({
        title: "Validation Errors",
        description: `Please fix ${errors.length} validation error(s)`,
        variant: "destructive",
      })
      return
    }

    setIsSaving(true)
    try {
      const changedConfigs = Object.entries(configs).reduce(
        (acc, [key, value]) => {
          if (JSON.stringify(value) !== JSON.stringify(originalConfigs[key])) {
            acc[key] = value
          }
          return acc
        },
        {} as Record<string, any>,
      )

      if (Object.keys(changedConfigs).length === 0) {
        toast({
          title: "No Changes",
          description: "No configuration changes to save",
        })
        return
      }

      const response = await fetch("/api/admin/config", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          configs: changedConfigs,
          tenant_id: selectedTenant || undefined,
          environment: selectedEnvironment,
        }),
      })

      if (response.ok) {
        setOriginalConfigs({ ...configs })
        setHasUnsavedChanges(false)
        toast({
          title: "Success",
          description: `${Object.keys(changedConfigs).length} configuration(s) saved successfully`,
          variant: "default",
        })

        // Check for configs that require restart
        const requiresRestart = Object.keys(changedConfigs).some(
          (key) => schema[key]?.requires_restart,
        )

        if (requiresRestart) {
          toast({
            title: "Restart Required",
            description: "Some changes require a service restart to take effect",
            variant: "destructive",
          })
        }
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to save configurations")
      }
    } catch (error) {
      console.error("Error saving configurations:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save configurations",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  /**
   * Reset configurations to original values
   */
  const resetConfigurations = () => {
    setConfigs({ ...originalConfigs })
    setHasUnsavedChanges(false)
    setValidationErrors([])
    toast({
      title: "Reset",
      description: "All changes have been reset",
    })
  }

  /**
   * Create configuration snapshot
   */
  const createSnapshot = async () => {
    const name = prompt("Enter snapshot name:")
    if (!name) return

    try {
      const response = await fetch("/api/admin/config/snapshots", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          description: `Snapshot created on ${new Date().toLocaleString()}`,
          tenant_id: selectedTenant || undefined,
        }),
      })

      if (response.ok) {
        await loadSnapshots()
        toast({
          title: "Success",
          description: "Configuration snapshot created successfully",
        })
      } else {
        throw new Error("Failed to create snapshot")
      }
    } catch (error) {
      console.error("Error creating snapshot:", error)
      toast({
        title: "Error",
        description: "Failed to create configuration snapshot",
        variant: "destructive",
      })
    }
  }

  /**
   * Rollback to snapshot
   */
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
        toast({
          title: "Success",
          description: "Successfully rolled back to snapshot",
        })
      } else {
        throw new Error("Failed to rollback to snapshot")
      }
    } catch (error) {
      console.error("Error rolling back to snapshot:", error)
      toast({
        title: "Error",
        description: "Failed to rollback to snapshot",
        variant: "destructive",
      })
    }
  }

  /**
   * Render configuration input based on type
   */
  const renderConfigInput = (key: string, item: any) => {
    const error = validationErrors.find((e) => e.key === key)
    const hasError = !!error

    switch (item.type) {
      case "boolean":
        return (
          <div className="flex items-center space-x-2">
            <Switch
              id={key}
              checked={item.value}
              onCheckedChange={(checked) => handleConfigChange(key, checked)}
            />
            <Label htmlFor={key} className="text-sm font-medium">
              {item.value ? "Enabled" : "Disabled"}
            </Label>
          </div>
        )

      case "number":
        return (
          <Input
            id={key}
            type="number"
            value={item.value}
            onChange={(e) => handleConfigChange(key, Number(e.target.value))}
            className={hasError ? "border-red-500" : ""}
            min={item.validation?.min}
            max={item.validation?.max}
          />
        )

      case "json":
        return (
          <Textarea
            id={key}
            value={
              typeof item.value === "string" ? item.value : JSON.stringify(item.value, null, 2)
            }
            onChange={(e) => {
              try {
                const parsed = JSON.parse(e.target.value)
                handleConfigChange(key, parsed)
              } catch {
                handleConfigChange(key, e.target.value)
              }
            }}
            className={hasError ? "border-red-500" : ""}
            rows={4}
          />
        )

      default:
        if (item.validation?.enum) {
          return (
            <Select value={item.value} onValueChange={(value) => handleConfigChange(key, value)}>
              <SelectTrigger className={hasError ? "border-red-500" : ""}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {item.validation.enum.map((option: string) => (
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
            id={key}
            type={item.type === "encrypted" ? "password" : "text"}
            value={item.value}
            onChange={(e) => handleConfigChange(key, e.target.value)}
            className={hasError ? "border-red-500" : ""}
            pattern={item.validation?.pattern}
          />
        )
    }
  }

  /**
   * Get category icon
   */
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "application":
        return <Settings className="h-4 w-4" />
      case "database":
        return <Database className="h-4 w-4" />
      case "security":
        return <Shield className="h-4 w-4" />
      case "performance":
        return <Zap className="h-4 w-4" />
      case "monitoring":
        return <Monitor className="h-4 w-4" />
      default:
        return <Settings className="h-4 w-4" />
    }
  }

  // Load data on component mount and when filters change
  useEffect(() => {
    loadConfigurations()
  }, [loadConfigurations])

  useEffect(() => {
    loadSnapshots()
  }, [loadSnapshots])

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (!hasUnsavedChanges) {
        loadConfigurations()
      }
    }, 30000)

    return () => clearInterval(interval)
  }, [loadConfigurations, hasUnsavedChanges])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">System Configuration</h1>
          <p className="text-gray-600">Configure your system without CLI access or deployments</p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="outline">Last updated: {lastRefresh.toLocaleTimeString()}</Badge>
          <Button variant="outline" size="sm" onClick={loadConfigurations} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Settings className="h-5 w-5 mr-2" />
            Configuration Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="environment">Environment</Label>
              <Select value={selectedEnvironment} onValueChange={setSelectedEnvironment}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Environments</SelectItem>
                  <SelectItem value="production">Production</SelectItem>
                  <SelectItem value="staging">Staging</SelectItem>
                  <SelectItem value="development">Development</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="tenant">Tenant (Optional)</Label>
              <Input
                id="tenant"
                placeholder="Leave empty for global config"
                value={selectedTenant}
                onChange={(e) => setSelectedTenant(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="category">Category</Label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      <div className="flex items-center">
                        {getCategoryIcon(category)}
                        <span className="ml-2 capitalize">{category}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Unsaved changes warning */}
      {hasUnsavedChanges && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            You have unsaved changes. Don't forget to save your configuration.
          </AlertDescription>
        </Alert>
      )}

      {/* Validation errors */}
      {validationErrors.length > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <div className="font-medium">Validation Errors:</div>
            <ul className="mt-2 list-disc list-inside">
              {validationErrors.map((error) => (
                <li key={error.key}>
                  <strong>{error.key}:</strong> {error.message}
                </li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Main content */}
      <Tabs defaultValue="configurations" className="space-y-4">
        <TabsList>
          <TabsTrigger value="configurations">Configurations</TabsTrigger>
          <TabsTrigger value="snapshots">Snapshots</TabsTrigger>
        </TabsList>

        <TabsContent value="configurations" className="space-y-4">
          {/* Action buttons */}
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <Button
                onClick={saveConfigurations}
                disabled={isSaving || !hasUnsavedChanges}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Save className="h-4 w-4 mr-2" />
                {isSaving ? "Saving..." : "Save Changes"}
              </Button>
              <Button variant="outline" onClick={resetConfigurations} disabled={!hasUnsavedChanges}>
                <RotateCcw className="h-4 w-4 mr-2" />
                Reset
              </Button>
            </div>
            <Button variant="outline" onClick={createSnapshot}>
              <History className="h-4 w-4 mr-2" />
              Create Snapshot
            </Button>
          </div>

          {/* Configuration form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                {getCategoryIcon(selectedCategory)}
                <span className="ml-2 capitalize">{selectedCategory} Configuration</span>
              </CardTitle>
              <CardDescription>
                Configure {selectedCategory} settings for your system
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="animate-pulse">
                      <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                      <div className="h-10 bg-gray-200 rounded"></div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-6">
                  {Object.entries(categoryConfigs).map(([key, item]) => {
                    const error = validationErrors.find((e) => e.key === key)

                    return (
                      <div key={key} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label htmlFor={key} className="text-sm font-medium">
                            {key}
                            {item.validation?.required && (
                              <span className="text-red-500 ml-1">*</span>
                            )}
                            {item.requires_restart && (
                              <Badge variant="outline" className="ml-2">
                                Requires Restart
                              </Badge>
                            )}
                            {item.hot_reload && (
                              <Badge variant="outline" className="ml-2 bg-green-50 text-green-700">
                                Hot Reload
                              </Badge>
                            )}
                          </Label>
                        </div>

                        {item.description && (
                          <p className="text-sm text-gray-600">{item.description}</p>
                        )}

                        {renderConfigInput(key, item)}

                        {error && <p className="text-sm text-red-600">{error.message}</p>}
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="snapshots" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <History className="h-5 w-5 mr-2" />
                Configuration Snapshots
              </CardTitle>
              <CardDescription>Manage configuration snapshots for easy rollback</CardDescription>
            </CardHeader>
            <CardContent>
              {snapshots.length === 0 ? (
                <div className="text-center py-8">
                  <History className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No snapshots available</p>
                  <Button onClick={createSnapshot} className="mt-4">
                    Create First Snapshot
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {snapshots.map((snapshot) => (
                    <div
                      key={snapshot.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div>
                        <h4 className="font-medium">{snapshot.name}</h4>
                        <p className="text-sm text-gray-600">
                          Created {new Date(snapshot.created_at).toLocaleString()}
                        </p>
                        {snapshot.description && (
                          <p className="text-sm text-gray-500 mt-1">{snapshot.description}</p>
                        )}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => rollbackToSnapshot(snapshot.id)}
                      >
                        <RotateCcw className="h-4 w-4 mr-2" />
                        Rollback
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
